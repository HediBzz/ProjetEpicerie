# Épicerie - Application de gestion

Application complète de gestion d'épicerie avec boutique en ligne et interface d'administration.

## Architecture

Cette application utilise :
- **Frontend** : React + TypeScript + Vite + Tailwind CSS
- **Backend** : Node.js + Express
- **Base de données** : PostgreSQL

## Démarrage rapide (local avec Docker)

```bash
# 1. Démarrer tous les services
docker-compose up -d

# 2. Ajouter des produits de démonstration
node database/add-demo-products.js

# 3. Accéder à l'application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

## Identifiants admin

- **Username** : `admin`
- **Password** : `admin123`

## Développement local (sans Docker)

### 1. Installer PostgreSQL

Installez PostgreSQL localement ou utilisez Docker uniquement pour PostgreSQL :

```bash
docker-compose up -d postgres
```

### 2. Initialiser la base de données

```bash
# Se connecter à PostgreSQL
psql -U epicerie_user -d epicerie -h localhost

# Exécuter le script SQL
\i database/init.sql
```

### 3. Démarrer le backend

```bash
cd backend
npm install
npm start
```

Le backend sera disponible sur http://localhost:3001

### 4. Démarrer le frontend

```bash
npm install
npm run dev
```

Le frontend sera disponible sur http://localhost:5173

## Ajouter des produits

Deux options :

### Option 1 : Produits de démonstration (recommandé pour tester)

```bash
node database/add-demo-products.js
```

Cela ajoute 15 produits de test (Coca-Cola, Pain, Lait, etc.)

### Option 2 : Migrer depuis Supabase

Si vous aviez des données sur Supabase :

```bash
node database/migrate-from-supabase.js
```

## Structure du projet

```
.
├── src/                    # Code source frontend
│   ├── components/        # Composants React
│   ├── contexts/          # Contextes React (Auth)
│   └── lib/              # Utilitaires et API client
├── backend/               # Code source backend API
│   ├── server.js         # Serveur Express
│   └── db.js             # Configuration PostgreSQL
├── database/              # Scripts et migrations SQL
│   ├── init.sql          # Script d'initialisation
│   └── add-demo-products.js  # Script de données de test
├── docker-compose.yml     # Configuration Docker
└── Dockerfile            # Image Docker pour frontend

```

## Déploiement en production

Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions complètes de déploiement.

**Résumé rapide :**

1. Déployez PostgreSQL sur un service managé (Supabase, Railway, Render)
2. Déployez le backend sur Railway, Render, ou Heroku
3. Configurez `VITE_API_URL` avec l'URL du backend
4. Déployez le frontend sur Netlify, Vercel, ou Cloudflare Pages

## Fonctionnalités

### Boutique en ligne (publique)
- Catalogue de produits avec filtres par catégorie
- Panier d'achat
- Formulaire de commande

### Interface d'administration (privée)
- Gestion des produits (créer, modifier, supprimer)
- Gestion des commandes (voir, changer statut)
- Authentification sécurisée

## Technologies

- React 18 + TypeScript
- Vite 5 (bundler ultra-rapide)
- Tailwind CSS (styling)
- Lucide React (icônes)
- Express (API REST)
- PostgreSQL (base de données)
- Docker (conteneurisation)

## Support

Pour toute question ou problème, consultez :
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guide de déploiement
- [README.Docker.md](./README.Docker.md) - Documentation Docker
