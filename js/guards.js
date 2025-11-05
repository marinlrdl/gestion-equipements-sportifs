/**
 * Guards - Protection des routes basées sur les rôles
 * Système de sécurisation des pages selon les permissions utilisateur
 */

class RouteGuards {
    constructor() {
        this.auth = window.AuthModule;
        this.currentPage = this.getCurrentPage();
        this.requiredAuth = [];
        this.redirectPaths = {
            connexion: 'connexion.html',
            dashboard: 'dashboard.html',
            index: 'index.html'
        };
        
        // Configuration des protections par page
        this.pageRules = {
            'dashboard.html': {
                auth: true,
                roles: ['mairie', 'prefecture_departementale', 'prefecture_regionale', 'administrateur']
            },
            'admin.html': {
                auth: true,
                roles: ['administrateur']
            },
            'formulaire-equipement.html': {
                auth: true,
                roles: ['mairie', 'prefecture_departementale', 'prefecture_regionale', 'administrateur'],
                permission: 'write'
            },
            'equipements.html': {
                auth: false, // Page publique
                roles: []
            },
            'carte.html': {
                auth: false, // Page publique
                roles: []
            },
            'detail-equipement.html': {
                auth: true,
                roles: ['mairie', 'prefecture_departementale', 'prefecture_regionale', 'administrateur']
            }
        };
    }
    
    /**
     * Initialisation des guards
     */
    init() {
        if (!this.auth) {
            console.error('❌ AuthModule non disponible');
            return;
        }
        
        console.log('🛡️ Initialisation des guards de protection des routes');
        
        // Vérifier la protection de la page actuelle
        this.checkCurrentPage();
        
        // Écouter les changements d'état d'authentification
        document.addEventListener('user-login', () => {
            this.handleAuthChange();
        });
        
        document.addEventListener('user-logout', () => {
            this.handleLogout();
        });
        
        // Vérification périodique des permissions
        this.startPeriodicCheck();
    }
    
    /**
     * Récupération de la page courante
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        return filename || 'index.html';
    }
    
    /**
     * Vérification de la page courante
     */
    checkCurrentPage() {
        const rule = this.pageRules[this.currentPage];
        
        if (!rule) {
            console.log(`ℹ️ Page "${this.currentPage}" sans protection spéciale`);
            return true;
        }
        
        console.log(`🔍 Vérification de la page "${this.currentPage}"`, rule);
        
        // Vérification d'authentification
        if (rule.auth && !this.auth.isLoggedIn()) {
            this.redirectToLogin();
            return false;
        }
        
        // Vérification des rôles
        if (rule.auth && rule.roles && rule.roles.length > 0) {
            if (!this.hasRequiredRole(rule.roles)) {
                this.redirectToAccessDenied();
                return false;
            }
        }
        
        // Vérification des permissions spécifiques
        if (rule.permission && !this.hasPermission(rule.permission)) {
            this.redirectToAccessDenied();
            return false;
        }
        
        console.log(`✅ Accès autorisé à "${this.currentPage}"`);
        return true;
    }
    
    /**
     * Vérification si l'utilisateur a un des rôles requis
     */
    hasRequiredRole(requiredRoles) {
        const userProfile = this.auth.currentProfile;
        
        if (!userProfile || !userProfile.role) {
            console.warn('⚠️ Profil utilisateur non chargé ou rôle manquant');
            return false;
        }
        
        const hasRole = requiredRoles.includes(userProfile.role);
        
        if (!hasRole) {
            console.warn(`❌ Rôle "${userProfile.role}" non autorisé. Rôles requis:`, requiredRoles);
        }
        
        return hasRole;
    }
    
    /**
     * Vérification si l'utilisateur a la permission requise
     */
    hasPermission(permission) {
        const hasPerm = this.auth.hasPermission(permission);
        
        if (!hasPerm) {
            console.warn(`❌ Permission "${permission}" non accordée`);
        }
        
        return hasPerm;
    }
    
    /**
     * Redirection vers la page de connexion
     */
    redirectToLogin() {
        console.log('🔐 Redirection vers la page de connexion');
        
        // Sauvegarder la page actuelle pour retour après connexion
        sessionStorage.setItem('auth_redirect', window.location.href);
        
        window.location.href = this.redirectPaths.connexion;
    }
    
    /**
     * Redirection vers page d'accès refusé
     */
    redirectToAccessDenied() {
        console.log('🚫 Redirection vers page d\'accès refusé');
        
        const userProfile = this.auth.currentProfile;
        const userRole = userProfile?.role || 'inconnu';
        
        // Afficher un message d'erreur
        if (this.auth.app?.showError) {
            this.auth.app.showError(`Accès refusé pour le rôle "${userRole}"`);
        }
        
        // Rediriger vers le dashboard ou l'index
        const redirectTo = this.auth.isLoggedIn() ? this.redirectPaths.dashboard : this.redirectPaths.index;
        window.location.href = redirectTo;
    }
    
