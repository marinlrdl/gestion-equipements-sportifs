/**
 * js/admin.js
 * Gestion des utilisateurs (administrateur uniquement)
 */

let utilisateurs = [];

/**
 * Initialise la page admin
 */
async function initialiserAdmin() {
  const user = await obtenirUtilisateurConnecte();
  
  if (!user || user.role !== 'administrateur') {
    alert('Accès refusé : administrateur uniquement');
    window.location.href = 'dashboard.html';
    return;
  }
  
  await chargerUtilisateurs();
  afficherTableauUtilisateurs();
}

/**
 * Charge tous les utilisateurs
 */
async function chargerUtilisateurs() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    utilisateurs = data;
  } catch (erreur) {
    console.error('Erreur chargement utilisateurs:', erreur);
  }
}

/**
 * Affiche le tableau des utilisateurs
 */
function afficherTableauUtilisateurs() {
  const tbody = document.getElementById('tableau-users-body');
  if (!tbody) {
    console.error('❌ Élément tableau-users-body non trouvé');
    return;
  }
  
  tbody.innerHTML = '';
  
  utilisateurs.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.email}</td>
      <td>${traduireRole(user.role)}</td>
      <td>${user.nom_entite || '-'}</td>
      <td>${obtenirPerimetre(user)}</td>
      <td>
        <span class="badge ${user.active ? 'badge-actif' : 'badge-inactif'}">
          ${user.active ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td class="actions">
        <button onclick="modifierUtilisateur('${user.id}')" class="btn-modifier">✏️ Modifier</button>
        <button onclick="toggleActif('${user.id}', ${!user.active})" class="btn-toggle">
          ${user.active ? '🔒 Désactiver' : '🔓 Activer'}
        </button>
        <button onclick="confirmerSuppressionUser('${user.id}')" class="btn-supprimer">🗑️ Supprimer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  const nbUsersElement = document.getElementById('nb-users');
  if (nbUsersElement) {
    nbUsersElement.textContent = utilisateurs.length;
  }
}

function traduireRole(role) {
  const roles = {
    'mairie': 'Mairie',
    'prefecture_departementale': 'Préfecture départementale',
    'prefecture_regionale': 'Préfecture régionale',
    'administrateur': 'Administrateur'
  };
  return roles[role] || role;
}

function obtenirPerimetre(user) {
  if (user.role === 'mairie') return `Commune ${user.code_commune || '-'}`;
  if (user.role === 'prefecture_departementale') return `Département ${user.code_departement || '-'}`;
  if (user.role === 'prefecture_regionale') return `Région ${user.code_region || '-'}`;
  if (user.role === 'administrateur') return 'France entière';
  return '-';
}

/**
 * Crée un nouvel utilisateur (simplifié, le mot de passe est géré côté Auth)
 */
async function creerUtilisateur(event) {
  event.preventDefault();
  
  const email = document.getElementById('user_email')?.value.trim();
  const password = document.getElementById('user_password')?.value;
  const role = document.getElementById('user_role')?.value;
  
  const userData = {
    role: role,
    nom_entite: document.getElementById('user_nom_entite')?.value.trim() || null,
    code_commune: document.getElementById('user_code_commune')?.value.trim() || null,
    code_departement: document.getElementById('user_code_departement')?.value.trim() || null,
    code_region: document.getElementById('user_code_region')?.value.trim() || null,
    telephone: document.getElementById('user_telephone')?.value.trim() || null,
    active: true
  };
  
  if (!validerUtilisateur(userData, password)) return;
  
  try {
    // 1. Créer dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });
    
    if (authError) throw authError;
    
    // 2. Créer dans la table 'users'
    userData.id = authData.user.id;
    userData.email = email;
    
    const { error } = await supabase
      .from('users')
      .insert([userData]);
    
    if (error) throw error;
    
    alert('Utilisateur créé avec succès');
    
    // Fermer la modale
    fermerModaleUtilisateur();
    
    // Recharger
    await chargerUtilisateurs();
    afficherTableauUtilisateurs();
    
  } catch (erreur) {
    console.error('Erreur création utilisateur:', erreur);
    alert('Erreur lors de la création : ' + erreur.message);
  }
}

function validerUtilisateur(userData, password) {
  if (!password || password.length < 6) { alert('Le mot de passe doit faire 6 caractères minimum'); return false; }
  if (userData.role === 'mairie' && !userData.code_commune) { alert('Code commune requis'); return false; }
  if (userData.role === 'prefecture_departementale' && !userData.code_departement) { alert('Code département requis'); return false; }
  if (userData.role === 'prefecture_regionale' && !userData.code_region) { alert('Code région requis'); return false; }
  return true;
}

