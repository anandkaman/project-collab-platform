import Project from '../models/Project.js';
import path from 'path';
import fs from 'fs/promises';

export const createProject = async (req, res) => {
  try {
    const { name, description, rootPath } = req.body;
    
    const project = new Project({
      name,
      description,
      rootPath: rootPath || path.join(process.cwd(), 'projects', name),
      createdBy: req.user._id,
      branches: [{ name: 'main' }]
    });
    
    await fs.mkdir(project.rootPath, { recursive: true });
    
    await project.save();
    
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('branches.developerId', 'username email');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (name) project.name = name;
    if (description) project.description = description;
    
    await project.save();
    
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
