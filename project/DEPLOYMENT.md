# Guide de Déploiement

Cette application utilise une architecture à 3 niveaux :
1. **Frontend** (React + Vite) - Interface utilisateur
2. **Backend API** (Node.js + Express) - API REST
3. **Base de données** (PostgreSQL) - Stockage des données

## Déploiement en production

### Option 1 : Déploiement avec Docker (Recommandé)

Le moyen le plus simple est d'utiliser Docker Compose sur un serveur :

```bash
# Sur votre serveur
git clone <votre-repo>
cd <votre-projet>

# Créer le fichier .env pour la production
cat > .env << EOF
VITE_API_URL=https://votre-domaine.com
EOF

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

Les services seront disponibles sur :
- Frontend : http://localhost:3000
- Backend API : http://localhost:3001
- PostgreSQL : localhost:5432

Vous devrez configurer un reverse proxy (Nginx, Caddy) pour exposer le port 3000 sur votre domaine.

### Option 2 : Déploiement séparé

#### 1. Déployer la base de données PostgreSQL

Utilisez un service managé :
- [Supabase](https://supabase.com) (PostgreSQL managé gratuit)
- [Railway](https://railway.app)
- [Render](https://render.com)
- [Neon](https://neon.tech)

Récupérez la chaîne de connexion PostgreSQL.

#### 2. Déployer le Backend API

Déployez le dossier `backend/` sur :
- [Railway](https://railway.app)
- [Render](https://render.com)
- [Heroku](https://heroku.com)
- [Fly.io](https://fly.io)

Configurez les variables d'environnement :
```
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3001
```

Récupérez l'URL du backend déployé (exemple : `https://api.votre-app.com`)

#### 3. Déployer le Frontend

Avant de déployer, configurez l'URL du backend :

```bash
# Créer le fichier .env
echo "VITE_API_URL=https://api.votre-app.com" > .env

# Build le frontend
npm run build
```

Déployez le dossier `dist/` sur :
- [Netlify](https://netlify.com)
- [Vercel](https://vercel.com)
- [Cloudflare Pages](https://pages.cloudflare.com)

**Important** : Configurez la variable d'environnement `VITE_API_URL` dans les paramètres de votre hébergeur.

## Initialiser la base de données

Une fois PostgreSQL déployé, initialisez la base :

```bash
# Se connecter à PostgreSQL
psql <votre-url-postgresql>

# Exécuter le script d'initialisation
\i database/init.sql
```

Ou copiez-collez le contenu de `database/init.sql` dans l'interface SQL de votre hébergeur.

## Identifiants par défaut

- **Username**: admin
- **Password**: admin123

⚠️ **Changez ces identifiants en production !**

## Troubleshooting

### "Failed to fetch products"
- Vérifiez que le backend est démarré et accessible
- Vérifiez que `VITE_API_URL` pointe vers la bonne URL
- Vérifiez les logs du backend avec `docker-compose logs backend`

### "Unauthorized" en tant qu'admin
- Vérifiez que la base de données est initialisée
- Vérifiez que les identifiants sont corrects
- Videz le cache du navigateur et réessayez

### CORS errors
- Le backend doit autoriser l'origine de votre frontend
- Modifiez `backend/server.js` pour ajouter votre domaine dans la configuration CORS
