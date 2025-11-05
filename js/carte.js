/**
 * js/carte.js
 * Gestion de la carte interactive Leaflet
 * (Utilise le schéma de données mis à jour)
 */

let carte;
let markersLayer;
let equipementsTous = []; // Cache global des équipements
let equipementsProches = []; // Cache pour géolocalisation

/**
 * Initialise la carte Leaflet
 */
function initialiserCarte() {
  carte = L.map('carte').setView([46.603354, 1.888334], 6);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(carte);
  
  markersLayer = L.markerClusterGroup({
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let className = 'marker-cluster-small';
      if (count < 10) {
        className = 'marker-cluster-small';
      } else if (count < 100) {
        className = 'marker-cluster-medium';
      } else {
        className = 'marker-cluster-large';
      }
      
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster ${className}`,
        iconSize: L.point(40, 40)
      });
    },
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true
  });
  carte.addLayer(markersLayer);
  
  // Event listeners pour la carte
  carte.on('zoomend moveend', function() {
    mettreAJourStatistiques();
  });
  
  chargerEquipements();
}

/**
 * Charge tous les équipements depuis Supabase
 */
async function chargerEquipements() {
  try {
    const loadingElement = document.getElementById('resultsList');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div class="loading-placeholder">
          <div class="loading-spinner"></div>
          <p>Chargement des équipements...</p>
        </div>
      `;
    }
    
    const { data, error } = await supabase
      .from('equipements')
      .select('id, equip_nom, inst_nom, inst_adresse, inst_cp, commune_nom, equip_type_name, equip_type_famille, access_pmr_global, longitude, latitude, densite_actuelle, capacite_max, activites')
      .not('longitude', 'is', null)
      .not('latitude', 'is', null)
      .limit(1000); // Limite pour les tests (peut être ajustée)
    
    if (error) {
      console.error('Erreur Supabase:', error);
      throw error;
    }
    
    equipementsTous = data || [];
    console.log(`✅ ${equipementsTous.length} équipements chargés`);
    
    afficherMarqueurs(equipementsTous);
    mettreAJourStatistiques();
    
    // Mettre à jour l'affichage des résultats
    afficherResultats(equipementsTous);
    
  } catch (erreur) {
    console.error('Erreur chargement équipements:', erreur);
    
    const errorElement = document.getElementById('resultsList');
    if (errorElement) {
      errorElement.innerHTML = `
        <div class="map-error">
          <div class="map-error-icon">❌</div>
          <div class="map-error-message">Erreur de chargement</div>
          <div class="map-error-help">${erreur.message}</div>
        </div>
      `;
    }
    
    alert('Erreur lors du chargement des équipements');
  }
}

/**
 * Affiche les marqueurs sur la carte
 */
function afficherMarqueurs(equipements) {
  markersLayer.clearLayers();
  
  equipements.forEach(equip => {
    const marqueur = L.marker([equip.latitude, equip.longitude]);
    const tauxOccupation = calculerTauxOccupation(equip);
    
    const popupHTML = `
      <div class="popup-equipement" style="min-width: 250px;">
        <h3 style="color: #0055A4; margin: 0 0 8px 0; font-size: 16px;">${equip.equip_nom}</h3>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Installation :</strong> ${equip.inst_nom || 'Non précisé'}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Type :</strong> ${equip.equip_type_name || 'Non précisé'}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Adresse :</strong> ${equip.inst_adresse || ''}, ${equip.inst_cp || ''} ${equip.commune_nom || ''}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Accessibilité PMR :</strong> ${equip.access_pmr_global === 'true' || equip.access_pmr_global === true ? '✓ Oui' : '✗ Non'}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Densité :</strong> ${tauxOccupation}%</p>
        <div class="jauge-densite" style="background: #f0f0f0; height: 8px; border-radius: 4px; margin: 8px 0; overflow: hidden;">
          <div class="jauge-remplissage" style="width: ${tauxOccupation}%; height: 100%; background-color: ${getCouleurDensite(equip)}; transition: width 0.3s ease;"></div>
        </div>
        <button onclick="afficherDetailEquipement('${equip.id}')" style="background: #0055A4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 8px;">Plus d'infos</button>
      </div>
    `;
    
    marqueur.bindPopup(popupHTML, {
      maxWidth: 300,
      className: 'popup-container'
    });
    
    // Personnaliser le marqueur selon le type d'équipement
    const markerIcon = getMarkerIcon(equip);
    if (markerIcon) {
      marqueur.setIcon(markerIcon);
    }
    
    markersLayer.addLayer(marqueur);
  });
  
  console.log(`🗺️ ${equipements.length} marqueurs affichés sur la carte`);
}

