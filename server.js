/**
 * 🏦 BANKSIM - SERVEUR VULNÉRABLE
 * 
 * ⚠️  CE CODE CONTIENT UNE FAILLE DE SÉCURITÉ INTENTIONNELLE ⚠️
 * 
 * Ce serveur démontre une vulnérabilité de type "Race Condition"
 * (TOCTOU - Time Of Check To Time Of Use)
 * 
 * NE PAS UTILISER EN PRODUCTION ! 
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variable pour tracker les requêtes (debug)
let requestCounter = 0;

/**
 * 📊 GET /api/accounts
 * Récupère tous les comptes avec leurs soldes
 */
app.get('/api/accounts', (req, res) => {
  try {
    const accounts = database. getAllAccounts();
    const total = database.getTotalBalance();
    res.json({ 
      success: true, 
      accounts,
      totalBalance: total,
      expectedTotal: 2000 // Somme initiale attendue
    });
  } catch (error) {
    res. status(500).json({ success: false, error: error.message });
  }
});

/**
 * 📊 GET /api/account/:id
 * Récupère les détails d'un compte spécifique
 */
app.get('/api/account/:id', (req, res) => {
  try {
    const account = database.getAccountById(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ success: false, error: 'Compte non trouvé' });
    }
    res.json({ success: true, account });
  } catch (error) {
    res.status(500).json({ success: false, error: error. message });
  }
});

/**
 * 💸 POST /api/transfer
 * 
 * ⚠️  ENDPOINT VULNÉRABLE - RACE CONDITION ⚠️
 * 
 * Cette implémentation contient une faille TOCTOU:
 * 1. On vérifie le solde (Time of Check)
 * 2.  Délai artificiel pour augmenter la fenêtre de vulnérabilité
 * 3. On effectue le transfert (Time of Use)
 * 
 * Problème: Entre l'étape 1 et 3, d'autres requêtes peuvent
 * passer la vérification avec le même solde initial. 
 */
app.post('/api/transfer', async (req, res) => {
  const currentRequest = ++requestCounter;
  const { from, to, amount } = req.body;
  
  console.log(`\n🔄 [Requête #${currentRequest}] Transfert initié: ${amount}€ de compte ${from} vers compte ${to}`);

  // Validation des entrées
  if (!from || ! to || !amount || amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Paramètres invalides' 
    });
  }

  if (from === to) {
    return res.status(400).json({ 
      success: false, 
      error: 'Impossible de transférer vers le même compte' 
    });
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // 🔴 ÉTAPE 1: VÉRIFICATION DU SOLDE (TIME OF CHECK)
    // ═══════════════════════════════════════════════════════════════
    // On récupère le solde actuel de l'expéditeur
    const sender = database.getBalance(from);
    
    if (! sender) {
      return res. status(404).json({ success: false, error: 'Compte expéditeur non trouvé' });
    }

    console.log(`📊 [Requête #${currentRequest}] Solde vérifié: ${sender.balance}€`);

    // ═══════════════════════════════════════════════════════════════
    // 🔴 FENÊTRE DE VULNÉRABILITÉ - DÉLAI ARTIFICIEL
    // ═══════════════════════════════════════════════════════════════
    // Ce délai simule un traitement réel (vérifications anti-fraude,
    // logging, etc.) et augmente la fenêtre de race condition
    await new Promise(resolve => setTimeout(resolve, 200));

    // ═══════════════════════════════════════════════════════════════
    // 🔴 VÉRIFICATION DE LA CONDITION
    // ═══════════════════════════════════════════════════════════════
    // À ce stade, le solde peut avoir changé par une autre requête,
    // mais on utilise toujours la valeur vérifiée précédemment! 
    if (sender.balance >= amount) {
      console.log(`✅ [Requête #${currentRequest}] Solde suffisant, transfert autorisé`);

      // ═══════════════════════════════════════════════════════════════
      // 🔴 ÉTAPE 2: EXÉCUTION DU TRANSFERT (TIME OF USE)
      // ═══════════════════════════════════════════════════════════════
      // Ces opérations ne sont PAS atomiques! 
      // Chaque UPDATE est indépendant = pas de transaction
      
      // Débiter l'expéditeur
      database.subtractBalance(from, amount);
      
      // Petit délai supplémentaire
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Créditer le destinataire
      database.addBalance(to, amount);
      
      // Enregistrer la transaction
      database. recordTransaction(from, to, amount);

      const newSenderBalance = database.getBalance(from);
      console.log(`💰 [Requête #${currentRequest}] Transfert effectué!  Nouveau solde expéditeur: ${newSenderBalance. balance}€`);

      return res.json({ 
        success: true, 
        message: `Transfert de ${amount}€ effectué avec succès`,
        requestId: currentRequest
      });
    } else {
      console.log(`❌ [Requête #${currentRequest}] Solde insuffisant: ${sender.balance}€ < ${amount}€`);
      return res.json({ 
        success: false, 
        error: 'Solde insuffisant',
        balance: sender.balance,
        requestId: currentRequest
      });
    }

  } catch (error) {
    console.error(`💥 [Requête #${currentRequest}] Erreur:`, error. message);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      requestId: currentRequest
    });
  }
});

/**
 * 📜 GET /api/transactions
 * Récupère l'historique des transactions
 */
app.get('/api/transactions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = database.getTransactions(limit);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 🔄 POST /api/reset
 * Réinitialise tous les comptes à leur état initial
 */
app.post('/api/reset', (req, res) => {
  try {
    database.resetAccounts();
    requestCounter = 0;
    console.log('\n🔄 ════════════════════════════════════════');
    console.log('   BASE DE DONNÉES RÉINITIALISÉE');
    console.log('════════════════════════════════════════\n');
    res.json({ 
      success: true, 
      message: 'Base de données réinitialisée',
      accounts: database.getAllAccounts()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 📊 GET /api/stats
 * Récupère les statistiques pour détecter les anomalies
 */
app. get('/api/stats', (req, res) => {
  try {
    const accounts = database.getAllAccounts();
    const total = database.getTotalBalance();
    const transactions = database.getTransactions(100);
    
    res.json({
      success: true,
      stats: {
        totalBalance: total,
        expectedTotal: 2000,
        anomaly: total !== 2000,
        anomalyAmount: total - 2000,
        accountCount: accounts.length,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  🏦 BANKSIM - Simulateur de Transferts Bancaires');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  ⚠️  MODE: VULNÉRABLE (Race Condition activée)`);
  console.log(`  🌐 URL: http://localhost:${PORT}`);
  console.log('════════════════════════════════════════════════════════════');
  console.log('\n📋 Comptes disponibles:');
  const accounts = database.getAllAccounts();
  accounts.forEach(acc => {
    console.log(`   - ${acc.name} (ID: ${acc.id}): ${acc.balance}€`);
  });
  console.log('\n🔍 Endpoints:');
  console.log('   GET  /api/accounts     - Liste des comptes');
  console.log('   GET  /api/account/:id  - Détails d\'un compte');
  console. log('   POST /api/transfer     - Effectuer un transfert');
  console.log('   GET  /api/transactions - Historique');
  console.log('   POST /api/reset        - Réinitialiser');
  console.log('   GET  /api/stats        - Statistiques\n');
});

module.exports = app;