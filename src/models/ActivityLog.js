import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    creche: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creche',
      required: false,
      default: null,
    },
    utilisateur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'ENTREE_STOCK',
        'SORTIE_STOCK',
        'AJUSTEMENT_POSITIF',
        'AJUSTEMENT_NEGATIF',
        'RECEPTION_COMMANDE',
        'CREATION_ARTICLE',
        'SUPPRESSION_ARTICLE',
        'MAJ_ARTICLE',
        'CREATION_CATEGORIE',
        'SUPPRESSION_CATEGORIE',
        'CREATION_COMMANDE',
        'COMMANDE_PASSEE',
      ],
    },
    detail: {
      type: String,
      required: true,
      trim: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    quantiteAjustee: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;