import express from 'express';
import { executeTerminalCommand } from '../controllers/terminalController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/execute', authenticate, executeTerminalCommand);

export default router;
