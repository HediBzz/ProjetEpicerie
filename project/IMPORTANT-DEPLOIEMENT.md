# ⚠️ IMPORTANT - Guide de déploiement

## Pourquoi l'erreur "supabaseUrl is required" ?

Cette erreur signifie que votre navigateur charge **un ancien build** de l'application qui utilisait encore Supabase.

## ✅ Solution en 3 étapes

### 1. Nettoyer et rebuild localement

```bash
# Supprimer les anciens fichiers
rm -rf node_modules package-lock.json dist

# Réinstaller
npm install

# Rebuild
npm run build
```

### 2. Comprendre l'architecture

Votre application nécessite **3 composants** qui doivent TOUS être déployés :

```
┌─────────────────┐
│   Frontend      │ ← Vous déployez probablement SEULEMENT celui-ci
│   (React)       │    ❌ C'EST INSUFFISANT !
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Backend API   │ ← Vous devez AUSSI déployer celui-ci
│   (Express)     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   PostgreSQL    │ ← Et aussi celui-ci
└─────────────────┘
```

### 3. Choisir votre méthode de déploiement

## Option A : Déploiement Docker (RECOMMANDÉ - Plus simple)

Si vous avez un serveur (VPS, DigitalOcean, Linode, etc.) :

```bash
# Sur votre serveur
git clone <votre-repo>
cd <votre-projet>

# Modifier les mots de passe dans docker-compose.yml
nano docker-compose.yml

# Démarrer TOUT (frontend + backend + PostgreSQL)
docker-compose up -d

# Vérifier
curl http://localhost:3000/health
```

Puis configurez Nginx pour exposer sur votre domaine (voir README.Docker.md)

**Avantages** :
- ✅ Un seul serveur nécessaire
- ✅ Tout démarre avec une seule commande
- ✅ Pas de problèmes CORS
- ✅ Facile à maintenir

## Option B : Déploiement séparé (Plus complexe)

### Étape 1 : Déployer PostgreSQL

Choisissez UN de ces services (gratuit) :

- **Supabase** (recommandé) : https://supabase.com
  1. Créez un projet
  2. Allez dans Database → SQL Editor
  3. Copiez-collez le contenu de `database/init.sql`
  4. Récupérez la connection string

- **Railway** : https://railway.app
- **Render** : https://render.com
- **Neon** : https://neon.tech

### Étape 2 : Déployer le Backend API

Choisissez UN de ces services :

**Sur Railway** :
1. Nouveau projet → Deploy from GitHub
2. Root Directory : `backend`
3. Start Command : `npm start`
4. Variables d'environnement :
   ```
   DATABASE_URL=<votre-connection-string-postgresql>
   PORT=3001
   ```
5. Récupérez l'URL (ex: `https://backend-xxxx.railway.app`)

**Ou sur Render** :
1. New Web Service → Connectez votre repo
2. Root Directory : `backend`
3. Build : `npm install`
4. Start : `node server.js`
5. Variables : `DATABASE_URL=<connection-string>`

### Étape 3 : Déployer le Frontend

**Sur Netlify** :
1. New site → Import from Git
2. Build command : `npm run build`
3. Publish directory : `dist`
4. **IMPORTANT - Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```
5. Deploy

**Ou sur Vercel** :
1. New Project → Import repo
2. Framework : Vite
3. Build : `npm run build`
4. Output : `dist`
5. **IMPORTANT - Variables** :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```

## ⚠️ ERREURS COURANTES

### Erreur 1 : "supabaseUrl is required"

**Cause** : Le frontend déployé utilise un ancien build ou un cache

**Solution** :
```bash
# Localement
rm -rf dist node_modules package-lock.json
npm install
npm run build

# Sur votre hébergeur (Netlify/Vercel)
# → Trigger un nouveau déploiement
# → Vider le cache CDN si disponible
```

### Erreur 2 : "Failed to fetch products"

**Cause** : Le backend n'est pas déployé ou `VITE_API_URL` est incorrect

**Solution** :
1. Vérifiez que le backend est accessible : `curl https://votre-backend.com/health`
2. Vérifiez que `VITE_API_URL` est configuré dans les variables d'environnement
3. Rebuild le frontend après avoir changé les variables

### Erreur 3 : "CORS error"

**Cause** : Le backend bloque les requêtes du frontend

**Solution** : Vérifiez `backend/server.js` :
```javascript
app.use(cors()); // Doit être présent
```

### Erreur 4 : "Cannot connect to PostgreSQL"

**Cause** : `DATABASE_URL` est incorrect ou PostgreSQL n'autorise pas les connexions externes

**Solution** :
1. Vérifiez le format de la connection string
2. Sur Supabase : utilisez la "Connection string" en mode "Session"
3. Vérifiez que votre IP est autorisée (certains services requièrent cela)

## 🔍 Checklist de déploiement

Avant de déployer, vérifiez :

- [ ] PostgreSQL est déployé et accessible
- [ ] Le script `database/init.sql` a été exécuté dans PostgreSQL
- [ ] Le backend est déployé et répond à `/health`
- [ ] `DATABASE_URL` est configurée dans le backend
- [ ] Le frontend a `VITE_API_URL` configurée
- [ ] Vous avez fait `npm run build` après avoir configuré `VITE_API_URL`
- [ ] Le dossier `dist/` a été déployé (pas le code source)

## 🧪 Tester votre déploiement

```bash
# 1. Tester PostgreSQL (remplacez par votre connection string)
psql "<votre-connection-string>" -c "SELECT COUNT(*) FROM products;"

# 2. Tester le backend
curl https://votre-backend.com/health
# Devrait retourner: {"status":"ok","message":"Backend API running"}

curl https://votre-backend.com/api/products/public
# Devrait retourner: [liste de produits]

# 3. Tester le frontend
# Ouvrez https://votre-site.com dans un navigateur
# Ouvrez la console (F12) et vérifiez qu'il n'y a pas d'erreurs
```

## 📚 Ressources

- **Docker (recommandé)** : [README.Docker.md](./README.Docker.md)
- **Déploiement général** : [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Correction d'erreurs** : [FIXING-DEPLOYMENT-ERROR.md](./FIXING-DEPLOYMENT-ERROR.md)

## 🆘 Besoin d'aide ?

Si vous avez toujours l'erreur après avoir suivi ce guide :

1. Videz le cache de votre navigateur (Ctrl+Shift+Delete)
2. Testez en navigation privée
3. Vérifiez la console du navigateur (F12) pour les erreurs
4. Vérifiez les logs de votre backend
5. Testez le backend directement avec curl/Postman
