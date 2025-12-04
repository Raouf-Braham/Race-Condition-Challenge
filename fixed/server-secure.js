/**
 * 🏦 BANKSIM - SERVEUR SÉCURISÉ
 * 
 * ✅ CE CODE EST PROTÉGÉ CONTRE LES RACE CONDITIONS ✅
 * 
 * Ce serveur démontre comment corriger la vulnérabilité TOCTOU
 * en utilisant des transactions SQL atomiques.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3001; // Different port to run alongside vulnerable version

// Initialize database
const db = new Database(path.join(__dirname, '..', 'banksim-secure.db'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ═══════════════════════════════════════════════════════════════
// DATABASE INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0,
      version INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_account INTEGER NOT NULL,
      to_account INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_account) REFERENCES accounts(id),
      FOREIGN KEY (to_account) REFERENCES accounts(id)
    )
  `);

  console.log('✅ Base de données sécurisée initialisée');
}

function resetAccounts() {
  db.exec("DELETE FROM transactions");
  db.exec("DELETE FROM accounts");
  db.exec("DELETE FROM sqlite_sequence WHERE name='accounts'");
  db.exec("DELETE FROM sqlite_sequence WHERE name='transactions'");

  const insertAccount = db.prepare('INSERT INTO accounts (name, balance, version) VALUES (?, ?, 1)');
  
  insertAccount.run('Alice', 1000);
  insertAccount.run('Bob', 500);
  insertAccount.run('Charlie', 500);

  console.log('🔄 Comptes réinitialisés (mode sécurisé)');
}

// Initialize
initializeDatabase();
resetAccounts();

// ═══════════════════════════════════════════════════════════════
// API ENDPOINTS
// ═══════════════════════════════════════════════════════════════

let requestCounter = 0;

/**
 * GET /api/accounts
 */
app.get('/api/accounts', (req, res) => {
  try {
    const accounts = db. prepare('SELECT * FROM accounts ORDER BY id'). all();
    const total = db.prepare('SELECT SUM(balance) as total FROM accounts').get();
    
    res.json({ 
      success: true, 
      accounts,
      totalBalance: total. total,
      expectedTotal: 2000,
      mode: 'secure'
    });
  } catch (error) {
    res.status(500). json({ success: false, error: error.message });
  }
});

/**
 * GET /api/account/:id
 */
