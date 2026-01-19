# 🤖 Chatbot IA Local (WebLLM)

Un chatbot IA qui s'exécute **entièrement dans votre navigateur** grâce à WebGPU et WebLLM. Aucune donnée n'est envoyée à un serveur externe.

![WebGPU](https://img.shields.io/badge/WebGPU-Enabled-green) ![License](https://img.shields.io/badge/License-Apache%202.0-blue)

## ✨ Fonctionnalités

- 🔒 **100% local** : Le modèle IA tourne dans votre navigateur
- 🚀 **Accélération GPU** : Utilise WebGPU pour des performances optimales
- 📎 **Pièces jointes** : Joignez des documents texte à analyser
- 🌙 **Mode sombre** : Interface adaptative
- 📱 **Responsive** : Fonctionne sur desktop et mobile
- 🔄 **Cache intelligent** : Le modèle est mis en cache pour les prochaines visites

## 🖥️ Modèles supportés

Le chatbot détecte automatiquement votre GPU et recommande le meilleur modèle :

| GPU | Modèle recommandé | Taille |
|-----|-------------------|--------|
| RTX 3080/3090/4070+ | DeepSeek-R1-Distill-Llama-8B | ~5 Go |
| RTX 3060/3070/4060 | Llama-3.2-3B | ~2 Go |
| GPU entrée de gamme | Qwen3-1.7B | ~1 Go |
| GPU intégré | SmolLM2-360M | ~300 Mo |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- Un navigateur avec WebGPU (Chrome 113+, Edge 113+)
- Un GPU compatible (Nvidia, AMD, Apple Silicon, Intel Arc)

### Installation

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USERNAME/chatbot-webllm.git
cd chatbot-webllm

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

### Build pour production

```bash
npm run build
```

Les fichiers sont générés dans `dist/`.

## ⚙️ Configuration WebGPU

### Chrome/Chromium sur Linux

Si WebGPU n'est pas activé par défaut :

1. Allez à `chrome://flags/#enable-vulkan` → **Enabled**
2. Allez à `chrome://flags/#use-vulkan` → **Enabled**
3. Allez à `chrome://flags/#enable-unsafe-webgpu` → **Enabled**
4. Redémarrez Chrome

Ou lancez Chrome avec :
```bash
google-chrome --enable-features=Vulkan --enable-unsafe-webgpu
```

### Vérification

Visitez [webgpureport.org](https://webgpureport.org) pour vérifier que WebGPU fonctionne.

## 🛠️ Technologies utilisées

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (avec Rolldown)
- [WebLLM](https://github.com/mlc-ai/web-llm) - Moteur LLM pour le web
- [Tailwind CSS](https://tailwindcss.com/) - Styles
- [Radix UI](https://www.radix-ui.com/) - Composants accessibles
- [Lucide](https://lucide.dev/) - Icônes

## 📄 Licence

Ce projet est sous licence [Apache 2.0](LICENSE).

© 2026 Pierre Jourlin

## ⚠️ Avertissement

Les réponses générées par l'IA peuvent contenir des erreurs ou des informations inexactes. L'auteur décline toute responsabilité quant à l'utilisation des résultats produits par ce logiciel.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
