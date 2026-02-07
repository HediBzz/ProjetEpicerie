# Comment corriger l'erreur "supabaseUrl is required"

## Pourquoi cette erreur ?

Votre application a migré de Supabase vers PostgreSQL local. Le code ne contient **plus aucune référence à Supabase**, mais votre déploiement en production essaie encore de charger l'ancienne version qui utilisait Supabase.

## Solution : Déployer la nouvelle architecture

Votre application utilise maintenant 3 composants qui doivent tous être déployés :

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Frontend  │─────▶│  Backend    │─────▶│  PostgreSQL  │
│  (React)    │ API  │  (Express)  │ SQL  │  (Database)  │
└─────────────┘      └─────────────┘      └──────────────┘
```

## Option 1 : Déploiement rapide tout-en-un (VPS avec Docker)

### Sur un serveur Ubuntu/Debian (DigitalOcean, Linode, Hetzner, etc.)

```bash
# 1. Installer Docker
curl -fsSL https://get.docker.com | sh
sudo systemctl start docker
sudo systemctl enable docker

# 2. Cloner votre projet
git clone <votre-repo>
cd <votre-projet>

# 3. Configurer l'URL de l'API
cat > .env << EOF
VITE_API_URL=https://votre-domaine.com/api
EOF

# 4. Démarrer avec Docker
docker-compose up -d

# 5. Ajouter des produits de test
docker exec <nom-container-postgres> psql -U epicerie_user -d epicerie -f /docker-entrypoint-initdb.d/init.sql
```

### Configurer Nginx comme reverse proxy

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Option 2 : Déploiement sur services managés (plus facile)

### Étape 1 : Déployer PostgreSQL

Choisissez un hébergeur PostgreSQL gratuit :

**Supabase Database** (recommandé - gratuit)
1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **Database** → **SQL Editor**
4. Copiez-collez le contenu de `database/init.sql`
5. Exécutez le script
6. Récupérez la connection string : **Project Settings** → **Database** → **Connection string**

**Ou Railway / Render / Neon** (aussi gratuits)

### Étape 2 : Déployer le Backend API

**Sur Railway :**

1. Créez un compte sur [railway.app](https://railway.app)
2. Créez un nouveau projet → **Deploy from GitHub repo**
3. Sélectionnez votre repo
4. Dans les paramètres :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. Ajoutez la variable d'environnement :
   ```
   DATABASE_URL=<votre-connection-string-postgresql>
   PORT=3001
   ```
6. Récupérez l'URL du backend (ex: `https://backend-production-xxxx.up.railway.app`)

**Ou sur Render :**

1. Créez un compte sur [render.com](https://render.com)
2. **New** → **Web Service**
3. Connectez votre repo GitHub
4. Configuration :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Environment Variables** :
     ```
     DATABASE_URL=<votre-connection-string>
     ```
5. Cliquez sur **Create Web Service**

### Étape 3 : Déployer le Frontend

**Sur Netlify :**

1. Créez un compte sur [netlify.com](https://netlify.com)
2. **Add new site** → **Import from Git**
3. Sélectionnez votre repo
4. Configuration :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
5. **Environment variables** :
   ```
   VITE_API_URL=https://votre-backend.up.railway.app
   ```
6. Cliquez sur **Deploy**

**Ou sur Vercel :**

1. Créez un compte sur [vercel.com](https://vercel.com)
2. **Add New Project** → Importez votre repo
3. Configuration :
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. **Environment Variables** :
   ```
   VITE_API_URL=https://votre-backend.up.railway.app
   ```
5. Cliquez sur **Deploy**

## Option 3 : Re-build et re-deploy manuellement

Si vous voulez garder votre hébergeur actuel :

```bash
# 1. Nettoyer le cache
rm -rf dist/ node_modules/.vite

# 2. S'assurer que .env contient l'URL correcte
echo "VITE_API_URL=https://votre-api-backend.com" > .env

# 3. Rebuild
npm install
npm run build

# 4. Re-déployer le dossier dist/
```

**Important** : Vous devez aussi déployer le backend et PostgreSQL quelque part !

## Vérification

Une fois déployé, testez :

```bash
# Tester le backend
curl https://votre-backend.com/health

# Devrait retourner :
# {"status":"ok","message":"Backend API running"}

# Tester les produits publics
curl https://votre-backend.com/api/products/public
```

Si ces commandes fonctionnent, votre frontend devrait aussi fonctionner.

## Checklist de déploiement

- [ ] PostgreSQL est déployé et accessible
- [ ] Le script `database/init.sql` a été exécuté
- [ ] Le backend API est déployé et répond à `/health`
- [ ] La variable `DATABASE_URL` est configurée dans le backend
- [ ] Le frontend a la variable `VITE_API_URL` correctement configurée
- [ ] Le frontend a été rebuild avec `npm run build`
- [ ] Le dossier `dist/` a été déployé

## Besoin d'aide ?

Si vous avez toujours des problèmes :

1. Vérifiez les logs de votre backend
2. Vérifiez que PostgreSQL accepte les connexions externes
3. Vérifiez que les CORS sont correctement configurés dans `backend/server.js`
4. Testez l'API backend directement avec curl/Postman

## Migration depuis l'ancienne version Supabase

Si vous avez des données sur l'ancienne version Supabase :

```bash
# 1. Assurez-vous que PostgreSQL est démarré
docker-compose up -d postgres

# 2. Migrer toutes vos données
node database/migrate-from-supabase.js
```

Cela copiera tous vos produits, commandes, et utilisateurs admin depuis Supabase vers votre nouvelle base PostgreSQL.
