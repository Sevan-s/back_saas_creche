
const crecheSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  codeRattachement: { type: String, required: true, unique: true },
  adresse: String,
  codePostal: String,
  ville: String,
  telephone: String,
  creePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    motDePasseHash: {
      type: String,
      required: true,
    },
    codePIN: {
      type: String,
      trim: true,
    },
    creche: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creche',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['ADMIN_CRECHE', 'EDUCATEUR', 'AUXILIAIRE', 'DIRECTION'],
      default: 'AUXILIAIRE',
    },
    sectionPrincipale: {
      type: String,
      enum: ['BEBES', 'MOYENS', 'GRANDS', 'CUISINE', 'GLOBAL'],
      default: 'GLOBAL',
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

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;