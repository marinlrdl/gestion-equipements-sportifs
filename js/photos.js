/**
 * js/photos.js
 * Gestion de l'upload de photos pour équipements sportifs
 * Fonctionnalités complètes d'upload, stockage et gestion des photos via Supabase Storage
 */

/**
 * Upload une photo vers Supabase Storage
 * @param {File} file - Le fichier image à uploader
 * @param {string} equipementId - ID de l'équipement
 * @returns {Promise<string|null>} URL publique de la photo ou null en cas d'erreur
 */
async function uploadPhoto(file, equipementId) {
  try {
    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      throw new Error('La taille du fichier ne doit pas dépasser 5MB');
    }

    // Génération du nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${equipementId}/${Date.now()}.${fileExt}`;
    
    console.log(`📸 Upload de la photo: ${fileName}`);
    
    // Upload dans le bucket 'photos-equipements'
    const { data, error } = await supabase.storage
      .from('photos-equipements')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Erreur upload Supabase:', error);
      throw error;
    }
    
    console.log('✅ Photo uploadée avec succès:', data.path);
    
    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('photos-equipements')
      .getPublicUrl(fileName);
    
    console.log('🔗 URL publique générée:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (erreur) {
    console.error('❌ Erreur upload photo:', erreur);
    throw erreur;
  }
}

/**
 * Ajoute l'URL de la photo à l'équipement (dans le tableau 'photos')
 * @param {string} equipementId - ID de l'équipement
 * @param {string} photoUrl - URL publique de la photo
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function ajouterPhotoEquipement(equipementId, photoUrl) {
  try {
    console.log(`📋 Ajout de la photo à l'équipement ${equipementId}`);
    
    // 1. Récupérer l'équipement actuel
    const { data: equip, error: errorGet } = await supabase
      .from('equipements')
      .select('photos')
      .eq('id', equipementId)
      .single();
    
    if (errorGet) {
      console.error('❌ Erreur récupération équipement:', errorGet);
      throw errorGet;
    }
    
    // 2. Ajouter la nouvelle photo au tableau existant
    const photos = equip.photos || [];
    photos.push(photoUrl);
    
    // 3. Mettre à jour l'équipement
    const { error } = await supabase
      .from('equipements')
      .update({ photos: photos })
      .eq('id', equipementId);
    
    if (error) {
      console.error('❌ Erreur mise à jour équipement:', error);
      throw error;
    }
    
    console.log('✅ Photo ajoutée à l\'équipement avec succès');
    return true;
  } catch (erreur) {
    console.error('❌ Erreur ajout URL photo:', erreur);
    throw erreur;
  }
}

/**
 * Gère l'upload depuis un input file
 * @param {Event} event - Événement du input file
 * @param {string} equipementId - ID de l'équipement
 * @returns {Promise<void>}
 */
async function handleUploadPhotos(event, equipementId) {
  const files = event.target.files;
  if (files.length === 0) return;
  
  const bouton = document.getElementById('btn-upload');
  const uploadContainer = document.getElementById('upload-container');
  
  // Interface de feedback
  if (bouton) {
    bouton.disabled = true;
    bouton.innerHTML = '<i class="icon-refresh"></i> Upload en cours...';
  }
  
  if (uploadContainer) {
    uploadContainer.classList.add('uploading');
  }
  
  let nbSuccess = 0;
  let nbErrors = 0;
  const errors = [];
  
  console.log(`📤 Début upload de ${files.length} fichier(s)`);
  
  for (const file of files) {
    // Validation fichier par fichier
    if (!file.type.startsWith('image/')) {
      console.warn(`⚠️ Fichier non-image ignoré: ${file.name}`);
      errors.push(`${file.name}: Type de fichier non supporté`);
      nbErrors++;
      continue;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      console.warn(`⚠️ Fichier trop volumineux: ${file.name}`);
      errors.push(`${file.name}: Taille trop importante (max 5MB)`);
      nbErrors++;
      continue;
    }
    
    try {
      // Upload de la photo
      const url = await uploadPhoto(file, equipementId);
      if (url) {
        // Ajout à l'équipement
        await ajouterPhotoEquipement(equipementId, url);
        nbSuccess++;
        console.log(`✅ Upload réussi: ${file.name}`);
      }
    } catch (error) {
      console.error(`❌ Erreur upload ${file.name}:`, error);
      errors.push(`${file.name}: ${error.message}`);
      nbErrors++;
    }
  }
  
  // Restauration de l'interface
  if (bouton) {
    bouton.disabled = false;
    bouton.innerHTML = '<i class="icon-camera"></i> Ajouter des photos';
  }
  
  if (uploadContainer) {
    uploadContainer.classList.remove('uploading');
  }
  
  // Feedback utilisateur
  let message = `${nbSuccess} photo(s) ajoutée(s) avec succès`;
  if (nbErrors > 0) {
    message += `\n${nbErrors} erreur(s):\n${errors.join('\n')}`;
  }
  
  alert(message);
  
  // Recharger l'affichage des photos
  if (typeof afficherPhotos === 'function') {
    afficherPhotos(equipementId);
  } else if (typeof rafraichirGaleriePhotos === 'function') {
    rafraichirGaleriePhotos(equipementId);
  }
  
  // Réinitialiser l'input
  if (event.target) {
    event.target.value = '';
  }
  
  console.log('📋 Upload terminé:', { success: nbSuccess, errors: nbErrors });
}

