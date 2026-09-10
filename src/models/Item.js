import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de l'article est obligatoire"],
      trim: true,
    },
    creche: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creche',
      required: true,
    },
    categorie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    fournisseur: {
      type: String,
      trim: true,
      default: '',
    },
    quantite: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'La quantité ne peut pas être négative'],
    },
    seuilAlerte: {
      type: Number,
      required: true,
      default: 5,
    },
    unite: {
      type: String,
      default: 'unité',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

export default Item;