import Item from '../models/Item.js';
import { logActivity } from './activityLogController.js';

const getUserId = (req) => req.user?._id || req.user?.id || req.user?.userId;

export const getItems = async (req, res) => {
  try {
    const { fournisseur, categorie, stockBas } = req.query;

    let query = {};
    if (req.user.crecheId && req.user.crecheId !== 'GLOBAL') {
      query.creche = req.user.crecheId;
    }

    if (fournisseur) query.fournisseur = fournisseur;
    if (categorie) query.categorie = categorie;

    let items = await Item.find(query).populate('categorie', 'nom couleur icone');

    if (stockBas === 'true') {
      items = items.filter(item => (item.quantite ?? item.quantiteActuelle ?? 0) <= item.seuilAlerte);
    }

    res.json(items);
  } catch (error) {
    console.error('Erreur récupération articles:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des articles.' });
  }
};

export const createItem = async (req, res) => {
  try {
    const { nom, categorie, fournisseur, quantite, seuilAlerte, unite } = req.body;

    if (!nom || !categorie) {
      return res.status(400).json({ message: 'Nom et catégorie requis.' });
    }

    const item = await Item.create({
      creche: (req.user.crecheId && req.user.crecheId !== 'GLOBAL') ? req.user.crecheId : null,
      nom,
      categorie,
      fournisseur: fournisseur || '',
      quantite: quantite !== undefined ? Number(quantite) : 0,
      seuilAlerte: seuilAlerte !== undefined ? Number(seuilAlerte) : 5,
      unite: unite || 'unité',
    });

    await logActivity({
      crecheId: req.user.crecheId,
      userId: getUserId(req),
      action: 'CREATION_ARTICLE',
      detail: `Création de l'article "${item.nom}" (Stock initial : ${item.quantite})`,
      item: item._id,
      quantiteAjustee: item.quantite
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Erreur création article:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'article.' });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    if (typeof delta !== 'number') {
      return res.status(400).json({ message: 'Le champ delta doit être un nombre.' });
    }

    const query = { _id: id };
    if (req.user.crecheId && req.user.crecheId !== 'GLOBAL') {
      query.creche = req.user.crecheId;
    }

    const item = await Item.findOne(query);
    if (!item) {
      return res.status(404).json({ message: 'Article introuvable.' });
    }

    const ancienneQuantite = item.quantite ?? item.quantiteActuelle ?? 0;
    const nouvelleQuantite = Math.max(0, ancienneQuantite + delta);
    const differenceReelle = nouvelleQuantite - ancienneQuantite;

    item.quantite = nouvelleQuantite;
    if (item.quantiteActuelle !== undefined) item.quantiteActuelle = nouvelleQuantite;
    await item.save();

    const actionType = delta > 0 ? 'ENTREE_STOCK' : 'SORTIE_STOCK';

    await logActivity({
      crecheId: req.user.crecheId,
      userId: getUserId(req),
      action: actionType,
      detail: `${delta > 0 ? 'Entrée' : 'Sortie'} de ${Math.abs(differenceReelle)} ${item.unite || 'unité'}(s) pour "${item.nom}"`,
      item: item._id,
      quantiteAjustee: differenceReelle
    });

    res.json(item);
  } catch (error) {
    console.error('Erreur ajustement stock:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajustement du stock.' });
  }
};

export const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantite } = req.body;

    if (quantite === undefined || isNaN(Number(quantite)) || Number(quantite) < 0) {
      return res.status(400).json({ message: 'Quantité invalide.' });
    }

    const query = { _id: id };
    if (req.user.crecheId && req.user.crecheId !== 'GLOBAL') {
      query.creche = req.user.crecheId;
    }

    const itemAncien = await Item.findOne(query);
    if (!itemAncien) {
      return res.status(404).json({ message: 'Article non trouvé.' });
    }

    const ancienneQuantite = itemAncien.quantite ?? itemAncien.quantiteActuelle ?? 0;
    const nouvelleQuantite = Number(quantite);
    const difference = nouvelleQuantite - ancienneQuantite;

    itemAncien.quantite = nouvelleQuantite;
    if (itemAncien.quantiteActuelle !== undefined) itemAncien.quantiteActuelle = nouvelleQuantite;
    
    await itemAncien.save();
    const updatedItem = await Item.findById(itemAncien._id).populate('categorie', 'nom couleur icone');

    let actionType = 'AJUSTEMENT_POSITIF';
    if (difference < 0) actionType = 'AJUSTEMENT_NEGATIF';
    if (difference === 0) actionType = 'ENTREE_STOCK';

    await logActivity({
      crecheId: req.user.crecheId,
      userId: getUserId(req),
      action: actionType,
      detail: `Modification manuelle du stock de "${updatedItem.nom}" : ${ancienneQuantite} -> ${nouvelleQuantite}`,
      item: updatedItem._id,
      quantiteAjustee: difference
    });

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la quantité :', error);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};
export const deleteItem = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.crecheId && req.user.crecheId !== 'GLOBAL') {
      query.creche = req.user.crecheId;
    }

    const item = await Item.findOneAndDelete(query);
    if (!item) {
      return res.status(404).json({ message: 'Article introuvable.' });
    }

    await logActivity({
      crecheId: req.user.crecheId,
      userId: getUserId(req),
      action: 'SUPPRESSION_ARTICLE',
      detail: `Suppression définitive de l'article "${item.nom}"`,
      item: null,
      quantiteAjustee: 0
    });

    res.json({ message: 'Article supprimé.' });
  } catch (error) {
    console.error('Erreur suppression article:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'article.' });
  }
};