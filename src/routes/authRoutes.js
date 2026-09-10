import express from 'express';
import { 
  registerCreche, 
  registerUser, 
  login, 
  loginByPin 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register-creche', registerCreche);
router.post('/register-user', registerUser);

router.post('/login', login);
router.post('/login-pin', loginByPin);

export default router;