/**
 * Supprime une photo d'un équipement
 * @param {string} equipementId - ID de l'équipement
 * @param {string} photoUrl - URL de la photo à supprimer
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function supprimerPhoto(equipementId, photoUrl) {
  try {
    console.log(`🗑️ Suppression de la photo: ${photoUrl}`);
    
    // 1. Récupérer l'équipement actuel
    const { data: equip, error: errorGet } = await supabase
      .from('equipements')
      .select('photos')
      .eq('id', equipementId)
      .single();
    
    if (errorGet) throw errorGet;
    
    // 2. Retirer la photo du tableau
    const photos = equip.photos || [];
    const nouvellePhotos = photos.filter(url => url !== photoUrl);
    
    // 3. Mettre à jour l'équipement
    const { error } = await supabase
      .from('equipements')
      .update({ photos: nouvellePhotos })
      .eq('id', equipementId);
    
    if (error) throw error;
    
    // 4. Supprimer le fichier du storage
    try {
      const fileName = photoUrl.split('/').pop();
      await supabase.storage
        .from('photos-equipements')
        .remove([`${equipementId}/${fileName}`]);
    } catch (storageError) {
      console.warn('⚠️ Impossible de supprimer le fichier du storage:', storageError);
    }
    
    console.log('✅ Photo supprimée avec succès');
    return true;
  } catch (erreur) {
    console.error('❌ Erreur suppression photo:', erreur);
    throw erreur;
  }
}

/**
 * Affiche la galerie de photos d'un équipement
 * @param {string} equipementId - ID de l'équipement
 * @param {string} containerId - ID du conteneur (optionnel)
 */
async function afficherPhotos(equipementId, containerId = 'galerie-photos') {
  try {
    console.log(`🖼️ Chargement des photos pour l'équipement ${equipementId}`);
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Conteneur ${containerId} introuvable`);
      return;
    }
    
    // Récupérer l'équipement
    const { data: equip, error } = await supabase
      .from('equipements')
      .select('photos, equip_nom')
      .eq('id', equipementId)
      .single();
    
    if (error) throw error;
    
    const photos = equip.photos || [];
    
    if (photos.length === 0) {
      container.innerHTML = `
        <div class="no-photos">
          <i class="icon-camera"></i>
          <p>Aucune photo disponible</p>
        </div>
      `;
      return;
    }
    
    // Générer la galerie
    let galerieHTML = `
      <div class="photo-gallery">
        <div class="gallery-header">
          <h3><i class="icon-images"></i> Photos de l'équipement</h3>
          <span class="photo-count">${photos.length} photo(s)</span>
        </div>
        <div class="photo-grid">
    `;
    
    photos.forEach((photoUrl, index) => {
      const fileName = photoUrl.split('/').pop();
      galerieHTML += `
        <div class="photo-item" data-index="${index}">
          <img src="${photoUrl}" alt="${equip.equip_nom} - Photo ${index + 1}" loading="lazy">
          <div class="photo-overlay">
            <button class="photo-action view-btn" onclick="voirPhoto('${photoUrl}', '${equip.equip_nom}')" title="Voir en grand">
              <i class="icon-eye"></i>
            </button>
            <button class="photo-action download-btn" onclick="telechargerPhoto('${photoUrl}', '${fileName}')" title="Télécharger">
              <i class="icon-download"></i>
            </button>
            <button class="photo-action delete-btn" onclick="confirmDeletePhoto('${equipementId}', '${photoUrl}')" title="Supprimer">
              <i class="icon-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    galerieHTML += `
        </div>
      </div>
    `;
    
    container.innerHTML = galerieHTML;
    console.log(`✅ ${photos.length} photo(s) affichée(s)`);
    
  } catch (erreur) {
    console.error('❌ Erreur affichage photos:', erreur);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <i class="icon-alert"></i>
          <p>Erreur lors du chargement des photos</p>
        </div>
      `;
    }
  }
}

