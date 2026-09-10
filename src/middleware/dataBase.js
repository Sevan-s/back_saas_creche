import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGO_URI;

export async function connectDB() {
  try {
    if (!uri) {
      throw new Error("MONGO_URI n'est pas définie dans le fichier .env");
    }

    // Connexion via Mongoose
    const conn = await mongoose.connect(uri);
    
    console.log(`MongoDB connecté via Mongoose : ${conn.connection.host}`);
  } catch (error) {
    console.error("Erreur de connexion MongoDB :", error);
    process.exit(1);
  }
}