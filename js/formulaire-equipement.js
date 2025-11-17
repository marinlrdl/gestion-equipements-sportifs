/**
 * js/formulaire-equipement.js
 * Gestion du formulaire d'ajout/modification d'équipement
 * (Utilise le schéma de données mis à jour)
 */

let modeEdition = false;
let equipementId = null;
let utilisateurConnecte = null;
let miniCarte;
let marqueurCarte;

/**
 * Initialise le formulaire
 */
async function initialiserFormulaire() {
  utilisateurConnecte = await obtenirUtilisateurConnecte();
  
  if (!utilisateurConnecte) {
    window.location.href = 'connexion.html';
    return;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  equipementId = urlParams.get('id');
  
  if (equipementId) {
    modeEdition = true;
    document.getElementById('titre-formulaire').textContent = 'Modifier un équipement';
    await chargerEquipement(equipementId);
  } else {
    // Mode création
    initialiserCarteMini();
    // Pré-remplir avec les données de l'utilisateur si disponible
    if (utilisateurConnecte.code_commune) {
      document.getElementById('commune_code').value = utilisateurConnecte.code_commune;
      document.getElementById('commune_nom').value = utilisateurConnecte.commune_nom || '';
    }
    if (utilisateurConnecte.code_departement) {
      document.getElementById('departement_code').value = utilisateurConnecte.code_departement;
    }
    if (utilisateurConnecte.code_region) {
      document.getElementById('region_code').value = utilisateurConnecte.code_region;
    }
  }
}

/**
 * Charge un équipement existant pour modification
 */
async function chargerEquipement(id) {
  try {
    const { data, error } = await window.AppConfig.supabase
      .from('equipements')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      alert('Équipement non trouvé');
      window.location.href = 'equipements.html';
      return;
    }
    
    // Vérifier les permissions
    if (!verifierPermissionsModification(data)) {
      alert('Vous n\'avez pas les permissions pour modifier cet équipement');
      window.location.href = 'equipements.html';
      return;
    }
    
    // Remplir le formulaire
    remplirFormulaire(data);
    
    // Initialiser la carte avec les coordonnées existantes
    if (data.latitude && data.longitude) {
      initialiserCarteMini(data.latitude, data.longitude);
    } else {
      initialiserCarteMini();
    }
    
  } catch (erreur) {
    console.error('Erreur chargement équipement:', erreur);
    alert('Erreur lors du chargement de l\'équipement : ' + erreur.message);
    window.location.href = 'equipements.html';
  }
}

/**
 * Vérifie si l'utilisateur peut modifier l'équipement
 */
function verifierPermissionsModification(equipement) {
  const role = utilisateurConnecte.role;
  
  switch (role) {
    case 'administrateur':
      return true;
    case 'mairie':
      return equipement.commune_code === utilisateurConnecte.code_commune;
    case 'prefecture_departementale':
      return equipement.departement_code === utilisateurConnecte.code_departement;
    case 'prefecture_regionale':
      return equipement.region_code === utilisateurConnecte.code_region;
    default:
      return false;
  }
}

/**
 * Remplit le formulaire avec les données de l'équipement
 */
function remplirFormulaire(data) {
  const champs = {
    'equip_nom': data.equip_nom,
    'inst_nom': data.inst_nom,
    'equip_type_famille': data.equip_type_famille,
    'equip_type_name': data.equip_type_name,
    'inst_adresse': data.inst_adresse,
    'inst_cp': data.inst_cp,
    'commune_nom': data.commune_nom,
    'commune_code': data.commune_code,
    'departement_code': data.departement_code,
    'region_code': data.region_code,
    'latitude': data.latitude,
    'longitude': data.longitude,
    'equip_nature': data.equip_nature,
    'equip_sol': data.equip_sol,
    'aire_longueur': data.aire_longueur,
    'aire_largeur': data.aire_largeur,
    'aire_surface': data.aire_surface,
    'tribune_places_assises': data.tribune_places_assises,
    'vestiaires_sportifs_nb': data.vestiaires_sportifs_nb,
    'proprietaire_type': data.proprietaire_type,
    'gestionnaire_type': data.gestionnaire_type,
    'equip_url': data.equip_url,
    'equip_obs': data.equip_obs
  };
  
  // Remplir les champs texte
  Object.keys(champs).forEach(champ => {
    const element = document.getElementById(champ);
    if (element && champs[champ] !== null && champs[champ] !== undefined) {
      element.value = champs[champ];
    }
  });
  
  // Remplir les cases à cocher
  const checkboxes = [
    'aire_eclairage', 'douches_presence', 'sanitaires_presence',
    'access_pmr_aire', 'access_pmr_vestiaires', 'access_pmr_sanitaires',
    'equip_acces_libre'
  ];
  
  checkboxes.forEach(champ => {
    const element = document.getElementById(champ);
    if (element && data[champ] !== null && data[champ] !== undefined) {
      element.checked = data[champ] === true || data[champ] === 'true';
    }
  });
}

