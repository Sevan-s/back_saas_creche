import express from 'express';
import { getItems, createItem, adjustStock, deleteItem, updateQuantity, updateItem } from '../controllers/itemController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.patch('/:id/stock', adjustStock);
router.patch('/:id/quantity', authMiddleware, updateQuantity);
router.delete('/:id', deleteItem);

export default router;