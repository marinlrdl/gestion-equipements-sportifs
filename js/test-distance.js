/**
 * js/test-distance.js
 * Tests pour les fonctions de calcul de distance
 */

// Tests de la formule de Haversine
function testerCalculerDistanceHaversine() {
  console.log('=== Test calculerDistanceHaversine ===');
  
  // Test 1: Distance entre Paris et Lyon (environ 392 km)
  const distanceParisLyon = calculerDistanceHaversine(48.8566, 2.3522, 45.7640, 4.8357);
  console.log(`Paris-Lyon: ${distanceParisLyon} km (attendu: ~392 km)`);
  
  // Test 2: Distance entre Marseille et Nice (environ 158 km)
  const distanceMarseilleNice = calculerDistanceHaversine(43.2965, 5.3698, 43.7102, 7.2620);
  console.log(`Marseille-Nice: ${distanceMarseilleNice} km (attendu: ~158 km)`);
  
  // Test 3: Distance nulle (même point)
  const distanceNulle = calculerDistanceHaversine(48.8566, 2.3522, 48.8566, 2.3522);
  console.log(`Même point: ${distanceNulle} km (attendu: 0 km)`);
  
  return true;
}

// Test de conversion degrés vers radians
function testerDegresVersRadians() {
  console.log('=== Test degresVersRadians ===');
  
  const rad0 = degresVersRadians(0);
  const rad90 = degresVersRadians(90);
  const rad180 = degresVersRadians(180);
  
  console.log(`0° = ${rad0} rad (attendu: 0)`);
  console.log(`90° = ${rad90} rad (attendu: π/2 ≈ 1.57)`);
  console.log(`180° = ${rad180} rad (attendu: π ≈ 3.14)`);
  
  return true;
}

// Test de la fonction trouverEquipementsProches
function testerTrouverEquipementsProches() {
  console.log('=== Test trouverEquipementsProches ===');
  
  // Données de test
  const equipementsTest = [
    {
      id: 1,
      equip_nom: 'Terrain de tennis Centre',
      latitude: 48.8566,
      longitude: 2.3522,
      densite_actuelle: 50,
      capacite_max: 100
    },
    {
      id: 2,
      equip_nom: 'Piscine Nord',
      latitude: 48.8606,
      longitude: 2.3376,
      densite_actuelle: 80,
      capacite_max: 100
    },
    {
      id: 3,
      equip_nom: 'Stade Sud',
      latitude: 48.8426,
      longitude: 2.3929,
      densite_actuelle: 30,
      capacite_max: 100
    }
  ];
  
  const userLat = 48.8566;
  const userLon = 2.3522;
  
  // Test sans priorisation disponibilité
  const prochesSimple = trouverEquipementsProches(userLat, userLon, equipementsTest, 3, false);
  console.log('Proches (distance uniquement):');
  prochesSimple.forEach(equip => {
    console.log(`- ${equip.equip_nom}: ${equip.distance} km, disponibilité: ${100 - equip.tauxOccupation}%`);
  });
  
  // Test avec priorisation disponibilité
  const prochesDisponibilite = trouverEquipementsProches(userLat, userLon, equipementsTest, 3, true);
  console.log('Proches (avec priorisation disponibilité):');
  prochesDisponibilite.forEach(equip => {
    console.log(`- ${equip.equip_nom}: ${equip.distance} km, score: ${equip.score.toFixed(2)}`);
  });
  
  return true;
}

// Test des fonctions utilitaires
function testerFonctionsUtilitaires() {
  console.log('=== Test fonctions utilitaires ===');
  
  const equipementTest = {
    latitude: 48.8566,
    longitude: 2.3522,
    densite_actuelle: 75,
    capacite_max: 100
  };
  
  const userLat = 48.8600;
  const userLon = 2.3500;
  
  // Test calcul distance depuis position
  const distance = calculerDistanceDepuisPosition(userLat, userLon, equipementTest);
  console.log(`Distance depuis position: ${distance} km`);
  
  // Test taux d'occupation
  const taux = calculerTauxOccupation(equipementTest);
  console.log(`Taux d'occupation: ${taux}%`);
  
  return true;
}

