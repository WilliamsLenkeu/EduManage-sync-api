# EduManage Sync API

API de synchronisation pour EduManage. Proxy push/pull vers MongoDB Atlas.

## Déploiement Vercel

1. Créez un projet sur [Vercel](https://vercel.com)
2. Importez ce dépôt
3. Ajoutez la variable d'environnement `MONGODB_URI` (MongoDB Atlas)
4. Déployez

**URL de base** : `https://votre-projet.vercel.app/api`  
Configurez dans EduManage : Paramètres → Sync → `https://votre-projet.vercel.app/api`

> MongoDB Atlas : autorisez `0.0.0.0/0` (toutes les IP) car Vercel utilise des IP dynamiques.

## Développement local

```bash
pnpm install
cp .env.example .env
# Éditez .env avec votre MONGODB_URI
pnpm dev
```

Par défaut : `http://localhost:3001`. Pour le local, l'URL dans l'app est `http://localhost:3001`.

## Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/sync/push | Reçoit les changements, upsert MongoDB |
| GET | /api/sync/pull?since=ISO8601 | Retourne les documents modifiés depuis `since` |
