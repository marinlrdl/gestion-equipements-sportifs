/**
 * js/equipements.js
 * Gestion de la liste des équipements pour collectivités
 */

let utilisateurConnecte = null;
let equipementsCollectivite = [];

/**
 * Initialise la page des équipements
 */
async function initialiserPageEquipements() {
  utilisateurConnecte = await obtenirUtilisateurConnecte();
  
  if (!utilisateurConnecte) {
    window.location.href = 'connexion.html';
    return;
  }
  
  afficherInfosUtilisateur();
  await chargerEquipementsCollectivite();
  afficherTableauEquipements();
}

/**
 * Affiche les informations de l'utilisateur connecté
 */
function afficherInfosUtilisateur() {
  const userInfo = document.getElementById('user-info');
  if (!userInfo) return;
  
  let roleText = '';
  switch (utilisateurConnecte.role) {
    case 'mairie':
      roleText = `Mairie de ${utilisateurConnecte.commune_nom}`;
      break;
    case 'prefecture_departementale':
      roleText = `Préfecture départementale - ${utilisateurConnecte.departement_nom}`;
      break;
    case 'prefecture_regionale':
      roleText = `Préfecture régionale - ${utilisateurConnecte.region_nom}`;
      break;
    case 'administrateur':
      roleText = 'Administrateur';
      break;
    default:
      roleText = 'Utilisateur';
  }
  
  userInfo.innerHTML = `
    <div class="user-info-card">
      <div class="user-info-title">Connecté en tant que</div>
      <div class="user-info-role">${roleText}</div>
      <div class="user-info-email">${utilisateurConnecte.email}</div>
    </div>
  `;
}

/**
 * Charge les équipements selon le rôle de l'utilisateur
 */
async function chargerEquipementsCollectivite() {
  try {
    let query = window.AppConfig.supabase.from('equipements').select('*');
    
    const role = utilisateurConnecte.role;
    
    if (role === 'mairie') {
      query = query.eq('commune_code', utilisateurConnecte.code_commune);
    } else if (role === 'prefecture_departementale') {
      query = query.eq('departement_code', utilisateurConnecte.code_departement);
    } else if (role === 'prefecture_regionale') {
      query = query.eq('region_code', utilisateurConnecte.code_region);
    }
    
    const { data, error } = await query.order('updated_at', { ascending: false });
    
    if (error) throw error;
    equipementsCollectivite = data || [];
    
  } catch (erreur) {
    console.error('Erreur chargement équipements:', erreur);
    alert('Erreur lors du chargement des équipements : ' + erreur.message);
  }
}

/**
 * Affiche le tableau des équipements
 */
function afficherTableauEquipements() {
  const tbody = document.getElementById('tableau-equipements-body');
  if (!tbody) {
    console.error('Element #tableau-equipements-body non trouvé');
    return;
  }
  
  tbody.innerHTML = '';
  
  if (equipementsCollectivite.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun équipement trouvé</td></tr>';
    return;
  }
  
  equipementsCollectivite.forEach(equip => {
    const tr = document.createElement('tr');
    const tauxOccupation = window.carte.calculateTauxOccupation ? window.carte.calculateTauxOccupation(equip) : 0;
    const couleurDensite = window.carte.getCouleurDensite ? window.carte.getCouleurDensite(equip) : '#00A94F';
    
    tr.innerHTML = `
      <td>${equip.equip_nom || 'N/A'}</td>
      <td>${equip.commune_nom || 'N/A'} ${equip.inst_cp ? '(' + equip.inst_cp + ')' : ''}</td>
      <td>${equip.equip_type_name || 'Non précisé'}</td>
      <td>
        <div class="badge-densite" style="background-color: ${couleurDensite}">
          ${tauxOccupation}%
        </div>
      </td>
      <td>${new Date(equip.updated_at).toLocaleDateString('fr-FR')}</td>
      <td class="actions">
        <button onclick="voirEquipement('${equip.id}')" class="btn-voir">👁️ Voir</button>
        <button onclick="modifierEquipement('${equip.id}')" class="btn-modifier">✏️ Modifier</button>
        <button onclick="confirmerSuppression('${equip.id}')" class="btn-supprimer">🗑️ Supprimer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  const countElement = document.getElementById('nb-equipements');
  if (countElement) {
    countElement.textContent = equipementsCollectivite.length;
  }
}

/**
 * Navigue vers l'ajout d'un nouvel équipement
 */
function ajouterEquipement() {
  window.location.href = 'formulaire-equipement.html';
}

/**
 * Navigue vers la modification d'un équipement
 */
function modifierEquipement(id) {
  window.location.href = `formulaire-equipement.html?id=${id}`;
}

/**
 * Navigue vers la visualisation détaillée d'un équipement
 */
function voirEquipement(id) {
  window.location.href = `detail-equipement.html?id=${id}`;
}

/**
 * Demande confirmation avant suppression
 */
function confirmerSuppression(id) {
  const equip = equipementsCollectivite.find(e => e.id === id);
  if (!equip) {
    alert('Équipement non trouvé');
    return;
  }
  
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'équipement "${equip.equip_nom}" ?\n\nCette action est irréversible.`)) {
    supprimerEquipement(id);
  }
}