    /**
     * Gestion du changement d'état d'authentification
     */
    handleAuthChange() {
        // Re-vérifier les permissions après connexion
        setTimeout(() => {
            this.checkCurrentPage();
        }, 100);
    }
    
    /**
     * Gestion de la déconnexion
     */
    handleLogout() {
        // Rediriger vers la page d'accueil après déconnexion
        if (this.currentPage !== 'index.html' && this.currentPage !== 'connexion.html') {
            window.location.href = this.redirectPaths.index;
        }
    }
    
    /**
     * Démarrage de la vérification périodique
     */
    startPeriodicCheck() {
        setInterval(() => {
            if (this.auth.isLoggedIn()) {
                this.checkCurrentPage();
            }
        }, 30000); // Vérification toutes les 30 secondes
    }
    
    /**
     * Protection manuelle d'une action
     */
    protectAction(requiredRole = null, requiredPermission = null) {
        if (!this.auth.isLoggedIn()) {
            this.redirectToLogin();
            return false;
        }
        
        if (requiredRole && !this.hasRequiredRole([requiredRole])) {
            this.auth.app?.showError?.(`Action non autorisée. Rôle "${requiredRole}" requis.`);
            return false;
        }
        
        if (requiredPermission && !this.hasPermission(requiredPermission)) {
            this.auth.app?.showError?.(`Action non autorisée. Permission "${requiredPermission}" requise.`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Vérification des permissions sur un équipement
     */
    canAccessEquipement(equipement, action = 'read') {
        if (!this.auth.isLoggedIn()) {
            return false;
        }
        
        // Les administrateurs ont tous les droits
        if (this.auth.currentProfile?.role === 'administrateur') {
            return true;
        }
        
        // Vérification des permissions selon le rôle
        return this.auth.verifierPermissions(equipement, action);
    }
    
    /**
     * Filtrage des équipements selon les permissions utilisateur
     */
    filterEquipementsByPermissions(equipements) {
        if (!this.auth.isLoggedIn()) {
            return [];
        }
        
        if (this.auth.currentProfile?.role === 'administrateur') {
            return equipements; // Les admins voient tout
        }
        
        // Filtrage selon le rôle
        return equipements.filter(equipement => {
            return this.auth.verifierPermissions(equipement, 'read');
        });
    }
    
    /**
     * Obtention des informations de permission pour l'interface
     */
    getPermissionInfo() {
        const userProfile = this.auth.currentProfile;
        
        if (!userProfile) {
            return {
                isAuthenticated: false,
                role: null,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                scope: 'none'
            };
        }
        
        const role = userProfile.role;
        let scope = 'none';
        let canCreate = false;
        let canEdit = false;
        let canDelete = false;
        
        switch (role) {
            case 'administrateur':
                scope = 'global';
                canCreate = true;
                canEdit = true;
                canDelete = true;
                break;
                
            case 'prefecture_regionale':
                scope = 'regional';
                canCreate = true;
                canEdit = true;
                canDelete = true;
                break;
                
            case 'prefecture_departementale':
                scope = 'departmental';
                canCreate = true;
                canEdit = true;
                canDelete = true;
                break;
                
            case 'mairie':
                scope = 'communal';
                canCreate = true;
                canEdit = true;
                canDelete = true;
                break;
        }
        
        return {
            isAuthenticated: true,
            role: role,
            canCreate: canCreate,
            canEdit: canEdit,
            canDelete: canDelete,
            scope: scope,
            profile: userProfile
        };
    }
    
    /**
     * Affichage conditionnel d'éléments selon les permissions
     */
    showElementIfAuthorized(elementId, requiredRole = null, requiredPermission = null) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`⚠️ Élément "${elementId}" non trouvé`);
            return;
        }
        
        const isAuthorized = this.protectAction(requiredRole, requiredPermission);
        element.style.display = isAuthorized ? 'block' : 'none';
    }
    
    /**
     * Désactivation conditionnelle de boutons selon les permissions
     */
    disableButtonIfUnauthorized(buttonId, requiredRole = null, requiredPermission = null) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.warn(`⚠️ Bouton "${buttonId}" non trouvé`);
            return;
        }
        
        const isAuthorized = this.protectAction(requiredRole, requiredPermission);
        button.disabled = !isAuthorized;
        
        if (!isAuthorized) {
            button.title = 'Vous n\'avez pas les permissions nécessaires pour cette action';
        } else {
            button.title = '';
        }
    }
}

// Création de l'instance globale
window.RouteGuards = new RouteGuards();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteGuards;
}

console.log('🛡️ Guards de protection des routes chargés');