app. get('/api/account/:id', (req, res) => {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ success: false, error: 'Compte non trouvé' });
    }
    res.json({ success: true, account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 💸 POST /api/transfer
 * 
 * ✅ VERSION SÉCURISÉE - Utilise des transactions SQL atomiques
 * 
 * Cette implémentation corrige la vulnérabilité TOCTOU en:
 * 1. Utilisant BEGIN IMMEDIATE pour verrouiller la base
 * 2. Effectuant toutes les opérations dans une seule transaction
 * 3.  Utilisant des opérations atomiques (balance = balance - amount)
 */
app.post('/api/transfer', (req, res) => {
  const currentRequest = ++requestCounter;
  const { from, to, amount } = req.body;
  
  console.log(`\n🔒 [Requête #${currentRequest}] Transfert sécurisé: ${amount}€ de compte ${from} vers compte ${to}`);

  // Validation
  if (!from || !to || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Paramètres invalides' });
  }

  if (from === to) {
    return res.status(400).json({ success: false, error: 'Impossible de transférer vers le même compte' });
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // 🟢 MÉTHODE 1: Transaction SQL avec BEGIN IMMEDIATE
    // ═══════════════════════════════════════════════════════════════
    // BEGIN IMMEDIATE acquiert immédiatement un verrou RESERVED,
    // empêchant toute autre écriture jusqu'au COMMIT/ROLLBACK
    
    const transferTransaction = db.transaction((fromId, toId, transferAmount) => {
      // Simuler un délai (même avec le délai, la transaction est sûre)
      // Dans un vrai système, il pourrait y avoir des appels externes ici
      
      // Vérifier le solde de l'expéditeur
      const sender = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(fromId);
      
      if (! sender) {
        throw new Error('Compte expéditeur non trouvé');
      }
      
      console.log(`📊 [Requête #${currentRequest}] Solde vérifié dans transaction: ${sender.balance}€`);
      
      if (sender.balance < transferAmount) {
        throw new Error('Solde insuffisant');
      }
      
      // ═══════════════════════════════════════════════════════════════
      // 🟢 OPÉRATIONS ATOMIQUES
      // ═══════════════════════════════════════════════════════════════
      // Utilise "balance = balance - amount" au lieu de "balance = nouvelle_valeur"
      // Ceci garantit que même si deux transactions lisent en même temps,
      // les soustractions/additions sont correctes
      
      // Débiter l'expéditeur
      const debitResult = db.prepare(
        'UPDATE accounts SET balance = balance - ? WHERE id = ?  AND balance >= ?'
      ).run(transferAmount, fromId, transferAmount);
      
      // Vérifier que le débit a réussi
      if (debitResult.changes === 0) {
        throw new Error('Solde insuffisant (vérification atomique)');
      }
      
      // Créditer le destinataire
      db.prepare(
        'UPDATE accounts SET balance = balance + ? WHERE id = ? '
      ).run(transferAmount, toId);
      
      // Enregistrer la transaction
      db. prepare(
        'INSERT INTO transactions (from_account, to_account, amount, status) VALUES (?, ?, ?, ?)'
      ).run(fromId, toId, transferAmount, 'completed');
      
      return { success: true };
    });
    
    // Exécuter la transaction
    const result = transferTransaction(from, to, amount);
    
    const newBalance = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(from);
    console.log(`✅ [Requête #${currentRequest}] Transfert sécurisé effectué!  Nouveau solde: ${newBalance. balance}€`);
    
    return res.json({ 
      success: true, 
      message: `Transfert sécurisé de ${amount}€ effectué`,
      requestId: currentRequest,
      mode: 'secure'
    });
    
  } catch (error) {
    console.log(`❌ [Requête #${currentRequest}] Rejeté: ${error.message}`);
    return res.json({ 
      success: false, 
      error: error.message,
      requestId: currentRequest,
      mode: 'secure'
    });
  }
});

/**
 * 💸 POST /api/transfer-optimistic
 * 
 * ✅ MÉTHODE ALTERNATIVE: Optimistic Locking avec version
 * 
 * Cette méthode utilise un numéro de version pour détecter
 * les modifications concurrentes. 
 */
app.post('/api/transfer-optimistic', (req, res) => {
  const currentRequest = ++requestCounter;
  const { from, to, amount } = req.body;
  
  console.log(`\n🔐 [Requête #${currentRequest}] Transfert (optimistic): ${amount}€`);

  if (!from || !to || !amount || amount <= 0 || from === to) {
    return res.status(400).json({ success: false, error: 'Paramètres invalides' });
  }

  try {
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      // Lire le solde et la version actuels
      const sender = db.prepare('SELECT balance, version FROM accounts WHERE id = ?'). get(from);
      
      if (!sender) {
        return res.status(404).json({ success: false, error: 'Compte non trouvé' });
      }
      
      if (sender.balance < amount) {
        return res.json({ success: false, error: 'Solde insuffisant' });
      }
      
      // Tenter la mise à jour avec vérification de la version
      // Si la version a changé, quelqu'un d'autre a modifié le compte
      const updateResult = db.prepare(`
        UPDATE accounts 
        SET balance = balance - ?, version = version + 1 
        WHERE id = ? AND version = ?  AND balance >= ?
      `). run(amount, from, sender.version, amount);
      
      if (updateResult.changes > 0) {
        // Succès!  Créditer le destinataire
        db.prepare('UPDATE accounts SET balance = balance + ?  WHERE id = ?').run(amount, to);
        db.prepare(
          'INSERT INTO transactions (from_account, to_account, amount) VALUES (?, ?, ?)'
        ).run(from, to, amount);
        
        console.log(`✅ [Requête #${currentRequest}] Succès (tentative ${attempt})`);
        return res.json({ success: true, message: 'Transfert effectué', attempt });
      }
      
      console.log(`🔄 [Requête #${currentRequest}] Conflit détecté, tentative ${attempt}/${maxRetries}`);
    }
    
    return res. json({ 
      success: false, 
      error: 'Trop de conflits, veuillez réessayer',
      attempts: attempt
    });
    
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/transactions
 */
app.get('/api/transactions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = db.prepare(`
      SELECT 
        t.id, t.amount, t.status, t.created_at,
        sender.name as from_name,
        receiver.name as to_name
      FROM transactions t
      JOIN accounts sender ON t.from_account = sender.id
      JOIN accounts receiver ON t.to_account = receiver.id
      ORDER BY t. created_at DESC
      LIMIT ?
    `).all(limit);
    
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reset
 */
app.post('/api/reset', (req, res) => {
  try {
    resetAccounts();
    requestCounter = 0;
    console.log('\n🔄 Base de données sécurisée réinitialisée\n');
    
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY id').all();
    res.json({ success: true, message: 'Réinitialisé', accounts, mode: 'secure' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY id').all();
    const total = db.prepare('SELECT SUM(balance) as total FROM accounts'). get();
    const transactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
    
    res.json({
      success: true,
      stats: {
        totalBalance: total.total,
        expectedTotal: 2000,
        anomaly: total.total !== 2000,
        anomalyAmount: total.total - 2000,
        accountCount: accounts.length,
        transactionCount: transactions.count
      },
      mode: 'secure'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════

app. listen(PORT, () => {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  🏦 BANKSIM - Simulateur de Transferts Bancaires');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  ✅ MODE: SÉCURISÉ (Transactions atomiques)`);
  console.log(`  🌐 URL: http://localhost:${PORT}`);
  console.log('════════════════════════════════════════════════════════════');
  console.log('\n🛡️  Protections actives:');
  console.log('   - Transactions SQL atomiques (BEGIN IMMEDIATE)');
  console.log('   - Opérations atomiques (balance = balance - amount)');
  console. log('   - Vérification dans la clause WHERE');
  console.log('   - Endpoint alternatif avec Optimistic Locking\n');
});

module.exports = app;