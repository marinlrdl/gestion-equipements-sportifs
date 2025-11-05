/**
 * Module d'authentification - Équipements Sportifs
 * Gestion de la connexion, déconnexion et session utilisateur
 */

class AuthModule {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionTimeout = null;
        this.refreshInterval = null;
        
        // Configuration
        this.config = {
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 heures
            refreshInterval: 15 * 60 * 1000,     // 15 minutes
            redirectAfterLogin: 'dashboard.html',
            redirectAfterLogout: 'index.html'
        };
    }
    
    /**
     * Initialisation du module d'authentification
     */
    init(app) {
        this.app = app;
        this.supabase = window.AppConfig?.supabase;
        
        if (!this.supabase) {
            console.warn('⚠️ Supabase non disponible - authentification limitée');
            return;
        }
        
        // Configuration des événements Supabase
        this.setupSupabaseListeners();
        
        // Vérification de la session existante
        this.checkExistingSession();
        
        // Configuration des formulaires de connexion
        this.setupAuthForms();
        
        console.log('✅ Module d\'authentification initialisé');
    }
    
    /**
     * Configuration des listeners Supabase
     */
    setupSupabaseListeners() {
        // Écoute des changements d'état d'authentification
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Changement d\'état d\'authentification:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    this.handleSignIn(session);
                    break;
                case 'SIGNED_OUT':
                    this.handleSignOut();
                    break;
                case 'TOKEN_REFRESHED':
                    this.handleTokenRefresh(session);
                    break;
                case 'USER_UPDATED':
                    this.handleUserUpdate(session);
                    break;
            }
        });
    }
    
    /**
     * Vérification de la session existante
     */
    async checkExistingSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) {
                console.error('Erreur lors de la récupération de la session:', error);
                return;
            }
            
            if (session) {
                this.currentUser = session.user;
                this.isAuthenticated = true;
                this.startSessionTimeout();
                this.startRefreshInterval();
                
                console.log('✅ Session existante trouvée:', this.currentUser.email);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de session:', error);
        }
    }
    
    /**
     * Configuration des formulaires d'authentification
     */
    setupAuthForms() {
        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(loginForm);
            });
        }
        
        // Bouton de déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Bouton de création de compte
        const signupBtn = document.getElementById('signupBtn');
        if (signupBtn) {
            signupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignupForm();
            });
        }
        
        // Toggle mot de passe
        const passwordToggle = document.getElementById('passwordToggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }
    }
    
    /**
     * Gestion de la connexion
     */
    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');
        
        // Validation
        if (!email || !password) {
            this.app.showError('Veuillez remplir tous les champs');
            return;
        }
        
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.textContent;
        
        try {
            // État de chargement
            submitBtn.disabled = true;
            submitBtn.textContent = 'Connexion...';
            
            // Connexion avec Supabase
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                throw error;
            }
            
            if (data.user) {
                console.log('✅ Connexion réussie:', data.user.email);
                
                // Sauvegarde de la préférence "Se souvenir de moi"
                if (remember) {
                    localStorage.setItem('auth_remember', 'true');
                } else {
                    localStorage.removeItem('auth_remember');
                }
                
                // Redirection
                const redirectUrl = sessionStorage.getItem('auth_redirect') || this.config.redirectAfterLogin;
                sessionStorage.removeItem('auth_redirect');
                
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ Erreur de connexion:', error);
            
            let errorMessage = 'Erreur de connexion';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou mot de passe incorrect';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
            }
            
            this.app.showError(errorMessage);
        } finally {
            // Restauration du bouton
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    /**
     * Gestion de la déconnexion
     */
    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                throw error;
            }
            
            console.log('✅ Déconnexion réussie');
            
            // Nettoyage local
            this.currentUser = null;
            this.isAuthenticated = false;
            this.clearSessionTimeout();
            this.clearRefreshInterval();
            
            // Événement de déconnexion
            document.dispatchEvent(new CustomEvent('user-logout'));
            
        } catch (error) {
            console.error('❌ Erreur lors de la déconnexion:', error);
            this.app.showError('Erreur lors de la déconnexion');
        }
    }
    
    /**
     * Création d'un compte
     */
    async signup(email, password, userData = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });
            
            if (error) {
                throw error;
            }
            
            if (data.user) {
                console.log('✅ Compte créé:', data.user.email);
                this.app.showNotification('Compte créé avec succès. Vérifiez votre email pour confirmer votre compte.', 'success');
                return { success: true, user: data.user };
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la création de compte:', error);
            
            let errorMessage = 'Erreur lors de la création du compte';
            
            if (error.message.includes('User already registered')) {
                errorMessage = 'Un compte avec cet email existe déjà';
            } else if (error.message.includes('Password should be at least')) {
                errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
            }
            
            this.app.showError(errorMessage);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Réinitialisation du mot de passe
     */
    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) {
                throw error;
            }
            
            this.app.showNotification('Email de réinitialisation envoyé', 'success');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation:', error);
            this.app.showError('Erreur lors de l\'envoi de l\'email de réinitialisation');
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Gestion de la connexion réussie
     */
    handleSignIn(session) {
        this.currentUser = session.user;
        this.isAuthenticated = true;
        this.startSessionTimeout();
        this.startRefreshInterval();
        
        // Événement de connexion
        document.dispatchEvent(new CustomEvent('user-login', {
            detail: { user: this.currentUser }
        }));
        
        console.log('🔐 Utilisateur connecté:', this.currentUser.email);
    }
    
    /**
     * Gestion de la déconnexion
     */
    handleSignOut() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.clearSessionTimeout();
        this.clearRefreshInterval();
        
        // Événement de déconnexion
        document.dispatchEvent(new CustomEvent('user-logout'));
        
        console.log('🔓 Utilisateur déconnecté');
    }
    
    /**
     * Gestion du rafraîchissement du token
     */
    handleTokenRefresh(session) {
        console.log('🔄 Token rafraîchi');
    }
    
    /**
     * Gestion de la mise à jour utilisateur
     */
    handleUserUpdate(session) {
        this.currentUser = session.user;
        console.log('👤 Profil utilisateur mis à jour');
    }
    
    /**
     * Démarrage du timeout de session
     */
    startSessionTimeout() {
        this.clearSessionTimeout();
        
        this.sessionTimeout = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.config.sessionTimeout);
    }
    
    /**
     * Nettoyage du timeout de session
     */
    clearSessionTimeout() {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }
    
    /**
     * Démarrage de l'intervalle de rafraîchissement
     */
    startRefreshInterval() {
        this.clearRefreshInterval();
        
        this.refreshInterval = setInterval(() => {
            this.refreshSession();
        }, this.config.refreshInterval);
    }
    
    /**
     * Nettoyage de l'intervalle de rafraîchissement
     */
    clearRefreshInterval() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    /**
     * Gestion du timeout de session
     */
    handleSessionTimeout() {
        this.app.showError('Session expirée. Veuillez vous reconnecter.', 10000);
        this.logout();
    }
    
    /**
     * Rafraîchissement de la session
     */
    async refreshSession() {
        try {
            const { data, error } = await this.supabase.auth.refreshSession();
            
            if (error) {
                console.error('Erreur lors du rafraîchissement:', error);
                this.logout();
                return;
            }
            
            if (data.session) {
                this.startSessionTimeout(); // Redémarre le timeout
            }
            
        } catch (error) {
            console.error('Erreur lors du rafraîchissement de session:', error);
        }
    }
    
    /**
     * Vérification si l'utilisateur est connecté
     */
    isLoggedIn() {
        return this.isAuthenticated && this.currentUser;
    }
    
    /**
     * Récupération de l'utilisateur actuel
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Vérification des permissions
     */
    hasPermission(permission) {
        if (!this.currentUser) {
            return false;
        }
        
        // Vérification des métadonnées utilisateur
        const userMetadata = this.currentUser.user_metadata || {};
        const appMetadata = this.currentUser.app_metadata || {};
        
        return userMetadata[permission] || appMetadata[permission] || false;
    }
    
    /**
     * Vérification du rôle admin
     */
    isAdmin() {
        return this.hasPermission('admin') || this.hasPermission('super_admin');
    }
    
    /**
     * Vérification du rôle gestionnaire
     */
    isManager() {
        return this.hasPermission('manager') || this.isAdmin();
    }
    
    /**
     * Protection d'une page
     */
    requireAuth(redirectTo = 'connexion.html') {
        if (!this.isLoggedIn()) {
            sessionStorage.setItem('auth_redirect', window.location.pathname);
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }
    
    /**
     * Protection d'une page admin
     */
    requireAdmin(redirectTo = 'index.html') {
        if (!this.requireAuth(redirectTo)) {
            return false;
        }
        
        if (!this.isAdmin()) {
            this.app.showError('Accès refusé. Droits administrateur requis.');
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }
    
    /**
     * Affichage du formulaire d'inscription
     */
    showSignupForm() {
        // Création d'une modale d'inscription
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Créer un compte</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="signupForm">
                        <div class="form-group">
                            <label for="signupEmail" class="form-label">Email</label>
                            <input type="email" id="signupEmail" name="email" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="signupPassword" class="form-label">Mot de passe</label>
                            <input type="password" id="signupPassword" name="password" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="signupConfirmPassword" class="form-label">Confirmer le mot de passe</label>
                            <input type="password" id="signupConfirmPassword" name="confirmPassword" class="form-input" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Créer le compte</button>
                            <button type="button" class="btn btn-secondary modal-close">Annuler</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Gestion du formulaire
        const signupForm = modal.querySelector('#signupForm');
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(signupForm);
            const email = formData.get('email');
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            if (password !== confirmPassword) {
                this.app.showError('Les mots de passe ne correspondent pas');
                return;
            }
            
            const result = await this.signup(email, password);
            if (result.success) {
                modal.remove();
            }
        });
        
        // Gestion de la fermeture
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    /**
     * Basculement de la visibilité du mot de passe
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleBtn = document.getElementById('passwordToggle');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '<i class="icon-eye-off"></i>';
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '<i class="icon-eye"></i>';
        }
    }
    
    /**
     * Mise à jour du profil utilisateur
     */
    async updateProfile(updates) {
        try {
            const { data, error } = await this.supabase.auth.updateUser({
                data: updates
            });
            
            if (error) {
                throw error;
            }
            
            this.currentUser = data.user;
            this.app.showNotification('Profil mis à jour avec succès', 'success');
            
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            this.app.showError('Erreur lors de la mise à jour du profil');
            return { success: false, error: error.message };
        }
    }
}

// Création de l'instance globale
window.AuthModule = new AuthModule();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthModule;
}

console.log('🔐 Module d\'authentification chargé');