/**
 * Retourne l'icône du marqueur selon le type d'équipement
 */
function getMarkerIcon(equipement) {
  const type = equipement.equip_type_famille?.toLowerCase() || '';
  
  let color = '#0055A4'; // Couleur par défaut
  
  if (type.includes('terrain')) color = '#0055A4';
  else if (type.includes('salle')) color = '#00A94F';
  else if (type.includes('piscine')) color = '#17A2B8';
  else if (type.includes('stade')) color = '#FF6B35';
  else if (type.includes('complexe')) color = '#6c757d';
  
  // Marqueur accessible PMR avec bordure spéciale
  if (equipement.access_pmr_global === 'true' || equipement.access_pmr_global === true) {
    color = '#00A94F';
  }
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

/**
 * Calcule le taux d'occupation en pourcentage
 */
function calculerTauxOccupation(equipement) {
  if (!equipement.capacite_max || equipement.capacite_max === 0) return 0;
  return Math.round((equipement.densite_actuelle / equipement.capacite_max) * 100);
}

/**
 * Retourne la couleur selon le taux d'occupation
 */
function getCouleurDensite(equipement) {
  const taux = calculerTauxOccupation(equipement);
  if (taux < 50) return '#00A94F'; // Vert
  if (taux < 80) return '#FF6B35'; // Orange
  return '#E63946'; // Rouge
}

/**
 * Filtre les équipements selon les critères
 */
function filtrerEquipements() {
  const typeSelectionne = document.getElementById('equipmentType')?.value || '';
  const accessiblePMR = document.getElementById('accessiblePMR')?.checked || false;
  const searchInput = document.getElementById('searchInput')?.value?.toLowerCase() || '';
  const departmentFilter = document.getElementById('departmentFilter')?.value || '';
  
  let equipementsFiltres = [...equipementsTous];
  
  // Filtre par type d'équipement
  if (typeSelectionne) {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.equip_type_famille === typeSelectionne || 
      e.equip_type_name === typeSelectionne
    );
  }
  
  // Filtre par accessibilité PMR
  if (accessiblePMR) {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.access_pmr_global === 'true' || e.access_pmr_global === true
    );
  }
  
  // Filtre par département
  if (departmentFilter) {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.departement_code === departmentFilter || 
      e.inst_cp?.startsWith(departmentFilter)
    );
  }
  
  // Filtre par recherche textuelle
  if (searchInput) {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.equip_nom?.toLowerCase().includes(searchInput) ||
      e.inst_nom?.toLowerCase().includes(searchInput) ||
      e.commune_nom?.toLowerCase().includes(searchInput)
    );
  }
  
  console.log(`🔍 ${equipementsFiltres.length} équipements après filtrage`);
  
  afficherMarqueurs(equipementsFiltres);
  afficherResultats(equipementsFiltres);
  mettreAJourStatistiques();
}

/**
 * Réinitialise tous les filtres
 */
function reinitialiserFiltres() {
  document.getElementById('equipmentType').value = '';
  document.getElementById('accessiblePMR').checked = false;
  document.getElementById('departmentFilter').value = '';
  document.getElementById('searchInput').value = '';
  
  afficherMarqueurs(equipementsTous);
  afficherResultats(equipementsTous);
  mettreAJourStatistiques();
}

/**
 * Géolocalise l'utilisateur et centre la carte
 */
