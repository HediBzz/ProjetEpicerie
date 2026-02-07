#!/bin/bash

# Script de déploiement du frontend
# Ce script nettoie, rebuild et prépare le frontend pour le déploiement

set -e

echo "🧹 Nettoyage des anciens fichiers..."
rm -rf node_modules package-lock.json dist

echo "📦 Installation des dépendances..."
npm install

echo "🔧 Configuration de l'API..."
if [ -z "$VITE_API_URL" ]; then
  echo "⚠️  ATTENTION: VITE_API_URL n'est pas définie !"
  echo "Vous devez définir cette variable avant de déployer."
  echo ""
  echo "Exemples :"
  echo "  export VITE_API_URL=https://votre-backend.railway.app"
  echo "  export VITE_API_URL=https://votre-backend.onrender.com"
  echo ""
  read -p "Voulez-vous continuer quand même ? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Déploiement annulé"
    exit 1
  fi
else
  echo "✅ VITE_API_URL=$VITE_API_URL"
fi

echo "🏗️  Build du frontend..."
npm run build

echo ""
echo "✅ Build terminé avec succès !"
echo ""
echo "📁 Fichiers prêts dans le dossier dist/"
echo ""
echo "Prochaines étapes :"
echo "1. Déployez le contenu du dossier dist/ sur votre hébergeur"
echo "2. Assurez-vous que VITE_API_URL est configurée dans les variables d'environnement"
echo "3. Testez votre site : curl https://votre-site.com"
echo ""
