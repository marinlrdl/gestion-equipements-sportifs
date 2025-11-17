/**
 * Tests d'authentification - Équipements Sportifs
 * Tests unitaires et d'intégration pour le système d'authentification
 */

class AuthTests {
    constructor() {
        this.auth = window.AuthModule;
        this.testResults = [];
        this.testUser = {
            email: 'test@collectivite.fr',
            password: 'testpassword123',
            role: 'mairie',
            code_commune: '75001'
        };
    }
    
    /**
     * Exécution de tous les tests
     */
    async runAllTests() {
        console.log('🧪 Démarrage des tests d\'authentification');
        
        this.testResults = [];
        
        // Tests d'authentification de base
        await this.testAuthModuleInitialization();
        await this.testConnectionFunctions();
        await this.testPermissionSystem();
        await this.testSessionManagement();
        await this.testRouteGuards();
        
        // Affichage des résultats
        this.displayResults();
        
        return this.testResults;
    }
    
    /**
     * Test d'initialisation du module d'authentification
     */
    async testAuthModuleInitialization() {
        console.log('🔧 Test d\'initialisation du module...');
        
        try {
            // Vérifier que le module existe
            if (!this.auth) {
                throw new Error('AuthModule non trouvé');
            }
            
            // Vérifier les propriétés de base
            const hasRequiredProperties = [
                'currentUser',
                'currentProfile', 
                'isAuthenticated',
                'config',
                'seConnecter',
                'seDeconnecter',
                'obtenirUtilisateurConnecte',
                'verifierPermissions'
            ].every(prop => this.auth.hasOwnProperty(prop));
            
            if (!hasRequiredProperties) {
                throw new Error('Propriétés manquantes dans AuthModule');
            }
            
            this.addTestResult('testAuthModuleInitialization', true, 'Module d\'authentification correctement initialisé');
            
        } catch (error) {
            this.addTestResult('testAuthModuleInitialization', false, error.message);
        }
    }
    
    /**
     * Test des fonctions de connexion/déconnexion
     */
    async testConnectionFunctions() {
        console.log('🔐 Test des fonctions de connexion...');
        
        try {
            // Test de la fonction seConnecter
            if (typeof this.auth.seConnecter !== 'function') {
                throw new Error('Fonction seConnecter non trouvée');
            }
            
            // Test de la fonction seDeconnecter
            if (typeof this.auth.seDeconnecter !== 'function') {
                throw new Error('Fonction seDeconnecter non trouvée');
            }
            
            // Test de la fonction obtenirUtilisateurConnecte
            if (typeof this.auth.obtenirUtilisateurConnecte !== 'function') {
                throw new Error('Fonction obtenirUtilisateurConnecte non trouvée');
            }
            
            this.addTestResult('testConnectionFunctions', true, 'Fonctions de connexion disponibles');
            
        } catch (error) {
            this.addTestResult('testConnectionFunctions', false, error.message);
        }
    }
    
    /**
     * Test du système de permissions
     */
    async testPermissionSystem() {
        console.log('🛡️ Test du système de permissions...');
        
        try {
            // Test de la fonction verifierPermissions
            if (typeof this.auth.verifierPermissions !== 'function') {
                throw new Error('Fonction verifierPermissions non trouvée');
            }
            
            // Test avec des données simulées
            const mockEquipement = {
                commune_code: '75001',
                departement_code: '75',
                region_code: '11'
            };
            
            // Simuler un profil utilisateur mairie
            this.auth.currentProfile = {
                role: 'mairie',
                code_commune: '75001'
            };
            
            const hasPermission = this.auth.verifierPermissions(mockEquipement, 'read');
            
            if (typeof hasPermission !== 'boolean') {
                throw new Error('verifierPermissions ne retourne pas un boolean');
            }
            
            // Test des rôles
            const hasRoleMethods = [
                'isAdmin',
                'isManager', 
                'isMairie',
                'isPrefecture'
            ].every(method => typeof this.auth[method] === 'function');
            
            if (!hasRoleMethods) {
                throw new Error('Méthodes de vérification de rôle manquantes');
            }
            
            this.addTestResult('testPermissionSystem', true, 'Système de permissions fonctionnel');
            
        } catch (error) {
            this.addTestResult('testPermissionSystem', false, error.message);
        }
    }
    
    /**
     * Test de la gestion des sessions
     */
    async testSessionManagement() {
        console.log('⏰ Test de la gestion des sessions...');
        
        try {
            // Vérifier les méthodes de gestion de session
            const sessionMethods = [
                'startSessionTimeout',
                'clearSessionTimeout',
                'startRefreshInterval', 
                'clearRefreshInterval',
                'refreshSession',
                'handleSessionTimeout'
            ];
            
            const hasAllMethods = sessionMethods.every(method => 
                typeof this.auth[method] === 'function'
            );
            
            if (!hasAllMethods) {
                throw new Error('Méthodes de gestion de session manquantes');
            }
            
            // Vérifier la configuration
            if (!this.auth.config || !this.auth.config.sessionTimeout) {
                throw new Error('Configuration de session manquante');
            }
            
            // Vérifier les propriétés de session
            const hasSessionProperties = [
                'sessionTimeout',
                'refreshInterval'
            ].every(prop => this.auth.hasOwnProperty(prop));
            
            if (!hasSessionProperties) {
                throw new Error('Propriétés de session manquantes');
            }
            
            this.addTestResult('testSessionManagement', true, 'Gestion des sessions correctement configurée');
            
        } catch (error) {
            this.addTestResult('testSessionManagement', false, error.message);
        }
    }
    
    /**
     * Test des guards de protection des routes
     */
    async testRouteGuards() {
        console.log('🛡️ Test des guards de protection...');
        
        try {
            const guards = window.RouteGuards;
            
            if (!guards) {
                throw new Error('RouteGuards non trouvé');
            }
            
            // Vérifier les méthodes principales
            const hasGuardMethods = [
                'init',
                'checkCurrentPage',
                'protectAction',
                'canAccessEquipement',
                'filterEquipementsByPermissions',
                'getPermissionInfo'
            ].every(method => typeof guards[method] === 'function');
            
            if (!hasGuardMethods) {
                throw new Error('Méthodes de guards manquantes');
            }
            
            // Vérifier la configuration des pages
            if (!guards.pageRules || Object.keys(guards.pageRules).length === 0) {
                throw new Error('Configuration des règles de protection manquante');
            }
            
            this.addTestResult('testRouteGuards', true, 'Guards de protection fonctionnels');
            
        } catch (error) {
            this.addTestResult('testRouteGuards', false, error.message);
        }
    }
    
    /**
     * Ajout d'un résultat de test
     */
    addTestResult(testName, success, message) {
        this.testResults.push({
            name: testName,
            success: success,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        const status = success ? '✅' : '❌';
        console.log(`${status} ${testName}: ${message}`);
    }
    
    /**
     * Affichage des résultats des tests
     */
    displayResults() {
        console.log('\n📊 RÉSULTATS DES TESTS D\'AUTHENTIFICATION');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.name}: ${result.message}`);
        });
        
        console.log('='.repeat(50));
        console.log(`📈 Résumé: ${passed}/${total} tests réussis`);
        
        if (passed === total) {
            console.log('🎉 Tous les tests sont passés avec succès !');
        } else {
            console.log('⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.');
        }
    }
}

// Fonction utilitaire pour lancer les tests depuis la console
window.runAuthTests = async function() {
    const tests = new AuthTests();
    return await tests.runAllTests();
};

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthTests;
}

console.log('🧪 Module de tests d\'authentification chargé');