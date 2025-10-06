import express from 'express';
import { 
  createModule, 
  getModulesByUser, 
  updateModuleStatus,
  getAllModules,
  cloneModule 
} from '../controllers/moduleController.js';
import { authenticate, authorizeTeamLead } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, authorizeTeamLead, createModule);
router.get('/my-modules', authenticate, getModulesByUser);
router.get('/', authenticate, getAllModules);
router.put('/:id/status', authenticate, updateModuleStatus);
router.post('/clone', authenticate, cloneModule);

export default router;
