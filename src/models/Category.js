import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom de la catégorie est obligatoire'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creche: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creche',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;