async function toggleActif(userId, nouvelEtat) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ active: nouvelEtat })
      .eq('id', userId);
    
    if (error) throw error;
    await chargerUtilisateurs();
    afficherTableauUtilisateurs();
  } catch (erreur) {
    console.error('Erreur toggle actif:', erreur);
    alert('Erreur lors de la modification : ' + erreur.message);
  }
}

async function supprimerUtilisateur(userId) {
  try {
    // 1. Supprimer de Auth (Admin API)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;
    
    // 2. Supprimer de la table 'users' (déjà fait par trigger, mais sécurité)
    const { error } = await supabase.from('users').delete().eq('id', userId);
    
    alert('Utilisateur supprimé avec succès');
    await chargerUtilisateurs();
    afficherTableauUtilisateurs();
  } catch (erreur) {
    console.error('Erreur suppression:', erreur);
    alert('Erreur : ' + erreur.message);
  }
}

function confirmerSuppressionUser(userId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
    supprimerUtilisateur(userId);
  }
}

async function modifierUtilisateur(userId) {
  const utilisateur = utilisateurs.find(u => u.id === userId);
  if (!utilisateur) {
    alert('Utilisateur non trouvé');
    return;
  }
  
  // Afficher la modale avec les données pré-remplies
  afficherModaleUtilisateur(utilisateur);
}

function afficherModaleUtilisateur(utilisateur = null) {
  const isEdit = utilisateur !== null;
  
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
        <button class="modal-close" onclick="fermerModaleUtilisateur()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="utilisateurForm">
          <div class="form-group">
            <label for="user_email" class="form-label">Email *</label>
            <input type="email" id="user_email" name="email" class="form-input" 
                   value="${utilisateur?.email || ''}" ${isEdit ? 'readonly' : ''} required>
          </div>
          
          ${!isEdit ? `
          <div class="form-group">
            <label for="user_password" class="form-label">Mot de passe *</label>
            <input type="password" id="user_password" name="password" class="form-input" required>
          </div>
          ` : ''}
          
          <div class="form-group">
            <label for="user_role" class="form-label">Rôle *</label>
            <select id="user_role" name="role" class="form-select" required onchange="updateCodeFields()">
              <option value="">Sélectionner un rôle</option>
              <option value="mairie" ${utilisateur?.role === 'mairie' ? 'selected' : ''}>Mairie</option>
              <option value="prefecture_departementale" ${utilisateur?.role === 'prefecture_departementale' ? 'selected' : ''}>Préfecture départementale</option>
              <option value="prefecture_regionale" ${utilisateur?.role === 'prefecture_regionale' ? 'selected' : ''}>Préfecture régionale</option>
              <option value="administrateur" ${utilisateur?.role === 'administrateur' ? 'selected' : ''}>Administrateur</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="user_nom_entite" class="form-label">Nom de l'entité *</label>
            <input type="text" id="user_nom_entite" name="nom_entite" class="form-input" 
                   value="${utilisateur?.nom_entite || ''}" required>
          </div>
          
          <div class="form-group code-commune-group" style="display: none;">
            <label for="user_code_commune" class="form-label">Code commune *</label>
            <input type="text" id="user_code_commune" name="code_commune" class="form-input" 
                   value="${utilisateur?.code_commune || ''}" placeholder="Ex: 01001">
          </div>
          
          <div class="form-group code-departement-group" style="display: none;">
            <label for="user_code_departement" class="form-label">Code département *</label>
            <input type="text" id="user_code_departement" name="code_departement" class="form-input" 
                   value="${utilisateur?.code_departement || ''}" placeholder="Ex: 01">
          </div>
          
          <div class="form-group code-region-group" style="display: none;">
            <label for="user_code_region" class="form-label">Code région *</label>
            <input type="text" id="user_code_region" name="code_region" class="form-input" 
                   value="${utilisateur?.code_region || ''}" placeholder="Ex: 84">
          </div>
          
          <div class="form-group">
            <label for="user_telephone" class="form-label">Téléphone</label>
            <input type="tel" id="user_telephone" name="telephone" class="form-input" 
                   value="${utilisateur?.telephone || ''}">
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="user_active" name="active" ${utilisateur?.active ? 'checked' : ''}>
              <span class="checkbox-custom"></span>
              Utilisateur actif
            </label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              ${isEdit ? 'Modifier' : 'Créer'}
            </button>
            <button type="button" class="btn btn-secondary" onclick="fermerModaleUtilisateur()">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Gestion du formulaire
  const form = modal.querySelector('#utilisateurForm');
  form.addEventListener('submit', isEdit ? modifierUtilisateurHandler : creerUtilisateur);
  
  // Appliquer les champs visibles
  setTimeout(() => updateCodeFields(), 100);
}