function geolocaliser() {
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
      
      carte.setView([lat, lon], 13);
      
      // Supprimer l'ancien marqueur utilisateur s'il existe
      document.querySelectorAll('.user-marker').forEach(el => el.remove());
      
      L.marker([lat, lon], {
        icon: L.divIcon({
          html: `<div style="background: #E63946; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;">
                   <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 12px; font-weight: bold;">📍</div>
                 </div>`,
          className: 'user-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).addTo(carte).bindPopup('Vous êtes ici').openPopup();
      
      document.body.removeChild(loadingMsg);
      
      console.log(`📍 Position utilisateur: ${lat}, ${lon}`);
    },
    (erreur) => {
      console.error('Erreur géolocalisation:', erreur);
      document.body.removeChild(loadingMsg);
      alert('Impossible de vous géolocaliser: ' + erreur.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}

/**
 * Géolocalise et affiche les équipements proches
 */
function geolocaliserEtAfficherProches() {
  if (!navigator.geolocation) {
    alert('La géolocalisation n\'est pas supportée par votre navigateur');
    return;
  }
  
  const loadingMsg = document.createElement('div');
  loadingMsg.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #00A94F; color: white; padding: 10px 20px; border-radius: 4px;
    z-index: 10000; font-size: 14px;
  `;
  loadingMsg.textContent = 'Recherche des équipements proches...';
  document.body.appendChild(loadingMsg);
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      // Centre la carte sur la position utilisateur
      carte.setView([lat, lon], 12);
      
      // Supprimer l'ancien marqueur utilisateur s'il existe
      document.querySelectorAll('.user-marker').forEach(el => el.remove());
      
      L.marker([lat, lon], {
        icon: L.divIcon({
          html: `<div style="background: #E63946; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); position: relative;">
                   <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 12px; font-weight: bold;">📍</div>
                 </div>`,
          className: 'user-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        })
      }).addTo(carte).bindPopup('Vous êtes ici').openPopup();
      
      document.body.removeChild(loadingMsg);
      
      // Afficher les équipements proches
      afficherEquipementsProches(lat, lon);
      
      console.log(`🎯 Recherche d'équipements proches pour: ${lat}, ${lon}`);
    },
    (erreur) => {
      console.error('Erreur géolocalisation:', erreur);
      document.body.removeChild(loadingMsg);
      alert('Impossible de vous géolocaliser: ' + erreur.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    }
  );
}

/**
 * Affiche les équipements proches d'une position (utilise distance.js)
 */
function afficherEquipementsProchesMap(lat, lon, rayonKm = 50) {
  equipementsProches = filtrerEquipementsParRayon(lat, lon, equipementsTous, rayonKm);
  
  console.log(`🎯 ${equipementsProches.length} équipements proches trouvés`);
  
  // Centrer la carte sur les équipements proches
  if (equipementsProches.length > 0) {
    const group = new L.featureGroup(
      equipementsProches.map(equip =>
        L.marker([equip.latitude, equip.longitude])
      )
    );
    carte.fitBounds(group.getBounds().pad(0.1));
  }
  
  afficherResultats(equipementsProches);
}

/**
 * Affiche les résultats dans le panneau latéral
 */
function afficherResultats(equipements) {
  const resultsList = document.getElementById('resultsList');
  const resultsCount = document.getElementById('resultsCount');
  
  if (!resultsList) return;
  
  resultsCount.textContent = equipements.length;
  
  if (equipements.length === 0) {
    resultsList.innerHTML = `
      <div class="loading-placeholder">
        <p>Aucun équipement trouvé</p>
      </div>
    `;
    return;
  }
  
  const resultsHTML = equipements.slice(0, 20).map(equip => {
    const tauxOccupation = calculerTauxOccupation(equip);
    const couleurDensite = getCouleurDensite(equip);
    
    return `
      <div class="result-item" onclick="centrerSurEquipement('${equip.id}')">
        <div class="result-name">${equip.equip_nom}</div>
        <div class="result-location">${equip.inst_nom || ''} - ${equip.commune_nom || ''}</div>
        <div class="result-type">${equip.equip_type_name || 'Type non précisé'}</div>
        <div class="result-accessibility">
          <span class="accessibility-badge ${equip.access_pmr_global === 'true' || equip.access_pmr_global === true ? 'yes' : 'no'}">
            ${equip.access_pmr_global === 'true' || equip.access_pmr_global === true ? 'Accessible PMR' : 'Non accessible PMR'}
          </span>
          <div style="margin-left: auto; font-weight: bold; color: ${couleurDensite};">
            ${tauxOccupation}%
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  resultsList.innerHTML = resultsHTML;
}

/**
 * Centre la carte sur un équipement spécifique
 */
function centrerSurEquipement(equipementId) {
  const equipement = equipementsTous.find(e => e.id === equipementId);
  if (equipement && equipement.latitude && equipement.longitude) {
    carte.setView([equipement.latitude, equipement.longitude], 15);
    
    // Ouvrir le popup correspondant
    markersLayer.eachLayer(marker => {
      const latLng = marker.getLatLng();
      if (Math.abs(latLng.lat - equipement.latitude) < 0.0001 && 
          Math.abs(latLng.lng - equipement.longitude) < 0.0001) {
        marker.openPopup();
      }
    });
  }
}

/**
 * Met à jour les statistiques affichées
 */
function mettreAJourStatistiques() {
  const visibleEquipments = document.getElementById('visibleEquipments');
  const totalEquipments = document.getElementById('totalEquipments');
  
  if (visibleEquipments) {
    // Calculer le nombre d'équipements visibles dans la zone actuelle
    const bounds = carte.getBounds();
    const equipementsVisibles = equipementsTous.filter(equip => {
      if (!equip.latitude || !equip.longitude) return false;
      return bounds.contains([equip.latitude, equip.longitude]);
    });
    
    visibleEquipments.textContent = equipementsVisibles.length.toLocaleString('fr-FR');
  }
  
  if (totalEquipments) {
    totalEquipments.textContent = `${equipementsTous.length.toLocaleString('fr-FR')}+`;
  }
}

/**
 * Affiche les détails d'un équipement
 */
function afficherDetailEquipement(equipementId) {
  const equipement = equipementsTous.find(e => e.id === equipementId);
  if (!equipement) return;
  
  // Créer une modal ou rediriger vers la page détail
  const modalHTML = `
    <div id="equipementModal" style="
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
      align-items: center; justify-content: center;
    " onclick="fermerModalEquipement(event)">
      <div style="
        background: white; border-radius: 8px; padding: 20px; 
        max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;
      " onclick="event.stopPropagation()">
        <h2 style="color: #0055A4; margin-top: 0;">${equipement.equip_nom}</h2>
        <div style="margin-bottom: 15px;">
          <strong>Installation :</strong> ${equipement.inst_nom || 'Non précisé'}<br>
          <strong>Type :</strong> ${equipement.equip_type_name || 'Non précisé'}<br>
          <strong>Adresse :</strong> ${equipement.inst_adresse || ''}, ${equipement.inst_cp || ''} ${equipement.commune_nom || ''}<br>
          <strong>Accessibilité PMR :</strong> ${equipement.access_pmr_global === 'true' || equipement.access_pmr_global === true ? 'Oui' : 'Non'}<br>
          <strong>Densité actuelle :</strong> ${equipement.densite_actuelle || 0}<br>
          <strong>Capacité maximale :</strong> ${equipement.capacite_max || 'Non définie'}
        </div>
        <button onclick="fermerModalEquipement()" style="
          background: #0055A4; color: white; border: none; 
          padding: 10px 20px; border-radius: 4px; cursor: pointer;
        ">Fermer</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Ferme la modal d'équipement
 */
function fermerModalEquipement(event) {
  if (event && event.target !== event.currentTarget) return;
  
  const modal = document.getElementById('equipementModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * Initialise les event listeners de l'interface
 */
function initialiserEventListeners() {
  // Bouton appliquer les filtres
  const applyFiltersBtn = document.getElementById('applyFilters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', filtrerEquipements);
  }
  
  // Bouton réinitialiser les filtres
  const resetFiltersBtn = document.getElementById('resetFilters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', reinitialiserFiltres);
  }
  
  // Recherche en temps réel
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filtrerEquipements, 500);
    });
  }
  
  // Filtres qui se mettent à jour automatiquement
  const equipmentType = document.getElementById('equipmentType');
  if (equipmentType) {
    equipmentType.addEventListener('change', filtrerEquipements);
  }
  
  const accessiblePMR = document.getElementById('accessiblePMR');
  if (accessiblePMR) {
    accessiblePMR.addEventListener('change', filtrerEquipements);
  }
  
  const departmentFilter = document.getElementById('departmentFilter');
  if (departmentFilter) {
    departmentFilter.addEventListener('change', filtrerEquipements);
  }
  
  // Toggle filtres sur mobile
  const filtersToggle = document.getElementById('filtersToggle');
  const filtersContent = document.getElementById('filtersContent');
  if (filtersToggle && filtersContent) {
    filtersToggle.addEventListener('click', function() {
      filtersContent.classList.toggle('show');
    });
  }
  
  // Toggle résultats sur mobile
  const resultsToggle = document.getElementById('resultsToggle');
  const resultsPanel = document.getElementById('mapResults');
  if (resultsToggle && resultsPanel) {
    resultsToggle.addEventListener('click', function() {
      resultsPanel.classList.remove('show');
    });
  }
  
  const resultsMobileToggle = document.getElementById('resultsMobileToggle');
  if (resultsMobileToggle && resultsPanel) {
    resultsMobileToggle.addEventListener('click', function() {
      resultsPanel.classList.toggle('show');
    });
  }
}

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initialisation de la carte interactive...');
  
  initialiserCarte();
  initialiserEventListeners();
  
  console.log('✅ Carte interactive initialisée avec succès');
});

// Export pour utilisation externe si nécessaire
window.CarteInteractive = {
  initialiserCarte,
  filtrerEquipements,
  geolocaliser,
  afficherEquipementsProches,
  centrerSurEquipement,
  afficherDetailEquipement,
  reinitialiserFiltres
};