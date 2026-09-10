import { User } from '../models/user.js';
import Creche from '../models/Creche.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateCodeRattachement = (codePostal) => {
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cp = codePostal ? codePostal.trim() : '00000';
  return `CRECHE-${randomHex}-${cp}`;
};

export const registerCreche = async (req, res) => {
  try {
    const { 
      nomCreche, adresse, codePostal, ville, telephone,
      nom, prenom, email, motDePasse, codePIN 
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const saltRounds = 10;
    const motDePasseHash = await bcrypt.hash(motDePasse, saltRounds);
    const codeRattachement = generateCodeRattachement(codePostal);
    const newCreche = new Creche({
      nom: nomCreche,
      codeRattachement,
      adresse,
      codePostal,
      ville,
      telephone
    });
    await newCreche.save();

    const newUser = new User({
      nom,
      prenom,
      email: email.toLowerCase(),
      motDePasseHash,
      codePIN,
      creche: newCreche._id,
      role: 'ADMIN_CRECHE',
      sectionPrincipale: 'GLOBAL'
    });
    await newUser.save();

    newCreche.creePar = newUser._id;
    await newCreche.save();

    const token = jwt.sign(
      { userId: newUser._id, crecheId: newCreche._id, role: newUser.role },
      process.env.JWT_SECRET || 'secret_key_temporaire',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Crèche et compte administrateur créés avec succès !',
      token,
      codeRattachement: newCreche.codeRattachement,
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: newUser.role,
        crecheId: newCreche._id
      }
    });

  } catch (error) {
    console.error('Erreur registerCreche:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création de la crèche.' });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { 
      codeRattachement, nom, prenom, email, motDePasse, 
      codePIN, role, sectionPrincipale 
    } = req.body;

    const creche = await Creche.findOne({ codeRattachement: codeRattachement?.trim().toUpperCase() });
    if (!creche) {
      return res.status(404).json({ message: 'Code de rattachement invalide. Crèche introuvable.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Un compte avec cet email existe déjà.' });
    }

    const saltRounds = 10;
    const motDePasseHash = await bcrypt.hash(motDePasse, saltRounds);

    const newUser = new User({
      nom,
      prenom,
      email: email.toLowerCase(),
      motDePasseHash,
      codePIN,
      creche: creche._id,
      role: role || 'AUXILIAIRE',
      sectionPrincipale: sectionPrincipale || 'GLOBAL'
    });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, crecheId: creche._id, role: newUser.role },
      process.env.JWT_SECRET || 'secret_key_temporaire',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Compte collaborateur créé avec succès !',
      token,
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: newUser.role,
        sectionPrincipale: newUser.sectionPrincipale,
        crecheId: creche._id
      }
    });

  } catch (error) {
    console.error('Erreur registerUser:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la création du compte.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate('creche', 'nom codeRattachement');
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    if (!user.actif) {
      return res.status(403).json({ message: 'Ce compte a été désactivé.' });
    }

    const isMatch = await bcrypt.compare(motDePasse, user.motDePasseHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { userId: user._id, crecheId: user.creche._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_temporaire',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie !',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        sectionPrincipale: user.sectionPrincipale,
        codePIN: user.codePIN ? true : false,
        creche: user.creche
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
};

export const loginByPin = async (req, res) => {
  try {
    const { codeRattachement, codePIN } = req.body;

    if (!codeRattachement || !codePIN) {
      return res.status(400).json({ message: 'Code de rattachement et Code PIN requis.' });
    }

    const creche = await Creche.findOne({ codeRattachement: codeRattachement.trim().toUpperCase() });
    if (!creche) {
      return res.status(404).json({ message: 'Crèche introuvable avec ce code.' });
    }

    const user = await User.findOne({ creche: creche._id, codePIN, actif: true });
    if (!user) {
      return res.status(401).json({ message: 'Code PIN incorrect.' });
    }

    const token = jwt.sign(
      { userId: user._id, crecheId: creche._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_temporaire',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Connexion rapide réussie !',
      token,
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        sectionPrincipale: user.sectionPrincipale,
        crecheId: creche._id
      }
    });

  } catch (error) {
    console.error('Erreur loginByPin:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion rapide.' });
  }
};