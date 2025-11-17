/**
 * Configuration Supabase - Équipements Sportifs
 * Configuration de la base de données et authentification
 */

// Configuration Supabase
const SUPABASE_URL = 'https://loxrfmbesnxkusdrhfvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveHJmbWJlc254a3VzZHJoZnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzc0NTQsImV4cCI6MjA3Nzc1MzQ1NH0.5FqYgUwc2gd9T5hyETBuSE88wIe8YzE3Yl2dIRWDqOs';

// Vérification que Supabase est disponible
if (typeof window.supabase === 'undefined') {
    console.error('Supabase client non chargé. Vérifiez que le script Supabase est inclus.');
}

// Initialisation du client Supabase
let supabase = null;

try {
    if (window.supabase && window.supabase.createClient) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Client Supabase initialisé avec succès');
    } else {
        console.warn('⚠️ Client Supabase non disponible - mode dégradé activé');
    }
} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Supabase:', error);
}

// Configuration de l'application
const APP_CONFIG = {
    // Informations générales
    name: 'Équipements Sportifs France',
    version: '1.0.0',
    description: 'Plateforme nationale de gestion des équipements sportifs français',
    
    // URLs et endpoints
    api: {
        baseUrl: SUPABASE_URL,
        anonKey: SUPABASE_ANON_KEY,
        endpoints: {
            equipements: '/rest/v1/equipements',
            communes: '/rest/v1/communes',
            types: '/rest/v1/types_equipements',
            activites: '/rest/v1/activites'
        }
    },
    
    // Configuration de l'interface
    ui: {
        theme: {
            primary: '#0055A4',      // Bleu France
            secondary: '#00A94F',    // Vert
            accent: '#FF6B35',       // Orange
            danger: '#E63946',       // Rouge
            success: '#00A94F',
            warning: '#FFC107',
            info: '#17A2B8'
        },
        breakpoints: {
            mobile: '768px',
            tablet: '1024px',
            desktop: '1200px'
        }
    },
    
    // Configuration des fonctionnalités
    features: {
        map: {
            enabled: true,
            provider: 'leaflet',
            defaultCenter: [46.603354, 1.888334], // Centre de la France
            defaultZoom: 6,
            maxZoom: 18,
            minZoom: 5
        },
        auth: {
            enabled: true,
            providers: ['email'],
            sessionTimeout: 24 * 60 * 60 * 1000 // 24 heures
        },
        export: {
            enabled: true,
            formats: ['csv', 'json', 'pdf']
        }
    },
    
    // Configuration des données
    data: {
        pageSize: 20,
        maxPageSize: 100,
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        retryAttempts: 3,
        retryDelay: 1000 // 1 seconde
    },
    
    // Messages et textes
    messages: {
        fr: {
            errors: {
                network: 'Erreur de connexion réseau',
                unauthorized: 'Accès non autorisé',
                notFound: 'Ressource non trouvée',
                serverError: 'Erreur serveur',
                validation: 'Erreur de validation'
            },
            success: {
                saved: 'Données sauvegardées avec succès',
                deleted: 'Élément supprimé avec succès',
                updated: 'Données mises à jour avec succès'
            },
            loading: 'Chargement en cours...',
            noData: 'Aucune donnée disponible',
            confirm: 'Êtes-vous sûr ?',
            cancel: 'Annuler',
            confirmAction: 'Confirmer'
        }
    }
};

