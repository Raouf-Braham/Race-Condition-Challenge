/**
 * 🏦 BANKSIM - Frontend Application
 * 
 * Gère l'interface utilisateur et les interactions avec l'API
 */

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION & STATE
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api';

let state = {
  accounts: [],
  transactions: [],
  isLoading: false
};

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Récupère tous les comptes
 */
async function fetchAccounts() {
  try {
    const response = await fetch(`${API_BASE}/accounts`);
    const data = await response.json();
    
    if (data.success) {
      state.accounts = data.accounts;
      renderAccounts();
      updateStats(data);
      populateAccountSelects();
    }
  } catch (error) {
    showToast('Erreur lors du chargement des comptes', 'error');
    console.error('fetchAccounts error:', error);
  }
}

/**
 * Récupère l'historique des transactions
 */
async function fetchTransactions() {
  try {
    const response = await fetch(`${API_BASE}/transactions`);
    const data = await response.json();
    
    if (data.success) {
      state.transactions = data.transactions;
      renderTransactions();
    }
  } catch (error) {
    showToast('Erreur lors du chargement des transactions', 'error');
    console.error('fetchTransactions error:', error);
  }
}

/**
 * Effectue un transfert
 */
async function performTransfer(from, to, amount) {
  const response = await fetch(`${API_BASE}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, amount })
  });
  
  return await response.json();
}

/**
 * Réinitialise la base de données
 */
async function resetDatabase() {
  try {
    const response = await fetch(`${API_BASE}/reset`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Base de données réinitialisée', 'success');
      hideExploitResults();
      await refreshAll();
    }
  } catch (error) {
    showToast('Erreur lors de la réinitialisation', 'error');
    console.error('resetDatabase error:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// RENDERING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Affiche les cartes de comptes
 */
function renderAccounts() {
  const grid = document.getElementById('accountsGrid');
  
  grid.innerHTML = state.accounts.map(account => {
    const isNegative = account.balance < 0;
    const initial = account.name.charAt(0).toUpperCase();
    
    return `
      <div class="account-card ${isNegative ? 'negative' : ''}">
        <div class="account-header">
          <div class="account-avatar">${initial}</div>
          <span class="account-id">ID: ${account.id}</span>
        </div>
        <div class="account-name">${account.name}</div>
        <div class="account-label">Solde disponible</div>
        <div class="account-balance ${isNegative ? 'negative' : ''}">${formatCurrency(account. balance)}</div>
      </div>
    `;
  }).join('');
}

/**
 * Met à jour les statistiques
 */
function updateStats(data) {
  const totalEl = document.getElementById('totalBalance');
  const anomalyEl = document.getElementById('anomalyAmount');
  const anomalyIndicator = document.getElementById('anomalyIndicator');
  
  const total = data.totalBalance || state.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const expected = 2000;
  const anomaly = total - expected;
  
  totalEl.textContent = formatCurrency(total);
  totalEl.className = `stat-value ${total !== expected ? 'anomaly' : ''}`;
  
  if (anomaly !== 0) {
    anomalyEl.textContent = `${anomaly > 0 ? '+' : ''}${formatCurrency(anomaly)}`;
    anomalyIndicator.classList.add('visible');
  } else {
    anomalyIndicator.classList.remove('visible');
  }
}

/**
 * Remplit les sélecteurs de compte
 */
function populateAccountSelects() {
  const fromSelect = document.getElementById('fromAccount');
  const toSelect = document.getElementById('toAccount');
  
  // Sauvegarder les valeurs actuelles
  const currentFrom = fromSelect.value;
  const currentTo = toSelect.value;
  
  const options = state.accounts.map(acc => 
    `<option value="${acc.id}">${acc.name} (${formatCurrency(acc.balance)})</option>`
  ). join('');
  
  fromSelect.innerHTML = '<option value="">Sélectionner... </option>' + options;
  toSelect.innerHTML = '<option value="">Sélectionner...</option>' + options;
  
  // Restaurer les valeurs si elles existent toujours
  if (currentFrom) fromSelect.value = currentFrom;
  if (currentTo) toSelect.value = currentTo;
}

/**
 * Affiche l'historique des transactions
 */
function renderTransactions() {
  const tbody = document.getElementById('transactionsBody');
  const emptyState = document.getElementById('emptyTransactions');
  const countEl = document.getElementById('transactionCount');
  
  countEl.textContent = state.transactions.length;
  
  if (state.transactions.length === 0) {
    tbody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }
  
  emptyState.hidden = true;
  
  tbody.innerHTML = state.transactions.map(tx => `
    <tr>
      <td class="tx-id">#${tx.id}</td>
      <td>${tx.from_name}</td>
      <td>${tx.to_name}</td>
      <td class="tx-amount outgoing">-${formatCurrency(tx.amount)}</td>
      <td class="tx-date">${formatDate(tx.created_at)}</td>
      <td><span class="tx-status">✓ ${tx.status}</span></td>
    </tr>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
// TRANSFER HANDLER
// ═══════════════════════════════════════════════════════════════

/**
 * Gère la soumission du formulaire de transfert
 */
async function handleTransfer(event) {
  event.preventDefault();
  
  const form = event.target;
  const fromAccount = parseInt(document.getElementById('fromAccount').value);
  const toAccount = parseInt(document.getElementById('toAccount').value);
  const amount = parseFloat(document. getElementById('amount').value);
  
  if (!fromAccount || ! toAccount || !amount) {
    showToast('Veuillez remplir tous les champs', 'warning');
    return;
  }
  
  if (fromAccount === toAccount) {
    showToast('Impossible de transférer vers le même compte', 'warning');
    return;
  }
  
  if (amount <= 0) {
    showToast('Le montant doit être positif', 'warning');
    return;
  }
  
  // Disable button and show loader
  const submitBtn = form.querySelector('.btn-transfer');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  
  submitBtn.disabled = true;
  btnText.textContent = 'Transfert en cours...';
  btnLoader.hidden = false;
  
  try {
    const result = await performTransfer(fromAccount, toAccount, amount);
    
    if (result.success) {
      showToast(`Transfert de ${formatCurrency(amount)} effectué!`, 'success');
      form.reset();
    } else {
      showToast(result.error || 'Erreur lors du transfert', 'error');
    }
    
    await refreshAll();
    
  } catch (error) {
    showToast('Erreur de connexion au serveur', 'error');
    console.error('handleTransfer error:', error);
  } finally {
    submitBtn.disabled = false;
    btnText.textContent = 'Transférer';
    btnLoader.hidden = true;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPLOIT FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════

/**
 * Exécute l'exploitation de la race condition
 */
async function runExploit() {
  const numRequests = parseInt(document.getElementById('exploitRequests').value) || 10;
  const amountPerRequest = parseFloat(document.getElementById('exploitAmount').value) || 100;
  
  // Get Alice (ID 1) and Bob (ID 2) for the exploit
  const fromAccount = 1; // Alice / Lycée Carnot
  const toAccount = 2;   // Bob / Collège Résistance
  
  const exploitBtn = document.querySelector('.btn-exploit');
  const resultsDiv = document.getElementById('exploitResults');
  const resultsContent = document.getElementById('resultsContent');
  
  // Disable button
  exploitBtn.disabled = true;
  exploitBtn.innerHTML = '<span class="btn-loader" style="display:inline-block"></span> Exploitation en cours...';
  
  // Show results panel
  resultsDiv.hidden = false;
  resultsContent.innerHTML = '<div class="result-line">🚀 Lancement de l\'exploitation...</div>';
  
  // Get initial balances
  await fetchAccounts();
  const initialAlice = state.accounts.find(a => a.id === fromAccount);
  const initialBob = state.accounts.find(a => a.id === toAccount);
  
  if (! initialAlice || !initialBob) {
    resultsContent. innerHTML += '<div class="result-line result-failure">❌ Erreur: Comptes non trouvés</div>';
    exploitBtn.disabled = false;
    exploitBtn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Relancer l\'exploitation</span>';
    return;
  }
  
  resultsContent.innerHTML += `
    <div class="result-line">
      📊 <strong>État initial:</strong><br>
      &nbsp;&nbsp;&nbsp;${initialAlice.name}: ${formatCurrency(initialAlice.balance)}<br>
      &nbsp;&nbsp;&nbsp;${initialBob.name}: ${formatCurrency(initialBob.balance)}
    </div>
    <div class="result-line">
      ⚡ Envoi de <strong>${numRequests} requêtes simultanées</strong> de ${formatCurrency(amountPerRequest)} chacune...
    </div>
  `;
  
  // Calculate expected behavior in a SECURE system
  const expectedSuccessfulRequests = Math.floor(initialAlice.balance / amountPerRequest);
  
  // Create array of promises for simultaneous requests
  const transferPromises = [];
  
  for (let i = 0; i < numRequests; i++) {
    transferPromises.push(
      performTransfer(fromAccount, toAccount, amountPerRequest)
        .then(result => ({ requestId: i + 1, ... result }))
        .catch(error => ({ requestId: i + 1, success: false, error: error.message }))
    );
  }
  
  // Execute all requests simultaneously
  const startTime = performance.now();
  const results = await Promise.all(transferPromises);
  const endTime = performance.now();
  
  // Analyze results
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => ! r.success).length;
  
  // Display individual results
  let resultsHTML = '<div class="result-line"><strong>📝 Résultats des requêtes:</strong></div>';
  
  results.forEach(result => {
    if (result.success) {
      resultsHTML += `<div class="result-line result-success">✅ Requête #${result.requestId}: Succès</div>`;
    } else {
      resultsHTML += `<div class="result-line result-failure">❌ Requête #${result.requestId}: Échec - ${result.error || 'Solde insuffisant'}</div>`;
    }
  });
  
  resultsContent.innerHTML += resultsHTML;
  
  // Refresh and get final balances
  await fetchAccounts();
  const finalAlice = state.accounts. find(a => a.id === fromAccount);
  const finalBob = state.accounts.find(a => a.id === toAccount);
  
  // Calculate totals
  const totalTransferred = successCount * amountPerRequest;
  
  // L'exploitation est réussie si :
  // 1. Plus de requêtes ont réussi que prévu dans un système sécurisé
  // 2. OU le solde final est négatif
  // 3. OU toutes les requêtes ont réussi ET ont vidé/dépassé le compte
  const isExploitSuccessful = 
    successCount > expectedSuccessfulRequests || 
    finalAlice.balance < 0 ||
    (successCount >= numRequests && totalTransferred >= initialAlice.balance && numRequests > 1);
  
  // Display summary
  resultsContent.innerHTML += `
    <div class="result-summary">
      <div class="result-line">
        ⏱️ <strong>Temps d'exécution:</strong> ${(endTime - startTime).toFixed(2)}ms
      </div>
      <div class="result-line">
        📊 <strong>Statistiques:</strong><br>
        &nbsp;&nbsp;&nbsp;Requêtes réussies: <span class="result-success">${successCount}</span> / ${numRequests}<br>
        &nbsp;&nbsp;&nbsp;Requêtes échouées: <span class="result-failure">${failCount}</span><br>
        &nbsp;&nbsp;&nbsp;Total transféré: ${formatCurrency(totalTransferred)}<br>
        &nbsp;&nbsp;&nbsp;Requêtes max attendues (système sécurisé): ${expectedSuccessfulRequests}
      </div>
      <div class="result-line">
        📊 <strong>État final:</strong><br>
        &nbsp;&nbsp;&nbsp;${finalAlice.name}: ${formatCurrency(finalAlice.balance)} ${finalAlice.balance < 0 ? '⚠️ NÉGATIF!' : finalAlice.balance === 0 ? '⚠️ VIDÉ!' : ''}<br>
        &nbsp;&nbsp;&nbsp;${finalBob.name}: ${formatCurrency(finalBob.balance)}
      </div>
      ${isExploitSuccessful ?  `
        <div class="result-line result-success" style="font-size: 1.1em; margin-top: 1rem; padding: 1rem; background: rgba(52, 211, 153, 0.1); border-radius: 8px;">
          💥 <strong>EXPLOITATION RÉUSSIE!</strong><br><br>
          &nbsp;&nbsp;&nbsp;📌 <strong>${successCount} requêtes ont réussi</strong> alors qu'un système sécurisé<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;n'en aurait autorisé que <strong>${expectedSuccessfulRequests}</strong> maximum. <br><br>
          ${finalAlice.balance < 0 ? 
            `&nbsp;&nbsp;&nbsp;💸 Le solde est maintenant <strong>négatif</strong>: ${formatCurrency(finalAlice.balance)}<br><br>` : 
            `&nbsp;&nbsp;&nbsp;💸 Toutes les requêtes ont passé la vérification <strong>simultanément</strong>.<br><br>`
          }
          &nbsp;&nbsp;&nbsp;🔍 <em>Cela prouve la vulnérabilité <strong>TOCTOU</strong><br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Time Of Check To Time Of Use).</em>
        </div>
      ` : `
        <div class="result-line result-failure" style="padding: 1rem; background: rgba(248, 113, 113, 0.1); border-radius: 8px;">
          ℹ️ <strong>Exploitation non concluante</strong><br><br>
          &nbsp;&nbsp;&nbsp;Le timing n'a pas permis d'exploiter la faille cette fois.<br>
          &nbsp;&nbsp;&nbsp;Suggestions:<br>
          &nbsp;&nbsp;&nbsp;• Augmentez le nombre de requêtes (20-30)<br>
          &nbsp;&nbsp;&nbsp;• Relancez plusieurs fois<br>
          &nbsp;&nbsp;&nbsp;• Vérifiez que le serveur vulnérable est bien lancé
        </div>
      `}
    </div>
  `;
  
  // Update stats display
  await refreshAll();
  
  // Re-enable button
  exploitBtn.disabled = false;
  exploitBtn.innerHTML = '<span class="btn-icon">🚀</span><span class="btn-text">Relancer l\'exploitation</span>';
  
  // Show toast
  if (isExploitSuccessful) {
    showToast('💥 Race condition exploitée avec succès! ', 'warning');
  } else {
    showToast('Exploitation terminée - Réessayez', 'info');
  }
}

/**
 * Cache les résultats d'exploitation
 */
function hideExploitResults() {
  const resultsDiv = document.getElementById('exploitResults');
  resultsDiv.hidden = true;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Formate un nombre en crédits
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' crédits';
}

/**
 * Formate une date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Affiche une notification toast
 */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container. appendChild(toast);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0. 3s ease forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

/**
 * Rafraîchit toutes les données
 */
async function refreshAll() {
  await Promise.all([
    fetchAccounts(),
    fetchTransactions()
  ]);
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Initialise l'application
 */
function init() {
  // Attach event listeners
  const transferForm = document.getElementById('transferForm');
  transferForm.addEventListener('submit', handleTransfer);
  
  // Initial data load
  refreshAll();
  
  // Auto-refresh every 10 seconds (increased to avoid resetting selects too often)
  setInterval(refreshAll, 10000);
  
  console.log('🏦 BankSim initialized');
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);