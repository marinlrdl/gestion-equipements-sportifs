/**
 * js/distance.js
 * Calcul de distance entre deux points GPS (Haversine)
 */

/**
 * Calcule la distance entre deux points GPS en km
 */
function calculerDistanceHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  
  const dLat = degresVersRadians(lat2 - lat1);
  const dLon = degresVersRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degresVersRadians(lat1)) * Math.cos(degresVersRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
}

/**
 * Convertit des degrés en radians
 */
function degresVersRadians(degres) {
  return degres * (Math.PI / 180);
}

/**
 * Trouve les N équipements les plus proches
 */
function trouverEquipementsProches(userLat, userLon, equipements, nombre = 5, prioriserDisponibilite = false) {
  const resultats = equipements.map(equip => {
    const distance = calculerDistanceHaversine(
      userLat, userLon,
      equip.latitude, equip.longitude
    );
    
    // Utilise la fonction de carte.js
    const tauxOccupation = calculerTauxOccupation(equip); 
    
    let score;
    if (prioriserDisponibilite) {
      const scoreDisponibilite = 100 - tauxOccupation;
      const scoreDistance = Math.max(0, 100 - (distance * 2));
      score = (scoreDisponibilite * 0.6) + (scoreDistance * 0.4);
    } else {
      score = 1 / (distance + 0.1);
    }
    
    return { ...equip, distance, tauxOccupation, score };
  });
  
  resultats.sort((a, b) => b.score - a.score);
  
  return resultats.slice(0, nombre);
}

/**
 * Affiche les équipements proches dans l'interface
 */
function afficherEquipementsProches(userLat, userLon) {
  if (!equipementsTous || equipementsTous.length === 0) {
      console.warn("Les équipements ne sont pas encore chargés.");
      return;
  }
    
  const proches = trouverEquipementsProches(
    userLat, userLon, 
    equipementsTous, 
    5,
    document.getElementById('prioriser-disponibilite')?.checked || false
  );
  
  const conteneur = document.getElementById('liste-equipements-proches');
  
  // Si le conteneur n'existe pas, créer une zone pour les équipements proches
  if (!conteneur) {
    const zoneProches = document.createElement('div');
    zoneProches.id = 'liste-equipements-proches';
    zoneProches.className = 'equipements-proches-container';
    
    // Trouver où l'ajouter (après les filtres ou dans les résultats)
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
      mapContainer.appendChild(zoneProches);
    }
  }
  
  const conteneurProches = document.getElementById('liste-equipements-proches');
  conteneurProches.innerHTML = '';
  
  if (proches.length === 0) {
    conteneurProches.innerHTML = '<p>Aucun équipement trouvé à proximité</p>';
    return;
  }
  
  // Créer le titre
  const titre = document.createElement('h3');
  titre.textContent = 'Équipements les plus proches';
  titre.className = 'proches-titre';
  conteneurProches.appendChild(titre);
  
  proches.forEach(equip => {
    const div = document.createElement('div');
    div.className = 'equipement-proche';
    div.innerHTML = `
      <h4>${equip.equip_nom}</h4>
      <p>${equip.inst_adresse || ''}, ${equip.commune_nom || ''}</p>
      <p><strong>Distance :</strong> ${equip.distance} km</p>
      <p><strong>Disponibilité :</strong> ${100 - equip.tauxOccupation}%</p>
      <div class="equipement-actions">
        <button onclick="centrerSurEquipement(${equip.latitude}, ${equip.longitude})" class="btn-action">
          Voir sur la carte
        </button>
        <button onclick="afficherItineraire(${equip.latitude}, ${equip.longitude})" class="btn-action">
          Itinéraire
        </button>
      </div>
    `;
    conteneurProches.appendChild(div);
  });
}

/**
 * Centre la carte sur un équipement
 */
function centrerSurEquipement(lat, lon) {
  if (typeof carte !== 'undefined' && carte) {
    carte.setView([lat, lon], 15);
  } else {
    console.error('Objet carte non disponible');
  }
}

/**
 * Ouvre l'itinéraire dans Google Maps
 */
function afficherItineraire(destLat, destLon) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLon}`;
  window.open(url, '_blank');
}

/**
 * Utilitaire pour obtenir la position actuelle de l'utilisateur
 */
function obtenirPositionActuelle() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (erreur) => {
        reject(erreur);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Calcule la distance pour un seul équipement depuis une position
 */
function calculerDistanceDepuisPosition(userLat, userLon, equipement) {
  if (!equipement.latitude || !equipement.longitude) {
    return Infinity;
  }
  
  return calculerDistanceHaversine(userLat, userLon, equipement.latitude, equipement.longitude);
}

/**
 * Filtre les équipements dans un rayon donné
 */
function filtrerEquipementsParRayon(userLat, userLon, equipements, rayonKm = 50) {
  return equipements.filter(equip => {
    const distance = calculerDistanceDepuisPosition(userLat, userLon, equip);
    return distance <= rayonKm && distance !== Infinity;
  });
}

/**
 * Optimise le tri par distance pour grandes collections
 */
function trierEquipementsParDistanceOptimise(userLat, userLon, equipements, limite = 100) {
  // Pour les grandes collections, on utilise un calcul optimisé
  const equipementsAvecDistance = equipements
    .filter(equip => equip.latitude && equip.longitude)
    .map(equip => ({
      ...equip,
      distance: calculerDistanceHaversine(userLat, userLon, equip.latitude, equip.longitude)
    }));
  
  // Tri optimisé utilisant le score de proximité
  equipementsAvecDistance.sort((a, b) => {
    // Priorité à la distance, puis à la disponibilité si distances similaires
    if (Math.abs(a.distance - b.distance) < 0.5) {
      return b.tauxOccupation - a.tauxOccupation; // Moins d'occupation = mieux
    }
    return a.distance - b.distance;
  });
  
  return equipementsAvecDistance.slice(0, limite);
}

// Export pour utilisation externe si nécessaire
window.DistanceCalculator = {
  calculerDistanceHaversine,
  degresVersRadians,
  trouverEquipementsProches,
  afficherEquipementsProches,
  centrerSurEquipement,
  afficherItineraire,
  obtenirPositionActuelle,
  calculerDistanceDepuisPosition,
  filtrerEquipementsParRayon,
  trierEquipementsParDistanceOptimise
};