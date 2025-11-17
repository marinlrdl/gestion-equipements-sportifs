# Guide Technique
## Application de Gestion des Équipements Sportifs

### 📋 Table des Matières

1. [Architecture du Système](#architecture-du-système)
2. [Configuration Supabase](#configuration-supabase)
3. [Structure des Fichiers](#structure-des-fichiers)
4. [APIs et Endpoints](#apis-et-endpoints)
5. [Sécurité et Permissions](#sécurité-et-permissions)
6. [Base de Données](#base-de-données)
7. [Frontend JavaScript](#frontend-javascript)
8. [Tests et Validation](#tests-et-validation)
9. [Déploiement et Maintenance](#déploiement-et-maintenance)
10. [Performance et Optimisation](#performance-et-optimisation)
11. [Monitoring et Logging](#monitoring-et-logging)
12. [Dépannage Technique](#dépannage-technique)

---

## Architecture du Système

### Vue d'Ensemble

L'application de gestion des équipements sportifs est une solution full-stack moderne basée sur :

- **Frontend** : JavaScript Vanilla (ES6+), HTML5, CSS3 responsive
- **Backend** : Supabase (PostgreSQL + APIs REST/GraphQL)
- **Cartographie** : Leaflet.js pour la géolocalisation interactive
- **Base de données** : PostgreSQL 15+ avec PostGIS (recommandé pour les analyses géospatiales)
- **Stockage** : Supabase Storage pour les photos et fichiers
- **Authentification** : Supabase Auth avec RLS (Row Level Security)

### Architecture des Données

#### Volume de Données
- **333 000+ équipements sportifs** en base
- **Données géospatiales** avec coordonnées GPS
- **Historique des densités** avec 30 jours de conservation
- **Photos** avec optimisation automatique
- **Logs d'activité** avec rotation automatique

#### Types de Données
```javascript
// Structure principale des équipements
{
  equip_numero: "string",           // Clé unique
  equip_nom: "string",              // Nom de l'équipement
  commune_code: "string",           // Code INSEE commune
  departement_code: "string",       // Code département
  longitude: "decimal",             // Coordonnées GPS
  latitude: "decimal",
  equip_type_name: "string",        // Type d'équipement
  densite_actuelle: "integer",      // Densité temps réel
  capacite_max: "integer",          // Capacité maximale calculée
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Patrons de Conception

#### 1. Modèle Vue Contrôleur (MVC) Simplifié
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    APIs         │    │   Base de       │
│   (HTML/CSS/JS) │◄──►│   Supabase      │◄──►│   Données       │
│                 │    │                 │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 2. Module Pattern pour le JavaScript
```javascript
// Exemple : Gestion modulaire de l'application
class SportEquipmentApp {
    constructor() {
        this.modules = new Map();
    }
    
    registerModule(name, module) {
        this.modules.set(name, module);
    }
    
    getModule(name) {
        return this.modules.get(name);
    }
}
```

#### 3. Repository Pattern pour l'Accès aux Données
```javascript
// Exemple : Service d'accès aux équipements
class EquipementService {
    async getEquipements(filters = {}) {
        // Logique de filtrage et pagination
        // Application des permissions utilisateur
        // Mise en cache des résultats
    }
}
```

---

## Configuration Supabase

### Initialisation du Projet

#### 1. Variables d'Environnement

Créer un fichier `.env` à la racine du projet :

```bash
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_KEY=votre_cle_service_privee

# Application Configuration
APP_ENVIRONMENT=production
APP_DEBUG=false
APP_LOG_LEVEL=info

# File Upload Configuration
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Security Configuration
JWT_SECRET=clesecretejwt
SESSION_TIMEOUT=1800   # 30 minutes

# Email Configuration (optionnel)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=votre_email@example.com
SMTP_PASS=votre_mot_de_passe
```

#### 2. Configuration dans `js/config.js`

```javascript
const APP_CONFIG = {
    api: {
        endpoints: {
            supabase: {
                url: process.env.SUPABASE_URL,
                anonKey: process.env.SUPABASE_ANON_KEY,
                serviceKey: process.env.SUPABASE_SERVICE_KEY
            }
        }
    },
    features: {
        map: {
            provider: 'leaflet',
            defaultZoom: 6,
            maxZoom: 18
        },
        auth: {
            sessionTimeout: 1800000, // 30 minutes
            enableMFA: false
        },
        export: {
            formats: ['csv', 'pdf', 'excel'],
            maxRecords: 10000
        }
    }
};
```

### Configuration de la Base de Données

#### 1. Création des Tables Principales

```sql
-- Table principale des équipements
CREATE TABLE equipements (
    equip_numero VARCHAR(255) PRIMARY KEY,
    inst_numero VARCHAR(255),
    equip_nom VARCHAR(255) NOT NULL,
    inst_nom VARCHAR(255),
    
    -- Localisation
    inst_adresse TEXT,
    inst_cp VARCHAR(10),
    commune_nom VARCHAR(255),
    commune_code VARCHAR(10),
    departement_nom VARCHAR(255),
    departement_code VARCHAR(10),
    region_nom VARCHAR(255),
    region_code VARCHAR(10),
    
    -- Coordonnées GPS
    longitude DECIMAL(10, 7),
    latitude DECIMAL(10, 7),
    
    -- Caractéristiques
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
    
    -- Champs calculés et système
    densite_actuelle INTEGER DEFAULT 0,
    capacite_max INTEGER,
    activites TEXT[], -- PostgreSQL array
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index pour optimiser les performances
CREATE INDEX idx_equipements_commune ON equipements(commune_code);
CREATE INDEX idx_equipements_departement ON equipements(departement_code);
CREATE INDEX idx_equipements_region ON equipements(region_code);
CREATE INDEX idx_equipements_type ON equipements(equip_type_name);
CREATE INDEX idx_equipements_coords ON equipements(longitude, latitude);
CREATE INDEX idx_equipements_updated ON equipements(updated_at DESC);

-- Index pour la recherche textuelle
CREATE INDEX idx_equipements_search ON equipements USING gin(
    to_tsvector('french', 
        equip_nom || ' ' || inst_nom || ' ' || commune_nom
    )
);
```

#### 2. Table des Utilisateurs Étendus

```sql
-- Extension de la table auth.users de Supabase
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nom_complet VARCHAR(255) NOT NULL,
    fonction VARCHAR(255),
    
    -- Rôle et permissions
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'mairie', 'prefecture_departementale', 
        'prefecture_regionale', 'administrateur'
    )),
    
    -- Périmètre d'intervention
    commune_code VARCHAR(10),
    departement_code VARCHAR(10),
    region_code VARCHAR(10),
    
    -- État du compte
    actif BOOLEAN DEFAULT TRUE,
    derniere_connexion TIMESTAMP,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les permissions
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_commune ON user_profiles(commune_code);
CREATE INDEX idx_user_profiles_departement ON user_profiles(departement_code);
```

#### 3. Table de l'Historique des Densités

```sql
CREATE TABLE historique_densite (
    id SERIAL PRIMARY KEY,
    equipement_id VARCHAR(255) REFERENCES equipements(equip_numero),
    densite INTEGER NOT NULL,
    capacite_max INTEGER NOT NULL,
    pourcentage_occupation DECIMAL(5, 2) GENERATED ALWAYS AS (
        (densite::DECIMAL / capacite_max::DECIMAL * 100)
    ) STORED,
    
    -- Contexte
    conditions_meteo VARCHAR(255),
    evenement_special TEXT,
    commentaire TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index pour les performances
CREATE INDEX idx_historique_equipement ON historique_densite(equipement_id);
CREATE INDEX idx_historique_date ON historique_densite(created_at DESC);
```

#### 4. Table des Contacts Citoyens

```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    equipement_id VARCHAR(255) REFERENCES equipements(equip_numero),
    
    -- Informations du demandeur
    nom VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    commune_residence VARCHAR(255),
    
    -- Contenu de la demande
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type_demande VARCHAR(50) CHECK (type_demande IN (
        'question_generale', 'reservation', 'signalement_probleme',
        'suggestion', 'plainte'
    )),
    
    -- Traitement
    statut VARCHAR(20) DEFAULT 'nouveau' CHECK (statut IN (
        'nouveau', 'en_cours', 'traite', 'ferme'
    )),
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN (
        'basse', 'normale', 'haute', 'urgente'
    )),
    
    -- Réponse
    reponse TEXT,
    date_reponse TIMESTAMP,
    repondu_par UUID REFERENCES auth.users(id),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_equipement ON contacts(equipement_id);
CREATE INDEX idx_contacts_statut ON contacts(statut);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);
```

### Configuration RLS (Row Level Security)

#### 1. Politiques de Sécurité pour les Équipements

```sql
-- Activation de RLS
ALTER TABLE equipements ENABLE ROW LEVEL SECURITY;

-- Politique pour les mairies (accès communal uniquement)
CREATE POLICY "mairie_access_own_commune" ON equipements
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

-- Politique pour les préfectures départementales
CREATE POLICY "prefecture_dept_access" ON equipements
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

-- Politique pour les préfectures régionales
CREATE POLICY "prefecture_regional_access" ON equipements
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

-- Politique pour les administrateurs (accès total)
CREATE POLICY "admin_full_access" ON equipements
FOR ALL USING (
    (
        SELECT role 
        FROM user_profiles 
        WHERE id = auth.uid()
    ) = 'administrateur'
);
```

#### 2. Politiques pour les Autres Tables

```sql
-- Table user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_profile" ON user_profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "admins_manage_profiles" ON user_profiles
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);

-- Table historique_densite
ALTER TABLE historique_densite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "densite_access_by_equipement_permission" ON historique_densite
FOR ALL USING (
    equipement_id IN (
        SELECT equip_numero FROM equipements
        WHERE -- même logique que pour les équipements
    )
);

-- Table contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_read_own_commune" ON contacts
FOR SELECT USING (
    equipement_id IN (
        SELECT equip_numero FROM equipements
        WHERE commune_code = (
            SELECT commune_code FROM user_profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "contacts_insert_public" ON contacts
FOR INSERT WITH CHECK (true); -- Les citoyens peuvent envoyer des demandes
```

### Fonctions PostgreSQL Avancées

#### 1. Fonction de Recherche par Proximité

```sql
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
        -- Calcul de distance avec formule de Haversine
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

#### 2. Fonction de Mise à Jour des Statistiques

```sql
CREATE OR REPLACE FUNCTION update_equipement_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mise à jour du timestamp updated_at
    NEW.updated_at = NOW();
    
    -- Calcul de la capacité maximale si pas déjà définie
    IF NEW.capacite_max IS NULL THEN
        NEW.capacite_max = calculate_capacity_max(
            NEW.aire_surface, 
            NEW.equip_type_name,
            NEW.equip_type_famille
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipement_stats
    BEFORE UPDATE ON equipements
    FOR EACH ROW
    EXECUTE FUNCTION update_equipement_stats();
```

---

## Structure des Fichiers

### Architecture du Projet

```
gestion-equipements-sportifs/
├── index.html                    # Page d'accueil
├── connexion.html                # Page de connexion
├── dashboard.html               # Tableau de bord principal
├── carte.html                   # Carte interactive
├── equipements.html             # Liste des équipements
├── detail-equipement.html       # Détail d'un équipement
├── formulaire-equipement.html   # Formulaire de création/modification
├── admin.html                   # Interface administrateur
├── assets/                      # Ressources statiques
│   ├── images/                  # Images et icônes
│   └── fonts/                   # Polices personnalisées
├── css/                         # Styles CSS
│   ├── style.css                # Styles globaux
│   ├── dashboard.css            # Tableau de bord
│   ├── carte.css                # Carte interactive
│   ├── formulaire.css           # Formulaires
│   ├── admin.css                # Interface admin
│   └── photos.css               # Gestion photos
├── js/                          # Scripts JavaScript
│   ├── app.js                   # Application principale
│   ├── auth.js                  # Authentification
│   ├── config.js                # Configuration
│   ├── utils.js                 # Utilitaires
│   ├── guards.js                # Protection des routes
│   ├── carte.js                 # Carte interactive
│   ├── equipements.js           # Gestion équipements
│   ├── formulaire-equipement.js # Formulaires équipements
│   ├── densite.js               # Gestion des densités
│   ├── distance.js              # Calculs de distance
│   ├── photos.js                # Gestion des photos
│   ├── contact.js               # Système de contact
│   └── tests/                   # Tests unitaires
│       ├── test-distance.js
│       ├── test-densite.js
│       └── tests-auth.js
├── database/                    # Scripts de base de données
│   ├── migrations/              # Migrations SQL
│   └── storage-setup.sql        # Configuration stockage
├── docs/                        # Documentation
│   ├── guide-utilisateur.md
│   ├── guide-technique.md
│   ├── api-documentation.md
│   └── deployment-guide.md
├── test-*.html                  # Pages de test
└── deploy-photos.sh            # Script de déploiement photos
```

### Conventions de Nommage

#### 1. Fichiers JavaScript
- **Modules** : `module-name.js` (camelCase)
- **Tests** : `test-module-name.js`
- **Pages de test** : `test-module-name-integration.html`

#### 2. Fichiers CSS
- **Styles globaux** : `style.css`
- **Modules spécifiques** : `module-name.css`

#### 3. Structure HTML
- **Pages principales** : `page-name.html` (kebab-case)
- **Composants** : Directement dans les pages

---

## APIs et Endpoints

### Configuration Supabase

#### 1. Client JavaScript

```javascript
// js/config.js - Configuration Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseConfig = {
    url: APP_CONFIG.api.endpoints.supabase.url,
    key: APP_CONFIG.api.endpoints.supabase.anonKey,
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
};

export const supabase = createClient(
    supabaseConfig.url,
    supabaseConfig.key,
    supabaseConfig.auth
);
```

#### 2. Services d'API

```javascript
// js/utils/api.js - Service API générique
class ApiService {
    constructor() {
        this.supabase = supabase;
    }

    // CRUD générique pour les équipements
    async getEquipements(filters = {}) {
        let query = this.supabase
            .from('equipements')
            .select('*');

        // Application des filtres
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                query = query.eq(key, value);
            }
        });

        const { data, error } = await query.order('updated_at', { ascending: false });
        
        if (error) {
            throw new Error(`Erreur lors de la récupération des équipements: ${error.message}`);
        }
        
        return data;
    }

    async createEquipement(equipementData) {
        const { data, error } = await this.supabase
            .from('equipements')
            .insert([equipementData])
            .select()
            .single();

        if (error) {
            throw new Error(`Erreur lors de la création: ${error.message}`);
        }

        return data;
    }

    async updateEquipement(id, updates) {
        const { data, error } = await this.supabase
            .from('equipements')
            .update(updates)
            .eq('equip_numero', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
        }

        return data;
    }

    async deleteEquipement(id) {
        const { error } = await this.supabase
            .from('equipements')
            .delete()
            .eq('equip_numero', id);

        if (error) {
            throw new Error(`Erreur lors de la suppression: ${error.message}`);
        }

        return true;
    }

    // Recherche par proximité
    async searchProximite(lat, lng, rayonKm = 10) {
        const { data, error } = await this.supabase
            .rpc('search_equipements_proximite', {
                user_lat: lat,
                user_lng: lng,
                radius_km: rayonKm
            });

        if (error) {
            throw new Error(`Erreur lors de la recherche: ${error.message}`);
        }

        return data;
    }
}
```

### Endpoints Principaux

#### 1. Authentification

```javascript
// js/auth.js - Gestion de l'authentification
class AuthModule {
    async signIn(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(`Échec de connexion: ${error.message}`);
        }

        // Récupération du profil utilisateur
        const profile = await this.getUserProfile(data.user.id);
        
        return { user: data.user, profile };
    }

    async signUp(email, password, userData) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });

        if (error) {
            throw new Error(`Échec d'inscription: ${error.message}`);
        }

        // Création du profil
        if (data.user) {
            await this.createUserProfile(data.user.id, userData);
        }

        return data;
    }

    async getUserProfile(userId) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erreur lors de la récupération du profil: ${error.message}`);
        }

        return data;
    }
}
```

#### 2. Gestion des Densités

```javascript
// js/densite.js - Gestion des densités d'occupation
class DensiteManager {
    async mettreAJourDensite(equipementId, nouvelleDensite, contexte = {}) {
        // Validation
        if (nouvelleDensite < 0 || nouvelleDensite > 1000) {
            throw new Error('La densité doit être comprise entre 0 et 1000');
        }

        // Récupération de l'équipement pour la capacité
        const equipement = await this.getEquipement(equipementId);
        if (!equipement) {
            throw new Error('Équipement non trouvé');
        }

        const capaciteMax = equipement.capacite_max || await this.calculerCapaciteMax(equipement);

        // Mise à jour de la densité actuelle
        const { data: densiteData, error: densiteError } = await this.supabase
            .from('equipements')
            .update({ 
                densite_actuelle: nouvelleDensite,
                updated_at: new Date().toISOString()
            })
            .eq('equip_numero', equipementId)
            .select()
            .single();

        if (densiteError) {
            throw new Error(`Erreur mise à jour densité: ${densiteError.message}`);
        }

        // Enregistrement dans l'historique
        const { data: historiqueData, error: historiqueError } = await this.supabase
            .from('historique_densite')
            .insert([{
                equipement_id: equipementId,
                densite: nouvelleDensite,
                capacite_max: capaciteMax,
                conditions_meteo: contexte.conditionsMeteo,
                evenement_special: contexte.evenementSpecial,
                commentaire: contexte.commentaire
            }])
            .select()
            .single();

        if (historiqueError) {
            console.warn('Erreur lors de l\'enregistrement historique:', historiqueError);
        }

        // Vérification des alertes
        const alerte = this.verifierAlerteDensite(nouvelleDensite, capaciteMax);
        if (alerte.niveau !== 'normal') {
            await this.creerAlerte(equipementId, alerte);
        }

        return {
            equipement: densiteData,
            historique: historiqueData,
            alerte: alerte
        };
    }

    async obtenirHistorique(equipementId, jours = 7) {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - jours);

        const { data, error } = await this.supabase
            .from('historique_densite')
            .select('*')
            .eq('equipement_id', equipementId)
            .gte('created_at', dateLimite.toISOString())
            .order('created_at', { ascending: true });

        if (error) {
            throw new Error(`Erreur récupération historique: ${error.message}`);
        }

        return data;
    }

    verifierAlerteDensite(densiteActuelle, capaciteMax) {
        const pourcentage = (densiteActuelle / capaciteMax) * 100;

        if (pourcentage >= 100) {
            return {
                niveau: 'critique',
                message: 'Équipement à capacité maximale',
                couleur: '#dc3545'
            };
        } else if (pourcentage >= 80) {
            return {
                niveau: 'haute',
                message: 'Forte occupation',
                couleur: '#fd7e14'
            };
        } else if (pourcentage >= 50) {
            return {
                niveau: 'moyenne',
                message: 'Occupation moyenne',
                couleur: '#ffc107'
            };
        } else {
            return {
                niveau: 'normal',
                message: 'Occupation normale',
                couleur: '#28a745'
            };
        }
    }
}
```

#### 3. Gestion des Photos

```javascript
// js/photos.js - Gestion des photos d'équipements
class PhotoManager {
    async uploadPhoto(file, equipementId, metadata = {}) {
        // Validation du fichier
        if (!this.validerFichier(file)) {
            throw new Error('Fichier non valide');
        }

        // Génération du nom de fichier unique
        const fileName = `${equipementId}/${Date.now()}_${file.name}`;

        // Upload vers Supabase Storage
        const { data, error } = await this.supabase.storage
            .from('photos-equipements')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw new Error(`Erreur upload: ${error.message}`);
        }

        // Génération des URLs
        const { data: urlData } = this.supabase.storage
            .from('photos-equipements')
            .getPublicUrl(fileName);

        // Sauvegarde des métadonnées
        const photoData = {
            equipement_id: equipementId,
            url: urlData.publicUrl,
            nom_fichier: fileName,
            description: metadata.description || '',
            categorie: metadata.categorie || 'vue_generale',
            taille_fichier: file.size,
            type_fichier: file.type,
            created_at: new Date().toISOString()
        };

        const { error: dbError } = await this.supabase
            .from('photos_equipements')
            .insert([photoData]);

        if (dbError) {
            // Rollback de l'upload
            await this.supabase.storage
                .from('photos-equipements')
                .remove([fileName]);
            
            throw new Error(`Erreur sauvegarde métadonnées: ${dbError.message}`);
        }

        return {
            url: urlData.publicUrl,
            nom_fichier: fileName,
            ...photoData
        };
    }

    validerFichier(file) {
        // Types autorisés
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return false;
        }

        // Taille maximum (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return false;
        }

        return true;
    }

    async supprimerPhoto(equipementId, nomFichier) {
        // Suppression de la base de données
        const { error: dbError } = await this.supabase
            .from('photos_equipements')
            .delete()
            .eq('equipement_id', equipementId)
            .eq('nom_fichier', nomFichier);

        if (dbError) {
            throw new Error(`Erreur suppression BDD: ${dbError.message}`);
        }

        // Suppression du fichier storage
        const { error: storageError } = await this.supabase.storage
            .from('photos-equipements')
            .remove([`${equipementId}/${nomFichier}`]);

        if (storageError) {
            console.warn('Erreur suppression storage:', storageError);
        }

        return true;
    }
}
```

### APIs REST Personnalisées

#### 1. Fonction de Calcul de Distance

```sql
-- PostgreSQL function pour calcul distance avec index géospatial
CREATE OR REPLACE FUNCTION calculate_distance_optimized(
    lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    earth_radius_km CONSTANT DECIMAL := 6371;
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

#### 2. API de Statistiques

```sql
-- Vue matérialisée pour les statistiques rapides
CREATE MATERIALIZED VIEW stats_equipements AS
SELECT 
    commune_code,
    COUNT(*) as nb_equipements,
    AVG(densite_actuelle::DECIMAL / capacite_max * 100) as taux_occupation_moyen,
    MAX(updated_at) as derniere_maj,
    COUNT(CASE WHEN capacite_max > 0 THEN 1 END) as equipements_avec_capacite
FROM equipements
WHERE capacite_max > 0
GROUP BY commune_code;

CREATE UNIQUE INDEX ON stats_equipements(commune_code);

-- Fonction de refresh automatique
CREATE OR REPLACE FUNCTION refresh_stats_equipements()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW stats_equipements;
END;
$$ LANGUAGE plpgsql;
```

---

## Sécurité et Permissions

### Système de Permissions

#### 1. Matrice des Permissions

```javascript
// js/config.js - Configuration des permissions
const PERMISSIONS = {
    mairie: {
        equipements: {
            read: true,
            create: true,
            update: true,
            delete: true,
            scope: 'commune'
        },
        densite: {
            read: true,
            create: true,
            update: true
        },
        photos: {
            read: true,
            create: true,
            delete: true
        },
        contact: {
            read: true,
            respond: true
        }
    },
    prefecture_departementale: {
        equipements: {
            read: true,
            create: true,
            update: true,
            delete: true,
            scope: 'departement'
        },
        densite: {
            read: true,
            create: true,
            update: true
        },
        photos: {
            read: true,
            create: true,
            delete: true
        },
        contact: {
            read: true,
            respond: true
        },
        rapports: {
            generate: true
        }
    },
    prefecture_regionale: {
        equipements: {
            read: true,
            create: true,
            update: true,
            delete: true,
            scope: 'region'
        },
        densite: {
            read: true,
            create: true,
            update: true
        },
        photos: {
            read: true,
            create: true,
            delete: true
        },
        contact: {
            read: true,
            respond: true
        },
        rapports: {
            generate: true,
            compare: true
        },
        planification: {
            create: true,
            update: true
        }
    },
    administrateur: {
        equipements: {
            read: true,
            create: true,
            update: true,
            delete: true,
            scope: 'all'
        },
        densite: {
            read: true,
            create: true,
            update: true
        },
        photos: {
            read: true,
            create: true,
            delete: true
        },
        contact: {
            read: true,
            respond: true
        },
        rapports: {
            generate: true,
            compare: true
        },
        users: {
            create: true,
            update: true,
            delete: true
        },
        system: {
            config: true,
            logs: true,
            backup: true
        }
    }
};
```

#### 2. Middleware de Vérification

```javascript
// js/guards.js - Protection des routes et actions
class RouteGuards {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
    }

    async init() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this.currentProfile = await this.getUserProfile(session.user.id);
        }
    }

    canAccessEquipement(equipement, action = 'read') {
        if (!this.currentProfile) return false;
        
        const userRole = this.currentProfile.role;
        const userCommune = this.currentProfile.commune_code;
        const userDepartement = this.currentProfile.departement_code;
        const userRegion = this.currentProfile.region_code;

        switch (userRole) {
            case 'mairie':
                return equipement.commune_code === userCommune;
            
            case 'prefecture_departementale':
                return equipement.departement_code === userDepartement;
            
            case 'prefecture_regionale':
                return equipement.region_code === userRegion;
            
            case 'administrateur':
                return true;
            
            default:
                return false;
        }
    }

    requireAuth(redirectTo = 'connexion.html') {
        if (!this.currentUser) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    requireRole(requiredRoles) {
        if (!this.currentProfile) return false;
        
        const userRole = this.currentProfile.role;
        if (!requiredRoles.includes(userRole)) {
            this.showAccessDenied();
            return false;
        }
        return true;
    }

    filterEquipementsByPermissions(equipements) {
        return equipements.filter(equipement => 
            this.canAccessEquipement(equipement, 'read')
        );
    }
}
```

### Sécurisation des APIs

#### 1. Validation des Données

```javascript
// js/utils/validators.js - Validateurs de données
class Validators {
    static validateEquipement(data) {
        const errors = [];

        // Champs obligatoires
        if (!data.equip_nom || data.equip_nom.trim().length === 0) {
            errors.push('Le nom de l\'équipement est obligatoire');
        }

        // Validation des coordonnées GPS
        if (data.longitude !== undefined && data.latitude !== undefined) {
            if (data.longitude < -180 || data.longitude > 180) {
                errors.push('La longitude doit être entre -180 et 180');
            }
            if (data.latitude < -90 || data.latitude > 90) {
                errors.push('La latitude doit être entre -90 et 90');
            }
        }

        // Validation des dimensions
        if (data.aire_longueur !== undefined && data.aire_longueur < 0) {
            errors.push('La longueur doit être positive');
        }

        if (data.aire_largeur !== undefined && data.aire_largeur < 0) {
            errors.push('La largeur doit être positive');
        }

        // Validation de la capacité
        if (data.capacite_max !== undefined && data.capacite_max < 0) {
            errors.push('La capacité doit être positive');
        }

        // Validation email pour les contacts
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Format d\'email invalide');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
}
```

#### 2. Protection CSRF

```javascript
// js/utils/security.js - Utilitaires de sécurité
class SecurityUtils {
    static generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    static validateCSRFToken(token) {
        const sessionToken = sessionStorage.getItem('csrf_token');
        return token === sessionToken;
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    static hashPassword(password) {
        // Utilisation de l'API Web Crypto pour le hash
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        return crypto.subtle.digest('SHA-256', data);
    }
}
```

### Gestion des Sessions

#### 1. Timeout et Renouvellement

```javascript
// js/auth.js - Gestion avancée des sessions
class AuthModule {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.refreshInterval = null;
        this.timeoutTimer = null;
    }

    startSessionMonitoring() {
        // Démarrage du timer de timeout
        this.timeoutTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.sessionTimeout);

        // Rafraîchissement périodique du token
        this.refreshInterval = setInterval(async () => {
            await this.refreshSession();
        }, 25 * 60 * 1000); // 25 minutes

        // Surveillance de l'activité utilisateur
        this.setupActivityMonitoring();
    }

    setupActivityMonitoring() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetSessionTimer();
            }, true);
        });
    }

    resetSessionTimer() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }
        
        this.timeoutTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.sessionTimeout);
    }

    async handleSessionTimeout() {
        await this.logout();
        
        // Notification à l'utilisateur
        this.showNotification('Session expirée, veuillez vous reconnecter', 'warning');
        
        // Redirection vers la connexion
        window.location.href = 'connexion.html?timeout=true';
    }
}
```

---

## Base de Données

### Schéma Complet

#### 1. Équipements (Table Principale)

```sql
-- Table des équipements sportifs
CREATE TABLE equipements (
    -- Identification
    equip_numero VARCHAR(255) PRIMARY KEY,
    inst_numero VARCHAR(255),
    
    -- Noms et descriptions
    equip_nom VARCHAR(255) NOT NULL,
    inst_nom VARCHAR(255),
    
    -- Localisation administrative
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
    
    -- Coordonnées géographiques
    longitude DECIMAL(10, 7),
    latitude DECIMAL(10, 7),
    
    -- Classification
    equip_type_name VARCHAR(255),
    equip_type_famille VARCHAR(255),
    equip_nature VARCHAR(255),
    equip_sol VARCHAR(255),
    annee_mise_en_service INTEGER,
    
    -- Dimensions et capacités
    aire_longueur DECIMAL(10, 2),
    aire_largeur DECIMAL(10, 2),
    aire_hauteur DECIMAL(10, 2),
    aire_surface DECIMAL(10, 2),
    
    -- Équipements et installations
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
    
    -- Gestion et accès
    proprietaire_type VARCHAR(255),
    gestionnaire_type VARCHAR(255),
    equip_acces_libre BOOLEAN DEFAULT TRUE,
    ouverture_saisonniere BOOLEAN DEFAULT FALSE,
    
    -- Informations complémentaires
    equip_url TEXT,
    equip_obs TEXT,
    inst_obs TEXT,
    activites TEXT[], -- Array PostgreSQL pour les activités
    
    -- Champs calculés
    densite_actuelle INTEGER DEFAULT 0,
    capacite_max INTEGER,
    
    -- Métadonnées système
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);
```

#### 2. Tables de Référence

```sql
-- Table des communes
CREATE TABLE communes (
    code_insee VARCHAR(10) PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    code_postal VARCHAR(10),
    departement_code VARCHAR(10),
    region_code VARCHAR(10),
    longitude DECIMAL(10, 7),
    latitude DECIMAL(10, 7),
    population INTEGER,
    superficie_km2 DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les recherches géographiques
CREATE INDEX idx_communes_coords ON communes(longitude, latitude);
CREATE INDEX idx_communes_departement ON communes(departement_code);

-- Table des types d'équipements
CREATE TABLE types_equipements (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL,
    famille VARCHAR(255),
    description TEXT,
    capacite_standard INTEGER,
    surface_minimum DECIMAL(10, 2),
    activites_possibles TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des activités sportives
CREATE TABLE activites (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    type_equipement_recommande VARCHAR(255),
    niveau_pratique VARCHAR(50), -- loisirs, competition, elite
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table de liaison équipements-activités
CREATE TABLE equipements_activites (
    equipement_id VARCHAR(255) REFERENCES equipements(equip_numero),
    activite_id INTEGER REFERENCES activites(id),
    principal BOOLEAN DEFAULT FALSE, -- activité principale de l'équipement
    PRIMARY KEY (equipement_id, activite_id)
);

-- Table des photos
CREATE TABLE photos_equipements (
    id SERIAL PRIMARY KEY,
    equipement_id VARCHAR(255) REFERENCES equipements(equip_numero),
    url TEXT NOT NULL,
    nom_fichier VARCHAR(255),
    description TEXT,
    categorie VARCHAR(100), -- vue_generale, aire_jeu, vestiaires, etc.
    taille_fichier INTEGER,
    type_fichier VARCHAR(50),
    ordre_affichage INTEGER DEFAULT 0,
    principal BOOLEAN DEFAULT FALSE, -- photo principale pour le thumbnail
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_photos_equipement ON photos_equipements(equipement_id);
```

### Migrations et Évolution du Schéma

#### 1. Scripts de Migration

```sql
-- migration_20241105_initial.sql
BEGIN;

-- Création des tables de base
CREATE TABLE equipements (
    -- ... (voir ci-dessus)
);

-- Table pour l'historique des densités
CREATE TABLE historique_densite (
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

-- Table des contacts citoyens
CREATE TABLE contacts (
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

-- Index pour les performances
CREATE INDEX idx_equipements_commune ON equipements(commune_code);
CREATE INDEX idx_equipements_departement ON equipements(departement_code);
CREATE INDEX idx_equipements_region ON equipements(region_code);
CREATE INDEX idx_equipements_type ON equipements(equip_type_name);
CREATE INDEX idx_equipements_coords ON equipements(longitude, latitude);
CREATE INDEX idx_historique_equipement ON historique_densite(equipement_id);
CREATE INDEX idx_historique_date ON historique_densite(created_at DESC);
CREATE INDEX idx_contacts_equipement ON contacts(equipement_id);
CREATE INDEX idx_contacts_statut ON contacts(statut);

COMMIT;
```

#### 2. Migrations PostGIS (Optionnel pour analyses géospatiales avancées)

```sql
-- migration_20241110_postgis.sql
BEGIN;

-- Extension PostGIS pour les analyses géospatiales
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Ajout d'une colonne géométrique
ALTER TABLE equipements ADD COLUMN geom geometry(Point, 4326);

-- Mise à jour de la colonne géométrique à partir des coordonnées
UPDATE equipements 
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

-- Index géospatial
CREATE INDEX idx_equipements_geom ON equipements USING GIST (geom);

-- Vue matérialisée pour les équipements géolocalisés
CREATE MATERIALIZED VIEW equipements_geo AS
SELECT 
    *,
    ST_AsText(geom) as geom_text
FROM equipements
WHERE geom IS NOT NULL;

CREATE UNIQUE INDEX ON equipements_geo(equip_numero);
CREATE INDEX idx_equipements_geo_geom ON equipements_geo USING GIST (geom);

COMMIT;
```

### Optimisations de Performance

#### 1. Index Spécialisés

```sql
-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_equipements_type_commune ON equipements(equip_type_name, commune_code);
CREATE INDEX idx_equipements_famille_dept ON equipements(equip_type_famille, departement_code);

-- Index partiel pour les équipements actifs uniquement
CREATE INDEX idx_equipements_actifs ON equipements(commune_code, updated_at DESC)
WHERE capacite_max > 0;

-- Index pour la recherche textuelle
CREATE INDEX idx_equipements_fts ON equipements USING gin(
    to_tsvector('french', 
        equip_nom || ' ' || inst_nom || ' ' || commune_nom
    )
);
```

#### 2. Vues Matérialisées pour les Statistiques

```sql
-- Vue pour les statistiques par commune
CREATE MATERIALIZED VIEW stats_communes AS
SELECT 
    commune_code,
    commune_nom,
    COUNT(*) as nb_equipements,
    AVG(densite_actuelle::DECIMAL / NULLIF(capacite_max, 0) * 100) as taux_occupation_moyen,
    COUNT(CASE WHEN capacite_max > 0 THEN 1 END) as equipements_avec_capacite,
    MAX(updated_at) as derniere_maj
FROM equipements
WHERE capacite_max > 0
GROUP BY commune_code, commune_nom;

CREATE UNIQUE INDEX ON stats_communes(commune_code);

-- Vue pour les statistiques par type d'équipement
CREATE MATERIALIZED VIEW stats_types_equipements AS
SELECT 
    equip_type_name,
    equip_type_famille,
    COUNT(*) as nb_equipements,
    AVG(densite_actuelle::DECIMAL / NULLIF(capacite_max, 0) * 100) as taux_occupation_moyen,
    AVG(aire_surface) as surface_moyenne
FROM equipements
WHERE capacite_max > 0
GROUP BY equip_type_name, equip_type_famille;

CREATE INDEX ON stats_types_equipements(equip_type_name);
```

#### 3. Fonctions de Maintenance

```sql
-- Fonction de nettoyage des données obsolètes
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Suppression de l'historique de densité de plus d'un an
    DELETE FROM historique_densite 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Suppression des logs d'anciennes sessions
    DELETE FROM auth.sessions 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    -- Mise à jour des statistiques
    REFRESH MATERIALIZED VIEW CONCURRENTLY stats_communes;
    REFRESH MATERIALIZED VIEW CONCURRENTLY stats_types_equipements;
END;
$$ LANGUAGE plpgsql;

-- Programmation du nettoyage automatique
SELECT cron.schedule(
    'cleanup-old-data',
    '0 2 * * 0', -- Tous les dimanches à 2h du matin
    'SELECT cleanup_old_data();'
);
```

---

## Frontend JavaScript

### Architecture de l'Application

#### 1. Point d'Entrée Principal

```javascript
// js/app.js - Application principale
class SportEquipmentApp {
    constructor() {
        this.version = '1.0.0';
        this.modules = new Map();
        this.config = window.AppConfig;
        this.currentUser = null;
        this.currentProfile = null;
        
        this.elements = {
            navigation: null,
            notifications: null,
            modals: null
        };
    }

    async init() {
        try {
            console.log(`🚀 Initialisation de l'application v${this.version}`);
            
            // Vérification des prérequis
            await this.checkPrerequisites();
            
            // Initialisation des éléments DOM
            this.initDOMElements();
            
            // Création du conteneur de notifications
            this.createNotificationsContainer();
            
            // Chargement de la session utilisateur
            await this.loadUserSession();
            
            // Initialisation des modules
            await this.initModules();
            
            // Configuration des événements globaux
            this.setupGlobalEvents();
            
            // Initialisation de l'interface
            this.initUI();
            
            // Configuration de la navigation
            this.setupRouting();
            
            console.log('✅ Application initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du chargement de l\'application');
        }
    }

    async checkPrerequisites() {
        // Vérification de Supabase
        if (typeof supabase === 'undefined') {
            throw new Error('Supabase client non chargé');
        }

        // Vérification de Leaflet pour la carte
        const cartePages = ['carte.html', 'index.html', 'formulaire-equipement.html'];
        if (cartePages.includes(this.getCurrentPage()) && typeof L === 'undefined') {
            throw new Error('Leaflet non chargé');
        }

        // Vérification de la connexion
        await this.testConnection();
    }

    async testConnection() {
        try {
            const { data, error } = await supabase
                .from('equipements')
                .select('count', { count: 'exact', head: true });
            
            if (error) throw error;
            console.log('✅ Connexion à la base de données OK');
            
        } catch (error) {
            console.warn('⚠️ Problème de connexion:', error.message);
            this.showError('Impossible de se connecter à la base de données');
        }
    }

    registerModule(name, module) {
        this.modules.set(name, module);
        console.log(`📦 Module enregistré: ${name}`);
    }

    getModule(name) {
        return this.modules.get(name);
    }

    async initModules() {
        // Module d'authentification
        const authModule = new AuthModule();
        await authModule.init(this);
        this.registerModule('auth', authModule);

        // Module de gestion des équipements
        if (this.shouldLoadModule('equipements')) {
            const equipementModule = new EquipementManager();
            await equipementModule.init(this);
            this.registerModule('equipements', equipementModule);
        }

        // Module de carte (si page appropriée)
        if (this.shouldLoadModule('carte')) {
            const carteModule = new CarteManager();
            await carteModule.init(this);
            this.registerModule('carte', carteModule);
        }

        // Module d'administration (si admin)
        if (this.shouldLoadModule('admin')) {
            const adminModule = new AdminManager();
            await adminModule.init(this);
            this.registerModule('admin', adminModule);
        }
    }

    shouldLoadModule(moduleName) {
        const currentPage = this.getCurrentPage();
        const modulePages = {
            equipements: ['equipements.html', 'formulaire-equipement.html', 'detail-equipement.html'],
            carte: ['carte.html', 'index.html', 'formulaire-equipement.html'],
            admin: ['admin.html'],
            densite: ['dashboard.html', 'equipements.html'],
            contact: ['contact.html', 'dashboard.html']
        };

        return modulePages[moduleName]?.includes(currentPage);
    }
}
```

#### 2. Module d'Authentification

```javascript
// js/auth.js - Gestion de l'authentification
class AuthModule {
    constructor() {
        this.supabase = supabase;
        this.config = {
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            refreshInterval: 25 * 60 * 1000, // 25 minutes
            maxLoginAttempts: 5,
            lockoutDuration: 15 * 60 * 1000 // 15 minutes
        };
        this.currentUser = null;
        this.currentProfile = null;
        this.loginAttempts = new Map();
    }

    async init(app) {
        this.app = app;
        
        // Configuration des listeners Supabase
        this.setupSupabaseListeners();
        
        // Vérification de la session existante
        await this.checkExistingSession();
        
        // Configuration des formulaires d'authentification
        this.setupAuthForms();
        
        // Démarrage du monitoring de session
        this.startSessionMonitoring();
    }

    setupSupabaseListeners() {
        // Listener pour les changements d'authentification
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Changement d\'état d\'auth:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    await this.handleSignIn(session);
                    break;
                case 'SIGNED_OUT':
                    this.handleSignOut();
                    break;
                case 'TOKEN_REFRESHED':
                    this.handleTokenRefresh(session);
                    break;
                case 'USER_UPDATED':
                    await this.handleUserUpdate(session);
                    break;
            }
        });
    }

    async checkExistingSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        
        if (session) {
            await this.handleSignIn(session);
        }
    }

    async handleSignIn(session) {
        this.currentUser = session.user;
        
        try {
            // Récupération du profil utilisateur
            this.currentProfile = await this.obtenirUtilisateurConnecte();
            
            if (!this.currentProfile) {
                throw new Error('Profil utilisateur non trouvé');
            }

            if (!this.currentProfile.actif) {
                await this.logout();
                throw new Error('Compte désactivé');
            }

            // Mise à jour de la dernière connexion
            await this.updateLastLogin();

            // Notification du succès
            this.app.showNotification('Connexion réussie', 'success');

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            await this.logout();
            throw error;
        }
    }

    async seConnecter(email, motDePasse) {
        // Vérification des tentatives de connexion
        if (this.isLockedOut(email)) {
            throw new Error('Trop de tentatives de connexion. Réessayez plus tard.');
        }

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password: motDePasse
            });

            if (error) throw error;

            // Reset des tentatives en cas de succès
            this.loginAttempts.delete(email);

            return data;

        } catch (error) {
            this.recordFailedAttempt(email);
            throw new Error('Email ou mot de passe incorrect');
        }
    }

    isLockedOut(email) {
        const attempts = this.loginAttempts.get(email);
        if (!attempts) return false;

        const { count, lastAttempt } = attempts;
        return count >= this.config.maxLoginAttempts && 
               Date.now() - lastAttempt < this.config.lockoutDuration;
    }

    recordFailedAttempt(email) {
        const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        this.loginAttempts.set(email, attempts);
    }

    async obtenirUtilisateurConnecte() {
        if (!this.currentUser) return null;

        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', this.currentUser.id)
            .single();

        if (error) {
            console.error('Erreur récupération profil:', error);
            return null;
        }

        return data;
    }

    // Vérification des permissions
    verifierPermissions(equipement, action) {
        if (!this.currentProfile) return false;

        const userRole = this.currentProfile.role;
        const userCommune = this.currentProfile.commune_code;
        const userDepartement = this.currentProfile.departement_code;
        const userRegion = this.currentProfile.region_code;

        switch (userRole) {
            case 'mairie':
                return equipement.commune_code === userCommune;
            
            case 'prefecture_departementale':
                return equipement.departement_code === userDepartement;
            
            case 'prefecture_regionale':
                return equipement.region_code === userRegion;
            
            case 'administrateur':
                return true;
            
            default:
                return false;
        }
    }

    hasPermission(permission) {
        if (!this.currentProfile) return false;

        const rolePermissions = {
            mairie: ['equipements:commune', 'densite:commune'],
            prefecture_departementale: ['equipements:departement', 'densite:departement', 'rapports:departement'],
            prefecture_regionale: ['equipements:region', 'densite:region', 'rapports:region', 'planification:region'],
            administrateur: ['*']
        };

        const userRole = this.currentProfile.role;
        const permissions = rolePermissions[userRole] || [];

        return permissions.includes('*') || permissions.includes(permission);
    }
}
```

#### 3. Module de Gestion des Équipements

```javascript
// js/equipements.js - Gestion des équipements
class EquipementManager {
    constructor() {
        this.supabase = supabase;
        this.equipements = [];
        this.filters = {};
        this.currentPage = 1;
        this.pageSize = 20;
        this.sortField = 'updated_at';
        this.sortDirection = 'desc';
    }

