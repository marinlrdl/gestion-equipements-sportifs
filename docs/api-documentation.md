# Documentation API
## Application de Gestion des Équipements Sportifs

### 📋 Table des Matières

1. [Configuration et Authentification](#configuration-et-authentification)
2. [Endpoints Supabase](#endpoints-supabase)
3. [APIs d'Équipements](#apis-déquipements)
4. [APIs de Densité](#apis-de-densité)
5. [APIs d'Authentification](#apis-dauthentification)
6. [APIs de Géolocalisation](#apis-de-géolocalisation)
7. [APIs de Photos](#apis-de-photos)
8. [APIs de Contact](#apis-de-contact)
9. [APIs d'Administration](#apis-dadministration)
10. [Fonctions Utilitaires](#fonctions-utilitaires)
11. [Gestion des Erreurs](#gestion-des-erreurs)
12. [Exemples d'Utilisation](#exemples-dutilisation)

---

## Configuration et Authentification

### Configuration Supabase

#### Initialisation du Client

```javascript
// Import et configuration
import { createClient } from '@supabase/supabase-js';

const supabaseConfig = {
    url: 'https://votre-projet.supabase.co',
    key: 'votre-cle-anon-publique',
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

export const supabase = createClient(supabaseConfig.url, supabaseConfig.key, supabaseConfig.auth);
```

#### Variables d'Environnement

```bash
# .env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_KEY=votre_cle_service_privee
```

### Authentification

#### Configuration des Headers

Toutes les requêtes authentifiées doivent inclure :
- `Authorization: Bearer <jwt_token>`
- `apikey: <supabase_anon_key>`
- `Content-Type: application/json`

#### Session Management

```javascript
// Récupération de la session active
const { data: { session }, error } = await supabase.auth.getSession();

// Écoute des changements d'authentification
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session);
});
```

---

## Endpoints Supabase

### Auth API

#### Sign In

**Endpoint**: `POST /auth/v1/token?grant_type=password`

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
    email: 'utilisateur@example.com',
    password: 'motdepasse123'
});
```

**Réponse**:
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1640995200,
    "refresh_token": "v1_refresh_token",
    "user": {
        "id": "uuid-utilisateur",
        "email": "utilisateur@example.com",
        "created_at": "2023-01-01T00:00:00Z"
    }
}
```

#### Sign Up

**Endpoint**: `POST /auth/v1/signup`

```javascript
const { data, error } = await supabase.auth.signUp({
    email: 'nouveau@example.com',
    password: 'motdepasse123',
    options: {
        data: {
            nom_complet: 'Nom Complet',
            fonction: 'Maire',
            commune_code: '12345'
        }
    }
});
```

**Réponse**:
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1640995200,
    "refresh_token": "v1_refresh_token",
    "user": {
        "id": "uuid-utilisateur",
        "email": "nouveau@example.com",
        "email_confirmed_at": null,
        "created_at": "2023-01-01T00:00:00Z"
    }
}
```

#### Sign Out

**Endpoint**: `POST /auth/v1/logout`

```javascript
const { error } = await supabase.auth.signOut();
```

#### Reset Password

**Endpoint**: `POST /auth/v1/recover`

```javascript
const { error } = await supabase.auth.resetPasswordForEmail('utilisateur@example.com');
```

### Database API

#### Base URL

```
https://votre-projet.supabase.co/rest/v1/
```

#### Headers Requis

```
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
Content-Type: application/json
Prefer: return=representation
```

---

## APIs d'Équipements

### GET - Liste des Équipements

**Endpoint**: `GET /equipements`

**Paramètres de Query**:
- `select` : Colonnes à sélectionner (défaut: `*`)
- `eq` : Égalité (`commune_code=eq.12345`)
- `neq` : Inégalité (`type=neq.Tennis`)
- `gt` : Supérieur (`capacite_max=gt.100`)
- `gte` : Supérieur ou égal
- `lt` : Inférieur
- `lte` : Inférieur ou égal
- `like` : Recherche textuelle (`nom=like.*football*`)
- `ilike` : Recherche textuelle insensible à la casse
- `in` : Dans une liste (`type=in.(Football,Tennis)`)
- `order` : Tri (`order=updated_at.desc`)
- `limit` : Limite (`limit=50`)
- `offset` : Décalage (`offset=100`)

**Exemple de Requête**:

```javascript
// Récupération avec filtres
const { data, error, count } = await supabase
    .from('equipements')
    .select('*', { count: 'exact' })
    .eq('commune_code', '12345')
    .eq('equip_type_name', 'Terrain de football')
    .gte('capacite_max', 50)
    .order('updated_at', { ascending: false })
    .range(0, 49); // Pagination

console.log(data.length, count);
```

**Réponse**:
```json
[
    {
        "equip_numero": "EQ001",
        "equip_nom": "Terrain de football principal",
        "commune_code": "12345",
        "commune_nom": "Ma Commune",
        "equip_type_name": "Terrain de football",
        "latitude": 46.603354,
        "longitude": 1.888334,
        "densite_actuelle": 15,
        "capacite_max": 50,
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-12-01T10:30:00Z"
    }
]
```

### POST - Création d'Équipement

**Endpoint**: `POST /equipements`

**Body**:
```json
{
    "equip_numero": "EQ001",
    "equip_nom": "Nouveau terrain de tennis",
    "commune_code": "12345",
    "departement_code": "12",
    "region_code": "01",
    "equip_type_name": "Court de tennis",
    "equip_type_famille": "Équipement tennis",
    "latitude": 46.603354,
    "longitude": 1.888334,
    "aire_longueur": 23.77,
    "aire_largeur": 8.23,
    "capacite_max": 4,
    "equip_acces_libre": true,
    "access_pmr_global": "partiellement_accessible"
}
```

**Exemple**:
```javascript
const { data, error } = await supabase
    .from('equipements')
    .insert([nouvelEquipement])
    .select()
    .single();

if (error) {
    console.error('Erreur création:', error);
    return;
}

console.log('Équipement créé:', data);
```

### PATCH - Mise à Jour d'Équipement

**Endpoint**: `PATCH /equipements?equip_numero=eq.EQ001`

**Body** (champs à modifier uniquement):
```json
{
    "equip_nom": "Terrain de tennis rénové",
    "densite_actuelle": 8,
    "updated_at": "2023-12-01T15:45:00Z"
}
```

**Exemple**:
```javascript
const { data, error } = await supabase
    .from('equipements')
    .update({
        equip_nom: 'Terrain rénové',
        densite_actuelle: 12,
        updated_at: new Date().toISOString()
    })
    .eq('equip_numero', 'EQ001')
    .select()
    .single();
```

### DELETE - Suppression d'Équipement

**Endpoint**: `DELETE /equipements?equip_numero=eq.EQ001`

**Exemple**:
```javascript
const { error } = await supabase
    .from('equipements')
    .delete()
    .eq('equip_numero', 'EQ001');

if (error) {
    console.error('Erreur suppression:', error);
}
```

### Recherche Géospatiale

**Endpoint**: `POST /rest/v1/rpc/search_equipements_proximite`

**Fonction PostgreSQL**:
```sql
search_equipements_proximite(user_lat, user_lng, radius_km, limit_count)
```

**Exemple**:
```javascript
const { data, error } = await supabase
    .rpc('search_equipements_proximite', {
        user_lat: 46.603354,
        user_lng: 1.888334,
        radius_km: 25, // Rayon de 25km
        limit_count: 50
    });

console.log('Équipements proches:', data);
```

**Réponse**:
```json
[
    {
        "equip_numero": "EQ001",
        "equip_nom": "Terrain de football",
        "commune_nom": "Commune proche",
        "distance_km": 5.2,
        "longitude": 1.920000,
        "latitude": 46.650000
    }
]
```

---

## APIs de Densité

### GET - Historique des Densités

**Endpoint**: `GET /historique_densite`

**Paramètres**:
```javascript
// Récupération de l'historique d'un équipement
const { data, error } = await supabase
    .from('historique_densite')
    .select('*')
    .eq('equipement_id', 'EQ001')
    .gte('created_at', '2023-12-01T00:00:00Z')
    .order('created_at', { ascending: true });
```

**Réponse**:
```json
[
    {
        "id": 1,
        "equipement_id": "EQ001",
        "densite": 15,
        "capacite_max": 50,
        "pourcentage_occupation": 30.0,
        "conditions_meteo": "beau",
        "commentaire": "Soirée animée",
        "created_at": "2023-12-01T18:00:00Z"
    }
]
```

### POST - Nouvelle Mesure de Densité

**Endpoint**: `POST /historique_densite`

**Body**:
```json
{
    "equipement_id": "EQ001",
    "densite": 18,
    "capacite_max": 50,
    "conditions_meteo": "nuageux",
    "commentaire": "Mesure du soir",
    "created_by": "uuid-utilisateur"
}
```

**Exemple**:
```javascript
// Mise à jour de la densité avec historique
async function mettreAJourDensite(equipementId, nouvelleDensite) {
    // 1. Récupérer l'équipement pour obtenir la capacité
    const { data: equipement, error: fetchError } = await supabase
        .from('equipements')
        .select('capacite_max')
        .eq('equip_numero', equipementId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Mettre à jour la densité actuelle
    const { error: updateError } = await supabase
        .from('equipements')
        .update({ 
            densite_actuelle: nouvelleDensite,
            updated_at: new Date().toISOString()
        })
        .eq('equip_numero', equipementId);

    if (updateError) throw updateError;

    // 3. Enregistrer dans l'historique
    const { error: historyError } = await supabase
        .from('historique_densite')
        .insert([{
            equipement_id: equipementId,
            densite: nouvelleDensite,
            capacite_max: equipement.capacite_max,
            created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

    if (historyError) throw historyError;

    return { success: true };
}
```

---

## APIs d'Authentification

### GET - Profil Utilisateur

**Endpoint**: `GET /user_profiles?id=eq.{user_id}`

**Exemple**:
```javascript
const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
```

**Réponse**:
```json
{
    "id": "uuid-utilisateur",
    "nom_complet": "Jean Dupont",
    "fonction": "Maire",
    "role": "mairie",
    "commune_code": "12345",
    "commune_nom": "Ma Commune",
    "departement_code": "12",
    "region_code": "01",
    "actif": true,
    "derniere_connexion": "2023-12-01T10:30:00Z",
    "created_at": "2023-01-01T00:00:00Z"
}
```

### POST - Création de Profil

**Endpoint**: `POST /user_profiles`

**Body**:
```json
{
    "id": "uuid-nouvel-utilisateur",
    "nom_complet": "Marie Martin",
    "fonction": "Secrétaire de mairie",
    "role": "mairie",
    "commune_code": "12345",
    "commune_nom": "Ma Commune",
    "departement_code": "12",
    "region_code": "01"
}
```

---

## APIs de Géolocalisation

### Calcul de Distance (Haversine)

**Fonction JavaScript**:
```javascript
// js/distance.js
function calculerDistanceHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Utilisation
const distance = calculerDistanceHaversine(46.603354, 1.888334, 46.650000, 1.920000);
console.log(`Distance: ${distance.toFixed(2)} km`);
```

### Géolocalisation Utilisateur

**API Géolocalisation**:
```javascript
function obtenirPositionActuelle() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Géolocalisation non supportée'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                reject(new Error(`Erreur géolocalisation: ${error.message}`));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

// Utilisation
try {
    const position = await obtenirPositionActuelle();
    console.log('Position:', position);
} catch (error) {
    console.error('Impossible d\'obtenir la position:', error);
}
```

---

## APIs de Photos

### Upload de Photo

**Endpoint Storage**: `POST /storage/v1/object/{bucket}/{path}`

**Exemple**:
```javascript
// js/photos.js
async function uploadPhoto(file, equipementId) {
    const fileName = `${equipementId}/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
        .from('photos-equipements')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    // Génération de l'URL publique
    const { data: urlData } = supabase.storage
        .from('photos-equipements')
        .getPublicUrl(fileName);

    return {
        path: data.path,
        publicUrl: urlData.publicUrl
    };
}

// Utilisation
const photoFile = document.getElementById('photo-input').files[0];
try {
    const result = await uploadPhoto(photoFile, 'EQ001');
    console.log('Photo uploadée:', result.publicUrl);
} catch (error) {
    console.error('Erreur upload:', error);
}
```

### Récupération de Photos

**Endpoint**: `GET /photos_equipements`

```javascript
async function obtenirPhotosEquipement(equipementId) {
    const { data, error } = await supabase
        .from('photos_equipements')
        .select('*')
        .eq('equipement_id', equipementId)
        .eq('principal', false)
        .order('ordre_affichage', { ascending: true });

    if (error) throw error;

    return data;
}
```

### Suppression de Photo

**Endpoint**: `DELETE /storage/v1/object/{bucket}/{path}`

```javascript
async function supprimerPhoto(nomFichier) {
    const { error } = await supabase.storage
        .from('photos-equipements')
        .remove([nomFichier]);

    if (error) throw error;

    // Supprimer aussi de la base de données
    const { error: dbError } = await supabase
        .from('photos_equipements')
        .delete()
        .eq('nom_fichier', nomFichier);

    if (dbError) throw dbError;
}
```

---

## APIs de Contact

### GET - Liste des Contacts

**Endpoint**: `GET /contacts`

**Filtres disponibles**:
```javascript
const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('statut', 'nouveau') // ou 'en_cours', 'traite'
    .eq('equipement_id', 'EQ001') // Contact pour un équipement
    .order('created_at', { ascending: false })
    .range(0, 49);
```

**Réponse**:
```json
[
    {
        "id": 1,
        "equipement_id": "EQ001",
        "nom": "Jean Dupont",
        "email": "jean.dupont@email.com",
        "telephone": "0123456789",
        "sujet": "Question sur la réservation",
        "message": "Bonjour, je souhaiterais réserver ce terrain...",
        "type_demande": "reservation",
        "statut": "nouveau",
        "priorite": "normale",
        "created_at": "2023-12-01T10:30:00Z"
    }
]
```

### POST - Nouveau Contact

**Endpoint**: `POST /contacts`

**Body**:
```json
{
    "equipement_id": "EQ001",
    "nom": "Marie Martin",
    "email": "marie.martin@email.com",
    "telephone": "0987654321",
    "commune_residence": "12345",
    "sujet": "Demande de réservation",
    "message": "Je souhaiterais réserver ce terrain pour...",
    "type_demande": "reservation"
}
```

### PATCH - Mise à Jour du Statut

```javascript
async function traiterContact(contactId, reponse, statut = 'traite') {
    const { data, error } = await supabase
        .from('contacts')
        .update({
            statut: statut,
            reponse: reponse,
            date_reponse: new Date().toISOString(),
            repondu_par: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', contactId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
```

---

## APIs d'Administration

### GET - Utilisateurs

**Endpoint**: `GET /user_profiles`

```javascript
async function obtenirTousUtilisateurs() {
    const { data, error } = await supabase
        .from('user_profiles')
        .select(`
            *,
            auth.users!inner(email, created_at)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
```

### POST - Création d'Utilisateur

**Endpoint Admin**: `POST /auth/v1/admin/users`

```javascript
async function creerUtilisateurAdmin(userData) {
    const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
            nom_complet: userData.nom_complet,
            fonction: userData.fonction
        }
    });

    if (error) throw error;

    // Créer le profil
    const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
            id: data.user.id,
            nom_complet: userData.nom_complet,
            fonction: userData.fonction,
            role: userData.role,
            commune_code: userData.commune_code,
            departement_code: userData.departement_code,
            region_code: userData.region_code
        }]);

    if (profileError) throw profileError;

    return data;
}
```

### Statistiques Système

**Vues Matérialisées**:

```javascript
async function obtenirStatistiques() {
    // Statistiques des équipements
    const { data: statsEquipements, error: statsError } = await supabase
        .from('stats_equipements')
        .select('*');

    // Nombre total d'équipements
    const { count: totalEquipements, error: countError } = await supabase
        .from('equipements')
        .select('*', { count: 'exact', head: true });

    // Utilisateurs actifs
    const { count: totalUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('actif', true);

    return {
        totalEquipements,
        totalUsers,
        statsEquipements
    };
}
```

---

## Fonctions Utilitaires

### Formatage des Données

**js/utils/formatters.js**:
```javascript
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
    }
};
```

### Validation des Données

**js/utils/validators.js**:
```javascript
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

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};
```

---

## Gestion des Erreurs

### Codes d'Erreur Courants

**Supabase Errors**:
- `PGRST116` : Aucune donnée trouvée
- `23505` : Contrainte d'unicité violée
- `23503` : Contrainte de clé étrangère violée
- `42501` : Permission refusée (RLS)
- `42P01` : Table non existante

**Gestion d'Erreur Standardisée**:
```javascript
class ApiError extends Error {
    constructor(message, code, status, details = null) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
    }
}

async function apiCall(apiFunction) {
    try {
        const result = await apiFunction();
        return { data: result.data, error: null };
    } catch (error) {
        console.error('API Error:', error);
        
        let apiError;
        if (error.code === 'PGRST116') {
            apiError = new ApiError('Aucune donnée trouvée', error.code, 404);
        } else if (error.code === '23505') {
            apiError = new ApiError('Donnée déjà existante', error.code, 409);
        } else if (error.message.includes('permission')) {
            apiError = new ApiError('Permission refusée', 'PERMISSION_DENIED', 403);
        } else {
            apiError = new ApiError('Erreur serveur', 'SERVER_ERROR', 500);
        }
        
        return { data: null, error: apiError };
    }
}
```

### Retry Logic

```javascript
async function apiCallWithRetry(apiFunction, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiFunction();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            
            // Attendre avant de réessayer
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
}
```

---

## Exemples d'Utilisation

### Exemple Complet : CRUD Équipement

```javascript
class EquipementService {
    constructor() {
        this.supabase = supabase;
    }

    // Création complète d'un équipement
    async creerEquipement(equipementData) {
        // 1. Validation
        const validation = Validators.validateEquipement(equipementData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // 2. Génération d'un numéro unique si non fourni
        if (!equipementData.equip_numero) {
            equipementData.equip_numero = this.genererNumeroEquipement();
        }

        // 3. Calcul de la capacité maximale si non fournie
        if (!equipementData.capacite_max) {
            equipementData.capacite_max = this.calculerCapaciteMax(equipementData);
        }

        // 4. Création de l'équipement
        const { data, error } = await this.supabase
            .from('equipements')
            .insert([equipementData])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Un équipement avec ce numéro existe déjà');
            }
            throw new Error(`Erreur création: ${error.message}`);
        }

        return data;
    }

    // Récupération avec filtres de sécurité
    async obtenirEquipements(filters = {}) {
        // Obtenir l'utilisateur courant
        const { data: { user } } = await this.supabase.auth.getUser();
        const { data: profile } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // Construire la requête selon les permissions
        let query = this.supabase.from('equipements').select('*');

        // Appliquer les filtres de périmètre selon le rôle
        switch (profile.role) {
            case 'mairie':
                query = query.eq('commune_code', profile.commune_code);
                break;
            case 'prefecture_departementale':
                query = query.eq('departement_code', profile.departement_code);
                break;
            case 'prefecture_regionale':
                query = query.eq('region_code', profile.region_code);
                break;
            case 'administrateur':
                // Pas de filtre pour les admins
                break;
        }

        // Appliquer les filtres supplémentaires
        if (filters.type) {
            query = query.eq('equip_type_name', filters.type);
        }

        if (filters.search) {
            query = query.or(`equip_nom.ilike.%${filters.search}%,inst_nom.ilike.%${filters.search}%`);
        }

        // Tri et pagination
        query = query
            .order('updated_at', { ascending: false })
            .range(0, 99);

        const { data, error } = await query;

        if (error) {
            throw new Error(`Erreur récupération: ${error.message}`);
        }

        return data;
    }

    // Mise à jour avec vérification de permissions
    async mettreAJourEquipement(equipementId, updates) {
        // 1. Vérifier que l'équipement existe
        const { data: equipement, error: fetchError } = await this.supabase
            .from('equipements')
            .select('*')
            .eq('equip_numero', equipementId)
            .single();

        if (fetchError) {
            throw new Error('Équipement non trouvé');
        }

        // 2. Vérifier les permissions
        const { data: { user } } = await this.supabase.auth.getUser();
        const { data: profile } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!this.peutModifierEquipement(equipement, profile)) {
            throw new Error('Permission refusée');
        }

        // 3. Mise à jour
        const { data, error } = await this.supabase
            .from('equipements')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
            .eq('equip_numero', equipementId)
            .select()
            .single();

        if (error) {
            throw new Error(`Erreur mise à jour: ${error.message}`);
        }

        return data;
    }

    peutModifierEquipement(equipement, profile) {
        switch (profile.role) {
            case 'mairie':
                return equipement.commune_code === profile.commune_code;
            case 'prefecture_departementale':
                return equipement.departement_code === profile.departement_code;
            case 'prefecture_regionale':
                return equipement.region_code === profile.region_code;
            case 'administrateur':
                return true;
            default:
                return false;
        }
    }

    genererNumeroEquipement() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `EQ_${timestamp}_${random}`.toUpperCase();
    }

    calculerCapaciteMax(equipement) {
        // Logique de calcul basée sur le type et la surface
        const densitesStandard = {
            'Terrain de football': 50,
            'Court de tennis': 4,
            'Piscine': 100,
            'Gymnase': 30
        };

        const densite = densitesStandard[equipement.equip_type_name] || 10;
        const surface = equipement.aire_surface || (equipement.aire_longueur * equipement.aire_largeur) || 100;

        return Math.round(densite * (surface / 100));
    }
}

// Utilisation
const equipementService = new EquipementService();

// Créer un équipement
try {
    const nouvelEquipement = {
        equip_nom: 'Terrain de tennis municipal',
        commune_code: '12345',
        equip_type_name: 'Court de tennis',
        latitude: 46.603354,
        longitude: 1.888334,
        aire_longueur: 23.77,
        aire_largeur: 8.23
    };

    const equipement = await equipementService.creerEquipement(nouvelEquipement);
    console.log('Équipement créé:', equipement);

} catch (error) {
    console.error('Erreur:', error.message);
}

// Récupérer les équipements
try {
    const equipements = await equipementService.obtenirEquipements({
        type: 'Court de tennis',
        search: 'tennis'
    });
    console.log(`${equipements.length} équipements trouvés`);

} catch (error) {
    console.error('Erreur:', error.message);
}
```

### Exemple : Recherche Géospatiale

```javascript
class GeolocationService {
    constructor() {
        this.supabase = supabase;
    }

    async rechercherEquipementsProches(userLat, userLng, options = {}) {
        const {
            rayonKm = 25,
            limite = 50,
            typeEquipement = null,
            prioriserDisponibilite = true
        } = options;

        try {
            // Appel à la fonction PostgreSQL de recherche
            const { data: equipementsProches, error } = await this.supabase
                .rpc('search_equipements_proximite', {
                    user_lat: userLat,
                    user_lng: userLng,
                    radius_km: rayonKm,
                    limit_count: limite
                });

            if (error) throw error;

            // Filtrage supplémentaire si nécessaire
            let resultats = equipementsProches;

            if (typeEquipement) {
                resultats = resultats.filter(eq => 
                    eq.equip_type_name === typeEquipement
                );
            }

            // Enrichissement avec les données complètes
            const equipementIds = resultats.map(eq => eq.equip_numero);
            const { data: equipementsDetails } = await this.supabase
                .from('equipements')
                .select('*')
                .in('equip_numero', equipementIds);

            // Fusion des données
            const equipementsComplets = resultats.map(proximite => {
                const details = equipementsDetails.find(d => 
                    d.equip_numero === proximite.equip_numero
                );
                return {
                    ...proximite,
                    details: details
                };
            });

            // Tri par priorité si demandé
            if (prioriserDisponibilite) {
                equipementsComplets.sort((a, b) => {
                    const tauxA = a.details.capacite_max > 0 
                        ? a.details.densite_actuelle / a.details.capacite_max 
                        : 1;
                    const tauxB = b.details.capacite_max > 0 
                        ? b.details.densite_actuelle / b.details.capacite_max 
                        : 1;
                    
                    // Priorité aux équipements moins occupés
                    return tauxA - tauxB;
                });
            }

            return equipementsComplets;

        } catch (error) {
            throw new Error(`Erreur recherche proximité: ${error.message}`);
        }
    }

    async calculerItineraire(lat1, lon1, lat2, lon2) {
        const distance = this.calculerDistanceHaversine(lat1, lon1, lat2, lon2);
        
        // Création d'un lien Google Maps
        const url = `https://www.google.com/maps/dir/${lat1},${lon1}/${lat2},${lon2}`;
        
        return {
            distance: distance,
            url: url,
            dureeEstimee: this.estimerDureeTrajet(distance)
        };
    }

    calculerDistanceHaversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    estimerDureeTrajet(distanceKm) {
        // Estimation basée sur une vitesse moyenne de 50 km/h
        const vitesseMoyenne = 50; // km/h
        const dureeHeures = distanceKm / vitesseMoyenne;
        
        if (dureeHeures < 1) {
            return `${Math.round(dureeHeures * 60)} minutes`;
        } else {
            const heures = Math.floor(dureeHeures);
            const minutes = Math.round((dureeHeures - heures) * 60);
            return `${heures}h${minutes.toString().padStart(2, '0')}`;
        }
    }
}

// Utilisation
const geoService = new GeolocationService();

// Recherche autour de l'utilisateur
try {
    const position = await navigator.geolocation.getCurrentPosition();
    
    const equipements = await geoService.rechercherEquipementsProches(
        position.coords.latitude,
        position.coords.longitude,
        {
            rayonKm: 30,
            limite: 20,
            typeEquipement: 'Terrain de football',
            prioriserDisponibilite: true
        }
    );

    console.log(`${equipements.length} équipements trouvés à proximité:`);
    equipements.forEach(eq => {
        console.log(`- ${eq.equip_nom} (${eq.distance_km.toFixed(1)}km)`);
    });

} catch (error) {
    console.error('Erreur recherche:', error.message);
}
```

---

*Documentation API - Version 1.0 - Novembre 2025*
*Application de Gestion des Équipements Sportifs*