// Configuration des tables Supabase
const TABLES = {
    equipements: {
        name: 'equipements',
        schema: {
            equip_numero: 'VARCHAR(255) PRIMARY KEY',
            inst_numero: 'VARCHAR(255)',
            equip_nom: 'VARCHAR(255) NOT NULL',
            inst_nom: 'VARCHAR(255)',
            date_enquete: 'DATE',
            date_creation_fiche: 'DATE',
            inst_adresse: 'TEXT',
            inst_cp: 'VARCHAR(10)',
            commune_nom: 'VARCHAR(255)',
            commune_code: 'VARCHAR(10)',
            departement_nom: 'VARCHAR(255)',
            departement_code: 'VARCHAR(10)',
            region_nom: 'VARCHAR(255)',
            region_code: 'VARCHAR(10)',
            epci_nom: 'VARCHAR(255)',
            epci_insee: 'VARCHAR(10)',
            longitude: 'DECIMAL(10, 7)',
            latitude: 'DECIMAL(10, 7)',
            equip_type_name: 'VARCHAR(255)',
            equip_type_famille: 'VARCHAR(255)',
            equip_nature: 'VARCHAR(255)',
            equip_sol: 'VARCHAR(255)',
            annee_mise_en_service: 'INTEGER',
            aire_longueur: 'DECIMAL(10, 2)',
            aire_largeur: 'DECIMAL(10, 2)',
            aire_hauteur: 'DECIMAL(10, 2)',
            aire_surface: 'DECIMAL(10, 2)',
            aire_eclairage: 'BOOLEAN',
            tribune_places_assises: 'INTEGER',
            vestiaires_sportifs_nb: 'INTEGER',
            vestiaires_arbitres_nb: 'INTEGER',
            douches_presence: 'BOOLEAN',
            sanitaires_presence: 'BOOLEAN',
            access_pmr_global: 'VARCHAR(255)',
            access_sensoriel_global: 'VARCHAR(255)',
            access_pmr_accueil: 'BOOLEAN',
            access_pmr_aire: 'BOOLEAN',
            access_pmr_cheminements: 'BOOLEAN',
            access_pmr_douches: 'BOOLEAN',
            access_pmr_sanitaires: 'BOOLEAN',
            access_pmr_tribunes: 'BOOLEAN',
            access_pmr_vestiaires: 'BOOLEAN',
            proprietaire_type: 'VARCHAR(255)',
            gestionnaire_type: 'VARCHAR(255)',
            equip_acces_libre: 'BOOLEAN',
            ouverture_saisonniere: 'BOOLEAN',
            equip_url: 'TEXT',
            equip_obs: 'TEXT',
            inst_obs: 'TEXT',
            activites: 'TEXT[]',
            densite_actuelle: 'INTEGER DEFAULT 0',
            capacite_max: 'INTEGER'
        }
    },
    communes: {
        name: 'communes',
        schema: {
            code_insee: 'VARCHAR(10) PRIMARY KEY',
            nom: 'VARCHAR(255) NOT NULL',
            code_postal: 'VARCHAR(10)',
            departement_code: 'VARCHAR(10)',
            region_code: 'VARCHAR(10)',
            longitude: 'DECIMAL(10, 7)',
            latitude: 'DECIMAL(10, 7)'
        }
    },
    types_equipements: {
        name: 'types_equipements',
        schema: {
            id: 'SERIAL PRIMARY KEY',
            nom: 'VARCHAR(255) UNIQUE NOT NULL',
            famille: 'VARCHAR(255)',
            created_at: 'TIMESTAMP DEFAULT NOW()'
        }
    },
    activites: {
        name: 'activites',
        schema: {
            id: 'SERIAL PRIMARY KEY',
            nom: 'VARCHAR(255) UNIQUE NOT NULL',
            created_at: 'TIMESTAMP DEFAULT NOW()'
        }
    }
};

// Configuration des politiques RLS (Row Level Security)
const RLS_POLICIES = {
    equipements: {
        public: 'Equipements sont publics',
        admin: 'Admins peuvent tout'
    }
};

// Fonctions utilitaires pour la configuration
const ConfigUtils = {
    /**
     * Récupère la configuration Supabase
     */
    getSupabaseConfig() {
        return {
            url: SUPABASE_URL,
            key: SUPABASE_ANON_KEY,
            client: supabase
        };
    },
    
    /**
     * Récupère la configuration de l'application
     */
    getAppConfig() {
        return APP_CONFIG;
    },
    
    /**
     * Récupère la configuration d'une table
     */
    getTableConfig(tableName) {
        return TABLES[tableName];
    },
    
    /**
     * Vérifie si une fonctionnalité est activée
     */
    isFeatureEnabled(featureName) {
        return APP_CONFIG.features[featureName]?.enabled || false;
    },
    
    /**
     * Récupère un message dans la langue spécifiée
     */
    getMessage(key, lang = 'fr') {
        const keys = key.split('.');
        let message = APP_CONFIG.messages[lang];
        
        for (const k of keys) {
            message = message?.[k];
        }
        
        return message || key;
    },
    
    /**
     * Teste la connexion à Supabase
     */
    async testConnection() {
        if (!supabase) {
            return { success: false, error: 'Client Supabase non initialisé' };
        }
        
        try {
            const { data, error } = await supabase
                .from('equipements')
                .select('count')
                .limit(1);
            
            if (error) {
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        supabase,
        APP_CONFIG,
        TABLES,
        RLS_POLICIES,
        ConfigUtils
    };
}

// Export global pour utilisation dans le navigateur
window.AppConfig = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    supabase,
    APP_CONFIG,
    TABLES,
    RLS_POLICIES,
    ConfigUtils
};

console.log('📋 Configuration chargée:', {
    app: APP_CONFIG.name,
    version: APP_CONFIG.version,
    supabase: SUPABASE_URL ? '✅ Configuré' : '❌ Non configuré'
});