    async init(app) {
        this.app = app;
        
        // Vérification de l'authentification
        await this.app.getModule('auth').requireAuth();
        
        // Chargement des équipements
        await this.chargerEquipementsCollectivite();
        
        // Configuration des événements
        this.initialiserEventListeners();
        
        // Initialisation de l'interface
        this.afficherTableauEquipements();
    }

    async chargerEquipementsCollectivite() {
        try {
            this.app.showNotification('Chargement des équipements...', 'info');
            
            let query = this.supabase
                .from('equipements')
                .select('*')
                .order(this.sortField, { ascending: this.sortDirection === 'asc' });

            // Application des filtres selon les permissions utilisateur
            const userProfile = this.app.getModule('auth').currentProfile;
            const filters = this.getUserFilters(userProfile);
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    query = query.eq(key, value);
                }
            });

            // Application des filtres de recherche
            if (this.filters.search) {
                query = query.or(`equip_nom.ilike.%${this.filters.search}%,inst_nom.ilike.%${this.filters.search}%`);
            }

            if (this.filters.type) {
                query = query.eq('equip_type_name', this.filters.type);
            }

            // Pagination
            const from = (this.currentPage - 1) * this.pageSize;
            const to = from + this.pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;

            this.equipements = data || [];
            this.totalCount = count;

            this.app.showNotification(`${this.equipements.length} équipements chargés`, 'success');

        } catch (error) {
            console.error('Erreur chargement équipements:', error);
            this.app.showError('Erreur lors du chargement des équipements');
        }
    }

    getUserFilters(userProfile) {
        switch (userProfile.role) {
            case 'mairie':
                return { commune_code: userProfile.commune_code };
            
            case 'prefecture_departementale':
                return { departement_code: userProfile.departement_code };
            
            case 'prefecture_regionale':
                return { region_code: userProfile.region_code };
            
            case 'administrateur':
                return {}; // Pas de filtre pour les admins
            
            default:
                return {};
        }
    }

    afficherTableauEquipements() {
        const tableContainer = document.getElementById('equipements-table-container');
        if (!tableContainer) return;

        const html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th data-sort="equip_nom">Nom</th>
                            <th data-sort="equip_type_name">Type</th>
                            <th data-sort="commune_nom">Commune</th>
                            <th>Densité</th>
                            <th data-sort="updated_at">Dernière MAJ</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.equipements.map(equip => this.generateTableRow(equip)).join('')}
                    </tbody>
                </table>
            </div>
            
            ${this.renderPagination()}
        `;

        tableContainer.innerHTML = html;
        this.attachTableEvents();
    }

    generateTableRow(equipement) {
        const pourcentageOccupation = equipement.capacite_max > 0 
            ? Math.round((equipement.densite_actuelle / equipement.capacite_max) * 100)
            : 0;

        const getDensiteClass = (pourcentage) => {
            if (pourcentage >= 80) return 'bg-danger';
            if (pourcentage >= 50) return 'bg-warning';
            return 'bg-success';
        };

        return `
            <tr>
                <td>
                    <strong>${equipement.equip_nom}</strong><br>
                    <small class="text-muted">${equipement.inst_nom || ''}</small>
                </td>
                <td>${equipement.equip_type_name}</td>
                <td>${equipement.commune_nom}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="me-2">${equipement.densite_actuelle}/${equipement.capacite_max || '?'}</span>
                        <div class="progress" style="width: 60px; height: 6px;">
                            <div class="progress-bar ${getDensiteClass(pourcentageOccupation)}" 
                                 style="width: ${pourcentageOccupation}%"></div>
                        </div>
                    </div>
                </td>
                <td>${new Date(equipement.updated_at).toLocaleDateString('fr-FR')}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="equipementManager.voirEquipement('${equipement.equip_numero}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" 
                                onclick="equipementManager.modifierEquipement('${equipement.equip_numero}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="equipementManager.confirmerSuppression('${equipement.equip_numero}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async voirEquipement(equipementId) {
        const equipement = this.equipements.find(e => e.equip_numero === equipementId);
        if (!equipement) return;

        // Vérification des permissions de lecture
        const auth = this.app.getModule('auth');
        if (!auth.verifierPermissions(equipement, 'read')) {
            this.app.showError('Vous n\'avez pas les permissions pour voir cet équipement');
            return;
        }

        // Redirection vers la page de détail
        window.location.href = `detail-equipement.html?id=${equipementId}`;
    }

    async modifierEquipement(equipementId) {
        const equipement = this.equipements.find(e => e.equip_numero === equipementId);
        if (!equipement) return;

        // Vérification des permissions d'édition
        const auth = this.app.getModule('auth');
        if (!auth.verifierPermissions(equipement, 'update')) {
            this.app.showError('Vous n\'avez pas les permissions pour modifier cet équipement');
            return;
        }

        // Redirection vers le formulaire
        window.location.href = `formulaire-equipement.html?id=${equipementId}`;
    }

    async confirmerSuppression(equipementId) {
        const equipement = this.equipements.find(e => e.equip_numero === equipementId);
        if (!equipement) return;

        // Vérification des permissions de suppression
        const auth = this.app.getModule('auth');
        if (!auth.verifierPermissions(equipement, 'delete')) {
            this.app.showError('Vous n\'avez pas les permissions pour supprimer cet équipement');
            return;
        }

        if (confirm(`Êtes-vous sûr de vouloir supprimer l'équipement "${equipement.equip_nom}" ?`)) {
            await this.supprimerEquipement(equipementId);
        }
    }

    async supprimerEquipement(equipementId) {
        try {
            const { error } = await this.supabase
                .from('equipements')
                .delete()
                .eq('equip_numero', equipementId);

            if (error) throw error;

            // Suppression de l'interface
            this.equipements = this.equipements.filter(e => e.equip_numero !== equipementId);
            this.afficherTableauEquipements();

            this.app.showNotification('Équipement supprimé avec succès', 'success');

        } catch (error) {
            console.error('Erreur suppression:', error);
            this.app.showError('Erreur lors de la suppression de l\'équipement');
        }
    }

    // Filtres et recherche
    filtrerEquipements() {
        const searchInput = document.getElementById('search-equipements');
        const typeSelect = document.getElementById('filter-type');

        this.filters = {
            search: searchInput?.value?.trim(),
            type: typeSelect?.value || ''
        };

        this.currentPage = 1;
        this.chargerEquipementsCollectivite();
    }

    reinitialiserFiltres() {
        this.filters = {};
        this.currentPage = 1;
        
        const searchInput = document.getElementById('search-equipements');
        const typeSelect = document.getElementById('filter-type');
        
        if (searchInput) searchInput.value = '';
        if (typeSelect) typeSelect.value = '';
        
        this.chargerEquipementsCollectivite();
    }

    // Tri
    trierEquipements(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }

        this.chargerEquipementsCollectivite();
    }

    // Export
    exporterEquipements() {
        const headers = [
            'Nom', 'Type', 'Commune', 'Département', 'Adresse',
            'Densité actuelle', 'Capacité maximale', 'Dernière mise à jour'
        ];

        const csvContent = [
            headers.join(','),
            ...this.equipements.map(equip => [
                `"${equip.equip_nom}"`,
                `"${equip.equip_type_name}"`,
                `"${equip.commune_nom}"`,
                `"${equip.departement_nom}"`,
                `"${equip.inst_adresse || ''}"`,
                equip.densite_actuelle,
                equip.capacite_max || '',
                new Date(equip.updated_at).toLocaleDateString('fr-FR')
            ].join(','))
        ].join('\n');

        this.downloadFile(csvContent, 'equipements.csv', 'text/csv');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}
