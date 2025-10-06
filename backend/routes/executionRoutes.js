import express from 'express';
import { executeProject, stopExecution } from '../controllers/executionController.js';
import { authenticate, authorizeTeamLead } from '../middleware/auth.js';

const router = express.Router();

router.post('/execute', authenticate, authorizeTeamLead, executeProject);
router.post('/stop', authenticate, authorizeTeamLead, stopExecution);

export default router;