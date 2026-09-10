import express from 'express';
import helmet from 'helmet';
import { requestTime } from './middleware/requestTime.js';
import { connectDB } from './middleware/dataBase.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

import cors from 'cors';

const app = express();
const port = 3000;

//Security
app.use(helmet());
app.disable('x-powered-by');
app.use(cors());

//middlewares
app.use(requestTime);
app.use(express.json())

//routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/logs', activityRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Le serveur écoute sur le port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Erreur critique de connexion MongoDB :', err);
  });