import User from '../models/user.js';

// Récupérer tous les utilisateurs de la crèche
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ creche: req.user.crecheId })
      .select('-motDePasseHash')
      .sort({ nom: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.' });
  }
};

// Mettre à jour un utilisateur (Rôle, Section, PIN, Statut actif)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, sectionPrincipale, codePIN, actif } = req.body;

    const user = await User.findOne({ _id: id, creche: req.user.crecheId });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable.' });
    }

    if (role) user.role = role;
    if (sectionPrincipale !== undefined) user.sectionPrincipale = sectionPrincipale;
    if (codePIN !== undefined) user.codePIN = codePIN;
    if (actif !== undefined) user.actif = actif;

    await user.save();

    res.json({
      message: 'Utilisateur mis à jour avec succès.',
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        sectionPrincipale: user.sectionPrincipale,
        actif: user.actif
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur.' });
  }
};