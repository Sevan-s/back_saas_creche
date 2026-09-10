import Order from '../models/Order.js';
import Item from '../models/Item.js';
import { logActivity } from './activityLogController.js';

// 1. Obtenir toutes les commandes de la crèche
export const getOrders = async (req, res) => {
  try {
    const { statut } = req.query;
    let query = { creche: req.user.crecheId };

    if (statut) {
      query.statut = statut;
    }

    const orders = await Order.find(query)
      .populate('creePar', 'nom prenom')
      .populate('items.item', 'nom unite quantiteActuelle quantiteSouhaitee')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Erreur getOrders:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes.' });
  }
};

// 2. Créer une commande manuelle pour un ou plusieurs articles
export const createOrder = async (req, res) => {
  try {
    const crecheId = req.user.crecheId;
    const { items, fournisseur, remarques } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'La commande doit contenir au moins un article.' });
    }

    const count = await Order.countDocuments({ creche: crecheId });
    const numeroCommande = `CMD-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const newOrder = await Order.create({
      creche: crecheId,
      numeroCommande,
      creePar: req.user.userId,
      statut: 'BROUILLON',
      items,
      fournisseur,
      remarques,
    });

    // Récupération complète avec lean() pour manipuler un objet JS pur et rapide
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('creePar', 'nom prenom')
      .populate('items.item', 'nom unite quantiteActuelle quantiteSouhaitee')
      .lean();

    // --- ENREGISTREMENT DÉTAILLÉ DANS L'HISTORIQUE ---
    if (populatedOrder && populatedOrder.items) {
      for (const orderItem of populatedOrder.items) {
        // Extraction sécurisée de l'ID et du Nom du produit
        const itemId = orderItem.item?._id || orderItem.item;
        const itemNom = orderItem.item?.nom || 'Article';
        const qty = orderItem.quantiteCommandee || 1;

        await logActivity({
          crecheId,
          userId: req.user.userId,
          action: 'COMMANDE_PASSEE',
          detail: `Commande ${numeroCommande} : ${qty}x "${itemNom}"`,
          item: itemId,
          quantiteAjustee: qty
        });
      }
    }

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Erreur createOrder:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande.' });
  }
};

// 3. Générer une commande automatique
export const generateAutoOrder = async (req, res) => {
  try {
    const crecheId = req.user.crecheId;

    const itemsStockBas = await Item.find({
      creche: crecheId,
      $expr: { $lte: ['$quantiteActuelle', '$seuilAlerte'] }
    });

    if (itemsStockBas.length === 0) {
      return res.status(200).json({
        message: 'Aucun article en stock bas. Pas de commande automatique nécessaire.',
        items: []
      });
    }

    const itemsACommander = itemsStockBas.map(item => {
      const manque = Math.max(1, item.quantiteSouhaitee - item.quantiteActuelle);
      return {
        item: item._id,
        quantiteCommandee: manque
      };
    });

    const count = await Order.countDocuments({ creche: crecheId });
    const numeroCommande = `CMD-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

    const newOrder = await Order.create({
      creche: crecheId,
      numeroCommande,
      creePar: req.user.userId,
      statut: 'BROUILLON',
      items: itemsACommander,
      remarques: 'Commande générée automatiquement basée sur les alertes de stock.'
    });

    await logActivity({
      crecheId,
      userId: req.user.userId,
      action: 'CREATION_COMMANDE',
      detail: `Génération automatique de la commande ${numeroCommande}`
    });

    const populatedOrder = await Order.findById(newOrder._id)
      .populate('items.item', 'nom unite quantiteActuelle quantiteSouhaitee');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Erreur generateAutoOrder:', error);
    res.status(500).json({ message: 'Erreur lors de la génération de la commande.' });
  }
};

// 4. Valider / Changer le statut d'une commande
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, fournisseur, remarques } = req.body;

    const order = await Order.findOne({ _id: id, creche: req.user.crecheId });
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    const ancienStatut = order.statut;

    if (statut) order.statut = statut;
    if (fournisseur) order.fournisseur = fournisseur;
    if (remarques) order.remarques = remarques;

    if (statut === 'VALIDEE' && !order.dateValidation) {
      order.dateValidation = new Date();
    }

    await order.save();

    // Définition de l'action et du détail pour le log
    let action = 'MODIFICATION_COMMANDE';
    let detail = `Commande ${order.numeroCommande} passée au statut "${order.statut}"`;

    if (statut === 'VALIDEE' || statut === 'EN_ATTENTE') {
      action = 'COMMANDE_PASSEE';
      detail = `Commande ${order.numeroCommande} passée auprès du fournisseur "${order.fournisseur || 'Non renseigné'}"`;
    }

    await logActivity({
      crecheId: req.user.crecheId,
      userId: req.user.userId,
      action,
      detail
    });

    res.json(order);
  } catch (error) {
    console.error('Erreur updateOrderStatus:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la commande.' });
  }
};

// 5. Réceptionner une commande (Incrémente le stock et enregistre les logs)
export const receiveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemsRecus } = req.body;

    const order = await Order.findOne({ _id: id, creche: req.user.crecheId });
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    if (order.statut === 'RECUE') {
      return res.status(400).json({ message: 'Cette commande a déjà été réceptionnée.' });
    }

    for (const itemRecu of itemsRecus) {
      const itemInOrder = order.items.find(i => i.item.toString() === itemRecu.item);
      if (itemInOrder) {
        itemInOrder.quantiteRecue = itemRecu.quantiteRecue;

        const itemObj = await Item.findById(itemRecu.item);
        if (itemObj) {
          itemObj.quantite = (itemObj.quantite || 0) + itemRecu.quantiteRecue;
          await itemObj.save();

          // Log individuel de réapprovisionnement de stock
          await logActivity({
            crecheId: req.user.crecheId,
            userId: req.user.userId,
            action: 'RECEPTION_COMMANDE',
            detail: `Réception de ${itemRecu.quantiteRecue} "${itemObj.nom}" (Commande ${order.numeroCommande})`,
            item: itemObj._id,
            quantiteAjustee: itemRecu.quantiteRecue
          });
        }
      }
    }

    order.statut = 'RECUE';
    order.dateReception = new Date();
    await order.save();

    res.json({ message: 'Commande réceptionnée et stocks mis à jour avec succès.', order });
  } catch (error) {
    console.error('Erreur receiveOrder:', error);
    res.status(500).json({ message: 'Erreur lors de la réception de la commande.' });
  }
};