/**
 * Confirme et supprime une photo
 * @param {string} equipementId - ID de l'équipement
 * @param {string} photoUrl - URL de la photo
 */
function confirmDeletePhoto(equipementId, photoUrl) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
    supprimerPhoto(equipementId, photoUrl)
      .then(() => {
        afficherPhotos(equipementId);
        alert('Photo supprimée avec succès');
      })
      .catch(error => {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression de la photo');
      });
  }
}

/**
 * Voir une photo en grand (lightbox)
 * @param {string} photoUrl - URL de la photo
 * @param {string} equipNom - Nom de l'équipement
 */
function voirPhoto(photoUrl, equipNom) {
  const lightbox = document.createElement('div');
  lightbox.className = 'photo-lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-overlay" onclick="fermerLightbox()">
      <div class="lightbox-content">
        <button class="lightbox-close" onclick="fermerLightbox()">
          <i class="icon-x"></i>
        </button>
        <img src="${photoUrl}" alt="${equipNom}" class="lightbox-image">
        <div class="lightbox-caption">
          <h3>${equipNom}</h3>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(lightbox);
  document.body.style.overflow = 'hidden';
}

/**
 * Ferme le lightbox
 */
function fermerLightbox() {
  const lightbox = document.querySelector('.photo-lightbox');
  if (lightbox) {
    lightbox.remove();
    document.body.style.overflow = 'auto';
  }
}

/**
 * Télécharge une photo
 * @param {string} photoUrl - URL de la photo
 * @param {string} fileName - Nom du fichier
 */
function telechargerPhoto(photoUrl, fileName) {
  const link = document.createElement('a');
  link.href = photoUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Initialise l'interface d'upload de photos
 * @param {string} equipementId - ID de l'équipement
 */
function initialiserUploadPhotos(equipementId) {
  const uploadArea = document.getElementById('photo-upload-area');
  const fileInput = document.getElementById('photo-input');
  
  if (!uploadArea || !fileInput) {
    console.warn('⚠️ Interface d\'upload non trouvée');
    return;
  }
  
  // Drag & Drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUploadPhotos({ target: { files } }, equipementId);
    }
  });
  
  // Clic pour ouvrir le sélecteur
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Changement de fichier
  fileInput.addEventListener('change', (e) => {
    handleUploadPhotos(e, equipementId);
  });
}

/**
 * Met à jour l'aperçu de la première photo dans la liste
 * @param {Object} equipement - Données de l'équipement
 * @param {HTMLElement} element - Élément DOM à mettre à jour
 */
function mettreAJourApercuPhoto(equipement, element) {
  const photos = equipement.photos || [];
  if (photos.length > 0) {
    element.innerHTML = `
      <img src="${photos[0]}" alt="${equipement.equip_nom}" class="equipment-thumbnail">
      <span class="photo-badge">${photos.length}</span>
    `;
  } else {
    element.innerHTML = `
      <div class="no-photo-placeholder">
        <i class="icon-camera"></i>
      </div>
    `;
  }
}

// Export pour utilisation globale
if (typeof window !== 'undefined') {
  window.uploadPhoto = uploadPhoto;
  window.ajouterPhotoEquipement = ajouterPhotoEquipement;
  window.handleUploadPhotos = handleUploadPhotos;
  window.supprimerPhoto = supprimerPhoto;
  window.afficherPhotos = afficherPhotos;
  window.confirmDeletePhoto = confirmDeletePhoto;
  window.voirPhoto = voirPhoto;
  window.fermerLightbox = fermerLightbox;
  window.telechargerPhoto = telechargerPhoto;
  window.initialiserUploadPhotos = initialiserUploadPhotos;
  window.mettreAJourApercuPhoto = mettreAJourApercuPhoto;
}

console.log('📸 Module photos.js chargé avec succès');