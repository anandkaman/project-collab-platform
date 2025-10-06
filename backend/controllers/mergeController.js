import Module from '../models/Module.js';
import Project from '../models/Project.js';
import fs from 'fs/promises';
import path from 'path';

export const requestMerge = async (req, res) => {
  try {
    const { moduleId, message } = req.body;
    
    const module = await Module.findById(moduleId)
      .populate('projectId')
      .populate('assignedTo', 'username email');
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    if (module.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    module.mergeRequestPending = true;
    module.mergeRequestMessage = message || 'Ready for review';
    module.mergeRequestedAt = new Date();
    module.status = 'submitted';
    
    await module.save();
    
    const io = req.app.get('io');
    io.emit('mergeRequested', {
      moduleId: module._id,
      projectId: module.projectId._id,
      developer: module.assignedTo.username,
      message: message
    });
    
    res.json({ success: true, message: 'Merge request submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMergeRequests = async (req, res) => {
  try {
    const { projectId } = req.query;
    
    const query = { mergeRequestPending: true };
    if (projectId) {
      query.projectId = projectId;
    }
    
    const mergeRequests = await Module.find(query)
      .populate('projectId', 'name')
      .populate('assignedTo', 'username email')
      .sort({ mergeRequestedAt: -1 });
    
    res.json({ success: true, mergeRequests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveMerge = async (req, res) => {
  try {
    const { moduleId } = req.body;
    
    const module = await Module.findById(moduleId).populate('projectId');
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    const project = module.projectId;
    const branchPath = path.join(project.rootPath, 'branches', module.branch);
    const mainPath = project.rootPath;
    
    // Copy files from branch to main
    await copyDirectoryRecursive(branchPath, mainPath);
    
    module.mergeRequestPending = false;
    module.merged = true;
    module.mergedAt = new Date();
    module.mergedBy = req.user._id;
    module.status = 'completed';
    
    await module.save();
    
    const io = req.app.get('io');
    io.emit('mergeApproved', {
      moduleId: module._id,
      projectId: project._id
    });
    
    res.json({ success: true, message: 'Merge approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const rejectMerge = async (req, res) => {
  try {
    const { moduleId, reason } = req.body;
    
    const module = await Module.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    module.mergeRequestPending = false;
    module.mergeRejected = true;
    module.mergeRejectionReason = reason;
    module.status = 'in-progress';
    
    await module.save();
    
    const io = req.app.get('io');
    io.emit('mergeRejected', {
      moduleId: module._id,
      reason: reason
    });
    
    res.json({ success: true, message: 'Merge rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const copyDirectoryRecursive = async (source, destination) => {
  try {
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await copyDirectoryRecursive(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error('Error copying directory:', error);
  }
};
