# EduManage Sync API

API de synchronisation pour [EduManage](https://github.com/.../EduManage). Proxy push/pull vers MongoDB Atlas.

## Installation

```bash
pnpm install
cp .env.example .env
# Éditez .env avec votre MONGODB_URI
```

## Lancement

```bash
pnpm dev
```

Par défaut : `http://localhost:3001`.

## Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /sync/push | Reçoit les changements, upsert MongoDB |
| GET | /sync/pull?since=ISO8601 | Retourne les documents modifiés depuis `since` |

## Déploiement

Déployez sur un serveur à IP fixe (Railway, Render, Fly.io, VPS). Whitelistez l'IP du serveur dans MongoDB Atlas → Network Access.
