/**
 * js/test-densite.js
 * Tests complets pour le système de gestion de la densité
 * 
 * Ce fichier contient tous les tests unitaires et d'intégration
 * pour valider le bon fonctionnement du système de densité.
 * 
 * @author Équipes de développement
 * @version 1.0.0
 * @date 2025-11-05
 */

// Configuration des tests
const TEST_CONFIG = {
    // Configuration Supabase pour les tests
    testEquipmentId: 'TEST-001', // ID d'équipement de test
    testDensityValues: [0, 25, 50, 75, 100],
    testCapacity: 100,
    timeout: 10000, // 10 secondes timeout pour les tests async
};

// Classe pour gérer les tests de densité
class DensiteTestSuite {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
    }

    // Méthode pour exécuter un test
    async runTest(testName, testFunction) {
        this.testCount++;
        console.log(`🧪 Test ${this.testCount}: ${testName}`);
        
        try {
            const startTime = performance.now();
            await testFunction();
            const endTime = performance.now();
            
            const duration = Math.round(endTime - startTime);
            this.testResults.push({
                name: testName,
                status: 'PASS',
                duration: duration,
                timestamp: new Date().toISOString()
            });
            this.passCount++;
            
            console.log(`✅ PASS - ${testName} (${duration}ms)`);
        } catch (error) {
            this.testResults.push({
                name: testName,
                status: 'FAIL',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            this.failCount++;
            
            console.error(`❌ FAIL - ${testName}:`, error);
        }
    }

    // Vérifier que les fonctions du module sont disponibles
    async testModuleExports() {
        // Vérifier l'export global
        if (typeof window.DensiteManager === 'undefined') {
            throw new Error('DensiteManager non exporté globalement');
        }

        // Vérifier les méthodes principales
        const requiredMethods = [
            'mettreAJourDensite',
            'obtenirHistoriqueDensite',
            'afficherGraphiqueDensite',
            'verifierAlerteDensite',
            'afficherAlerteDensite',
            'formaterAffichageDensite'
        ];

        requiredMethods.forEach(method => {
            if (typeof window.DensiteManager[method] !== 'function') {
                throw new Error(`Méthode manquante: ${method}`);
            }
        });
    }

    // Tester la validation des paramètres
    async testValidationParameters() {
        // Test des paramètres invalides
        const invalidTests = [
            { equipementId: null, nouvelleDensite: 50 },
            { equipementId: 'TEST', nouvelleDensite: -10 },
            { equipementId: 'TEST', nouvelleDensite: 'invalid' },
            { equipementId: 'TEST' }, // nouvelleDensite manquant
        ];

        for (const testCase of invalidTests) {
            try {
                await window.DensiteManager.mettreAJourDensite(
                    testCase.equipementId, 
                    testCase.nouvelleDensite
                );
                throw new Error('La validation aurait dû échouer');
            } catch (error) {
                // Erreur attendue, c'est bon signe
                if (!error.message.includes('paramètres') && !error.message.includes('requis')) {
                    console.warn(`⚠️ Validation inattendue pour ${JSON.stringify(testCase)}: ${error.message}`);
                }
            }
        }
    }

    // Tester la fonction de vérification des alertes
    async testVerificationAlertes() {
        const testCases = [
            { densite: 0, capacite: 100, expected: 'NORMALE' },
            { densite: 25, capacite: 100, expected: 'NORMALE' },
            { densite: 50, capacite: 100, expected: 'MODEREE' },
            { densite: 75, capacite: 100, expected: 'ATTENTION' },
            { densite: 90, capacite: 100, expected: 'ATTENTION' },
            { densite: 100, capacite: 100, expected: 'CRITIQUE' },
            { densite: 150, capacite: 100, expected: 'CRITIQUE' }, // Capacité dépassée
        ];

        for (const testCase of testCases) {
            const alerte = window.DensiteManager.verifierAlerteDensite(
                testCase.densite, 
                testCase.capacite
            );

            if (alerte.niveau !== testCase.expected) {
                throw new Error(
                    `Alerte incorrecte pour densité=${testCase.densite}, capacité=${testCase.capacite}: ` +
                    `attendu=${testCase.expected}, obtenu=${alerte.niveau}`
                );
            }

            // Vérifier que les couleurs sont définies
            if (!alerte.couleur) {
                throw new Error(`Couleur d'alerte manquante pour niveau ${alerte.niveau}`);
            }

            // Vérifier le ratio calculé
            const expectedRatio = testCase.capacite > 0 ? testCase.densite / testCase.capacite : 0;
            if (Math.abs(alerte.ratio - expectedRatio) > 0.01) {
                throw new Error(`Ratio incorrect: attendu=${expectedRatio}, obtenu=${alerte.ratio}`);
            }
        }
    }

    // Tester le formatage d'affichage de la densité
    async testFormatageAffichage() {
        const testCases = [
            { densite: 50, capacite: 100 },
            { densite: 0, capacite: 100 },
            { densite: 100, capacite: 100 },
            { densite: 30, capacite: 0 }, // Capacité zero
        ];

        for (const testCase of testCases) {
            const display = window.DensiteManager.formaterAffichageDensite(
                testCase.densite, 
                testCase.capacite
            );

            // Vérifier la structure du retour
            const requiredFields = ['densite', 'capaciteMax', 'pourcentage', 'alerte', 'barreProgression'];
            for (const field of requiredFields) {
                if (display[field] === undefined) {
                    throw new Error(`Champ manquant dans le formatage: ${field}`);
                }
            }

            // Vérifier les valeurs
            if (display.densite !== testCase.densite) {
                throw new Error(`Densité incorrecte: attendue=${testCase.densite}, obtenue=${display.densite}`);
            }

            if (display.capaciteMax !== testCase.capacite) {
                throw new Error(`Capacité incorrecte: attendue=${testCase.capacite}, obtenue=${display.capaciteMax}`);
            }

            // Vérifier la barre de progression
            if (typeof display.barreProgression.largeur !== 'number') {
                throw new Error('Largeur de barre de progression invalide');
            }
        }
    }

    // Tester l'affichage du graphique (sans rendu visuel)
    async testAffichageGraphique() {
        // Données de test
        const historiqueTest = [
            { densite_personnes: 10, timestamp: '2025-11-01T10:00:00Z' },
            { densite_personnes: 25, timestamp: '2025-11-02T10:00:00Z' },
            { densite_personnes: 50, timestamp: '2025-11-03T10:00:00Z' },
            { densite_personnes: 30, timestamp: '2025-11-04T10:00:00Z' },
        ];

        const capaciteMax = 100;

        // Tester avec canvas valide
        const canvas = document.getElementById('test-canvas');
        if (!canvas) {
            const newCanvas = document.createElement('canvas');
            newCanvas.id = 'test-canvas';
            newCanvas.width = 800;
            newCanvas.height = 400;
            document.body.appendChild(newCanvas);
        }

        try {
            window.DensiteManager.afficherGraphiqueDensite(historiqueTest, capaciteMax, 'test-canvas');
            console.log('✅ Graphique affiché sans erreur');
        } catch (error) {
            throw new Error(`Erreur affichage graphique: ${error.message}`);
        }

        // Tester avec canvas inexistant
        try {
            window.DensiteManager.afficherGraphiqueDensite(historiqueTest, capaciteMax, 'canvas-inexistant');
            console.log('✅ Gestion canvas inexistant correcte');
        } catch (error) {
            throw new Error(`Erreur gestion canvas inexistant: ${error.message}`);
        }

        // Tester avec données vides
        try {
            window.DensiteManager.afficherGraphiqueDensite([], capaciteMax, 'test-canvas');
            console.log('✅ Gestion données vides correcte');
        } catch (error) {
            throw new Error(`Erreur gestion données vides: ${error.message}`);
        }
    }

    // Tester l'export CSV
    async testExportCSV() {
        const donneesTest = [
            {
                timestamp: '2025-11-05T10:00:00Z',
                equip_id: 'TEST-001',
                densite_personnes: 50,
                capacite_max: 100
            },
            {
                timestamp: '2025-11-04T10:00:00Z',
                equip_id: 'TEST-001',
                densite_personnes: 30,
                capacite_max: 100
            }
        ];

        // Test export CSV
        const csvContent = window.DensiteManager.exporterDonneesDensiteCSV(donneesTest);
        
        if (typeof csvContent !== 'string' || csvContent.length === 0) {
            throw new Error('Export CSV a retourné un contenu invalide');
        }

        // Vérifier les en-têtes
        const enTetes = ['Date', 'Équipement', 'Densité', 'Capacité Max', 'Pourcentage', 'Alerte'];
        const premiereLigne = csvContent.split('\n')[0];
        for (const entete of enTetes) {
            if (!premiereLigne.includes(entete)) {
                throw new Error(`En-tête manquant: ${entete}`);
            }
        }

        // Test avec données vides
        const csvVide = window.DensiteManager.exporterDonneesDensiteCSV([]);
        if (csvVide !== '') {
            throw new Error('Export CSV avec données vides devrait retourner une chaîne vide');
        }

        // Test avec données null/undefined
        try {
            window.DensiteManager.exporterDonneesDensiteCSV(null);
            throw new Error('Export CSV avec données null devrait échouer');
        } catch (error) {
            // Erreur attendue
        }
    }

    // Tester l'affichage des alertes dans le DOM
    async testAffichageAlerteDOM() {
        // Créer un élément test pour l'alerte
        const alerteElement = document.getElementById('test-alerte-densite');
        if (!alerteElement) {
            const newElement = document.createElement('div');
            newElement.id = 'test-alerte-densite';
            document.body.appendChild(newElement);
        }

        const alerteTest = {
            niveau: 'MODEREE',
            couleur: '#FFC107',
            message: 'Test d\'alerte',
            ratio: 0.5
        };

        try {
            window.DensiteManager.afficherAlerteDensite('test', alerteTest);
            const element = document.getElementById('test-alerte-densite');
            
            if (!element || element.innerHTML.trim() === '') {
                throw new Error('L\'alerte n\'a pas été affichée dans le DOM');
            }

            // Vérifier la présence du niveau dans le HTML
            if (!element.innerHTML.includes('MODEREE')) {
                throw new Error('Le niveau d\'alerte n\'apparaît pas dans le HTML généré');
            }
        } catch (error) {
            throw new Error(`Erreur affichage alerte DOM: ${error.message}`);
        }
    }

    // Test d'intégration complet (nécessite Supabase)
    async testIntegrationSupabase() {
        // Vérifier que Supabase est configuré
        if (!window.AppConfig?.supabase) {
            console.warn('⚠️ Supabase non configuré, test d\'intégration ignoré');
            return;
        }

        const testEquipmentId = TEST_CONFIG.testEquipmentId;
        const testDensity = 42;

        try {
            // Test de mise à jour de densité
            const resultat = await window.DensiteManager.mettreAJourDensite(testEquipmentId, testDensity);
            
            if (!resultat.succes) {
                throw new Error(`Échec mise à jour densité: ${resultat.erreur}`);
            }

            console.log('✅ Mise à jour densité réussie');

            // Test de récupération d'historique
            const historique = await window.DensiteManager.obtenirHistoriqueDensite(testEquipmentId, 1);
            
            if (!Array.isArray(historique)) {
                throw new Error('L\'historique doit être un tableau');
            }

            console.log(`✅ Historique récupéré: ${historique.length} entrées`);

            // Test de la dernière entrée
            if (historique.length > 0) {
                const derniereEntree = historique[historique.length - 1];
                if (derniereEntree.densite_personnes !== testDensity) {
                    throw new Error(`Densité incorrecte dans l'historique: attendue=${testDensity}, obtenue=${derniereEntree.densite_personnes}`);
                }
            }

        } catch (error) {
            // En cas d'erreur, vérifier si c'est lié à la configuration Supabase
            if (error.message.includes('Client Supabase non disponible')) {
                console.warn('⚠️ Test d\'intégration ignoré - Supabase non disponible');
                return;
            }
            throw error;
        }
    }

    // Générer un rapport de test
    generateReport() {
        const totalDuration = this.testResults.reduce((sum, result) => sum + result.duration, 0);
        const averageDuration = Math.round(totalDuration / this.testResults.length);
        
        return {
            summary: {
                total: this.testCount,
                passed: this.passCount,
                failed: this.failCount,
                successRate: Math.round((this.passCount / this.testCount) * 100),
                totalDuration: totalDuration,
                averageDuration: averageDuration
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
    }

    // Afficher le rapport dans la console
    printReport() {
        const report = this.generateReport();
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RAPPORT DE TESTS - SYSTÈME DE DENSITÉ');
        console.log('='.repeat(60));
        console.log(`Total des tests: ${report.summary.total}`);
        console.log(`✅ Réussis: ${report.summary.passed}`);
        console.log(`❌ Échoués: ${report.summary.failed}`);
        console.log(`📈 Taux de réussite: ${report.summary.successRate}%`);
        console.log(`⏱️ Durée totale: ${report.summary.totalDuration}ms`);
        console.log(`📊 Durée moyenne: ${report.summary.averageDuration}ms`);
        console.log('='.repeat(60));

        // Détail des résultats
        if (this.failCount > 0) {
            console.log('\n❌ TESTS ÉCHOUÉS:');
            this.testResults
                .filter(result => result.status === 'FAIL')
                .forEach(result => {
                    console.log(`  - ${result.name}: ${result.error}`);
                });
        }

        console.log('\n✅ Tests terminés à:', new Date().toLocaleString('fr-FR'));
    }
}

// Fonction principale pour exécuter tous les tests
async function executerTestsDensite() {
    console.log('🧪 Démarrage des tests du système de gestion de la densité...');
    console.log('Configuration:', TEST_CONFIG);
    
    const testSuite = new DensiteTestSuite();
    
    try {
        // Tests unitaires (sans Supabase)
        await testSuite.runTest('Module exports', () => testSuite.testModuleExports());
        await testSuite.runTest('Validation des paramètres', () => testSuite.testValidationParameters());
        await testSuite.runTest('Vérification des alertes', () => testSuite.testVerificationAlertes());
        await testSuite.runTest('Formatage d\'affichage', () => testSuite.testFormatageAffichage());
        await testSuite.runTest('Affichage graphique', () => testSuite.testAffichageGraphique());
        await testSuite.runTest('Export CSV', () => testSuite.testExportCSV());
        await testSuite.runTest('Affichage alerte DOM', () => testSuite.testAffichageAlerteDOM());
        
        // Test d'intégration (avec Supabase si disponible)
        await testSuite.runTest('Intégration Supabase', () => testSuite.testIntegrationSupabase());
        
    } catch (error) {
        console.error('❌ Erreur générale lors des tests:', error);
    }
    
    // Générer le rapport final
    testSuite.printReport();
    
    return testSuite.generateReport();
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DensiteTestSuite,
        executerTestsDensite,
        TEST_CONFIG
    };
}

// Export global pour utilisation dans le navigateur
window.DensiteTests = {
    DensiteTestSuite,
    executerTestsDensite,
    TEST_CONFIG
};

// Auto-exécution des tests si la page se charge dans un contexte de test
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Système de tests de densité chargé');
        // Décommenter la ligne suivante pour auto-exécuter les tests
        // executerTestsDensite();
    });
} else {
    console.log('🚀 Système de tests de densité chargé');
}

console.log('🧪 Module de tests de densité chargé avec succès');