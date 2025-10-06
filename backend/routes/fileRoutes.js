import express from 'express';
import { 
  getFiles, 
  readFile, 
  writeFile, 
  deleteFile, 
  createBatFile,
  createFolder,
  searchFiles 
} from '../controllers/fileController.js';
import { authenticate, authorizeTeamLead } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getFiles);
router.get('/read', authenticate, readFile);
router.get('/search', authenticate, searchFiles);
router.post('/write', authenticate, writeFile);
router.post('/create-folder', authenticate, createFolder);
router.delete('/delete', authenticate, deleteFile);
router.post('/bat', authenticate, authorizeTeamLead, createBatFile);

export default router;