```

### Utilitaires et Helpers

#### 1. Utilitaires de Formatage

```javascript
// js/utils/formatters.js - Formatage des données
const Formatters = {
    formatNumber(num, decimals = 0) {
        if (num === null || num === undefined) return '-';
        return Number(num).toLocaleString('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined) return '-';
        return `${value.toFixed(decimals)}%`;
    },

    formatDate(date, format = 'short') {
        if (!date) return '-';
        
        const dateObj = new Date(date);
        switch (format) {
            case 'short':
                return dateObj.toLocaleDateString('fr-FR');
            case 'long':
                return dateObj.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            case 'datetime':
                return dateObj.toLocaleString('fr-FR');
            default:
                return dateObj.toLocaleDateString('fr-FR');
        }
    },

    formatDistance(distance, unit = 'km') {
        if (!distance) return '-';
        
        if (unit === 'km') {
            return `${distance.toFixed(1)} km`;
        } else {
            return `${Math.round(distance)} m`;
        }
    },

    formatFileSize(bytes) {
        if (!bytes) return '-';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    },

    formatAddress(address, postalCode, commune) {
        const parts = [address, postalCode, commune].filter(Boolean);
        return parts.join(', ');
    }
};
```

#### 2. Validateurs

```javascript
// js/utils/validators.js - Validation des données
const Validators = {
    required(value, fieldName) {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return `${fieldName} est obligatoire`;
        }
        return null;
    },

    email(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Format d\'email invalide';
        }
        return null;
    },

    phone(phone) {
        const phoneRegex = /^(?:\+33|0)[1-9](?:[\s.-]?\d{2}){4}$/;
        if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
            return 'Format de téléphone invalide';
        }
        return null;
    },

    coordinates(lat, lng) {
        const errors = [];
        
        if (lat !== undefined && (lat < -90 || lat > 90)) {
            errors.push('La latitude doit être entre -90 et 90');
        }
        
        if (lng !== undefined && (lng < -180 || lng > 180)) {
            errors.push('La longitude doit être entre -180 et 180');
        }
        
        return errors;
    },

    number(value, fieldName, min = null, max = null) {
        const num = Number(value);
        
        if (isNaN(num)) {
            return `${fieldName} doit être un nombre`;
        }
        
        if (min !== null && num < min) {
            return `${fieldName} doit être supérieur à ${min}`;
        }
        
        if (max !== null && num > max) {
            return `${fieldName} doit être inférieur à ${max}`;
        }
        
        return null;
    },

    url(url) {
        if (!url) return null; // Optionnel
        
        try {
            new URL(url);
            return null;
        } catch {
            return 'Format d\'URL invalide';
        }
    },

    validateEquipement(data) {
        const errors = [];

        // Champs obligatoires
        const requiredFields = [
            { field: data.equip_nom, name: 'Nom de l\'équipement' },
            { field: data.commune_code, name: 'Code commune' },
            { field: data.departement_code, name: 'Code département' },
            { field: data.region_code, name: 'Code région' }
        ];

        requiredFields.forEach(({ field, name }) => {
            const error = this.required(field, name);
            if (error) errors.push(error);
        });

        // Validation des coordonnées
        if (data.longitude || data.latitude) {
            const coordErrors = this.coordinates(data.latitude, data.longitude);
            errors.push(...coordErrors);
        }

        // Validation des nombres
        if (data.aire_longueur !== undefined) {
            const error = this.number(data.aire_longueur, 'Longueur', 0);
            if (error) errors.push(error);
        }

        if (data.aire_largeur !== undefined) {
            const error = this.number(data.aire_largeur, 'Largeur', 0);
            if (error) errors.push(error);
        }

        if (data.capacite_max !== undefined) {
            const error = this.number(data.capacite_max, 'Capacité maximale', 0);
            if (error) errors.push(error);
        }

        // Validation URL
        if (data.equip_url) {
            const error = this.url(data.equip_url);
            if (error) errors.push(error);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};
```

---

*[Le document continue avec les sections Tests, Déploiement, Performance, Monitoring et Dépannage...]*