/**
 * Initialise la mini-carte Leaflet pour la sélection des coordonnées
 */
function initialiserCarteMini(lat = 46.6, lon = 1.88, zoom = 6) {
  const carteElement = document.getElementById('mini-carte-gps');
  if (!carteElement) {
    console.error('Element #mini-carte-gps non trouvé');
    return;
  }
  
  miniCarte = L.map('mini-carte-gps').setView([lat, lon], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(miniCarte);

  if (lat !== 46.6 || lon !== 1.88) {
    marqueurCarte = L.marker([lat, lon], { draggable: true }).addTo(miniCarte);
    marqueurCarte.on('dragend', mettreAJourChampsGPS);
  }

  miniCarte.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (!marqueurCarte) {
      marqueurCarte = L.marker([lat, lng], { draggable: true }).addTo(miniCarte);
      marqueurCarte.on('dragend', mettreAJourChampsGPS);
    } else {
      marqueurCarte.setLatLng([lat, lng]);
    }
    mettreAJourChampsGPS({ target: marqueurCarte });
  });
  
  console.log('🗺️ Mini-carte initialisée');
}

/**
 * Met à jour les champs Lat/Lon quand le marqueur est bougé
 */
function mettreAJourChampsGPS(event) {
  const position = event.target.getLatLng();
  const latInput = document.getElementById('latitude');
  const lngInput = document.getElementById('longitude');
  
  if (latInput) latInput.value = position.lat.toFixed(7);
  if (lngInput) lngInput.value = position.lng.toFixed(7);
}

/**
 * Calcule la capacité maximale selon le type et la surface
 */
function calculerCapaciteMax(surface, typeFamille) {
  if (!surface || surface <= 0) return 0;
  
  const densites = {
    'terrain_sport': 2.5,     // 2.5 m² par personne
    'salle_sport': 3,         // 3 m² par personne
    'piscine': 4,             // 4 m² par personne (bassins)
    'stade': 1,               // 1 m² par personne
    'complexe_sportif': 2.5   // 2.5 m² par personne
  };
  
  const densite = densites[typeFamille] || 2.5;
  return Math.floor(surface / densite);
}

/**
 * Soumet le formulaire (création ou modification)
 */
