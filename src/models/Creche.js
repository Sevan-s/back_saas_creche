import mongoose from 'mongoose';

const crecheSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom de la crèche est obligatoire'],
      trim: true,
    },
    codeRattachement: {
      type: String,
      required: [true, 'Le code de rattachement est obligatoire'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    adresse: {
      rue: { type: String, trim: true },
      codePostal: { type: String, trim: true },
      ville: { type: String, trim: true },
    },
    telephone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
const Creche = mongoose.models.Creche || mongoose.model('Creche', crecheSchema);

export default Creche;