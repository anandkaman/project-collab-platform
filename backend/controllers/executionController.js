import Project from '../models/Project.js';
import path from 'path';
import { executeBatchFile } from '../utils/batchExecutor.js';

export const executeProject = async (req, res) => {
  try {
    const { projectId, batFileName } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (!project.batFiles.includes(batFileName)) {
      return res.status(404).json({ error: 'Batch file not found' });
    }
    
    project.isRunning = true;
    await project.save();
    
    const batFilePath = path.join(project.rootPath, batFileName);
    const io = req.app.get('io');
    
    executeBatchFile(batFilePath, projectId, io)
      .then(async (result) => {
        project.isRunning = false;
        project.currentOutput = result.output;
        await project.save();
      })
      .catch(async (error) => {
        project.isRunning = false;
        await project.save();
        console.error('Execution error:', error);
      });
    
    res.json({ 
      success: true, 
      message: 'Execution started',
      projectId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const stopExecution = async (req, res) => {
  try {
    const { projectId } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    project.isRunning = false;
    await project.save();
    
    const io = req.app.get('io');
    io.to(projectId).emit('executionStopped', { projectId });
    
    res.json({ success: true, message: 'Execution stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};