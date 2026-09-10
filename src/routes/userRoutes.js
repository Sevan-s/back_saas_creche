import express from 'express';
import { getUsers, updateUser } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getUsers);
router.patch('/:id', updateUser);

export default router;