function fermerModaleUtilisateur() {
  const modal = document.querySelector('.modal.show');
  if (modal) {
    modal.remove();
  }
}

async function modifierUtilisateurHandler(event) {
  event.preventDefault();
  
  const userId = event.target.closest('.modal').dataset.userId;
  const email = document.getElementById('user_email')?.value.trim();
  
  const userData = {
    role: document.getElementById('user_role')?.value,
    nom_entite: document.getElementById('user_nom_entite')?.value.trim() || null,
    code_commune: document.getElementById('user_code_commune')?.value.trim() || null,
    code_departement: document.getElementById('user_code_departement')?.value.trim() || null,
    code_region: document.getElementById('user_code_region')?.value.trim() || null,
    telephone: document.getElementById('user_telephone')?.value.trim() || null,
    active: document.getElementById('user_active')?.checked
  };
  
  if (!validerModification(userData)) return;
  
  try {
    const { error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId);
    
    if (error) throw error;
    
    alert('Utilisateur modifié avec succès');
    fermerModaleUtilisateur();
    await chargerUtilisateurs();
    afficherTableauUtilisateurs();
    
  } catch (erreur) {
    console.error('Erreur modification utilisateur:', erreur);
    alert('Erreur lors de la modification : ' + erreur.message);
  }
}

function validerModification(userData) {
  if (userData.role === 'mairie' && !userData.code_commune) { alert('Code commune requis'); return false; }
  if (userData.role === 'prefecture_departementale' && !userData.code_departement) { alert('Code département requis'); return false; }
  if (userData.role === 'prefecture_regionale' && !userData.code_region) { alert('Code région requis'); return false; }
  return true;
}

function updateCodeFields() {
  const role = document.getElementById('user_role')?.value;
  
  // Masquer tous les champs de code
  document.querySelectorAll('.code-commune-group, .code-departement-group, .code-region-group').forEach(group => {
    group.style.display = 'none';
  });
  
  // Afficher le champ approprié selon le rôle
  switch (role) {
    case 'mairie':
      document.querySelector('.code-commune-group').style.display = 'block';
      break;
    case 'prefecture_departementale':
      document.querySelector('.code-departement-group').style.display = 'block';
      break;
    case 'prefecture_regionale':
      document.querySelector('.code-region-group').style.display = 'block';
      break;
  }
}

/**
 * Gestion des onglets d'administration
 */
function initialiserOngletsAdmin() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      
      // Désactiver tous les onglets
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activer l'onglet sélectionné
      button.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
        
        // Charger le contenu spécifique selon l'onglet
        chargerContenuOnglet(targetTab);
      }
    });
  });
}

/**
 * Charge le contenu spécifique selon l'onglet
 */
function chargerContenuOnglet(tabName) {
  switch (tabName) {
    case 'overview':
      chargerVueEnsemble();
      break;
    case 'users':
      // Les utilisateurs sont déjà chargés lors de l'initialisation
      break;
    case 'data':
      chargerGestionDonnees();
      break;
    case 'logs':
      chargerGestionLogs();
      break;
    case 'settings':
      chargerConfiguration();
      break;
  }
}

/**
 * Charge la vue d'ensemble
 */
async function chargerVueEnsemble() {
  try {
    // Charger les statistiques
    const { data: statsData } = await supabase.rpc('get_system_stats');
    
    if (statsData) {
      const [usersCount, equipmentCount, sessionsCount] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('equipments').select('id', { count: 'exact', head: true }),
        supabase.rpc('get_active_sessions_count')
      ]);
      
      document.getElementById('totalUsers')?.textContent = usersCount.count || 0;
      document.getElementById('totalRecords')?.textContent = equipmentCount.count || 0;
      document.getElementById('activeSessions')?.textContent = sessionsCount || 0;
    }
    
    // Charger l'activité récente
    chargerActiviteRecente();
    
    // Charger les alertes système
    chargerAlertesSysteme();
    
  } catch (erreur) {
    console.error('Erreur chargement vue ensemble:', erreur);
  }
}

/**
 * Charge l'activité récente
 */
function chargerActiviteRecente() {
  // Placeholder pour l'activité récente
  const recentActivity = document.getElementById('recentActivity');
  if (recentActivity) {
    recentActivity.innerHTML = `
      <div class="activity-item">
        <div class="activity-icon create">+</div>
        <div class="activity-content">
          <div class="activity-title">Nouveau équipement ajouté</div>
          <div class="activity-description">Terrain de football à Lyon 3e</div>
          <div class="activity-time">Il y a 2 heures</div>
        </div>
      </div>
    `;
  }
}

/**
 * Charge les alertes système
 */
