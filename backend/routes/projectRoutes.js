import express from 'express';
import { 
  createProject, 
  getAllProjects, 
  getProjectById, 
  updateProject, 
  deleteProject 
} from '../controllers/projectController.js';
import { authenticate, authorizeTeamLead } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorizeTeamLead, createProject);
router.get('/', authenticate, getAllProjects);
router.get('/:id', authenticate, getProjectById);
router.put('/:id', authenticate, authorizeTeamLead, updateProject);
router.delete('/:id', authenticate, authorizeTeamLead, deleteProject);

export default router;