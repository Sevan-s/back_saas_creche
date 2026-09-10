import Category from '../models/Category.js';
import { logActivity } from './activityLogController.js';

const getUserId = (req) => req.user?._id || req.user?.id || req.user?.userId;

const getCrecheId = (req) => req.user?.creche || req.user?.crecheId;

export const getCategories = async (req, res) => {
  try {
    const crecheId = getCrecheId(req);
    const query = (!crecheId || crecheId === 'GLOBAL') ? {} : { creche: crecheId };

    const categories = await Category.find(query).sort({ nom: 1 });

    res.status(200).json(categories);
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des catégories.' });
  }
};

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

    await logActivity({
      crecheId: validCrecheId,
      userId: getUserId(req),
      action: 'CREATION_CATEGORIE',
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

    await logActivity({
      crecheId: (crecheId && crecheId !== 'GLOBAL') ? crecheId : null,
      userId: getUserId(req),
      action: 'SUPPRESSION_CATEGORIE',
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