async function soumettreFormulaire(event) {
  event.preventDefault();
  
  // Récupérer les données du formulaire
  const donnees = {
    equip_nom: document.getElementById('equip_nom').value.trim(),
    inst_nom: document.getElementById('inst_nom').value.trim(),
    equip_type_famille: document.getElementById('equip_type_famille').value,
    equip_type_name: document.getElementById('equip_type_name').value.trim(),
    
    inst_adresse: document.getElementById('inst_adresse').value.trim(),
    inst_cp: document.getElementById('inst_cp').value.trim(),
    commune_nom: document.getElementById('commune_nom').value.trim(),
    commune_code: document.getElementById('commune_code').value.trim(),
    departement_code: document.getElementById('departement_code').value.trim(),
    region_code: document.getElementById('region_code').value.trim(),
    latitude: parseFloat(document.getElementById('latitude').value),
    longitude: parseFloat(document.getElementById('longitude').value),
    
    equip_nature: document.getElementById('equip_nature').value,
    equip_sol: document.getElementById('equip_sol').value,
    aire_longueur: parseInt(document.getElementById('aire_longueur').value) || null,
    aire_largeur: parseInt(document.getElementById('aire_largeur').value) || null,
    aire_surface: parseInt(document.getElementById('aire_surface').value) || null,
    
    aire_eclairage: document.getElementById('aire_eclairage').checked,
    tribune_places_assises: parseInt(document.getElementById('tribune_places_assises').value) || 0,
    vestiaires_sportifs_nb: parseInt(document.getElementById('vestiaires_sportifs_nb').value) || 0,
    douches_presence: document.getElementById('douches_presence').checked,
    sanitaires_presence: document.getElementById('sanitaires_presence').checked,
    
    access_pmr_aire: document.getElementById('access_pmr_aire').checked,
    access_pmr_vestiaires: document.getElementById('access_pmr_vestiaires').checked,
    access_pmr_sanitaires: document.getElementById('access_pmr_sanitaires').checked,

    proprietaire_type: document.getElementById('proprietaire_type').value,
    gestionnaire_type: document.getElementById('gestionnaire_type').value,
    equip_acces_libre: document.getElementById('equip_acces_libre').checked,
    
    equip_url: document.getElementById('equip_url').value.trim() || null,
    equip_obs: document.getElementById('equip_obs').value.trim() || null,
    
    capacite_max: calculerCapaciteMax(
      parseInt(document.getElementById('aire_surface').value),
      document.getElementById('equip_type_famille').value
    ),
    
    updated_at: new Date().toISOString(),
    updated_by: utilisateurConnecte.id
  };
  
  if (!validerFormulaire(donnees)) return;
  
  try {
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sauvegarde...';
    
    if (modeEdition) {
      const { error } = await window.AppConfig.supabase
        .from('equipements')
        .update(donnees)
        .eq('id', equipementId);
      if (error) throw error;
      alert('Équipement modifié avec succès');
    } else {
      donnees.equip_numero = genererNumeroUnique("EQ");
      donnees.inst_numero = genererNumeroUnique("IN");
      donnees.densite_actuelle = 0;
      donnees.created_at = new Date().toISOString();
      donnees.created_by = utilisateurConnecte.id;
      
      const { error } = await window.AppConfig.supabase
        .from('equipements')
        .insert([donnees]);
      if (error) throw error;
      alert('Équipement créé avec succès');
    }
    
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    window.location.href = 'equipements.html';
    
  } catch (erreur) {
    console.error('Erreur sauvegarde:', erreur);
    alert('Erreur lors de la sauvegarde : ' + erreur.message);
    
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sauvegarder';
    }
  }
}

/**
 * Valide le formulaire
 */
function validerFormulaire(donnees) {
  const erreurs = [];
  
  if (!donnees.equip_nom) {
    erreurs.push('Le nom de l\'équipement est obligatoire');
  }
  
  if (!donnees.inst_cp || donnees.inst_cp.length !== 5 || isNaN(donnees.inst_cp)) {
    erreurs.push('Code postal invalide (5 chiffres requis)');
  }
  
  if (!donnees.commune_code) {
    erreurs.push('Le code INSEE de la commune est obligatoire');
  }
  
  if (donnees.aire_surface && donnees.aire_surface < 0) {
    erreurs.push('La surface ne peut pas être négative');
  }
  
  if (donnees.aire_longueur && donnees.aire_longueur < 0) {
    erreurs.push('La longueur ne peut pas être négative');
  }
  
  if (donnees.aire_largeur && donnees.aire_largeur < 0) {
    erreurs.push('La largeur ne peut pas être négative');
  }
  
  if (donnees.latitude === 0 && donnees.longitude === 0) {
    erreurs.push('Les coordonnées GPS sont obligatoires');
  }
  
  if (donnees.latitude < -90 || donnees.latitude > 90) {
    erreurs.push('Latitude invalide (doit être entre -90 et 90)');
  }
  
  if (donnees.longitude < -180 || donnees.longitude > 180) {
    erreurs.push('Longitude invalide (doit être entre -180 et 180)');
  }
  
  if (erreurs.length > 0) {
    alert('Erreurs de validation :\n\n' + erreurs.join('\n'));
    return false;
  }
  
  return true;
}

/**
 * Génère un numéro unique
 */
