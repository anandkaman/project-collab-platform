import express from 'express';
import { register, login, getDevelopers } from '../controllers/authController.js';
import { authenticate, authorizeTeamLead } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/developers', authenticate, authorizeTeamLead, getDevelopers);

export default router;