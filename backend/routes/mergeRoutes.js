import express from 'express';
import { 
  requestMerge, 
  getMergeRequests, 
  approveMerge, 
  rejectMerge 
} from '../controllers/mergeController.js';
import { authenticate, authorizeTeamLead } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', authenticate, requestMerge);
router.get('/requests', authenticate, authorizeTeamLead, getMergeRequests);
router.post('/approve', authenticate, authorizeTeamLead, approveMerge);
router.post('/reject', authenticate, authorizeTeamLead, rejectMerge);

export default router;
