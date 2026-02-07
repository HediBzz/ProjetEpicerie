# Migration de Supabase vers PostgreSQL Local

Ce dossier contient les scripts nécessaires pour migrer votre application de Supabase vers PostgreSQL local.

## Fichiers

- `init.sql` - Script d'initialisation de la base de données (tables, fonctions, triggers)
- `migrate-from-supabase.js` - Script de migration des données depuis Supabase
- `README.md` - Ce fichier

## Étapes de migration

### 1. Démarrer PostgreSQL avec Docker

```bash
docker-compose up -d postgres
```

Ceci va:
- Créer un conteneur PostgreSQL
- Initialiser la base de données avec le schéma (init.sql)
- Créer un utilisateur admin par défaut (username: admin, password: admin123)

### 2. Migrer les données depuis Supabase

```bash
# Installer les dépendances temporaires pour la migration
npm install pg

# Exécuter le script de migration
node database/migrate-from-supabase.js
```

Le script va:
- Se connecter à votre Supabase
- Extraire toutes les données (admin_users, products, orders, order_items)
- Les importer dans PostgreSQL local
- Afficher un résumé de la migration

### 3. Vérifier la migration

Vous pouvez vous connecter à PostgreSQL pour vérifier les données:

```bash
# Se connecter au conteneur PostgreSQL
docker exec -it epicerie-db psql -U epicerie_user -d epicerie

# Vérifier les données
\dt                           # Lister les tables
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM admin_users;
\q                            # Quitter
```

### 4. Démarrer l'application

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f app
```

L'application sera accessible sur http://localhost:3000

## Informations de connexion

### PostgreSQL (dans Docker)

- **Host**: localhost (ou `postgres` depuis un autre conteneur)
- **Port**: 5432
- **Database**: epicerie
- **User**: epicerie_user
- **Password**: epicerie_password_2024
- **Connection String**: `postgresql://epicerie_user:epicerie_password_2024@localhost:5432/epicerie`

### Admin par défaut

- **Username**: admin
- **Password**: admin123
- **Email**: admin@epicerie.com

⚠️ **Important**: Changez ce mot de passe après la première connexion!

## Dépannage

### Le conteneur PostgreSQL ne démarre pas

```bash
# Vérifier les logs
docker-compose logs postgres

# Redémarrer proprement
docker-compose down -v
docker-compose up -d postgres
```

### Erreur de connexion lors de la migration

Assurez-vous que:
1. Le conteneur PostgreSQL est démarré: `docker-compose ps`
2. Les ports ne sont pas en conflit: `lsof -i :5432`
3. Le fichier .env contient les bonnes informations

### Réinitialiser complètement la base de données

```bash
# Arrêter et supprimer tout (ATTENTION: supprime les données)
docker-compose down -v

# Redémarrer
docker-compose up -d postgres

# Relancer la migration
node database/migrate-from-supabase.js
```

## Sauvegarde et restauration

### Sauvegarder la base de données

```bash
docker exec epicerie-db pg_dump -U epicerie_user epicerie > backup.sql
```

### Restaurer depuis une sauvegarde

```bash
docker exec -i epicerie-db psql -U epicerie_user epicerie < backup.sql
```

## Schéma de la base de données

### Tables principales

- **admin_users** - Utilisateurs administrateurs
- **admin_sessions** - Sessions d'authentification
- **products** - Catalogue de produits
- **orders** - Commandes clients
- **order_items** - Articles dans les commandes

### Fonctions importantes

- `authenticate_admin(username, password)` - Authentification admin
- `validate_admin_session(token)` - Validation de session
- `create_admin_user(username, email, password)` - Création d'admin
- `decrease_product_stock()` - Gestion automatique du stock
- `restore_product_stock_on_cancel()` - Restauration du stock

### Triggers

- Mise à jour automatique de `updated_at`
- Diminution automatique du stock lors des commandes
- Restauration du stock lors d'annulation

## Sécurité

- Les mots de passe sont hashés avec bcrypt (pgcrypto)
- Les sessions expirent après 24 heures
- Le script de migration désactive temporairement le trigger de stock pour éviter les doublons
- Aucune donnée sensible n'est exposée publiquement

## Nettoyage après migration

Une fois la migration réussie, vous pouvez:

1. Supprimer le dossier `supabase/` (optionnel, pour garder l'historique)
2. Retirer `@supabase/supabase-js` des dépendances
3. Supprimer les anciennes variables d'environnement Supabase du .env

```bash
# Désinstaller Supabase (après avoir mis à jour le code)
npm uninstall @supabase/supabase-js
```
