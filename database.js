/**
 * 🗄️ DATABASE MODULE - BankSim
 * 
 * Configuration de la base de données SQLite pour le simulateur bancaire. 
 * Gère les comptes et l'historique des transactions.
 */

const Database = require('better-sqlite3');
const path = require('path');

// Création de la base de données
const db = new Database(path.join(__dirname, 'banksim.db'));

/**
 * Initialise la base de données avec les tables nécessaires
 */
function initializeDatabase() {
  // Création de la table des comptes
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      balance REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Création de la table des transactions
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

  console.log('✅ Base de données initialisée');
}

/**
 * Réinitialise les comptes aux valeurs par défaut
 */
function resetAccounts() {
  // Supprime toutes les données existantes
  db.exec('DELETE FROM transactions');
  db.exec('DELETE FROM accounts');
  
  // Réinitialise l'auto-increment
  db.exec("DELETE FROM sqlite_sequence WHERE name='accounts'");
  db.exec("DELETE FROM sqlite_sequence WHERE name='transactions'");

  // Insère les comptes de test
  const insertAccount = db.prepare('INSERT INTO accounts (name, balance) VALUES (?, ?)');
  
  const accounts = [
    { name: 'Alice', balance: 1000 },
    { name: 'Bob', balance: 500 },
    { name: 'Charlie', balance: 500 }
  ];

  for (const account of accounts) {
    insertAccount.run(account. name, account.balance);
  }

  console.log('🔄 Comptes réinitialisés:');
  console.log('   - Alice: 1000€');
  console.log('   - Bob: 500€');
  console.log('   - Charlie: 500€');
}

/**
 * Récupère tous les comptes
 */
function getAllAccounts() {
  return db.prepare('SELECT * FROM accounts ORDER BY id').all();
}

/**
 * Récupère un compte par ID
 */
function getAccountById(id) {
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
}

/**
 * Récupère le solde d'un compte (version asynchrone simulée pour la vulnérabilité)
 */
function getBalance(accountId) {
  return db.prepare('SELECT balance FROM accounts WHERE id = ?').get(accountId);
}

/**
 * Met à jour le solde d'un compte
 */
function updateBalance(accountId, newBalance) {
  return db.prepare('UPDATE accounts SET balance = ? WHERE id = ?').run(newBalance, accountId);
}

/**
 * Soustrait un montant du solde (opération atomique)
 */
function subtractBalance(accountId, amount) {
  return db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, accountId);
}

/**
 * Ajoute un montant au solde (opération atomique)
 */
function addBalance(accountId, amount) {
  return db.prepare('UPDATE accounts SET balance = balance + ?  WHERE id = ?').run(amount, accountId);
}

/**
 * Enregistre une transaction
 */
function recordTransaction(fromAccount, toAccount, amount, status = 'completed') {
  return db.prepare(
    'INSERT INTO transactions (from_account, to_account, amount, status) VALUES (?, ?, ?, ?)'
  ).run(fromAccount, toAccount, amount, status);
}

/**
 * Récupère l'historique des transactions
 */
function getTransactions(limit = 50) {
  return db.prepare(`
    SELECT 
      t.id,
      t.amount,
      t.status,
      t.created_at,
      sender.name as from_name,
      receiver.name as to_name
    FROM transactions t
    JOIN accounts sender ON t.from_account = sender.id
    JOIN accounts receiver ON t.to_account = receiver.id
    ORDER BY t.created_at DESC
    LIMIT ?
  `). all(limit);
}

/**
 * Calcule le total des soldes (pour détecter l'anomalie)
 */
function getTotalBalance() {
  const result = db.prepare('SELECT SUM(balance) as total FROM accounts'). get();
  return result.total;
}

/**
 * Retourne l'instance de la base de données pour les transactions manuelles
 */
function getDb() {
  return db;
}

// Initialisation au chargement du module
initializeDatabase();
resetAccounts();

module.exports = {
  db,
  getDb,
  initializeDatabase,
  resetAccounts,
  getAllAccounts,
  getAccountById,
  getBalance,
  updateBalance,
  subtractBalance,
  addBalance,
  recordTransaction,
  getTransactions,
  getTotalBalance
};