import express from 'express';
import * as studentController from '../controllers/studentController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('student'));

router.get('/history', studentController.getStudentHistory);

export default router;
