import { spawn } from 'child_process';
import path from 'path';
import Project from '../models/Project.js';

export const executeTerminalCommand = async (req, res) => {
  try {
    const { projectId, command, branch } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const workingDir = branch && branch !== 'main'
      ? path.join(project.rootPath, 'branches', branch)
      : project.rootPath;
    
    const io = req.app.get('io');
    
    // Parse command
    const [cmd, ...args] = command.trim().split(' ');
    
    // Execute command
    const process = spawn(cmd, args, { 
      cwd: workingDir,
      shell: true
    });
    
    process.stdout.on('data', (data) => {
      io.to(projectId).emit('terminalOutput', {
        output: data.toString(),
        timestamp: Date.now()
      });
    });
    
    process.stderr.on('data', (data) => {
      io.to(projectId).emit('terminalError', {
        error: data.toString(),
        timestamp: Date.now()
      });
    });
    
    process.on('close', (exitCode) => {
      io.to(projectId).emit('commandComplete', {
        exitCode,
        timestamp: Date.now()
      });
    });
    
    res.json({ success: true, message: 'Command execution started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
