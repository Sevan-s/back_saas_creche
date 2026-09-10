import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

import {
  getOrders,
  createOrder,
  generateAutoOrder,
  updateOrderStatus,
  receiveOrder,
} from '../controllers/orderController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.post('/', createOrder);
router.post('/auto-generate', generateAutoOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/receive', receiveOrder);

export default router;