function chargerAlertesSysteme() {
  const systemAlerts = document.getElementById('systemAlerts');
  if (systemAlerts) {
    systemAlerts.innerHTML = `
      <div class="no-alerts">
        <i class="icon-check-circle"></i>
        <p>Aucune alerte en cours</p>
      </div>
    `;
  }
}

/**
 * Charge la gestion des données
 */
function chargerGestionDonnees() {
  // Placeholder pour la gestion des données
  const dataStats = document.getElementById('dataStats');
  if (dataStats) {
    dataStats.innerHTML = `
      <div class="data-stat-item">
        <div class="data-stat-number">1,247</div>
        <div class="data-stat-label">Équipements total</div>
      </div>
      <div class="data-stat-item">
        <div class="data-stat-number">156</div>
        <div class="data-stat-label">Communes couvertes</div>
      </div>
      <div class="data-stat-item">
        <div class="data-stat-number">23</div>
        <div class="data-stat-label">Départements couverts</div>
      </div>
      <div class="data-stat-item">
        <div class="data-stat-number">12</div>
        <div class="data-stat-label">Régions couvertes</div>
      </div>
    `;
  }
}

/**
 * Charge la gestion des logs
 */
function chargerGestionLogs() {
  // Placeholder pour les logs
  const logsList = document.getElementById('logsList');
  if (logsList) {
    logsList.innerHTML = `
      <div class="log-entry">
        <div class="log-timestamp">2024-11-05 18:20:15</div>
        <div class="log-level info">INFO</div>
        <div class="log-message">Utilisateur admin connecté</div>
      </div>
      <div class="log-entry">
        <div class="log-timestamp">2024-11-05 18:15:42</div>
        <div class="log-level info">INFO</div>
        <div class="log-message">Nouvel équipement créé</div>
      </div>
    `;
  }
}

/**
 * Charge la configuration
 */
function chargerConfiguration() {
  // La configuration est déjà affichée statiquement dans le HTML
  console.log('Configuration chargée');
}

/**
 * Gestion des événements de l'interface
 */
function initialiserEvenementsAdmin() {
  // Bouton nouvel utilisateur
  const addUserBtn = document.getElementById('addUserBtn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', () => afficherModaleUtilisateur());
  }
  
  // Filtres utilisateurs
  const userSearch = document.getElementById('userSearch');
  if (userSearch) {
    userSearch.addEventListener('input', filtrerUtilisateurs);
  }
  
  const userRoleFilter = document.getElementById('userRoleFilter');
  if (userRoleFilter) {
    userRoleFilter.addEventListener('change', filtrerUtilisateurs);
  }
  
  const userStatusFilter = document.getElementById('userStatusFilter');
  if (userStatusFilter) {
    userStatusFilter.addEventListener('change', filtrerUtilisateurs);
  }
}

/**
 * Filtre les utilisateurs selon les critères
 */
function filtrerUtilisateurs() {
  const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
  const roleFilter = document.getElementById('userRoleFilter')?.value || '';
  const statusFilter = document.getElementById('userStatusFilter')?.value || '';
  
  const utilisateursFiltres = utilisateurs.filter(user => {
    const matchSearch = user.email.toLowerCase().includes(searchTerm) || 
                       (user.nom_entite && user.nom_entite.toLowerCase().includes(searchTerm));
    const matchRole = !roleFilter || user.role === roleFilter;
    const matchStatus = !statusFilter || 
                       (statusFilter === 'active' && user.active) ||
                       (statusFilter === 'inactive' && !user.active);
    
    return matchSearch && matchRole && matchStatus;
  });
  
  // Afficher les utilisateurs filtrés
  const tbody = document.getElementById('tableau-users-body');
  if (tbody) {
    tbody.innerHTML = '';
    utilisateursFiltres.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.email}</td>
        <td>${traduireRole(user.role)}</td>
        <td>${user.nom_entite || '-'}</td>
        <td>${obtenirPerimetre(user)}</td>
        <td>
          <span class="badge ${user.active ? 'badge-actif' : 'badge-inactif'}">
            ${user.active ? 'Actif' : 'Inactif'}
          </span>
        </td>
        <td class="actions">
          <button onclick="modifierUtilisateur('${user.id}')" class="btn-modifier">✏️ Modifier</button>
          <button onclick="toggleActif('${user.id}', ${!user.active})" class="btn-toggle">
            ${user.active ? '🔒 Désactiver' : '🔓 Activer'}
          </button>
          <button onclick="confirmerSuppressionUser('${user.id}')" class="btn-supprimer">🗑️ Supprimer</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

/**
 * Initialisation de la page admin au chargement du DOM
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialiser les onglets
  initialiserOngletsAdmin();
  
  // Initialiser les événements
  initialiserEvenementsAdmin();
  
  // Initialiser l'administration
  await initialiserAdmin();
});

console.log('✅ Module admin.js chargé');