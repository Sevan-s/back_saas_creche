import express from 'express';
import { getLogs } from '../controllers/activityLogController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getLogs);

export default router;