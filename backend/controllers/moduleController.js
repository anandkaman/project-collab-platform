import Module from '../models/Module.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import path from 'path';
import fs from 'fs/promises';

export const createModule = async (req, res) => {
  try {
    const { name, projectId, assignedTo, description, files } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const branchName = `dev_${assignedTo}_${Date.now()}`;
    
    const module = new Module({
      name,
      projectId,
      assignedTo,
      description,
      files: files || [],
      branch: branchName,
      status: 'pending'
    });
    
    await module.save();
    
    project.branches.push({
      name: branchName,
      developerId: assignedTo
    });
    
    await project.save();
    
    await User.findByIdAndUpdate(assignedTo, {
      $push: { assignedModules: module._id }
    });
    
    const branchPath = path.join(project.rootPath, 'branches', branchName);
    await fs.mkdir(branchPath, { recursive: true });
    
    const io = req.app.get('io');
    io.emit('moduleAssigned', { 
      userId: assignedTo, 
      module: module 
    });
    
    res.status(201).json({ success: true, module });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getModulesByUser = async (req, res) => {
  try {
    const modules = await Module.find({ assignedTo: req.user._id })
      .populate('projectId', 'name description')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, modules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateModuleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    module.status = status;
    
    if (status === 'submitted') {
      module.mergeRequestPending = true;
    }
    
    await module.save();
    
    const io = req.app.get('io');
    io.emit('moduleStatusUpdated', { moduleId: module._id, status });
    
    res.json({ success: true, module });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllModules = async (req, res) => {
  try {
    const { projectId } = req.query;
    
    const query = projectId ? { projectId } : {};
    
    const modules = await Module.find(query)
      .populate('assignedTo', 'username email')
      .populate('projectId', 'name');
    
    res.json({ success: true, modules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const cloneModule = async (req, res) => {
  try {
    const { moduleId } = req.body;
    
    const module = await Module.findById(moduleId).populate('projectId');
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    if (module.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const project = module.projectId;
    const branchPath = path.join(project.rootPath, 'branches', module.branch);
    
    // Create branch directory if it doesn't exist
    await fs.mkdir(branchPath, { recursive: true });
    
    // Copy main project files to branch
    await copyMainToBranch(project.rootPath, branchPath);
    
    module.cloned = true;
    module.clonedAt = new Date();
    module.status = 'in-progress';
    
    await module.save();
    
    res.json({ 
      success: true, 
      message: 'Module cloned successfully',
      branchPath: module.branch 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const copyMainToBranch = async (mainPath, branchPath) => {
  try {
    const entries = await fs.readdir(mainPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // Skip branches folder and node_modules
      if (entry.name === 'branches' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      
      const srcPath = path.join(mainPath, entry.name);
      const destPath = path.join(branchPath, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await copyMainToBranch(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error('Error copying to branch:', error);
  }
};