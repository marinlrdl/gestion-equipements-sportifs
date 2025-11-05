/**
 * Application principale - Équipements Sportifs
 * Point d'entrée et initialisation de l'application
 */

class SportEquipmentApp {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.modules = new Map();
        this.currentUser = null;
        
        // Éléments DOM principaux
        this.elements = {
            navbar: null,
            main: null,
            sidebar: null,
            loading: null,
            notifications: null
        };
        
        // Configuration
        this.config = window.AppConfig?.APP_CONFIG || {};
    }
    
    /**
     * Initialisation principale de l'application
     */
    async init() {
        try {
            console.log('🚀 Initialisation de l\'application...');
            
            // Vérification des prérequis
            await this.checkPrerequisites();
            
            // Initialisation des éléments DOM
            this.initDOMElements();
            
            // Initialisation des modules
            await this.initModules();
            
            // Configuration des événements globaux
            this.setupGlobalEvents();
            
            // Initialisation de l'interface utilisateur
            this.initUI();
            
            // Chargement des données utilisateur
            await this.loadUserSession();
            
            // Configuration de la route actuelle
            this.setupRouting();
            
            this.isInitialized = true;
            console.log('✅ Application initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showError('Erreur lors du démarrage de l\'application');
        }
    }
    
    /**
     * Vérification des prérequis
     */
    async checkPrerequisites() {
        const errors = [];
        
        // Vérification de Supabase
        if (!window.AppConfig?.supabase) {
            errors.push('Client Supabase non disponible');
        }
        
        // Vérification des dépendances
        if (typeof window.fetch === 'undefined') {
            errors.push('Fetch API non supporté');
        }
        
        // Vérification des modules optionnels
        const leafletAvailable = typeof window.L !== 'undefined';
        const chartAvailable = typeof window.Chart !== 'undefined';
        
        if (!leafletAvailable) {
            console.warn('⚠️ Leaflet (carte) non disponible');
        }
        
        if (!chartAvailable) {
            console.warn('⚠️ Chart.js (graphiques) non disponible');
        }
        
        if (errors.length > 0) {
            throw new Error(`Prérequis manquants: ${errors.join(', ')}`);
        }
    }
    
    /**
     * Initialisation des éléments DOM
     */
    initDOMElements() {
        this.elements = {
            navbar: document.querySelector('.navbar'),
            main: document.querySelector('.main-content'),
            header: document.querySelector('.header'),
            footer: document.querySelector('.footer'),
            loading: document.querySelector('.loading'),
            notifications: this.createNotificationsContainer()
        };
        
        // Ajout de classes CSS pour l'état de chargement
        document.body.classList.add('app-loading');
    }
    
    /**
     * Création du conteneur de notifications
     */
    createNotificationsContainer() {
        let container = document.querySelector('.notifications');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'notifications';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    /**
     * Initialisation des modules
     */
    async initModules() {
        // Module d'authentification
        if (window.AuthModule) {
            this.registerModule('auth', window.AuthModule);
        }
        
        // Module de gestion des équipements
        if (window.EquipmentModule) {
            this.registerModule('equipment', window.EquipmentModule);
        }
        
        // Module de carte
        if (window.MapModule && typeof window.L !== 'undefined') {
            this.registerModule('map', window.MapModule);
        }
        
        // Module de notifications
        this.registerModule('notifications', {
            show: (message, type = 'info', duration = 5000) => {
                this.showNotification(message, type, duration);
            }
        });
        
        // Initialisation des modules
        for (const [name, module] of this.modules) {
            if (module.init && typeof module.init === 'function') {
                try {
                    await module.init(this);
                    console.log(`✅ Module ${name} initialisé`);
                } catch (error) {
                    console.error(`❌ Erreur lors de l'initialisation du module ${name}:`, error);
                }
            }
        }
    }
    
    /**
     * Enregistrement d'un module
     */
    registerModule(name, module) {
        this.modules.set(name, module);
    }
    
    /**
     * Récupération d'un module
     */
    getModule(name) {
        return this.modules.get(name);
    }
    
    /**
     * Configuration des événements globaux
     */
    setupGlobalEvents() {
        // Navigation mobile
        this.setupMobileNavigation();
        
        // Gestion des formulaires
        this.setupFormHandling();
        
        // Gestion du redimensionnement
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
        
        // Gestion de la connexion/déconnexion
        document.addEventListener('user-login', (event) => {
            this.handleUserLogin(event.detail);
        });
        
        document.addEventListener('user-logout', () => {
            this.handleUserLogout();
        });
        
        // Gestion des erreurs globales
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.showError('Une erreur inattendue s\'est produite');
        });
        
        // Gestion des erreurs de promesses
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesse rejetée:', event.reason);
            this.showError('Erreur de communication avec le serveur');
        });
    }
    
    /**
     * Configuration de la navigation mobile
     */
    setupMobileNavigation() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
            
            // Fermeture du menu lors du clic sur un lien
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                });
            });
        }
    }
    
    /**
     * Configuration de la gestion des formulaires
     */
    setupFormHandling() {
        // Validation en temps réel
        document.addEventListener('input', (event) => {
            if (event.target.matches('.form-input, .form-select, .form-textarea')) {
                this.validateField(event.target);
            }
        });
        
        // Soumission des formulaires
        document.addEventListener('submit', (event) => {
            if (event.target.matches('form[data-ajax]')) {
                event.preventDefault();
                this.handleFormSubmit(event.target);
            }
        });
    }
    
    /**
     * Validation d'un champ de formulaire
     */
    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        const type = field.type;
        
        // Suppression des classes de validation précédentes
        field.classList.remove('is-valid', 'is-invalid');
        
        // Validation requise
        if (isRequired && !value) {
            field.classList.add('is-invalid');
            return false;
        }
        
        // Validation de type
        if (value) {
            switch (type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        field.classList.add('is-invalid');
                        return false;
                    }
                    break;
                    
                case 'url':
                    try {
                        new URL(value);
                    } catch {
                        field.classList.add('is-invalid');
                        return false;
                    }
                    break;
            }
        }
        
        field.classList.add('is-valid');
        return true;
    }
    
    /**
     * Gestion de la soumission des formulaires
     */
    async handleFormSubmit(form) {
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn?.textContent;
        
        try {
            // État de chargement
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('loading');
                submitBtn.textContent = 'Envoi en cours...';
            }
            
            // Collecte des données
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Validation du formulaire
            const isValid = this.validateForm(form);
            if (!isValid) {
                throw new Error('Formulaire invalide');
            }
            
            // Envoi de l'événement personnalisé
            const submitEvent = new CustomEvent('form-submit', {
                detail: { form, data }
            });
            document.dispatchEvent(submitEvent);
            
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            this.showError('Erreur lors de l\'envoi du formulaire');
        } finally {
            // Restauration du bouton
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = originalText;
            }
        }
    }
    
    /**
     * Validation complète d'un formulaire
     */
    validateForm(form) {
        const fields = form.querySelectorAll('.form-input, .form-select, .form-textarea');
        let isValid = true;
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Gestion du redimensionnement
     */
    handleResize() {
        // Propagation de l'événement aux modules interested
        document.dispatchEvent(new CustomEvent('app-resize', {
            detail: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        }));
    }
    
    /**
     * Initialisation de l'interface utilisateur
     */
    initUI() {
        // Suppression de la classe de chargement
        document.body.classList.remove('app-loading');
        document.body.classList.add('app-loaded');
        
        // Initialisation des tooltips et popovers
        this.initTooltips();
        
        // Configuration des animations
        this.initAnimations();
        
        // Configuration des modales
        this.initModals();
    }
    
    /**
     * Initialisation des tooltips
     */
    initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    /**
     * Configuration des animations
     */
    initAnimations() {
        // Animation au scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observation des éléments animables
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }
    
    /**
     * Configuration des modales
     */
    initModals() {
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-modal]')) {
                event.preventDefault();
                const modalId = event.target.dataset.modal;
                this.openModal(modalId);
            }
            
            if (event.target.matches('.modal-close, .modal-overlay')) {
                this.closeModal();
            }
        });
        
        // Fermeture avec Escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    /**
     * Ouverture d'une modale
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId) || document.querySelector(`[data-modal-id="${modalId}"]`);
        
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * Fermeture d'une modale
     */
    closeModal() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
    
    /**
     * Chargement de la session utilisateur
     */
    async loadUserSession() {
        const authModule = this.getModule('auth');
        
        if (authModule && authModule.getCurrentUser) {
            try {
                this.currentUser = await authModule.getCurrentUser();
                this.updateUIForUser();
            } catch (error) {
                console.log('Aucune session active');
            }
        }
    }
    
    /**
     * Mise à jour de l'interface selon l'utilisateur
     */
    updateUIForUser() {
        const userElements = document.querySelectorAll('[data-user-dependent]');
        
        userElements.forEach(element => {
            if (this.currentUser) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
        
        // Mise à jour des éléments d'interface
        const userNameElement = document.querySelector('#userName');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.email || 'Utilisateur';
        }
    }
    
    /**
     * Gestion de la connexion utilisateur
     */
    handleUserLogin(user) {
        this.currentUser = user;
        this.updateUIForUser();
        this.showNotification('Connexion réussie', 'success');
        
        // Redirection si nécessaire
        const redirectUrl = sessionStorage.getItem('auth_redirect');
        if (redirectUrl) {
            sessionStorage.removeItem('auth_redirect');
            window.location.href = redirectUrl;
        }
    }
    
    /**
     * Gestion de la déconnexion utilisateur
     */
    handleUserLogout() {
        this.currentUser = null;
        this.updateUIForUser();
        this.showNotification('Déconnexion réussie', 'info');
        
        // Redirection vers l'accueil si sur une page protégée
        if (window.location.pathname !== '/' && !window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
    
    /**
     * Configuration du routing
     */
    setupRouting() {
        // Récupération de la page actuelle
        const currentPage = this.getCurrentPage();
        this.updateNavigation(currentPage);
        
        // Gestion des liens internes
        document.addEventListener('click', (event) => {
            if (event.target.matches('a[href^="./"], a[href^="../"]')) {
                const href = event.target.getAttribute('href');
                
                if (href && !href.startsWith('#') && !event.target.hasAttribute('download')) {
                    event.preventDefault();
                    this.navigateTo(href);
                }
            }
        });
    }
    
    /**
     * Récupération de la page actuelle
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename === '' || filename === 'index.html') return 'index';
        return filename.replace('.html', '');
    }
    
    /**
     * Mise à jour de la navigation
     */
    updateNavigation(currentPage) {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * Navigation vers une page
     */
    navigateTo(url) {
        // Animation de sortie
        document.body.classList.add('page-transition-out');
        
        setTimeout(() => {
            window.location.href = url;
        }, 150);
    }
    
    /**
     * Affichage d'une notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        this.elements.notifications.appendChild(notification);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Gestion de la fermeture
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.hideNotification(notification);
        });
        
        // Fermeture automatique
        if (duration > 0) {
            setTimeout(() => {
                this.hideNotification(notification);
            }, duration);
        }
    }
    
    /**
     * Icône pour le type de notification
     */
    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
    
    /**
     * Masquage d'une notification
     */
    hideNotification(notification) {
        notification.classList.remove('show');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    /**
     * Affichage d'une erreur
     */
    showError(message, duration = 7000) {
        this.showNotification(message, 'error', duration);
    }
    
    /**
     * Affichage d'un tooltip
     */
    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);
        
        element.tooltipElement = tooltip;
    }
    
    /**
     * Masquage du tooltip
     */
    hideTooltip() {
        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => {
            tooltip.classList.remove('show');
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        });
    }
    
    /**
     * Utilitaire de debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Récupération d'une information de configuration
     */
    getConfig(key, defaultValue = null) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) {
                return defaultValue;
            }
        }
        
        return value;
    }
}

// Initialisation de l'application quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    // Création de l'instance globale
    window.sportApp = new SportEquipmentApp();
    
    // Initialisation
    window.sportApp.init();
});

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportEquipmentApp;
}

console.log('🏃‍♂️ Script app.js chargé');