/**
 * Supprime un équipement
 */
async function supprimerEquipement(id) {
  try {
    const { error } = await window.AppConfig.supabase
      .from('equipements')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    alert('Équipement supprimé avec succès');
    await chargerEquipementsCollectivite();
    afficherTableauEquipements();
    
  } catch (erreur) {
    console.error('Erreur suppression:', erreur);
    alert('Erreur lors de la suppression : ' + erreur.message);
  }
}

/**
 * Filtrage des équipements
 */
function filtrerEquipements() {
  const searchTerm = document.getElementById('searchEquipment')?.value?.toLowerCase() || '';
  const typeFilter = document.getElementById('typeFilter')?.value || '';
  const departmentFilter = document.getElementById('departmentFilter')?.value || '';
  const accessibilityFilter = document.getElementById('accessibilityFilter')?.value || '';
  
  let equipementsFiltres = [...equipementsCollectivite];
  
  // Filtre par recherche textuelle
  if (searchTerm) {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.equip_nom?.toLowerCase().includes(searchTerm) ||
      e.inst_nom?.toLowerCase().includes(searchTerm) ||
      e.commune_nom?.toLowerCase().includes(searchTerm) ||
      e.inst_cp?.includes(searchTerm)
    );
  }
  
  // Filtre par type
  if (typeFilter) {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.equip_type_famille === typeFilter || 
      e.equip_type_name === typeFilter
    );
  }
  
  // Filtre par département
  if (departmentFilter) {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.departement_code === departmentFilter
    );
  }
  
  // Filtre par accessibilité
  if (accessibilityFilter === 'accessible') {
    equipementsFiltres = equipementsFiltres.filter(e => 
      e.access_pmr_global === 'true' || e.access_pmr_global === true ||
      e.access_pmr_aire === true || e.access_pmr_vestiaires === true
    );
  } else if (accessibilityFilter === 'non_accessible') {
    equipementsFiltres = equipementsFiltres.filter(e => 
      !(e.access_pmr_global === 'true' || e.access_pmr_global === true ||
        e.access_pmr_aire === true || e.access_pmr_vestiaires === true)
    );
  }
  
  // Afficher les équipements filtrés
  afficherEquipementsFiltres(equipementsFiltres);
  
  // Mettre à jour le compteur
  const countElement = document.getElementById('resultsCount');
  if (countElement) {
    countElement.textContent = equipementsFiltres.length;
  }
}

/**
 * Affiche les équipements filtrés
 */
