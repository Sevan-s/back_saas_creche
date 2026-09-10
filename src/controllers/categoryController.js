import Category from '../models/Category.js';
import { logActivity } from './activityLogController.js';

// Helper pour récupérer l'ID utilisateur
const getUserId = (req) => req.user?._id || req.user?.id || req.user?.userId;

// Helper pour récupérer l'ID crèche
const getCrecheId = (req) => req.user?.creche || req.user?.crecheId;

// 1. Obtenir toutes les catégories
export const getCategories = async (req, res) => {
  try {
    const crecheId = getCrecheId(req);

    // Si pas de crèche spécifique ou si "GLOBAL", on récupère toutes les catégories
    const query = (!crecheId || crecheId === 'GLOBAL') ? {} : { creche: crecheId };

    const categories = await Category.find(query).sort({ nom: 1 });

    res.status(200).json(categories);
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories.' });
  }
};

// 2. Créer une nouvelle catégorie
export const createCategory = async (req, res) => {
  try {
    const { nom, description } = req.body;
    const crecheId = getCrecheId(req);

    if (!nom) {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }

    const validCrecheId = (crecheId && crecheId !== 'GLOBAL') ? crecheId : null;

    const newCategory = await Category.create({
      creche: validCrecheId,
      nom,
      description
    });

    // Journalisation de la création
    await logActivity({
      crecheId: validCrecheId,
      userId: getUserId(req),
      action: 'CREATION_CATEGORIE', // Action générique de création du catalogue
      detail: `Création de la catégorie "${newCategory.nom}"`,
      item: null,
      quantiteAjustee: 0
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la catégorie.' });
  }
};

// 3. Supprimer une catégorie
export const deleteCategory = async (req, res) => {
  try {
    const crecheId = getCrecheId(req);

    const query = { _id: req.params.id };
    if (crecheId && crecheId !== 'GLOBAL') {
      query.creche = crecheId;
    }

    const category = await Category.findOneAndDelete(query);

    if (!category) {
      return res.status(404).json({ message: 'Catégorie introuvable.' });
    }

    // Journalisation de la suppression
    await logActivity({
      crecheId: (crecheId && crecheId !== 'GLOBAL') ? crecheId : null,
      userId: getUserId(req),
      action: 'SUPPRESSION_CATEGORIE', // Action générique de suppression du catalogue
      detail: `Suppression de la catégorie "${category.nom}"`,
      item: null,
      quantiteAjustee: 0
    });

    res.json({ message: 'Catégorie supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie.' });
  }
};