# EduManage Sync API

API de synchronisation pour [EduManage](https://github.com/WilliamsLenkeu/EduManage) — Proxy push/pull vers MongoDB Atlas.

## 📋 Description

Cette API sert de **couche intermédiaire** entre les applications EduManage (Tauri desktop/PWA) et MongoDB Atlas. Elle gère :

- **Push** : Réception des changements depuis les clients (SQLite local)
- **Pull** : Distribution des changements aux clients
- **Résolution de conflits** : Last-Write-Wins (LWW) basé sur `updated_at`
- **Authentification** : JWT (scope par établissement)

## 🏗️ Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Appareil A      │         │   API Sync       │         │   MongoDB        │
│   (PC école)      │         │   (Cette API)    │         │   Atlas          │
│                   │         │                  │         │                  │
│  SQLite           │  push   │                  │  write  │  collections     │
│  pending_changes  │ ──────► │  /api/sync/push  │ ──────► │  (mirror schema) │
│                   │         │  /api/sync/pull  │         │                  │
│                   │  pull   │                  │  read   │                  │
│                   │ ◄────── │                  │ ◄────── │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

## 🚀 Déploiement Vercel (recommandé)

### Étapes

1. **Créez un projet sur [Vercel](https://vercel.com)**
   - Importez ce dépôt
   - Framework preset : **Other**
   - Root directory : laisser vide

2. **Ajoutez les variables d'environnement**
   - `MONGODB_URI` : URI de connexion MongoDB Atlas
   - `JWT_SECRET` : Secret pour signer les JWT (optionnel pour MVP)

3. **Configurez MongoDB Atlas**
   - Créez un cluster (gratuit M0)
   - Dans Network Access : autorisez `0.0.0.0/0` (toutes les IP) car Vercel utilise des IP dynamiques
   - Créez une base de données (ex: `edu-manage`)
   - Les collections seront créées automatiquement

4. **Déployez**
   - Vercel va déployer automatiquement
   - L'URL sera : `https://votre-projet.vercel.app/api`

5. **Configurez EduManage**
   - Ouvrez l'application EduManage
   - Paramètres → Synchronisation
   - Entrez l'URL : `https://votre-projet.vercel.app/api`

## 💻 Développement local

### Prérequis

- **Node.js** 18+
- **pnpm** (ou npm/yarn)
- **MongoDB** local ou MongoDB Atlas

### Setup

```bash
# Cloner le dépôt
git clone https://github.com/WilliamsLenkeu/EduManage-sync-api.git
cd EduManage-sync-api

# Installer les dépendances
pnpm install

# Configurer l'environnement
cp .env.example .env
# Éditez .env avec votre MONGODB_URI

# Lancer le serveur de développement
pnpm dev
```

Le serveur démarre sur `http://localhost:3001`.

### Variables d'environnement

| Variable | Description | Requis |
|----------|-------------|--------|
| `MONGODB_URI` | URI de connexion MongoDB | ✅ |
| `PORT` | Port du serveur (défaut: 3001) | ❌ |
| `JWT_SECRET` | Secret JWT pour validation (optionnel MVP) | ❌ |

## 🔌 Endpoints API

### `POST /api/sync/push`

Reçoit les changements depuis un client et les upsert dans MongoDB.

**Headers** :
- `Authorization: Bearer <jwt>` (optionnel en MVP)

**Body** :
```json
{
  "changes": [
    {
      "entity_type": "grades",
      "entity_id": "uuid",
      "operation": "insert" | "update" | "delete",
      "payload": { ... },
      "device_id": "device-uuid",
      "updated_at": "2026-03-03T10:30:00Z"
    }
  ]
}
```

**Réponse** :
```json
{
  "accepted": ["uuid1", "uuid2"],
  "conflicts": []
}
```

### `GET /api/sync/pull?since=ISO8601`

Retourne tous les documents modifiés depuis la date `since`.

**Headers** :
- `Authorization: Bearer <jwt>` (optionnel en MVP)

**Query params** :
- `since` : timestamp ISO 8601 (ex: `2026-03-03T10:00:00Z`)

**Réponse** :
```json
{
  "changes": [
    {
      "entity_type": "grades",
      "payload": { ... },
      "updated_at": "2026-03-03T10:30:00Z"
    }
  ]
}
```

## 📊 Schéma MongoDB

Les collections correspondent aux entités SQLite :

- `establishments`
- `school_years`
- `terms`
- `sequences`
- `classes`
- `subjects`
- `class_subjects`
- `students`
- `student_classes`
- `grades`
- `tuition_payments`
- `users`
- `pending_changes` (optionnel pour audit)

Tous les documents ont :
- `_id` : UUID (identique à SQLite)
- `created_at`, `updated_at` : timestamps UTC
- `deleted_at` : soft delete (null si actif)

## 🔐 Authentification (MVP)

Pour le MVP, l'API n'impose pas d'authentification stricte. En production :
- Ajouter middleware JWT
- Vérifier le `establishment_id` dans le token
- Scope par établissement

## 🧪 Tests

```bash
# Tests (à venir)
pnpm test
```

## 📦 Dépendances

- **express** : Serveur HTTP
- **mongodb** : Driver MongoDB officiel
- **dotenv** : Variables d'environnement
- **cors** : Cross-origin requests
- **helmet** : Sécurité HTTP headers

## 🐛 Debug & Logs

En développement, les logs sont affichés en console. En production (Vercel), consultez les logs dans le dashboard Vercel.

## 📝 Notes importantes

- **Last-Write-Wins** : En cas de conflit, la version avec `updated_at` le plus récent l'emporte
- **Idempotence** : Les opérations de push sont idempotentes (même `entity_id` = upsert)
- **Horloges** : Utilisez des timestamps UTC cohérents entre clients
- **Rate limiting** : Non implémenté (à ajouter en production)

## 🤝 Contribution

Voir le dépôt principal : [EduManage](https://github.com/WilliamsLenkeu/EduManage)

## 📄 Licence

Propriétaire — Tous droits réservés.
