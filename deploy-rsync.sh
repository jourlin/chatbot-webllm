#!/bin/bash
# filepath: deploy-rsync.sh

set -e

# Configuration
SSH_USER="YOUR_SSH_USERNAME"
SSH_HOST="YOUR_SSH_HOST"
SSH_PORT="22"
REMOTE_PATH="YOUR_REMOTE_PATH"
BUILD_DIR="dist"

echo "🚀 Déploiement du chatbot WebLLM avec rsync..."

# Build du projet
echo "🔨 Construction du projet..."
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    exit 1
fi

npm run build

if [ ! -d "${BUILD_DIR}" ]; then
    echo "❌ Erreur: Le dossier ${BUILD_DIR} n'a pas été créé"
    exit 1
fi

# Vérification de la connexion SSH
echo "🔍 Vérification de la connexion SSH..."
if ! ssh -p ${SSH_PORT} -o ConnectTimeout=10 ${SSH_USER}@${SSH_HOST} "echo 'Connexion OK'" 2>/dev/null; then
    echo "❌ Erreur: Impossible de se connecter au serveur"
    echo "💡 Vérifiez le port SSH (peut-être 2222 au lieu de 22)"
    exit 1
fi

# Création du répertoire distant si nécessaire
echo "📁 Création du répertoire distant..."
ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} "mkdir -p ${REMOTE_PATH}"

# Déploiement avec rsync
echo "📤 Synchronisation des fichiers..."
rsync -avz --delete \
    -e "ssh -p ${SSH_PORT}" \
    --progress \
    ${BUILD_DIR}/ ${SSH_USER}@${SSH_HOST}:${REMOTE_PATH}/

# Définir les permissions
echo "🔧 Configuration des permissions..."
ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} "chmod -R 755 ${REMOTE_PATH}"

echo ""
echo "✅ Déploiement terminé avec succès!"
echo "🌐 Votre chatbot est accessible à: https://YOUR_DOMAIN/YOUR_PATH"