function afficherEquipementsFiltres(equipementsFiltres) {
  const tbody = document.getElementById('tableau-equipements-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (equipementsFiltres.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun équipement trouvé pour ces critères</td></tr>';
    return;
  }
  
  equipementsFiltres.forEach(equip => {
    const tr = document.createElement('tr');
    const tauxOccupation = window.carte.calculateTauxOccupation ? window.carte.calculateTauxOccupation(equip) : 0;
    const couleurDensite = window.carte.getCouleurDensite ? window.carte.getCouleurDensite(equip) : '#00A94F';
    
    tr.innerHTML = `
      <td>${equip.equip_nom || 'N/A'}</td>
      <td>${equip.commune_nom || 'N/A'} ${equip.inst_cp ? '(' + equip.inst_cp + ')' : ''}</td>
      <td>${equip.equip_type_name || 'Non précisé'}</td>
      <td>
        <div class="badge-densite" style="background-color: ${couleurDensite}">
          ${tauxOccupation}%
        </div>
      </td>
      <td>${new Date(equip.updated_at).toLocaleDateString('fr-FR')}</td>
      <td class="actions">
        <button onclick="voirEquipement('${equip.id}')" class="btn-voir">👁️ Voir</button>
        <button onclick="modifierEquipement('${equip.id}')" class="btn-modifier">✏️ Modifier</button>
        <button onclick="confirmerSuppression('${equip.id}')" class="btn-supprimer">🗑️ Supprimer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Réinitialise tous les filtres
 */
function reinitialiserFiltres() {
  const searchInput = document.getElementById('searchEquipment');
  const typeSelect = document.getElementById('typeFilter');
  const departmentSelect = document.getElementById('departmentFilter');
  const accessibilitySelect = document.getElementById('accessibilityFilter');
  
  if (searchInput) searchInput.value = '';
  if (typeSelect) typeSelect.value = '';
  if (departmentSelect) departmentSelect.value = '';
  if (accessibilitySelect) accessibilitySelect.value = '';
  
  afficherTableauEquipements();
  
  const countElement = document.getElementById('resultsCount');
  if (countElement) {
    countElement.textContent = equipementsCollectivite.length;
  }
}

/**
 * Exporte les équipements en CSV
 */
function exporterEquipements() {
  if (equipementsCollectivite.length === 0) {
    alert('Aucun équipement à exporter');
    return;
  }
  
  const headers = [
    'Nom équipement',
    'Installation',
    'Type',
    'Commune',
    'Code postal',
    'Adresse',
    'Accessibilité PMR',
    'Densité actuelle',
    'Capacité max',
    'Dernière mise à jour'
  ];
  
  const csvContent = [
    headers.join(','),
    ...equipementsCollectivite.map(equip => [
      `"${equip.equip_nom || ''}"`,
      `"${equip.inst_nom || ''}"`,
      `"${equip.equip_type_name || ''}"`,
      `"${equip.commune_nom || ''}"`,
      `"${equip.inst_cp || ''}"`,
      `"${equip.inst_adresse || ''}"`,
      equip.access_pmr_global === 'true' || equip.access_pmr_global === true ? 'Oui' : 'Non',
      equip.densite_actuelle || 0,
      equip.capacite_max || '',
      new Date(equip.updated_at).toLocaleDateString('fr-FR')
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `equipements_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Trie les équipements selon le critère sélectionné
 */
function trierEquipements(critere) {
  equipementsCollectivite.sort((a, b) => {
    switch (critere) {
      case 'nom':
        return (a.equip_nom || '').localeCompare(b.equip_nom || '');
      case 'commune':
        return (a.commune_nom || '').localeCompare(b.commune_nom || '');
      case 'type':
        return (a.equip_type_name || '').localeCompare(b.equip_type_name || '');
      case 'departement':
        return (a.departement_nom || '').localeCompare(b.departement_nom || '');
      case 'accessibility':
        const aAccess = (a.access_pmr_global === 'true' || a.access_pmr_global === true) ? 1 : 0;
        const bAccess = (b.access_pmr_global === 'true' || b.access_pmr_global === true) ? 1 : 0;
        return bAccess - aAccess;
      case 'date':
        return new Date(b.updated_at) - new Date(a.updated_at);
      default:
        return 0;
    }
  });
  
  afficherTableauEquipements();
}

/**
 * Initialise les event listeners de la page
 */
function initialiserEventListeners() {
  // Recherche en temps réel
  const searchInput = document.getElementById('searchEquipment');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(filtrerEquipements, 500);
    });
  }
  
  // Filtres avec changement
  const filters = ['typeFilter', 'departmentFilter', 'accessibilityFilter'];
  filters.forEach(filterId => {
    const element = document.getElementById(filterId);
    if (element) {
      element.addEventListener('change', filtrerEquipements);
    }
  });
  
  // Boutons d'action
  const applyFiltersBtn = document.getElementById('applyFilters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', filtrerEquipements);
  }
  
  const resetFiltersBtn = document.getElementById('resetFilters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', reinitialiserFiltres);
  }
  
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exporterEquipements);
  }
  
  // Tri
  const sortSelect = document.getElementById('sortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      trierEquipements(this.value);
    });
  }
}

// Initialisation automatique quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initialisation de la page équipements...');
  
  // Vérifier l'authentification
  if (!window.AuthModule?.isLoggedIn()) {
    window.location.href = 'connexion.html';
    return;
  }
  
  initialiserPageEquipements();
  initialiserEventListeners();
  
  console.log('✅ Page équipements initialisée avec succès');
});

// Export pour utilisation externe
window.EquipementManager = {
  initialiserPageEquipements,
  ajouterEquipement,
  modifierEquipement,
  voirEquipement,
  confirmerSuppression,
  supprimerEquipement,
  filtrerEquipements,
  reinitialiserFiltres,
  exporterEquipements,
  trierEquipements
};

console.log('📋 Module équipements chargé');