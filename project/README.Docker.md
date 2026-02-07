# Docker - Guide de démarrage

Ce guide explique comment lancer l'application avec Docker.

## Prérequis

- Docker installé sur votre machine
- Docker Compose installé (inclus avec Docker Desktop)

## Configuration

Avant de lancer l'application, assurez-vous que le fichier `.env` contient vos variables d'environnement Supabase :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme_supabase
```

## Lancer l'application

### Option 1 : Avec Docker Compose (recommandé)

```bash
docker-compose up -d
```

L'application sera accessible sur http://localhost:3000

### Option 2 : Avec Docker directement

```bash
# Construire l'image
docker build -t mon-epicerie .

# Lancer le conteneur
docker run -d -p 3000:80 --name mon-epicerie-app mon-epicerie
```

## Commandes utiles

### Voir les logs

```bash
docker-compose logs -f
```

ou

```bash
docker logs -f mon-epicerie-app
```

### Arrêter l'application

```bash
docker-compose down
```

ou

```bash
docker stop mon-epicerie-app
docker rm mon-epicerie-app
```

### Reconstruire l'image après des modifications

```bash
docker-compose up -d --build
```

### Nettoyer les images inutilisées

```bash
docker system prune -a
```

## Architecture

- **Frontend** : Application React/Vite servie par Nginx sur le port 80 (mappé sur 3000)
- **Base de données** : Supabase (hébergé dans le cloud)

## Notes importantes

- La base de données Supabase est déjà hébergée et configurée, aucune configuration Docker supplémentaire n'est nécessaire
- L'application se connecte à Supabase via les variables d'environnement définies dans le fichier `.env`
- Les images statiques sont servies depuis le dossier `public`
- Nginx est configuré pour gérer le routing côté client (SPA)

## Dépannage

### L'application ne démarre pas

1. Vérifiez que le port 3000 n'est pas déjà utilisé :
   ```bash
   lsof -i :3000
   ```

2. Vérifiez les logs :
   ```bash
   docker-compose logs
   ```

### Erreurs de connexion à Supabase

1. Vérifiez que le fichier `.env` contient les bonnes variables
2. Vérifiez que les variables sont bien copiées dans l'image Docker
3. Reconstruisez l'image : `docker-compose up -d --build`

### Modifier le port

Pour utiliser un autre port que 3000, modifiez le fichier `docker-compose.yml` :

```yaml
ports:
  - "8080:80"  # Changez 3000 en 8080 (ou autre)
```