// Test d'intégration avec le DOM (simulé)
function testerIntegrationDOM() {
  console.log('=== Test intégration DOM ===');
  
  // Créer un élément DOM de test pour les équipements proches
  const conteneurTest = document.createElement('div');
  conteneurTest.id = 'liste-equipements-proches';
  document.body.appendChild(conteneurTest);
  
  // Simuler des équipements proches
  const equipementsTest = [
    {
      id: 1,
      equip_nom: 'Terrain de tennis Test',
      inst_adresse: '123 Rue de Test',
      commune_nom: 'Testville',
      latitude: 48.8566,
      longitude: 2.3522,
      tauxOccupation: 30
    }
  ];
  
  // Tester l'affichage
  const userLat = 48.8566;
  const userLon = 2.3522;
  
  console.log('Simulation de l\'affichage des équipements proches...');
  console.log(`Coordonnées utilisateur: ${userLat}, ${userLon}`);
  console.log(`Équipements à afficher: ${equipementsTest.length}`);
  
  // Nettoyer
  document.body.removeChild(conteneurTest);
  
  return true;
}

// Test complet
function lancerTousLesTests() {
  console.log('🚀 Démarrage des tests du système de distance...\n');
  
  try {
    testerCalculerDistanceHaversine();
    console.log('\n✅ Test calculerDistanceHaversine: PASSED\n');
  } catch (erreur) {
    console.log(`❌ Test calculerDistanceHaversine: FAILED - ${erreur.message}\n`);
  }
  
  try {
    testerDegresVersRadians();
    console.log('\n✅ Test degresVersRadians: PASSED\n');
  } catch (erreur) {
    console.log(`❌ Test degresVersRadians: FAILED - ${erreur.message}\n`);
  }
  
  try {
    testerTrouverEquipementsProches();
    console.log('\n✅ Test trouverEquipementsProches: PASSED\n');
  } catch (erreur) {
    console.log(`❌ Test trouverEquipementsProches: FAILED - ${erreur.message}\n`);
  }
  
  try {
    testerFonctionsUtilitaires();
    console.log('\n✅ Test fonctions utilitaires: PASSED\n');
  } catch (erreur) {
    console.log(`❌ Test fonctions utilitaires: FAILED - ${erreur.message}\n`);
  }
  
  try {
    testerIntegrationDOM();
    console.log('\n✅ Test intégration DOM: PASSED\n');
  } catch (erreur) {
    console.log(`❌ Test intégration DOM: FAILED - ${erreur.message}\n`);
  }
  
  console.log('🎉 Tous les tests sont terminés!');
}

// Test de performance pour grandes collections
function testerPerformance() {
  console.log('=== Test de performance ===');
  
  // Générer 1000 équipements de test
  const equipementsPerf = [];
  for (let i = 0; i < 1000; i++) {
    equipementsPerf.push({
      id: i,
      equip_nom: `Équipement ${i}`,
      latitude: 48.8566 + (Math.random() - 0.5) * 2, // Aléatoire autour de Paris
      longitude: 2.3522 + (Math.random() - 0.5) * 2,
      densite_actuelle: Math.floor(Math.random() * 100),
      capacite_max: 100
    });
  }
  
  const userLat = 48.8566;
  const userLon = 2.3522;
  
  console.time('Calcul distance pour 1000 équipements');
  const resultats = trierEquipementsParDistanceOptimise(userLat, userLon, equipementsPerf, 50);
  console.timeEnd('Calcul distance pour 1000 équipements');
  
  console.log(`Top 5 des plus proches:`);
  resultats.slice(0, 5).forEach((equip, index) => {
    console.log(`${index + 1}. ${equip.equip_nom}: ${equip.distance} km`);
  });
  
  return true;
}

// Exposer les tests globalement
window.TestsDistance = {
  testerCalculerDistanceHaversine,
  testerDegresVersRadians,
  testerTrouverEquipementsProches,
  testerFonctionsUtilitaires,
  testerIntegrationDOM,
  lancerTousLesTests,
  testerPerformance
};

console.log('📋 Tests de distance chargés. Utilisez TestsDistance.lancerTousLesTests() pour exécuter tous les tests.');