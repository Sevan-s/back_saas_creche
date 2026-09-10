import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantiteCommandee: {
    type: Number,
    required: true,
    min: 1
  },
  quantiteRecue: {
    type: Number,
    default: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  creche: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creche',
    required: true,
    index: true
  },
  numeroCommande: {
    type: String,
    required: true
  },
  creePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statut: {
    type: String,
    enum: ['BROUILLON', 'VALIDEE', 'EN_ATTENTE', 'RECUE', 'ANNULEE'],
    default: 'BROUILLON'
  },
  items: [orderItemSchema],
  fournisseur: {
    type: String,
    trim: true
  },
  remarques: {
    type: String,
    trim: true
  },
  dateValidation: {
    type: Date
  },
  dateReception: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);