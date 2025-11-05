# 🏟️ Application de Gestion des Équipements Sportifs

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/votre-repo/gestion-equipements-sportifs)
[![Status](https://img.shields.io/badge/status-production-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-orange.svg)](https://supabase.io/)

Application web moderne de gestion des équipements sportifs destinée aux collectivités françaises (mairies, préfectures). Gérez vos équipements, suivez leur occupation, analysez les données et facilitez le contact avec les citoyens.

## 📋 Table des Matières

- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Captures d'Écran](#-captures-décran)
- [Architecture Technique](#-architecture-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Déploiement](#-déploiement)
- [Structure du Projet](#-structure-du-projet)
- [API et Documentation](#-api-et-documentation)
- [Tests](#-tests)
- [Contribution](#-contribution)
- [Support](#-support)
- [Licence](#-licence)

## 🌟 Fonctionnalités Principales

### 👥 Gestion Multi-Rôles
- **Mairies** : Gestion des équipements de leur commune
- **Préfectures Départementales** : Vue d'ensemble du département
- **Préfectures Régionales** : Planification régionale
- **Administrateurs** : Accès complet et gestion système

### ⚽ Gestion des Équipements
- ✅ **CRUD Complet** : Création, lecture, modification, suppression
- 📍 **Géolocalisation GPS** : Coordonnées précises et carte interactive
- 🗺️ **Carte Interactive** : Visualisation avec Leaflet.js
- 📊 **Suivi de la Densité** : Occupation en temps réel avec graphiques
- 🏷️ **Classification Avancée** : Types, familles, nature des équipements
- ♿ **Gestion PMR** : Accessibilité détaillée

### 📈 Analyses et Rapports
- 📊 **Statistiques Temps Réel** : Taux d'occupation, tendances
- 📍 **Calcul de Proximité** : Recherche d'équipements proches avec Haversine
- 📈 **Graphiques Dynamiques** : Évolution des densités sur 7/15/30 jours
- 📋 **Export de Données** : CSV, PDF, Excel
- 🎯 **Alertes Automatiques** : Seuils d'occupation configurables

### 📱 Interface Utilisateur
- 📱 **Responsive Design** : Compatible mobile, tablette, desktop
- 🇫🇷 **100% Français** : Interface entièrement localisée
- ⚡ **Performance Optimisée** : Gestion de 333k+ équipements
- 🔒 **Sécurisé** : Authentification Supabase avec RLS
- 🎨 **Design Moderne** : Interface intuitive et ergonomique

### 🖼️ Gestion des Médias
- 📸 **Upload de Photos** : Optimisation automatique
- 🗂️ **Galerie Organisée** : Catégorisation et thumbnails
- 📱 **Lightbox** : Visualisation en plein écran
- ⚡ **Compression** : Images optimisées pour le web

### 💬 Communication Citoyens
- 📧 **Système de Contact** : Messages directed vers les gestionnaires
- 🏷️ **Catégorisation** : Questions, réservations, signalements
- 📊 **Statistiques** : Volume de demandes et délais de réponse
- 🔔 **Notifications** : Alertes en temps réel

## 📱 Captures d'Écran

### 🏠 Tableau de Bord Principal
![Tableau de Bord](assets/screenshots/dashboard.png)
*Vue d'ensemble avec statistiques personnalisées selon le rôle*

### 🗺️ Carte Interactive
![Carte Interactive](assets/screenshots/carte.png)
*Localisation des équipements avec filtres et recherche de proximité*

### ⚽ Liste des Équipements
![Liste Équipements](assets/screenshots/equipements.png)
*Gestion complète avec tri, filtres et actions groupées*

### 📊 Suivi des Densités
![Graphiques Densité](assets/screenshots/densite.png)
*Évolution temps réel avec alertes configurables*

### 📝 Formulaire Équipement
![Formulaire](assets/screenshots/formulaire.png)
*Création/modification avec géolocalisation intégrée*

## 🏗️ Architecture Technique

### Frontend
- **HTML5** : Structure sémantique moderne
- **CSS3** : Design responsive avec variables CSS
- **JavaScript ES6+** : Architecture modulaire et orientée objet
- **Leaflet.js** : Cartographie interactive
- **Chart.js** : Graphiques et visualisations

### Backend
- **Supabase** : Backend-as-a-Service
- **PostgreSQL** : Base de données relationnelle
- **Row Level Security** : Sécurité au niveau des lignes
- **Real-time** : Mises à jour en temps réel

### Infrastructure
- **Hébergement Statique** : Netlify/Vercel/GitHub Pages
- **CDN** : Distribution globale des assets
- **Storage** : Supabase Storage pour les fichiers
- **Auth** : Supabase Auth avec JWT

### Données
- **333 000+ équipements** sportifs référencés
- **Données géospatiales** avec coordonnées GPS précises
- **Historique 30 jours** des mesures de densité
- **Photos optimisées** avec compression automatique

## 🔧 Prérequis

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 ou **yarn** >= 1.22.0
- **Navigateur moderne** (Chrome 90+, Firefox 88+, Safari 14+)
- **Compte Supabase** (gratuit)
- **Git** pour le clonage

## 🚀 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-repo/gestion-equipements-sportifs.git
cd gestion-equipements-sportifs
```

### 2. Installation des Dépendances

```bash
# Avec npm
npm install

# Ou avec yarn
yarn install
```

### 3. Configuration de l'Environnement

Créer un fichier `.env` à la racine :

```bash
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_KEY=votre_cle_service_privee

# Application
APP_ENVIRONMENT=development
APP_DEBUG=true
APP_LOG_LEVEL=debug

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Security
JWT_SECRET=votre_secret_jwt
SESSION_TIMEOUT=1800000

# Email (optionnel)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=votre_email@example.com
SMTP_PASS=votre_mot_de_passe
```

### 4. Configuration de la Base de Données

```bash
# Application des migrations
npm run migrate

# OU exécution manuelle
psql -h votre-db-host -U postgres -d postgres -f database/migrations/20241105_initial.sql
```

### 5. Lancement en Développement

```bash
# Avec npm
npm run dev

# Ou avec yarn
yarn dev
```

L'application sera accessible sur `http://localhost:3000`

## ⚙️ Configuration

### Variables d'Environnement Principales

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `SUPABASE_URL` | URL du projet Supabase | - |
| `SUPABASE_ANON_KEY` | Clé publique Supabase | - |
| `SUPABASE_SERVICE_KEY` | Clé de service Supabase | - |
| `APP_ENVIRONMENT` | Environnement (development/production) | development |
| `MAX_FILE_SIZE` | Taille max upload (bytes) | 5242880 |
| `SESSION_TIMEOUT` | Timeout session (ms) | 1800000 |

### Configuration Supabase

#### 1. Création du Projet
1. Créer un compte sur [supabase.io](https://supabase.io)
2. Créer un nouveau projet
3. Récupérer les clés dans Settings > API

#### 2. Configuration des Tables
```sql
-- Activer PostGIS (optionnel pour géolocalisation avancée)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Les tables sont créées via les migrations automatiques
-- Voir database/migrations/ pour plus de détails
```

#### 3. Configuration du Storage
```javascript
// Bucket recommandé pour les photos
photos-equipements/
├── {equipement_id}/
│   ├── {timestamp}_photo_principale.jpg
│   ├── {timestamp}_vue_generale.png
│   └── {timestamp}_detail_equipement.webp
```

#### 4. Politiques de Sécurité (RLS)
Les politiques RLS sont automatiquement appliquées selon les rôles :
- **mairie** : Accès communal uniquement
- **prefecture_departementale** : Accès départemental
- **prefecture_regionale** : Accès régional
- **administrateur** : Accès complet

## 🚀 Déploiement

### Déploiement Production

#### 1. Build de Production
```bash
npm run build
```

#### 2. Déploiement Netlify
```bash
# Installation CLI Netlify
npm install -g netlify-cli

# Déploiement
netlify deploy --prod --dir=dist
```

#### 3. Déploiement Vercel
```bash
# Installation CLI Vercel
npm install -g vercel

# Déploiement
vercel --prod
```

#### 4. Déploiement GitHub Pages
```bash
npm run build:github-pages
npx gh-pages -d dist
```

### Variables d'Environnement Production

```bash
APP_ENVIRONMENT=production
APP_DEBUG=false
APP_LOG_LEVEL=info

# URLs de production
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_production

# Sécurité renforcée
SESSION_TIMEOUT=900000
JWT_SECRET=votre_secret_production_très_sécurisé
```

### Scripts de Déploiement

```bash
# Déploiement complet
npm run deploy

# Déploiement rapide (déjà buildé)
npm run deploy:fast

# Déploiement avec tests
npm run deploy:test
```

## 📁 Structure du Projet

```
gestion-equipements-sportifs/
├── 📄 README.md                          # Ce fichier
├── 📄 index.html                         # Page d'accueil
├── 📄 connexion.html                     # Page de connexion
├── 📄 dashboard.html                     # Tableau de bord
├── 📄 carte.html                         # Carte interactive
├── 📄 equipements.html                   # Liste équipements
├── 📄 detail-equipement.html             # Détail équipement
├── 📄 formulaire-equipement.html         # Formulaire CRUD
├── 📄 admin.html                         # Interface admin
├── 📁 assets/                            # Ressources statiques
│   ├── 📁 images/                        # Images et logos
│   │   ├── logo.svg
│   │   └── screenshots/
│   └── 📁 fonts/                         # Polices
├── 📁 css/                               # Styles CSS
│   ├── 📄 style.css                      # Styles globaux
│   ├── 📄 dashboard.css                  # Tableau de bord
│   ├── 📄 carte.css                      # Carte interactive
│   ├── 📄 formulaire.css                 # Formulaires
│   ├── 📄 admin.css                      # Interface admin
│   └── 📄 photos.css                     # Gestion photos
├── 📁 js/                                # Scripts JavaScript
│   ├── 📄 app.js                         # Application principale
│   ├── 📄 auth.js                        # Authentification
│   ├── 📄 config.js                      # Configuration
│   ├── 📄 utils.js                       # Utilitaires
│   ├── 📄 guards.js                      # Protection routes
│   ├── 📄 carte.js                       # Carte interactive
│   ├── 📄 equipements.js                 # Gestion équipements
│   ├── 📄 formulaire-equipement.js       # Formulaires
│   ├── 📄 densite.js                     # Gestion densités
│   ├── 📄 distance.js                    # Calculs distance
│   ├── 📄 photos.js                      # Gestion photos
│   ├── 📄 contact.js                     # Système contact
│   └── 📁 tests/                         # Tests unitaires
│       ├── 📄 test-distance.js
│       ├── 📄 test-densite.js
│       └── 📄 tests-auth.js
├── 📁 database/                          # Base de données
│   ├── 📁 migrations/                    # Scripts SQL
│   │   ├── 📄 20241105_initial.sql
│   │   ├── 📄 20241110_postgis.sql
│   │   └── 📄 20241115_contacts.sql
│   └── 📄 storage-setup.sql              # Configuration storage
├── 📁 docs/                              # Documentation
│   ├── 📄 guide-utilisateur.md           # Guide utilisateur
│   ├── 📄 guide-technique.md             # Guide technique
│   ├── 📄 api-documentation.md           # Documentation API
│   └── 📄 deployment-guide.md            # Guide déploiement
├── 📄 test-*.html                        # Pages de test
├── 📄 deploy-photos.sh                   # Script déploiement
├── 📄 .gitignore                         # Git ignore
├── 📄 package.json                       # Dépendances npm
├── 📄 package-lock.json                  # Versions verrouillées
└── 📄 .env.example                       # Exemple variables env
```

## 📚 API et Documentation

### Documentation Complète

- 📖 **[Guide Utilisateur](docs/guide-utilisateur.md)** : Manuel complet pour les collectivités
- 🔧 **[Guide Technique](docs/guide-technique.md)** : Documentation développeur
- 🔌 **[API Documentation](docs/api-documentation.md)** : Référence complète des APIs
- 🚀 **[Guide de Déploiement](docs/deployment-guide.md)** : Instructions détaillées

### Endpoints Principaux

#### Authentification
```
POST /auth/v1/token           # Connexion
POST /auth/v1/signup          # Inscription
POST /auth/v1/logout          # Déconnexion
POST /auth/v1/recover         # Récupération mot de passe
```

#### Équipements
```
GET    /equipements           # Liste des équipements
POST   /equipements           # Création
PATCH  /equipements           # Mise à jour
DELETE /equipements           # Suppression
POST   /rpc/search_equipements_proximite  # Recherche proximité
```

#### Densité
```
GET  /historique_densite      # Historique des mesures
POST /historique_densite      # Nouvelle mesure
```

#### Photos
```
POST /storage/v1/object       # Upload photo
GET  /storage/v1/object       # Récupération photo
```

### Exemples d'Utilisation

```javascript
// Initialisation Supabase
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://votre-projet.supabase.co',
  'votre-cle-anon-publique'
)

// Récupération des équipements
const { data, error } = await supabase
  .from('equipements')
  .select('*')
  .eq('commune_code', '12345')
  .order('updated_at', { ascending: false })

// Mise à jour de la densité
await supabase
  .from('equipements')
  .update({ densite_actuelle: 15 })
  .eq('equip_numero', 'EQ001')
```

## 🧪 Tests

### Exécution des Tests

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests end-to-end
npm run test:e2e

# Couverture de code
npm run test:coverage
```

### Pages de Test

- **Test Distance** : `/test-distance-integration.html`
- **Test CRUD Équipements** : `/test-equipements-crud.html`
- **Test Densité** : `/test-densite-integration.html`
- **Test Authentification** : Accessible depuis la console

### Tests Automatisés

```bash
# Test des fonctions de distance
node js/test-distance.js

# Test des calculs de densité
node js/test-densite.js

# Test du système d'authentification
node js/tests-auth.js
```

## 🤝 Contribution

Nous encourageons les contributions ! Voici comment procéder :

### Processus de Contribution

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. **Commit** vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. **Push** vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. **Ouvrir** une Pull Request

### Standards de Code

- **ESLint** : Configuration automatique
- **Prettier** : Formatage du code
- **Conventional Commits** : Format des messages
- **Tests** : Couverture minimum 80%

```bash
# Linting et formatage
npm run lint
npm run format

# Vérification avant commit
npm run pre-commit
```

### Types de Contributions

- 🐛 **Corrections de bugs**
- ✨ **Nouvelles fonctionnalités**
- 📚 **Amélioration de la documentation**
- 🎨 **Améliorations UI/UX**
- 🧪 **Tests supplémentaires**
- 🔧 **Optimisations de performance**

### Reporting de Bugs

Utilisez le [système de tickets](https://github.com/votre-repo/gestion-equipements-sportifs/issues) avec le template :

```markdown
**Description du bug**
Description claire et concise

**Étapes pour reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Scroller vers '...'
4. Voir l'erreur

**Comportement attendu**
Description de ce qui était attendu

**Screenshots**
Si applicable, ajoutez des captures d'écran

**Informations environnement**
- OS: [e.g. Windows 10]
- Navigateur: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]
```

## 📞 Support

### 🆘 Obtenir de l'Aide

- 📧 **Email** : support@equipements-sportifs.fr
- 💬 **Discord** : [Lien vers le serveur](https://discord.gg/votre-lien)
- 📚 **Documentation** : [docs.equipements-sportifs.fr](https://docs.equipements-sportifs.fr)
- 🐛 **Issues GitHub** : [Créer un ticket](https://github.com/votre-repo/gestion-equipements-sportifs/issues)

### 👥 Équipe de Développement

- **Développeur Principal** : [Votre Nom](mailto:votre.email@example.com)
- **Architecte** : [Nom Architecte](mailto:architecte@example.com)
- **Designer UI/UX** : [Nom Designer](mailto:designer@example.com)

### 📅 Planning

- ✅ **Version 1.0** : Fonctionnalités de base (Novembre 2025)
- 🔄 **Version 1.1** : Améliorations performance (Décembre 2025)
- 📅 **Version 2.0** : Fonctionnalités avancées (Q1 2026)

### 🎯 Roadmap

- [ ] **API Mobile** : Application native iOS/Android
- [ ] **Intégration Planner** : Synchronisation avec outils de planification
- [ ] **IA Prédictive** : Analyse prédictive de l'occupation
- [ ] **Multi-tenant** : Support de plusieurs collectivités
- [ ] **Intégration SI** : APIs vers systèmes existants

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

```
MIT License

Copyright (c) 2025 Gestion Équipements Sportifs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Remerciements

- **Supabase** : Pour la plateforme backend exceptionnelle
- **Leaflet** : Pour la bibliothèque cartographique
- **Chart.js** : Pour les graphiques interactifs
- **OpenStreetMap** : Pour les données cartographiques
- **Communauté Open Source** : Pour les outils et bibliothèques

---

<div align="center">

**🏟️ Gestion des Équipements Sportifs - Pour des collectivités connectées**

[![⭐ Star sur GitHub](https://img.shields.io/github/stars/votre-repo/gestion-equipements-sportifs?style=social)](https://github.com/votre-repo/gestion-equipements-sportifs)
[![🐛 Signaler un Bug](https://img.shields.io/badge/Signaler%20un%20Bug-FF6B6B?style=for-the-badge)](https://github.com/votre-repo/gestion-equipements-sportifs/issues)
[![✨ Proposer une Feature](https://img.shields.io/badge/Proposer%20une%20Feature-4ECDC4?style=for-the-badge)](https://github.com/votre-repo/gestion-equipements-sportifs/issues)

**Développé avec ❤️ pour les collectivités françaises**

</div>