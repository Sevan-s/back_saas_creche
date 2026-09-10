import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async ({ crecheId, userId, action, detail, item, quantiteAjustee }) => {
  try {
    // Si crecheId vaut "GLOBAL" ou n'est pas un ObjectId valide, on stocke null
    const validCrecheId = (crecheId && crecheId !== 'GLOBAL') ? crecheId : null;

    await ActivityLog.create({
      creche: validCrecheId,
      utilisateur: userId,
      action,
      detail,
      item: item || null,
      quantiteAjustee: quantiteAjustee || 0
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du log:', error);
  }
};

export const getLogs = async (req, res) => {
  try {
    // Si l'utilisateur n'a pas de crèche spécifique ou est "GLOBAL", on retourne tous les logs
    const filter = (!req.user.crecheId || req.user.crecheId === 'GLOBAL') 
      ? {} 
      : { creche: req.user.crecheId };

    const logs = await ActivityLog.find(filter)
      .populate('utilisateur', 'nom prenom role')
      .populate('item', 'nom')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};