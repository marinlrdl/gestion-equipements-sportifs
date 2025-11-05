# Guide de Déploiement
## Application de Gestion des Équipements Sportifs

### 📋 Table des Matières

1. [Vue d'Ensemble du Déploiement](#vue-densemble-du-déploiement)
2. [Prérequis](#prérequis)
3. [Configuration Supabase](#configuration-supabase)
4. [Variables d'Environnement](#variables-denvironnement)
5. [Scripts de Migration](#scripts-de-migration)
6. [Déploiement en Développement](#déploiement-en-développement)
7. [Déploiement en Production](#déploiement-en-production)
8. [Tests et Validation](#tests-et-validation)
9. [Monitoring et Maintenance](#monitoring-et-maintenance)
10. [Rollback et Sauvegarde](#rollback-et-sauvegarde)
11. [Dépannage](#dépannage)

---

## Vue d'Ensemble du Déploiement

L'application de gestion des équipements sportifs peut être déployée selon différents scénarios :

- 🏠 **Développement Local** : Pour les développeurs
- 🌐 **Staging** : Environnement de pré-production
- 🚀 **Production** : Environnement de production
- 📱 **Multi-Instance** : Déploiement pour plusieurs collectivités

### Architecture de Déploiement

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   Storage       │
│   (Netlify/     │◄──►│   PostgreSQL    │◄──►│   (Photos)      │
│    Vercel)      │    │   APIs          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Real-time     │    │   Backup        │
│   Global        │    │   Subscriptions │    │   Automated     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Stratégie de Déploiement

- **Frontend** : Déploiement continu via Git
- **Backend** : Supabase Cloud avec automatisation
- **Database** : Migrations versionnées
- **Storage** : Configuration automatique
- **Monitoring** : Intégré Supabase + внешние outils

---

## Prérequis

### Outils Requis

```bash
# Node.js et npm
node --version  # >= 16.0.0
npm --version   # >= 8.0.0

# Git
git --version   # >= 2.30.0

# PostgreSQL (optionnel, pour migrations locales)
psql --version  # >= 13.0
```

### Comptes Nécessaires

1. **Supabase** : [supabase.io](https://supabase.io)
   - Projet créé et configuré
   - Clés API récupérées

2. **Déploiement Frontend** :
   - **Netlify** : [netlify.com](https://netlify.com)
   - **Vercel** : [vercel.com](https://vercel.com)
   - **GitHub Pages** : Via GitHub

3. **Monitoring** (optionnel) :
   - **Sentry** : [sentry.io](https://sentry.io)
   - **Analytics** : Google Analytics ou Plausible

### Permissions Requises

- Accès administrateur Supabase
- Permissions de déploiement sur la plateforme choisie
- Accès en écriture au repository Git
- Configuration DNS (si domaine personnalisé)

---

## Configuration Supabase

### 1. Création du Projet

```bash
# Via CLI Supabase (optionnel)
npm install -g supabase
supabase login
supabase projects create gestion-equipements-sportifs
```

### 2. Configuration de la Base de Données

#### A. Activation des Extensions

```sql
-- Dans l'éditeur SQL Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extension PostGIS (optionnel, pour géolocalisation avancée)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

#### B. Création des Schémas

```sql
-- Schema principal
CREATE SCHEMA IF NOT EXISTS public;

-- Schema pour les fonctions utilitaires
CREATE SCHEMA IF NOT EXISTS utils;

-- Grants pour l'utilisateur anon
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### 3. Configuration des Tables

#### Script de Création Principal

```sql
-- database/migrations/20241105_initial_schema.sql
BEGIN;

-- Table des équipements (version complète)
CREATE TABLE IF NOT EXISTS equipements (
    equip_numero VARCHAR(255) PRIMARY KEY,
    inst_numero VARCHAR(255),
    equip_nom VARCHAR(255) NOT NULL,
    inst_nom VARCHAR(255),
    
    -- Localisation
    inst_adresse TEXT,
    inst_cp VARCHAR(10),
    commune_nom VARCHAR(255),
    commune_code VARCHAR(10) NOT NULL,
    departement_nom VARCHAR(255),
    departement_code VARCHAR(10) NOT NULL,
    region_nom VARCHAR(255),
    region_code VARCHAR(10) NOT NULL,
    epci_nom VARCHAR(255),
    epci_insee VARCHAR(10),
    
    -- Coordonnées GPS
    longitude DECIMAL(10, 7),
    latitude DECIMAL(10, 7),
    
    -- Classification
    equip_type_name VARCHAR(255),
    equip_type_famille VARCHAR(255),
    equip_nature VARCHAR(255),
    equip_sol VARCHAR(255),
    annee_mise_en_service INTEGER,
    
    -- Dimensions
    aire_longueur DECIMAL(10, 2),
    aire_largeur DECIMAL(10, 2),
    aire_hauteur DECIMAL(10, 2),
    aire_surface DECIMAL(10, 2),
    
    -- Équipements complémentaires
    aire_eclairage BOOLEAN DEFAULT FALSE,
    tribune_places_assises INTEGER DEFAULT 0,
    vestiaires_sportifs_nb INTEGER DEFAULT 0,
    vestiaires_arbitres_nb INTEGER DEFAULT 0,
    douches_presence BOOLEAN DEFAULT FALSE,
    sanitaires_presence BOOLEAN DEFAULT FALSE,
    
    -- Accessibilité PMR
    access_pmr_global VARCHAR(255),
    access_sensoriel_global VARCHAR(255),
    access_pmr_accueil BOOLEAN DEFAULT FALSE,
    access_pmr_aire BOOLEAN DEFAULT FALSE,
    access_pmr_cheminements BOOLEAN DEFAULT FALSE,
    access_pmr_douches BOOLEAN DEFAULT FALSE,
    access_pmr_sanitaires BOOLEAN DEFAULT FALSE,
    access_pmr_tribunes BOOLEAN DEFAULT FALSE,
    access_pmr_vestiaires BOOLEAN DEFAULT FALSE,
    
    -- Gestion
    proprietaire_type VARCHAR(255),
    gestionnaire_type VARCHAR(255),
    equip_acces_libre BOOLEAN DEFAULT TRUE,
    ouverture_saisonniere BOOLEAN DEFAULT FALSE,
    
    -- Informations complémentaires
    equip_url TEXT,
    equip_obs TEXT,
    inst_obs TEXT,
    activites TEXT[],
    
    -- Champs calculés
    densite_actuelle INTEGER DEFAULT 0,
    capacite_max INTEGER,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nom_complet VARCHAR(255) NOT NULL,
    fonction VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'mairie', 'prefecture_departementale', 
        'prefecture_regionale', 'administrateur'
    )),
    commune_code VARCHAR(10),
    departement_code VARCHAR(10),
    region_code VARCHAR(10),
    actif BOOLEAN DEFAULT TRUE,
    derniere_connexion TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table historique des densités
CREATE TABLE IF NOT EXISTS historique_densite (
    id SERIAL PRIMARY KEY,
    equipement_id VARCHAR(255) REFERENCES equipements(equip_numero),
    densite INTEGER NOT NULL,
    capacite_max INTEGER NOT NULL,
    pourcentage_occupation DECIMAL(5, 2) GENERATED ALWAYS AS (
        (densite::DECIMAL / capacite_max::DECIMAL * 100)
    ) STORED,
    conditions_meteo VARCHAR(255),
    evenement_special TEXT,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table des contacts
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    equipement_id VARCHAR(255) REFERENCES equipements(equip_numero),
    nom VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    commune_residence VARCHAR(255),
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type_demande VARCHAR(50) CHECK (type_demande IN (
        'question_generale', 'reservation', 'signalement_probleme',
        'suggestion', 'plainte'
    )),
    statut VARCHAR(20) DEFAULT 'nouveau' CHECK (statut IN (
        'nouveau', 'en_cours', 'traite', 'ferme'
    )),
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN (
        'basse', 'normale', 'haute', 'urgente'
    )),
    reponse TEXT,
    date_reponse TIMESTAMP,
    repondu_par UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des photos
CREATE TABLE IF NOT EXISTS photos_equipements (
    id SERIAL PRIMARY KEY,
    equipement_id VARCHAR(255) REFERENCES equipements(equip_numero),
    url TEXT NOT NULL,
    nom_fichier VARCHAR(255),
    description TEXT,
    categorie VARCHAR(100),
    taille_fichier INTEGER,
    type_fichier VARCHAR(50),
    ordre_affichage INTEGER DEFAULT 0,
    principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

COMMIT;
```

#### Index de Performance

```sql
-- database/migrations/20241105_indexes.sql
BEGIN;

-- Index sur les équipements
CREATE INDEX IF NOT EXISTS idx_equipements_commune ON equipements(commune_code);
CREATE INDEX IF NOT EXISTS idx_equipements_departement ON equipements(departement_code);
CREATE INDEX IF NOT EXISTS idx_equipements_region ON equipements(region_code);
CREATE INDEX IF NOT EXISTS idx_equipements_type ON equipements(equip_type_name);
CREATE INDEX IF NOT EXISTS idx_equipements_coords ON equipements(longitude, latitude);
CREATE INDEX IF NOT EXISTS idx_equipements_updated ON equipements(updated_at DESC);

-- Index pour la recherche textuelle
CREATE INDEX IF NOT EXISTS idx_equipements_fts ON equipements USING gin(
    to_tsvector('french', 
        equip_nom || ' ' || inst_nom || ' ' || commune_nom
    )
);

-- Index sur les autres tables
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_historique_equipement ON historique_densite(equipement_id);
CREATE INDEX IF NOT EXISTS idx_historique_date ON historique_densite(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_equipement ON contacts(equipement_id);
CREATE INDEX IF NOT EXISTS idx_contacts_statut ON contacts(statut);
CREATE INDEX IF NOT EXISTS idx_photos_equipement ON photos_equipements(equipement_id);

COMMIT;
```

### 4. Configuration RLS (Row Level Security)

```sql
-- database/migrations/20241105_rls_policies.sql
BEGIN;

-- Activation RLS sur toutes les tables
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_densite ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos_equipements ENABLE ROW LEVEL SECURITY;

-- Politiques pour les équipements
CREATE POLICY IF NOT EXISTS "mairie_access_own_commune" ON equipements
FOR ALL USING (
    commune_code = (
        SELECT commune_code 
        FROM user_profiles 
        WHERE id = auth.uid()
    )
    AND (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    ) = 'mairie'
);

CREATE POLICY IF NOT EXISTS "prefecture_dept_access" ON equipements
FOR ALL USING (
    departement_code = (
        SELECT departement_code 
        FROM user_profiles 
        WHERE id = auth.uid()
    )
    AND (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    ) = 'prefecture_departementale'
);

CREATE POLICY IF NOT EXISTS "prefecture_regional_access" ON equipements
FOR ALL USING (
    region_code = (
        SELECT region_code 
        FROM user_profiles 
        WHERE id = auth.uid()
    )
    AND (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    ) = 'prefecture_regionale'
);

CREATE POLICY IF NOT EXISTS "admin_full_access" ON equipements
FOR ALL USING (
    (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    ) = 'administrateur'
);

-- Politiques pour user_profiles
CREATE POLICY IF NOT EXISTS "users_read_own_profile" ON user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "admins_manage_profiles" ON user_profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);

-- Politiques pour les contacts (lecture publique pour inscription)
CREATE POLICY IF NOT EXISTS "contacts_read_by_permission" ON contacts
FOR SELECT USING (
    equipement_id IN (
        SELECT equip_numero FROM equipements
        WHERE commune_code = (
            SELECT commune_code FROM user_profiles WHERE id = auth.uid()
        )
        OR departement_code = (
            SELECT departement_code FROM user_profiles WHERE id = auth.uid()
        )
        OR region_code = (
            SELECT region_code FROM user_profiles WHERE id = auth.uid()
        )
    )
    OR (
        SELECT role FROM user_profiles WHERE id = auth.uid()
    ) = 'administrateur'
);

CREATE POLICY IF NOT EXISTS "contacts_insert_public" ON contacts
FOR INSERT WITH CHECK (true);

-- Politiques similaires pour historique_densite et photos_equipements

COMMIT;
```

### 5. Configuration du Storage

#### Bucket pour les Photos

```sql
-- database/storage-setup.sql
BEGIN;

-- Le bucket sera créé via l'interface Supabase ou API
-- Configuration recommandée :
-- - Nom : photos-equipements
-- - Public : true (pour affichage public des photos)
-- - Taille max : 5MB par fichier
-- - Formats autorisés : image/jpeg, image/png, image/webp

-- Politiques de sécurité pour le storage
CREATE POLICY IF NOT EXISTS "Photos sont publiques" ON storage.objects
FOR SELECT USING (bucket_id = 'photos-equipements');

CREATE POLICY IF NOT EXISTS "Upload pour utilisateurs connectés" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'photos-equipements' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Suppression par propriétaires" ON storage.objects
FOR DELETE USING (
    bucket_id = 'photos-equipements' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMIT;
```

### 6. Fonctions PostgreSQL

```sql
-- database/functions/search_equipements_proximite.sql
CREATE OR REPLACE FUNCTION search_equipements_proximite(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER DEFAULT 10,
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
    equip_numero VARCHAR,
    equip_nom VARCHAR,
    commune_nom VARCHAR,
    distance_km DECIMAL,
    longitude DECIMAL,
    latitude DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.equip_numero,
        e.equip_nom,
        e.commune_nom,
        (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(e.latitude)) * 
                cos(radians(e.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(e.latitude))
            )
        ) as distance_km,
        e.longitude,
        e.latitude
    FROM equipements e
    WHERE 
        e.longitude IS NOT NULL 
        AND e.latitude IS NOT NULL
        AND (
            6371 * acos(
                cos(radians(user_lat)) * 
                cos(radians(e.latitude)) * 
                cos(radians(e.longitude) - radians(user_lng)) + 
                sin(radians(user_lat)) * 
                sin(radians(e.latitude))
            )
        ) <= radius_km
    ORDER BY distance_km
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## Variables d'Environnement

### Fichier .env.example

```bash
# =============================================================================
# CONFIGURATION SUPABASE
# =============================================================================
# URL du projet Supabase (obligatoire)
SUPABASE_URL=https://votre-projet.supabase.co

# Clé publique Supabase (obligatoire)
SUPABASE_ANON_KEY=votre_cle_anon_publique

# Clé de service Supabase (admin uniquement)
SUPABASE_SERVICE_KEY=votre_cle_service_privee

# =============================================================================
# CONFIGURATION APPLICATION
# =============================================================================
# Environnement (development, staging, production)
APP_ENVIRONMENT=development

# Debug (true/false)
APP_DEBUG=true

# Niveau de logging (error, warn, info, debug)
APP_LOG_LEVEL=debug

# URL de base de l'application
APP_BASE_URL=http://localhost:3000

# Nom de l'application
APP_NAME="Gestion Équipements Sportifs"

# =============================================================================
# CONFIGURATION SÉCURITÉ
# =============================================================================
# Secret JWT pour les tokens (obligatoire en production)
JWT_SECRET=clesecretjet123456789

# Timeout de session en millisecondes (30 minutes par défaut)
SESSION_TIMEOUT=1800000

# Nombre maximum de tentatives de connexion
MAX_LOGIN_ATTEMPTS=5

# Durée de lockout en millisecondes (15 minutes)
LOCKOUT_DURATION=900000

# =============================================================================
# CONFIGURATION UPLOAD FICHIERS
# =============================================================================
# Taille maximum des fichiers en bytes (5MB par défaut)
MAX_FILE_SIZE=5242880

# Types de fichiers autorisés (images uniquement)
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Qualité de compression des images (0.1 à 1.0)
IMAGE_QUALITY=0.8

# Largeur maximum des images en pixels
MAX_IMAGE_WIDTH=1920

# Hauteur maximum des images en pixels
MAX_IMAGE_HEIGHT=1080

# =============================================================================
# CONFIGURATION EMAIL (OPTIONNEL)
# =============================================================================
# Serveur SMTP pour l'envoi d'emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false

# Authentification SMTP
SMTP_USER=votre_email@example.com
SMTP_PASS=votre_mot_de_passe_email

# Email expéditeur par défaut
SMTP_FROM_EMAIL=noreply@equipements-sportifs.fr
SMTP_FROM_NAME="Gestion Équipements Sportifs"

# =============================================================================
# CONFIGURATION EXTERNAL SERVICES (OPTIONNEL)
# =============================================================================
# Google Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry pour le monitoring d'erreurs
SENTRY_DSN=https://votre_dsn_sentry@sentry.io/project_id

# API Key pour les services externes
EXTERNAL_API_KEY=votre_cle_api_externe

# =============================================================================
# CONFIGURATION GÉOLOCALISATION
# =============================================================================
# Provider de géocodage (osm, google, etc.)
GEOCODING_PROVIDER=osm

# Clé API pour le géocodage (si requis)
GEOCODING_API_KEY=votre_cle_geocodage

# Cache TTL pour le géocodage en secondes
GEOCODING_CACHE_TTL=86400

# =============================================================================
# CONFIGURATION PERFORMANCE
# =============================================================================
# Cache TTL par défaut en millisecondes (5 minutes)
CACHE_TTL=300000

# Nombre maximum d'éléments par page
MAX_ITEMS_PER_PAGE=50

# Timeout des requêtes API en millisecondes
API_TIMEOUT=30000

# =============================================================================
# CONFIGURATION DÉVELOPPEMENT
# =============================================================================
# Port de développement
DEV_PORT=3000

# Hot reload (true/false)
DEV_HOT_RELOAD=true

# Source maps en développement
DEV_SOURCE_MAPS=true

# =============================================================================
# CONFIGURATION MONITORING (PRODUCTION)
# =============================================================================
# URL de healthcheck
HEALTHCHECK_URL=/api/health

# Intervalle de monitoring en secondes
MONITORING_INTERVAL=60

# Alertes par email (true/false)
ALERTS_ENABLED=true

# Seuils d'alerte
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
```

### Variables par Environnement

#### Développement (.env.development)
```bash
APP_ENVIRONMENT=development
APP_DEBUG=true
APP_LOG_LEVEL=debug

SUPABASE_URL=https://votre-projet-dev.supabase.co
SUPABASE_ANON_KEY=votre_cle_dev

JWT_SECRET=dev-secret-key-not-secure
SESSION_TIMEOUT=3600000

APP_BASE_URL=http://localhost:3000
```

#### Production (.env.production)
```bash
APP_ENVIRONMENT=production
APP_DEBUG=false
APP_LOG_LEVEL=info

SUPABASE_URL=https://votre-projet-prod.supabase.co
SUPABASE_ANON_KEY=votre_cle_prod

JWT_SECRET=production-secret-very-secure-256-bits
SESSION_TIMEOUT=1800000

APP_BASE_URL=https://equipements-sportifs.fr
```

---

## Scripts de Migration

### Script de Migration Principal

```bash
#!/bin/bash
# scripts/migrate.sh

set -e  # Arrêter en cas d'erreur

echo "🏃 Début de la migration des données..."

# Vérification des variables d'environnement
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "❌ Erreur: Variables SUPABASE_URL et SUPABASE_SERVICE_KEY requises"
    exit 1
fi

# Fonction de logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Migration des schémas
log "📋 Application des migrations de schéma..."
psql "$DATABASE_URL" -f database/migrations/20241105_initial_schema.sql
psql "$DATABASE_URL" -f database/migrations/20241105_indexes.sql
psql "$DATABASE_URL" -f database/migrations/20241105_rls_policies.sql

# Migration des fonctions
log "⚙️ Installation des fonctions PostgreSQL..."
psql "$DATABASE_URL" -f database/functions/search_equipements_proximite.sql

# Configuration du storage
log "📁 Configuration du storage..."
psql "$DATABASE_URL" -f database/storage-setup.sql

# Création des vues matérialisées pour les statistiques
log "📊 Création des vues matérialisées..."
psql "$DATABASE_URL" -f database/views/create_materialized_views.sql

# Population des données de référence
log "🔄 Population des données de référence..."
psql "$DATABASE_URL" -f database/seeds/reference_data.sql

# Tests de validation
log "🧪 Tests de validation..."
npm run test:migration

# Mise à jour des métadonnées
log "📝 Mise à jour des métadonnées..."
UPDATE schema_version SET version = '1.0.0', applied_at = NOW();

log "✅ Migration terminée avec succès!"
log "🌐 L'application est maintenant prête à être déployée."
```

### Script de Migration Node.js

```javascript
// scripts/migrate.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DatabaseMigrator {
    constructor() {
        this.migrationsDir = path.join(__dirname, '../database/migrations');
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.serviceKey = process.env.SUPABASE_SERVICE_KEY;
    }

    async run() {
        console.log('🚀 Début de la migration de base de données...');

        try {
            // Vérification des prérequis
            await this.checkPrerequisites();

            // Application des migrations
            await this.applyMigrations();

            // Création des fonctions
            await this.createFunctions();

            // Configuration des politiques RLS
            await this.setupRLSPolicies();

            // Tests de validation
            await this.runTests();

            console.log('✅ Migration terminée avec succès!');
            
        } catch (error) {
            console.error('❌ Erreur lors de la migration:', error);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('🔍 Vérification des prérequis...');

        if (!this.supabaseUrl) {
            throw new Error('SUPABASE_URL non définie');
        }

        if (!this.serviceKey) {
            throw new Error('SUPABASE_SERVICE_KEY non définie');
        }

        // Test de connexion
        const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': this.serviceKey,
                'Authorization': `Bearer ${this.serviceKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Impossible de se connecter à Supabase');
        }

        console.log('✅ Prérequis validés');
    }

    async applyMigrations() {
        console.log('📋 Application des migrations...');

        const migrations = [
            '20241105_initial_schema.sql',
            '20241105_indexes.sql',
            '20241105_rls_policies.sql'
        ];

        for (const migration of migrations) {
            await this.applyMigration(migration);
        }
    }

    async applyMigration(filename) {
        const filePath = path.join(this.migrationsDir, filename);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`Migration non trouvée: ${filename}`);
        }

        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`  📄 Application de ${filename}...`);

        // Exécution via l'API Supabase
        const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.serviceKey,
                'Authorization': `Bearer ${this.serviceKey}`
            },
            body: JSON.stringify({ sql })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Erreur migration ${filename}: ${error}`);
        }

        console.log(`  ✅ ${filename} appliquée`);
    }

    async createFunctions() {
        console.log('⚙️ Création des fonctions PostgreSQL...');

        const functionsDir = path.join(__dirname, '../database/functions');
        const functionFiles = fs.readdirSync(functionsDir);

        for (const file of functionFiles) {
            if (file.endsWith('.sql')) {
                await this.createFunction(path.join(functionsDir, file));
            }
        }
    }

    async createFunction(filePath) {
        const sql = fs.readFileSync(filePath, 'utf8');
        const functionName = path.basename(filePath, '.sql');

        console.log(`  📦 Création de la fonction ${functionName}...`);

        const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.serviceKey,
                'Authorization': `Bearer ${this.serviceKey}`
            },
            body: JSON.stringify({ sql })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Erreur fonction ${functionName}: ${error}`);
        }

        console.log(`  ✅ Fonction ${functionName} créée`);
    }

    async runTests() {
        console.log('🧪 Tests de validation...');

        // Test de connexion
        const testResponse = await fetch(`${this.supabaseUrl}/rest/v1/equipements?select=count&limit=1`, {
            headers: {
                'apikey': this.serviceKey,
                'Authorization': `Bearer ${this.serviceKey}`
            }
        });

        if (!testResponse.ok) {
            throw new Error('Test de connexion échoué');
        }

        // Test des fonctions
        const functionTestResponse = await fetch(`${this.supabaseUrl}/rest/v1/rpc/search_equipements_proximite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.serviceKey,
                'Authorization': `Bearer ${this.serviceKey}`
            },
            body: JSON.stringify({
                user_lat: 46.603354,
                user_lng: 1.888334,
                radius_km: 1,
                limit_count: 1
            })
        });

        if (!functionTestResponse.ok) {
            throw new Error('Test des fonctions échoué');
        }

        console.log('✅ Tests de validation réussis');
    }
}

// Exécution
if (require.main === module) {
    const migrator = new DatabaseMigrator();
    migrator.run();
}

module.exports = DatabaseMigrator;
```

### Package.json Scripts

```json
{
  "scripts": {
    "migrate": "node scripts/migrate.js",
    "migrate:reset": "node scripts/reset-database.js",
    "migrate:rollback": "node scripts/rollback-migration.js",
    "migrate:test": "node scripts/test-migration.js",
    
    "seed": "node scripts/seed-database.js",
    "seed:production": "node scripts/seed-production.js",
    
    "setup": "npm run migrate && npm run seed",
    "setup:production": "npm run migrate && npm run seed:production",
    
    "test:migration": "node scripts/test-migration.js",
    "validate:deployment": "node scripts/validate-deployment.js"
  }
}
```

---

## Déploiement en Développement

### 1. Configuration Locale

```bash
# Clonage du repository
git clone https://github.com/votre-repo/gestion-equipements-sportifs.git
cd gestion-equipements-sportifs

# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs Supabase

# Migration de la base de données
npm run migrate

# Population des données de test
npm run seed

# Lancement du serveur de développement
npm run dev
```

### 2. Utilisation de Supabase Local (Optionnel)

```bash
# Installation de Supabase CLI
npm install -g supabase

# Initialisation locale
supabase init

# Démarrage des services locaux
supabase start

# Application des migrations locales
supabase db reset

# Lancement de l'interface d'admin
supabase studio
```

### 3. Configuration Visual Studio Code

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "html"],
  "emmet.includeLanguages": {
    "html": "html"
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "formulahendry.auto-rename-tag"
  ]
}
```

---

## Déploiement en Production

### 1. Déploiement Netlify

#### Configuration netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--production=false"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;"

[context.production.environment]
  APP_ENVIRONMENT = "production"
  APP_DEBUG = "false"
  APP_LOG_LEVEL = "info"

[context.deploy-preview.environment]
  APP_ENVIRONMENT = "staging"
  APP_DEBUG = "true"
  APP_LOG_LEVEL = "debug"
```

#### Déploiement via Git

```bash
# Connecter le repository à Netlify
# 1. Aller sur netlify.com
# 2. New site from Git
# 3. Choisir GitHub et le repository
# 4. Configurer les variables d'environnement dans l'interface

# Ou via CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### 2. Déploiement Vercel

#### Configuration vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "env": {
    "APP_ENVIRONMENT": "production",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key"
  }
}
```

#### Déploiement

```bash
# Installation CLI
npm install -g vercel

# Déploiement
vercel --prod

# Configuration des variables d'environnement
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
```

### 3. Déploiement GitHub Pages

#### Configuration GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        APP_ENVIRONMENT: production
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 4. Docker (Optionnel)

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        
        root /usr/share/nginx/html;
        index index.html;

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
        add_header X-Content-Type-Options nosniff;
    }
}
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - APP_ENVIRONMENT=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
```

---

## Tests et Validation

### 1. Tests Pré-Déploiement

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests end-to-end
npm run test:e2e

# Tests de performance
npm run test:performance

# Validation de la migration
npm run test:migration

# Validation du déploiement
npm run validate:deployment
```

### 2. Tests de Validation Post-Déploiement

```javascript
// scripts/validate-deployment.js
const fetch = require('fetch');
const { createClient } = require('@supabase/supabase-js');

class DeploymentValidator {
    constructor() {
        this.appUrl = process.env.APP_BASE_URL;
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    }

    async validate() {
        console.log('🔍 Validation du déploiement...');

        const tests = [
            this.testApplicationLoading(),
            this.testApiConnection(),
            this.testDatabaseConnection(),
            this.testAuthentication(),
            this.testCRUDOperations(),
            this.testFileUpload(),
            this.testPerformance()
        ];

        const results = await Promise.allSettled(tests);
        
        const passed = results.filter(r => r.status === 'fulfilled').length;
        const total = results.length;

        console.log(`📊 Résultats: ${passed}/${total} tests réussis`);

        if (passed === total) {
            console.log('✅ Déploiement validé avec succès!');
            return true;
        } else {
            console.log('❌ Certains tests ont échoué');
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.log(`  Test ${index + 1}: ${result.reason.message}`);
                }
            });
            return false;
        }
    }

    async testApplicationLoading() {
        const response = await fetch(this.appUrl);
        if (!response.ok) {
            throw new Error(`Application non accessible: ${response.status}`);
        }
        const html = await response.text();
        if (!html.includes('Gestion des Équipements Sportifs')) {
            throw new Error('Application non chargée correctement');
        }
        console.log('✅ Application accessible');
    }

    async testApiConnection() {
        const supabase = createClient(this.supabaseUrl, this.supabaseKey);
        
        const { data, error } = await supabase
            .from('equipements')
            .select('count', { count: 'exact', head: true });

        if (error) {
            throw new Error(`Erreur API: ${error.message}`);
        }
        console.log('✅ API accessible');
    }

    async testDatabaseConnection() {
        const supabase = createClient(this.supabaseUrl, this.supabaseKey);
        
        // Test de la fonction de recherche de proximité
        const { data, error } = await supabase
            .rpc('search_equipements_proximite', {
                user_lat: 46.603354,
                user_lng: 1.888334,
                radius_km: 1,
                limit_count: 1
            });

        if (error) {
            throw new Error(`Erreur fonction PostgreSQL: ${error.message}`);
        }
        console.log('✅ Base de données accessible');
    }

    async testAuthentication() {
        const supabase = createClient(this.supabaseUrl, this.supabaseKey);
        
        // Test création de session (sans connexion réelle)
        const { data: { session } } = await supabase.auth.getSession();
        console.log('✅ Authentification configurée');
    }

    async testCRUDOperations() {
        const supabase = createClient(this.supabaseUrl, this.supabaseKey);
        
        // Test de lecture seulement (lecture par défaut)
        const { data, error } = await supabase
            .from('equipements')
            .select('equip_numero, equip_nom')
            .limit(1);

        if (error) {
            throw new Error(`Erreur CRUD test: ${error.message}`);
        }
        console.log('✅ Opérations CRUD disponibles');
    }

    async testFileUpload() {
        // Test configuration du storage (lecture)
        const supabase = createClient(this.supabaseUrl, this.supabaseKey);
        
        const { data, error } = await supabase.storage
            .from('photos-equipements')
            .list('', { limit: 1 });

        if (error && !error.message.includes('not found')) {
            throw new Error(`Erreur storage: ${error.message}`);
        }
        console.log('✅ Storage configuré');
    }

    async testPerformance() {
        const startTime = Date.now();
        
        const response = await fetch(`${this.appUrl}/api/health`);
        const responseTime = Date.now() - startTime;
        
        if (!response.ok || responseTime > 5000) {
            throw new Error(`Performance dégradée: ${responseTime}ms`);
        }
        console.log(`✅ Performance acceptable: ${responseTime}ms`);
    }
}

// Exécution
if (require.main === module) {
    const validator = new DeploymentValidator();
    validator.validate().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = DeploymentValidator;
```

### 3. Monitoring Continu

```yaml
# .github/workflows/monitor.yml
name: Health Monitoring

on:
  schedule:
    - cron: '*/15 * * * *'  # Toutes les 15 minutes
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    
    steps:
    - name: Health Check
      run: |
        curl -f ${{ secrets.APP_URL }}/api/health || exit 1
        curl -f ${{ secrets.SUPABASE_URL }}/rest/v1/ || exit 1
```

---

## Monitoring et Maintenance

### 1. Métriques de Performance

```javascript
// utils/monitoring.js
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            responseTime: [],
            errorRate: 0,
            activeUsers: 0,
            dbConnections: 0
        };
    }

    // Mesure du temps de réponse
    measureResponseTime(operation, startTime) {
        const duration = Date.now() - startTime;
        this.metrics.responseTime.push(duration);
        
        // Garder seulement les 100 dernières mesures
        if (this.metrics.responseTime.length > 100) {
            this.metrics.responseTime.shift();
        }
        
        return duration;
    }

    // Calcul de la moyenne des temps de réponse
    getAverageResponseTime() {
        if (this.metrics.responseTime.length === 0) return 0;
        
        const sum = this.metrics.responseTime.reduce((a, b) => a + b, 0);
        return sum / this.metrics.responseTime.length;
    }

    // Alertes de performance
    checkAlerts() {
        const avgResponseTime = this.getAverageResponseTime();
        
        if (avgResponseTime > 5000) {
            this.sendAlert('Temps de réponse élevé', `${avgResponseTime}ms`);
        }
        
        if (this.metrics.errorRate > 0.05) {
            this.sendAlert('Taux d\'erreur élevé', `${(this.metrics.errorRate * 100)}%`);
        }
    }

    sendAlert(type, message) {
        console.warn(`🚨 ALERTE ${type}: ${message}`);
        // Intégration avec service d'alertes (email, Slack, etc.)
    }
}

module.exports = PerformanceMonitor;
```

### 2. Maintenance Automatisée

```javascript
// scripts/maintenance.js
const cron = require('node-cron');

class MaintenanceScheduler {
    constructor() {
        this.scheduleMaintenance();
    }

    scheduleMaintenance() {
        // Nettoyage des logs (quotidien à 2h)
        cron.schedule('0 2 * * *', () => {
            this.cleanupLogs();
        });

        // Optimisation de la base de données (hebdomadaire dimanche à 3h)
        cron.schedule('0 3 * * 0', () => {
            this.optimizeDatabase();
        });

        // Sauvegarde des données (quotidien à 1h)
        cron.schedule('0 1 * * *', () => {
            this.backupData();
        });

        // Vérification de l'intégrité (hebdomadaire mercredi à 4h)
        cron.schedule('0 4 * * 3', () => {
            this.checkIntegrity();
        });
    }

    async cleanupLogs() {
        console.log('🧹 Nettoyage des logs...');
        // Suppression des logs anciens
    }

    async optimizeDatabase() {
        console.log('🔧 Optimisation de la base de données...');
        // VACUUM et ANALYZE PostgreSQL
    }

    async backupData() {
        console.log('💾 Sauvegarde des données...');
        // Sauvegarde automatique
    }

    async checkIntegrity() {
        console.log('🔍 Vérification de l\'intégrité...');
        // Tests d'intégrité des données
    }
}

module.exports = MaintenanceScheduler;
```

### 3. Dashboard de Monitoring

```html
<!-- monitoring/dashboard.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring - Gestion Équipements Sportifs</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="monitoring-container">
        <h1>📊 Dashboard de Monitoring</h1>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>⚡ Temps de Réponse Moyen</h3>
                <div id="avg-response-time">-- ms</div>
            </div>
            
            <div class="metric-card">
                <h3>👥 Utilisateurs Actifs</h3>
                <div id="active-users">--</div>
            </div>
            
            <div class="metric-card">
                <h3>❌ Taux d'Erreur</h3>
                <div id="error-rate">-- %</div>
            </div>
            
            <div class="metric-card">
                <h3>💾 Base de Données</h3>
                <div id="db-status">--</div>
            </div>
        </div>
        
        <div class="charts-container">
            <canvas id="response-time-chart"></canvas>
            <canvas id="users-chart"></canvas>
        </div>
    </div>

    <script>
        // JavaScript pour le dashboard de monitoring
        // Mise à jour en temps réel des métriques
    </script>
</body>
</html>
```

---

## Rollback et Sauvegarde

### 1. Stratégie de Sauvegarde

```bash
#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backups/equipements-sportifs"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="backup_${DATE}"

echo "💾 Début de la sauvegarde..."

# Création du répertoire de sauvegarde
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Sauvegarde de la base de données
echo "📊 Sauvegarde de la base de données..."
pg_dump "${DATABASE_URL}" > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"

# Sauvegarde des fichiers uploadés
echo "📁 Sauvegarde des fichiers..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/files.tar.gz" /var/www/uploads/

# Sauvegarde de la configuration
echo "⚙️ Sauvegarde de la configuration..."
cp .env "${BACKUP_DIR}/${BACKUP_NAME}/"
cp nginx.conf "${BACKUP_DIR}/${BACKUP_NAME}/"

# Compression finale
echo "🗜️ Compression de la sauvegarde..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" "${BACKUP_DIR}/${BACKUP_NAME}"

# Nettoyage
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Upload vers stockage externe (S3, etc.)
echo "☁️ Upload vers stockage externe..."
aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" s3://votre-backup-bucket/

echo "✅ Sauvegarde terminée: ${BACKUP_NAME}.tar.gz"
```

### 2. Script de Rollback

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <backup_name>"
    echo "Exemples:"
    echo "  $0 backup_20231105_143022"
    echo "  $0 backup_latest"
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_DIR="/backups/equipements-sportifs"

if [ "$BACKUP_NAME" = "backup_latest" ]; then
    BACKUP_NAME=$(ls -t ${BACKUP_DIR}/backup_*.tar.gz | head -n1 | xargs basename -s .tar.gz)
    echo "🔍 Utilisation de la dernière sauvegarde: $BACKUP_NAME"
fi

BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ Sauvegarde non trouvée: $BACKUP_PATH"
    exit 1
fi

echo "⚠️ ATTENTION: Cette opération va restaurer la sauvegarde $BACKUP_NAME"
echo "Toutes les données actuelles seront perdues!"
read -p "Continuer? (oui/non): " confirmation

if [ "$confirmation" != "oui" ]; then
    echo "❌ Opération annulée"
    exit 1
fi

echo "🔄 Début du rollback..."

# Extraction de la sauvegarde
echo "📦 Extraction de la sauvegarde..."
TEMP_DIR="/tmp/rollback_$$"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_PATH" -C "$TEMP_DIR"

# Arrêt des services
echo "🛑 Arrêt des services..."
# systemctl stop nginx
# systemctl stop app

# Restauration de la base de données
echo "📊 Restauration de la base de données..."
dropdb "$(echo $DATABASE_URL | sed 's/.*\///')" || true
createdb "$(echo $DATABASE_URL | sed 's/.*\///')"
psql "$DATABASE_URL" < "${TEMP_DIR}/${BACKUP_NAME}/database.sql"

# Restauration des fichiers
echo "📁 Restauration des fichiers..."
tar -xzf "${TEMP_DIR}/${BACKUP_NAME}/files.tar.gz" -C /

# Restauration de la configuration
echo "⚙️ Restauration de la configuration..."
cp "${TEMP_DIR}/${BACKUP_NAME}/.env" .
cp "${TEMP_DIR}/${BACKUP_NAME}/nginx.conf" .

# Redémarrage des services
echo "🚀 Redémarrage des services..."
# systemctl start app
# systemctl start nginx

# Nettoyage
rm -rf "$TEMP_DIR"

echo "✅ Rollback terminé avec succès!"
```

### 3. Sauvegarde Automatique

```yaml
# .github/workflows/backup.yml
name: Automated Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Quotidien à 2h du matin
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Create Backup
      run: |
        npm install -g pg
        chmod +x scripts/backup.sh
        ./scripts/backup.sh
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
    
    - name: Upload to S3
      run: |
        aws s3 sync /backups/equipements-sportifs s3://${{ secrets.S3_BACKUP_BUCKET }}
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    
    - name: Cleanup old backups
      run: |
        find /backups/equipements-sportifs -name "backup_*.tar.gz" -mtime +30 -delete
```

---

## Dépannage

### 1. Problèmes Courants

#### A. Erreur de Connexion Supabase

**Symptômes**:
```
Error: Failed to fetch
TypeError: Network request failed
```

**Solutions**:
```bash
# 1. Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# 2. Tester la connexion
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"

# 3. Vérifier les clés dans Supabase Dashboard
# Settings > API > Project API keys
```

#### B. Problèmes de Migration

**Symptômes**:
```
ERROR: relation "equipements" does not exist
ERROR: permission denied for table equipements
```

**Solutions**:
```bash
# 1. Vérifier l'ordre des migrations
ls database/migrations/

# 2. Relancer la migration complète
npm run migrate:reset
npm run migrate

# 3. Vérifier les permissions RLS
# Dans Supabase SQL Editor:
SELECT * FROM pg_policies WHERE tablename = 'equipements';
```

#### C. Erreurs CORS

**Symptômes**:
```
Access to fetch at 'SUPABASE_URL' from origin 'YOUR_DOMAIN' 
has been blocked by CORS policy
```

**Solutions**:
```javascript
// Vérifier la configuration Supabase
// Authentication > Settings > Site URL
// Ajouter votre domaine dans les URL autorisées

// Dans le code, vérifier la configuration :
const supabase = createClient(
  'https://votre-projet.supabase.co',
  'votre-cle',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);
```

### 2. Logs et Debugging

#### A. Configuration des Logs

```javascript
// utils/logger.js
class Logger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    log(level, message, data = {}) {
        if (this.levels[level] <= this.levels[this.level]) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                data,
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            console[level](message, data);
            
            // Envoi au service de monitoring (optionnel)
            if (typeof Sentry !== 'undefined') {
                Sentry.captureMessage(message, level);
            }
        }
    }

    error(message, data) { this.log('error', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    info(message, data) { this.log('info', message, data); }
    debug(message, data) { this.log('debug', message, data); }
}

module.exports = new Logger(process.env.APP_LOG_LEVEL || 'info');
```

#### B. Mode Debug

```javascript
// utils/debug.js
class DebugHelper {
    static enable() {
        window.DEBUG_MODE = true;
        console.log('🔍 Mode debug activé');
        
        // Affichage des requêtes Supabase
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            console.log('🌐 API Request:', args);
            return originalFetch.apply(this, args).then(response => {
                console.log('🌐 API Response:', response.status, response.url);
                return response;
            });
        };
    }

    static logState() {
        console.group('🔍 État de l\'application');
        console.log('User:', window.currentUser);
        console.log('Profile:', window.currentProfile);
        console.log('Route:', window.location.pathname);
        console.log('Supabase:', window.supabase);
        console.groupEnd();
    }

    static testAPIs() {
        console.group('🧪 Tests des APIs');
        
        // Test de la base de données
        supabase.from('equipements').select('count').then(result => {
            console.log('✅ DB Test:', result);
        });

        // Test du storage
        supabase.storage.from('photos-equipements').list().then(result => {
            console.log('✅ Storage Test:', result);
        });

        // Test des fonctions
        supabase.rpc('search_equipements_proximite', {
            user_lat: 46.603354,
            user_lng: 1.888334,
            radius_km: 1,
            limit_count: 1
        }).then(result => {
            console.log('✅ Functions Test:', result);
        });

        console.groupEnd();
    }
}

// Activation automatique en développement
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    DebugHelper.enable();
    console.log('🔧 Outils de debug chargés. Utilisez DebugHelper pour plus d\'outils.');
}
```

### 3. Outils de Diagnostic

```bash
#!/bin/bash
# scripts/diagnostic.sh

echo "🔍 Diagnostic du système..."
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo "OS: $(uname -a)"
echo

echo "📊 Ressources système:"
echo "CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
echo "RAM: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5")'}')"
echo

echo "🌐 Connectivité réseau:"
ping -c 1 google.com > /dev/null 2>&1 && echo "✅ Internet: OK" || echo "❌ Internet: FAIL"
ping -c 1 supabase.io > /dev/null 2>&1 && echo "✅ Supabase: OK" || echo "❌ Supabase: FAIL"
echo

echo "🗄️ Base de données:"
if command -v psql > /dev/null; then
    psql "$DATABASE_URL" -c "SELECT version();" 2>/dev/null && echo "✅ PostgreSQL: OK" || echo "❌ PostgreSQL: FAIL"
else
    echo "⚠️ PostgreSQL client: Not installed"
fi
echo

echo "📁 Fichiers de configuration:"
[ -f ".env" ] && echo "✅ .env: Present" || echo "❌ .env: Missing"
[ -f "package.json" ] && echo "✅ package.json: Present" || echo "❌ package.json: Missing"
[ -d "database/migrations" ] && echo "✅ Migrations: Present" || echo "❌ Migrations: Missing"
echo

echo "🔧 Services:"
systemctl is-active nginx > /dev/null 2>&1 && echo "✅ Nginx: Running" || echo "❌ Nginx: Not running"
echo

echo "📋 Logs récents:"
echo "=== Application Logs ==="
tail -n 5 logs/application.log 2>/dev/null || echo "Pas de logs d'application"
echo
echo "=== Nginx Logs ==="
tail -n 5 /var/log/nginx/access.log 2>/dev/null || echo "Pas de logs nginx"
echo

echo "✅ Diagnostic terminé"
```

### 4. Contact Support

```bash
# Script pour collecter les informations de support
# scripts/support-info.sh

echo "📋 Collecte des informations de support..."

# Informations système
echo "=== INFORMATIONS SYSTÈME ===" > support-info.txt
uname -a >> support-info.txt
cat /etc/os-release >> support-info.txt
echo >> support-info.txt

# Configuration application
echo "=== CONFIGURATION APPLICATION ===" >> support-info.txt
echo "Node.js: $(node --version)" >> support-info.txt
echo "npm: $(npm --version)" >> support-info.txt
echo "Environment: ${APP_ENVIRONMENT:-not set}" >> support-info.txt
echo >> support-info.txt

# Statut des services
echo "=== STATUT DES SERVICES ===" >> support-info.txt
systemctl status nginx --no-pager >> support-info.txt 2>&1
echo >> support-info.txt

# Logs récents
echo "=== LOGS RÉCENTS ===" >> support-info.txt
journalctl --since "1 hour ago" --no-pager >> support-info.txt 2>&1
echo >> support-info.txt

# Taille de la base de données
echo "=== BASE DE DONNÉES ===" >> support-info.txt
if command -v psql > /dev/null; then
    psql "$DATABASE_URL" -c "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats;" >> support-info.txt 2>&1
fi
echo >> support-info.txt

echo "📄 Informations collectées dans support-info.txt"
echo "Veuillez envoyer ce fichier au support technique."
```

---

*Guide de Déploiement - Version 1.0 - Novembre 2025*
*Application de Gestion des Équipements Sportifs*