function genererNumeroUnique(prefix) {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

/**
 * Calcul automatique de la surface à partir de la longueur et largeur
 */
function calculerSurface() {
  const longueur = parseFloat(document.getElementById('aire_longueur').value);
  const largeur = parseFloat(document.getElementById('aire_largeur').value);
  const surfaceField = document.getElementById('aire_surface');
  
  if (longueur && largeur && !isNaN(longueur) && !isNaN(largeur)) {
    const surface = longueur * largeur;
    surfaceField.value = Math.round(surface);
  }
}

/**
 * Recherche de commune par code postal
 */
async function rechercherCommune() {
  const codePostal = document.getElementById('inst_cp').value.trim();
  
  if (codePostal.length !== 5 || isNaN(codePostal)) {
    return;
  }
  
  try {
    const { data, error } = await window.AppConfig.supabase
      .from('communes')
      .select('*')
      .eq('code_postal', codePostal)
      .limit(10);
      
    if (error) throw error;
    
    if (data && data.length > 0) {
      const commune = data[0]; // Prendre la première correspondance
      
      // Remplir automatiquement les champs
      document.getElementById('commune_nom').value = commune.nom;
      document.getElementById('commune_code').value = commune.code_insee;
      document.getElementById('departement_code').value = commune.departement_code;
      document.getElementById('region_code').value = commune.region_code;
      
      // Centrer la carte sur la commune si pas de coordonnées
      const latInput = document.getElementById('latitude');
      const lngInput = document.getElementById('longitude');
      
      if ((!latInput.value || latInput.value === '0') && 
          (!lngInput.value || lngInput.value === '0') &&
          commune.latitude && commune.longitude) {
        initialiserCarteMini(commune.latitude, commune.longitude, 12);
      }
    }
  } catch (erreur) {
    console.error('Erreur recherche commune:', erreur);
  }
}

/**
 * Vérification en temps réel du code postal
 */
function verifierCodePostal() {
  const codePostal = document.getElementById('inst_cp').value.trim();
  const field = document.getElementById('inst_cp');
  
  if (codePostal.length === 5 && !isNaN(codePostal)) {
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
  } else {
    field.classList.remove('is-valid');
    field.classList.add('is-invalid');
  }
}

/**
 * Initialise les event listeners
 */
function initialiserEventListeners() {
  // Soumission du formulaire
  const form = document.getElementById('equipementForm');
  if (form) {
    form.addEventListener('submit', soumettreFormulaire);
  }
  
  // Calcul automatique de surface
  const longueurField = document.getElementById('aire_longueur');
  const largeurField = document.getElementById('aire_largeur');
  
  if (longueurField) {
    longueurField.addEventListener('input', calculerSurface);
  }
  
  if (largeurField) {
    largeurField.addEventListener('input', calculerSurface);
  }
  
  // Recherche de commune par code postal
  const cpField = document.getElementById('inst_cp');
  if (cpField) {
    cpField.addEventListener('input', Utils.debounce(rechercherCommune, 500));
    cpField.addEventListener('input', verifierCodePostal);
  }
  
  // Géolocalisation pour obtenir les coordonnées
  const geolocBtn = document.getElementById('btn-geoloc');
  if (geolocBtn) {
    geolocBtn.addEventListener('click', obtenirLocalisation);
  }
}

/**
 * Obtient la géolocalisation et met à jour la carte
 */
function obtenirLocalisation() {
  if (!navigator.geolocation) {
    alert('La géolocalisation n\'est pas supportée par votre navigateur');
    return;
  }
  
  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #0055A4; color: white; padding: 10px 20px; border-radius: 4px;
    z-index: 10000; font-size: 14px;
  `;
  loadingMsg.textContent = 'Géolocalisation en cours...';
  document.body.appendChild(loadingMsg);
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      // Mettre à jour les champs
      document.getElementById('latitude').value = lat.toFixed(7);
      document.getElementById('longitude').value = lon.toFixed(7);
      
      // Mettre à jour la carte
      if (miniCarte) {
        miniCarte.setView([lat, lon], 15);
        if (!marqueurCarte) {
          marqueurCarte = L.marker([lat, lon], { draggable: true }).addTo(miniCarte);
          marqueurCarte.on('dragend', mettreAJourChampsGPS);
        } else {
          marqueurCarte.setLatLng([lat, lon]);
        }
      }
      
      document.body.removeChild(loadingMsg);
      console.log(`📍 Position obtenue: ${lat}, ${lon}`);
    },
    (erreur) => {
      console.error('Erreur géolocalisation:', erreur);
      document.body.removeChild(loadingMsg);
      alert('Impossible d\'obtenir votre position: ' + erreur.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initialisation du formulaire équipement...');
  
  // Vérifier l'authentification
  if (!window.AuthModule?.isLoggedIn()) {
    window.location.href = 'connexion.html';
    return;
  }
  
  initialiserFormulaire();
  initialiserEventListeners();
  
  console.log('✅ Formulaire équipement initialisé avec succès');
});

// Export pour utilisation externe
window.FormulaireEquipement = {
  initialiserFormulaire,
  soumettreFormulaire,
  calculerSurface,
  rechercherCommune,
  obtenirLocalisation
};

console.log('📝 Module formulaire équipement chargé');