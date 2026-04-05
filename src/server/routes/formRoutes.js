import express from 'express';
import * as facultyController from '../controllers/facultyController.js';
import * as studentController from '../controllers/studentController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Faculty Routes
router.post('/', authorizeRole('faculty'), facultyController.createForm);
router.put('/:id', authorizeRole('faculty'), facultyController.updateForm);
router.get('/faculty', authorizeRole('faculty'), facultyController.getFacultyForms);
router.get('/:id/responses', authorizeRole('faculty'), facultyController.getFormResponses);
router.get('/:id/analysis', authorizeRole('faculty'), facultyController.getFormAnalysis);

// Student Routes
router.get('/available', authorizeRole('student'), studentController.getAvailableForms);
router.get('/:id', authenticateToken, studentController.getFormDetails);
router.post('/:id/submit', authorizeRole('student'), studentController.submitResponse);
router.put('/:id/edit', authorizeRole('student'), studentController.editResponse);

export default router;
