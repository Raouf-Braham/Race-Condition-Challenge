# 🛡️ NIRD Security Lab
## Démonstration de Vulnérabilité Race Condition

---

<div align="center">

**Projet éducatif réalisé dans le cadre de la Nuit de l'Info 2025**

*Le Village Numérique Résistant : Comment les établissements scolaires peuvent tenir tête aux Big Tech ? *

---

**Équipe :** [Votre nom d'équipe]  
**Date :** Décembre 2025  
**Licence :** Libre (MIT)

</div>

---

## 📋 Table des matières

1. [Introduction](#1-introduction)
2. [Contexte et objectifs](#2-contexte-et-objectifs)
3. [Présentation de la vulnérabilité](#3-présentation-de-la-vulnérabilité)
4. [Architecture technique](#4-architecture-technique)
5. [Fonctionnement de la faille](#5-fonctionnement-de-la-faille)
6. [Guide de reproduction](#6-guide-de-reproduction)
7. [Solutions de protection](#7-solutions-de-protection)
8. [Lien avec la démarche NIRD](#8-lien-avec-la-démarche-nird)
9.  [Conclusion](#9-conclusion)
10. [Annexes](#10-annexes)

---

## 1. Introduction

### 1.1 Présentation du projet

**NIRD Security Lab** est un laboratoire interactif de cybersécurité conçu pour sensibiliser les établissements scolaires aux vulnérabilités des systèmes informatiques. Ce projet s'inscrit dans la démarche **NIRD** (Numérique Inclusif, Responsable et Durable) qui promeut l'utilisation de logiciels libres et la compréhension approfondie des outils numériques.

### 1.2 La faille choisie : Race Condition

Nous avons choisi de démontrer une **Race Condition** de type **TOCTOU** (Time Of Check To Time Of Use), une vulnérabilité sous-estimée mais extrêmement dangereuse dans les systèmes de production.

### 1.3 Pourquoi ce choix ?

| Critère | Justification |
|---------|---------------|
| **Originalité** | Les race conditions sont rarement démontrées de manière interactive |
| **Impact réel** | Responsables de pertes financières majeures dans l'industrie |
| **Valeur pédagogique** | Illustre l'importance des transactions atomiques |
| **Pertinence NIRD** | Démontre pourquoi le code auditable est essentiel |

---

## 2. Contexte et objectifs

### 2.1 Le scénario pédagogique

Notre application simule un **système de gestion de crédits informatiques** pour établissements scolaires. Chaque établissement dispose d'un budget en "crédits" pour acquérir des logiciels. 

**Acteurs du scénario :**
- 🏫 **Lycée Carnot** (Alice) : 1 000 crédits
- 🏫 **Collège Résistance** (Bob) : 500 crédits
- 🏫 **École Primaire Liberté** (Charlie) : 500 crédits

**Budget total du système :** 2 000 crédits (invariant)

### 2.2 Objectifs pédagogiques

À l'issue de cette démonstration, l'utilisateur sera capable de :

1.  ✅ Comprendre ce qu'est une race condition
2.  ✅ Identifier les conditions qui rendent un système vulnérable
3.  ✅ Reproduire l'exploitation dans un environnement contrôlé
4. ✅ Implémenter les protections appropriées
5. ✅ Faire le lien avec l'importance des logiciels libres auditables

---

## 3.  Présentation de la vulnérabilité

### 3.1 Qu'est-ce qu'une Race Condition ?

Une **race condition** (condition de concurrence) est une situation où le comportement d'un système dépend de l'ordre d'exécution de plusieurs opérations concurrentes. Lorsque cet ordre n'est pas garanti, des résultats inattendus peuvent se produire.

### 3. 2 La variante TOCTOU

**TOCTOU** signifie **Time Of Check To Time Of Use** :

```
┌─────────────────────────────────────────────────────────────┐
│                    VULNÉRABILITÉ TOCTOU                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. TIME OF CHECK (Vérification)                          │
│      → Le système vérifie une condition                     │
│      → Ex: "Le solde est-il suffisant ?"                   │
│                                                             │
│   ⏰ FENÊTRE DE VULNÉRABILITÉ                               │
│      → Délai entre vérification et utilisation              │
│      → D'autres opérations peuvent s'intercaler             │
│                                                             │
│   2. TIME OF USE (Utilisation)                             │
│      → Le système utilise le résultat de la vérification   │
│      → Ex: "Effectuer le transfert"                        │
│                                                             │
│   ⚠️  PROBLÈME: La condition peut avoir changé !             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Impact dans le monde réel

| Entreprise | Année | Impact | Description |
|------------|-------|--------|-------------|
| Uber | 2016 | $$ | Double facturation via requêtes concurrentes |
| Starbucks | 2015 | $$ | Rechargement infini de cartes cadeaux |
| Banques diverses | Continu | $$$ | Retraits multiples simultanés |

---

## 4. Architecture technique

### 4.1 Stack technologique

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE BANKSIM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│   │   Frontend  │     │   Backend   │     │  Database   │  │
│   │  HTML/CSS   │────▶│   Node.js   │────▶│   SQLite    │  │
│   │ JavaScript  │◀────│   Express   │◀────│             │  │
│   └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                             │
│   Technologies:                                             │
│   • Frontend: HTML5, CSS3, JavaScript ES6+                 │
│   • Backend: Node.js, Express. js                           │
│   • Base de données: SQLite (better-sqlite3)               │
│   • Exploitation: Scripts Node.js et Python                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Structure du projet

```
race-condition-challenge/
│
├── 📄 server.js                 # Serveur VULNÉRABLE
├── 📄 database.js               # Configuration SQLite
├── 📄 package.json              # Dépendances Node.js
│
├── 📁 public/                   # Interface utilisateur
│   ├── index.html              # Page principale
│   ├── style.css               # Styles (thème NIRD)
│   └── app.js                  # Logique frontend
│
├── 📁 exploit/                  # Scripts d'exploitation
│   ├── exploit.js              # Version Node.js
│   └── exploit. py              # Version Python
│
├── 📁 fixed/                    # Version corrigée
│   └── server-secure.js        # Serveur SÉCURISÉ
│
└── 📄 DOCUMENTATION.md          # Ce document
```

### 4.3 Schéma de la base de données

```sql
-- Table des comptes
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    balance REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des transactions
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account INTEGER NOT NULL,
    to_account INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_account) REFERENCES accounts(id),
    FOREIGN KEY (to_account) REFERENCES accounts(id)
);
```

---

## 5.  Fonctionnement de la faille

### 5.1 Code vulnérable

Voici le code **volontairement vulnérable** de notre endpoint de transfert :

```javascript
// ❌ CODE VULNÉRABLE - NE PAS UTILISER EN PRODUCTION
app.post('/api/transfer', async (req, res) => {
    const { from, to, amount } = req.body;
    
    // ══════════════════════════════════════════════
    // ÉTAPE 1: TIME OF CHECK (Vérification)
    // ══════════════════════════════════════════════
    const sender = database.getBalance(from);
    
    // ⏰ FENÊTRE DE VULNÉRABILITÉ
    // Délai simulant un traitement réel
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Vérification du solde avec la valeur ANCIENNE
    if (sender. balance >= amount) {
        
        // ══════════════════════════════════════════
        // ÉTAPE 2: TIME OF USE (Utilisation)
        // ══════════════════════════════════════════
        // Ces opérations ne sont PAS atomiques !
        database.subtractBalance(from, amount);
        database.addBalance(to, amount);
        database.recordTransaction(from, to, amount);
        
        return res.json({ success: true });
    }
    
    return res.json({ success: false, error: 'Solde insuffisant' });
});
```

### 5.2 Diagramme de séquence de l'attaque

```
         Requête 1              Requête 2              Base de données
             │                      │                        │
             │                      │         Solde Alice = 1000€
             │                      │                        │
    T1 ──────┼── Vérifier solde ───────────────────────────▶│
             │                      │                        │
             │◀─────── 1000€ ───────────────────────────────│
             │                      │                        │
    T2 ──────│──────────────────────┼── Vérifier solde ────▶│
             │                      │                        │
             │                      │◀─────── 1000€ ────────│
             │                      │                        │
             │   ⏰ FENÊTRE         │   ⏰ FENÊTRE           │
             │   CRITIQUE           │   CRITIQUE             │
             │                      │                        │
    T3 ──────┼── 1000 >= 100?  ✅ ──│                        │
             │                      │                        │
    T4 ──────│──────────────────────┼── 1000 >= 100? ✅ ────│
             │                      │                        │
    T5 ──────┼── Débiter 100€ ─────────────────────────────▶│ Solde = 900€
             │                      │                        │
    T6 ──────│──────────────────────┼── Débiter 100€ ──────▶│ Solde = 800€
             │                      │                        │
             │         ✅ Succès    │         ✅ Succès      │
             │                      │                        │
             ▼                      ▼                        ▼
    
    💥 RÉSULTAT: Les deux requêtes ont réussi !
       Alice a transféré 200€ au lieu de 100€ maximum autorisé. 
```

### 5.3 Exploitation avec 10 requêtes simultanées

```
                    AVANT L'ATTAQUE
    ┌─────────────────────────────────────────┐
    │  Alice (Lycée Carnot)    : 1 000 crédits│
    │  Bob (Collège Résistance):   500 crédits│
    │  ─────────────────────────────────────  │
    │  TOTAL SYSTÈME           : 2 000 crédits│
    └─────────────────────────────────────────┘
    
                         │
                         │  10 requêtes de 100 crédits
                         │  envoyées SIMULTANÉMENT
                         ▼
    
    ┌─────────────────────────────────────────┐
    │     TOUTES vérifient le solde = 1000    │
    │     TOUTES passent la vérification      │
    │     TOUTES effectuent le transfert      │
    └─────────────────────────────────────────┘
    
                         │
                         ▼
    
                    APRÈS L'ATTAQUE
    ┌─────────────────────────────────────────┐
    │  Alice (Lycée Carnot)    :     0 crédits│ ⚠️ 
    │  Bob (Collège Résistance): 1 500 crédits│
    │  ─────────────────────────────────────  │
    │  TOTAL SYSTÈME           : 2 000 crédits│ ✅ Conservé
    └─────────────────────────────────────────┘
    
    💥 10 requêtes ont réussi alors qu'une seule aurait dû passer ! 
```

### 5.4 Cas extrême : Solde négatif

Avec davantage de requêtes (15-20), le solde peut devenir **négatif** :

```
                    APRÈS L'ATTAQUE (15 requêtes)
    ┌─────────────────────────────────────────┐
    │  Alice (Lycée Carnot)    :  -500 crédits│ ⚠️ NÉGATIF ! 
    │  Bob (Collège Résistance): 2 000 crédits│
    │  ─────────────────────────────────────  │
    │  TOTAL SYSTÈME           : 2 000 crédits│ ✅ Conservé
    └─────────────────────────────────────────┘
    
    💥 Alice a transféré 1500€ alors qu'elle n'avait que 1000€ !
```

---

## 6. Guide de reproduction

### 6.1 Prérequis

- **Node.js** v16 ou supérieur
- **npm** (inclus avec Node.js)
- **Python 3.8+** (optionnel, pour le script Python)
- Un navigateur web moderne

### 6.2 Installation

```bash
# 1. Cloner ou télécharger le projet
cd race-condition-challenge

# 2. Installer les dépendances
npm install

# 3. (Optionnel) Installer les dépendances Python
pip install aiohttp
```

### 6.3 Lancement du serveur vulnérable

```bash
# Démarrer le serveur vulnérable
node server.js

# Sortie attendue:
# ════════════════════════════════════════════════════════════
#   🏦 BANKSIM - Simulateur de Transferts Bancaires
# ════════════════════════════════════════════════════════════
#   ⚠️  MODE: VULNÉRABLE (Race Condition activée)
#   🌐 URL: http://localhost:3000
# ════════════════════════════════════════════════════════════
```

### 6.4 Exploitation via l'interface web

1.  Ouvrir **http://localhost:3000** dans un navigateur
2. Localiser la section **"Zone de démonstration"**
3.  Configurer les paramètres :
   - Nombre de requêtes : **10** (ou plus)
   - Crédits par requête : **100**
4. Cliquer sur **"🚀 Lancer la démonstration"**
5. Observer les résultats

### 6.5 Exploitation via script Node.js

```bash
# Lancer le script d'exploitation
node exploit/exploit.js

# Options disponibles:
node exploit/exploit.js -n 20 -a 100    # 20 requêtes de 100 crédits
node exploit/exploit.js --help          # Afficher l'aide
```

### 6.6 Exploitation via script Python

```bash
# Lancer le script Python
python exploit/exploit.py

# Options disponibles:
python exploit/exploit. py -n 20 -a 100  # 20 requêtes de 100 crédits
python exploit/exploit.py --help        # Afficher l'aide
```

### 6.7 Résultats attendus

**Serveur vulnérable :**
```
📊 État initial:
   Alice: 1 000 crédits
   Bob: 500 crédits

📊 Résultats:
   Requêtes réussies: 10/10 (ou plus)
   Total transféré: 1 000+ crédits

📊 État final:
   Alice: 0 crédits (ou négatif)
   Bob: 1 500+ crédits

💥 EXPLOITATION RÉUSSIE ! 
```

---

## 7. Solutions de protection

### 7.1 Solution 1 : Transactions SQL atomiques (Recommandée)

```javascript
// ✅ CODE SÉCURISÉ - Avec transactions atomiques
app.post('/api/transfer', (req, res) => {
    const { from, to, amount } = req.body;
    
    const transferTransaction = db.transaction((fromId, toId, transferAmount) => {
        // Tout est exécuté dans une seule transaction
        const sender = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(fromId);
        
        if (sender.balance < transferAmount) {
            throw new Error('Solde insuffisant');
        }
        
        // Opérations atomiques
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?')
          .run(transferAmount, fromId);
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?')
          .run(transferAmount, toId);
        
        return { success: true };
    });
    
    try {
        const result = transferTransaction(from, to, amount);
        res.json(result);
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});
```

**Avantages :**
- ✅ Isolation complète des opérations
- ✅ Rollback automatique en cas d'erreur
- ✅ Standard SQL, portable

### 7.2 Solution 2 : Vérification atomique dans UPDATE

```sql
-- La vérification et la mise à jour sont atomiques
UPDATE accounts 
SET balance = balance - 100 
WHERE id = 1 AND balance >= 100;

-- Vérifier si la mise à jour a réussi
-- Si changes = 0, le solde était insuffisant
```

```javascript
// Implémentation JavaScript
const result = db.prepare(
    'UPDATE accounts SET balance = balance - ?  WHERE id = ?  AND balance >= ?'
).run(amount, fromId, amount);

if (result.changes === 0) {
    return res.json({ success: false, error: 'Solde insuffisant' });
}
```

**Avantages :**
- ✅ Simple à implémenter
- ✅ Très performant
- ✅ Une seule requête SQL

### 7.3 Solution 3 : Optimistic Locking

```javascript
// Utilisation d'un numéro de version pour détecter les conflits
const sender = db.prepare('SELECT balance, version FROM accounts WHERE id = ?'). get(fromId);

const result = db.prepare(`
    UPDATE accounts 
    SET balance = balance - ?, version = version + 1 
    WHERE id = ? AND version = ? AND balance >= ?
`).run(amount, fromId, sender.version, amount);

if (result.changes === 0) {
    // Conflit détecté - réessayer ou retourner une erreur
    return res.json({ success: false, error: 'Conflit - veuillez réessayer' });
}
```

**Avantages :**
- ✅ Pas de verrouillage bloquant
- ✅ Bonnes performances en lecture
- ✅ Détection des conflits

### 7.4 Comparaison des solutions

| Solution | Complexité | Performance | Cas d'usage |
|----------|------------|-------------|-------------|
| **Transactions SQL** | Moyenne | Bonne | Applications critiques |
| **UPDATE atomique** | Faible | Excellente | Opérations simples |
| **Optimistic Locking** | Élevée | Très bonne | Haute concurrence |

### 7.5 Test du serveur sécurisé

```bash
# Lancer le serveur sécurisé
node fixed/server-secure.js

# URL: http://localhost:3001
```

**Résultat attendu avec le serveur sécurisé :**

```
🔒 [Requête #1] Solde vérifié: 1000€ → Nouveau solde: 900€
🔒 [Requête #2] Solde vérifié: 900€  → Nouveau solde: 800€
🔒 [Requête #3] Solde vérifié: 800€  → Nouveau solde: 700€
... 
🔒 [Requête #10] Solde vérifié: 100€ → Nouveau solde: 0€
🔒 [Requête #11] ❌ Rejeté: Solde insuffisant

📊 Résultat: Exactement 10 requêtes réussies, solde final = 0€
```

---

## 8. Lien avec la démarche NIRD

### 8.1 Pourquoi ce projet est pertinent pour NIRD

La démarche **NIRD** (Numérique Inclusif, Responsable et Durable) promeut :

| Pilier NIRD | Lien avec ce projet |
|-------------|---------------------|
| **♿ Inclusif** | Interface accessible, documentation en français |
| **⚖️ Responsable** | Sensibilisation aux failles de sécurité |
| **♻️ Durable** | Code libre, auditable, réutilisable |

### 8.2 Logiciels libres vs propriétaires

```
┌─────────────────────────────────────────────────────────────┐
│              LOGICIELS PROPRIÉTAIRES (Big Tech)             │
├─────────────────────────────────────────────────────────────┤
│  ❌ Code source fermé - "Boîte noire"                       │
│  ❌ Impossible de vérifier la sécurité                      │
│  ❌ Dépendance au fournisseur                               │
│  ❌ Obsolescence programmée                                 │
│  ❌ Données potentiellement hors UE                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    LOGICIELS LIBRES (NIRD)                  │
├─────────────────────────────────────────────────────────────┤
│  ✅ Code source ouvert - Auditable                          │
│  ✅ Communauté pour identifier et corriger les failles      │
│  ✅ Indépendance technologique                              │
│  ✅ Durabilité (pas d'obsolescence forcée)                  │
│  ✅ Souveraineté des données                                │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Ce que cette démonstration enseigne

1. **Transparence du code** : Notre code vulnérable est visible et compréhensible, permettant d'apprendre. 

2. **Audit communautaire** : Dans un logiciel libre, cette faille aurait été détectée et corrigée rapidement.

3. **Formation** : Les élèves peuvent manipuler le code, comprendre la faille, et implémenter la correction.

4. **Autonomie** : Pas besoin de faire confiance aveuglément - on peut vérifier soi-même.

### 8.4 Ressources NIRD

- 🌐 **Site officiel NIRD** : https://nird.forge.apps.education. fr/
- 🔧 **Forge des communs numériques** : https://forge. apps.education.fr/
- 📺 **Vidéo de présentation** : [Lien vers la vidéo du Lycée Carnot]

---

## 9.  Conclusion

### 9.1 Résumé

Ce projet démontre de manière interactive et pédagogique :

| Aspect | Démonstration |
|--------|---------------|
| **La vulnérabilité** | Race condition TOCTOU sur un système de transfert |
| **L'exploitation** | Requêtes simultanées permettant de dépasser le solde |
| **La protection** | Transactions SQL atomiques |
| **Le lien NIRD** | Importance du code auditable et des logiciels libres |

### 9.2 Points clés à retenir

```
╔═══════════════════════════════════════════════════════════════╗
║                    LEÇONS APPRISES                            ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. 🔍 Ne jamais faire confiance aux vérifications non        ║
║        atomiques dans un contexte concurrent                  ║
║                                                               ║
║  2. 🛡️  Toujours utiliser des transactions pour les           ║
║        opérations critiques                                   ║
║                                                               ║
║  3. 📖 Le code auditable permet de détecter ces failles       ║
║        avant qu'elles ne soient exploitées                    ║
║                                                               ║
║  4. 🏫 La formation à la cybersécurité est essentielle        ║
║        pour les établissements scolaires                      ║
║                                                               ║
║  5. 🌱 Les logiciels libres favorisent un numérique           ║
║        plus sûr, plus durable et plus responsable             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

### 9.3 Perspectives

Ce laboratoire pourrait être étendu pour démontrer d'autres vulnérabilités :
- Injection SQL
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Broken Authentication

Chaque démonstration renforcerait l'importance d'un numérique **éduqué, auditable et responsable**.

---

## 10. Annexes

### Annexe A : Installation complète

```bash
# Cloner le projet
git clone [URL_DU_REPO]
cd race-condition-challenge

# Installer les dépendances
npm install

# Lancer le serveur vulnérable
npm start
# ou
node server.js

# Lancer le serveur sécurisé
npm run start:secure
# ou
node fixed/server-secure.js

# Lancer l'exploitation (Node.js)
npm run exploit
# ou
node exploit/exploit.js

# Lancer l'exploitation (Python)
pip install aiohttp
python exploit/exploit.py
```

### Annexe B : Configuration des ports

| Serveur | Port | URL |
|---------|------|-----|
| Vulnérable | 3000 | http://localhost:3000 |
| Sécurisé | 3001 | http://localhost:3001 |

### Annexe C : Dépendances

**Node.js (package.json) :**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9. 4.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "axios": "^1.6.7"
  }
}
```

**Python (requirements.txt) :**
```
aiohttp>=3.9.0
```

### Annexe D : Références

1. **OWASP - Race Conditions** : https://owasp. org/www-community/vulnerabilities/Race_Conditions
2. **CWE-367: TOCTOU Race Condition** : https://cwe.mitre.org/data/definitions/367.html
3.  **Démarche NIRD** : https://nird.forge.apps. education.fr/
4. **Forge des communs numériques éducatifs** : https://forge.apps.education.fr/

---

<div align="center">

## 🏆 Merci !

**Projet réalisé avec ❤️ pour la Nuit de l'Info 2025**

*Pour un numérique éducatif plus sûr, plus libre et plus durable*

---

🛡️ **NIRD Security Lab** | 🏫 **Démarche NIRD** | 🌙 **Nuit de l'Info 2025**

</div>
