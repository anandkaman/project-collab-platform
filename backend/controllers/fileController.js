import fs from 'fs/promises';
import path from 'path';
import Project from '../models/Project.js';

export const getFiles = async (req, res) => {
  try {
    const { projectId, branch } = req.query;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const basePath = branch && branch !== 'main'
      ? path.join(project.rootPath, 'branches', branch)
      : project.rootPath;
    
    const files = await readDirectory(basePath, basePath);
    
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const readDirectory = async (dirPath, basePath) => {
  const items = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);
      
      if (entry.isDirectory()) {
        const children = await readDirectory(fullPath, basePath);
        items.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children
        });
      } else {
        items.push({
          name: entry.name,
          type: 'file',
          path: relativePath
        });
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return items;
};

export const readFile = async (req, res) => {
  try {
    const { projectId, filePath, branch } = req.query;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const basePath = branch && branch !== 'main'
      ? path.join(project.rootPath, 'branches', branch)
      : project.rootPath;
    
    const fullPath = path.join(basePath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const writeFile = async (req, res) => {
  try {
    const { projectId, filePath, content, branch } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const basePath = branch && branch !== 'main'
      ? path.join(project.rootPath, 'branches', branch)
      : project.rootPath;
    
    const fullPath = path.join(basePath, filePath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    
    const io = req.app.get('io');
    io.to(projectId).emit('fileChanged', {
      projectId,
      filePath,
      branch,
      action: 'modified'
    });
    
    res.json({ success: true, message: 'File saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { projectId, filePath, branch } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const basePath = branch && branch !== 'main'
      ? path.join(project.rootPath, 'branches', branch)
      : project.rootPath;
    
    const fullPath = path.join(basePath, filePath);
    
    try {
      // Check if it's a directory or file
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        // Remove directory recursively
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        // Remove file
        await fs.unlink(fullPath);
      }
      
      const io = req.app.get('io');
      io.to(projectId).emit('fileChanged', {
        projectId,
        filePath,
        branch,
        action: 'deleted'
      });
      
      res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'File or folder not found' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createFolder = async (req, res) => {
  try {
    const { projectId, folderPath, branch } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const basePath = branch && branch !== 'main'
      ? path.join(project.rootPath, 'branches', branch)
      : project.rootPath;
    
    const fullPath = path.join(basePath, folderPath);
    
    // Create folder recursively
    await fs.mkdir(fullPath, { recursive: true });
    
    // Create a .gitkeep file to ensure folder is tracked
    await fs.writeFile(path.join(fullPath, '.gitkeep'), '');
    
    const io = req.app.get('io');
    io.to(projectId).emit('fileChanged', {
      projectId,
      folderPath,
      branch,
      action: 'created'
    });
    
    res.json({ success: true, message: 'Folder created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBatFile = async (req, res) => {
  try {
    const { projectId, fileName, content } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const fullPath = path.join(project.rootPath, fileName);
    await fs.writeFile(fullPath, content, 'utf-8');
    
    // Update project batFiles array
    if (!project.batFiles) {
      project.batFiles = [];
    }
    if (!project.batFiles.includes(fileName)) {
      project.batFiles.push(fileName);
      await project.save();
    }
    
    res.json({ success: true, message: 'Batch file created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchFiles = async (req, res) => {
  try {
    const { projectId, searchTerm } = req.query;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const files = await getFilesRecursive(project.rootPath, project.rootPath, searchTerm);
    
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFilesRecursive = async (dirPath, basePath, searchTerm = '') => {
  let results = [];
  
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      // Skip node_modules and hidden folders
      if (item.name === 'node_modules' || item.name.startsWith('.')) continue;
      
      const fullPath = path.join(dirPath, item.name);
      const relativePath = path.relative(basePath, fullPath);
      
      if (item.isDirectory()) {
        const subFiles = await getFilesRecursive(fullPath, basePath, searchTerm);
        results = results.concat(subFiles);
      } else {
        // Filter by search term if provided
        if (!searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            name: item.name,
            path: relativePath,
            type: 'file'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return results;
};
