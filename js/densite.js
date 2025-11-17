/**
 * js/densite.js
 * Gestion de la densité des équipements sportifs en temps réel
 * 
 * Ce module gère :
 * - La mise à jour de la densité des équipements
 * - L'historique des densités sur 7 jours
 * - L'affichage graphique des données de densité via Canvas
 * - Les alertes automatiques en cas de surcharge
 * 
 * @author Équipes de développement
 * @version 1.0.0
 * @date 2025-11-05
 */

// Vérification de la configuration Supabase
if (typeof window.AppConfig === 'undefined') {
    console.error('❌ AppConfig non chargé. Chargez js/config.js avant js/densite.js');
}

/**
 * Met à jour la densité d'un équipement
 * @param {string|number} equipementId - ID de l'équipement
 * @param {number} nouvelleDensite - Nouvelle densité (nombre de personnes)
 * @returns {Promise<Object>} Résultat de l'opération
 */
async function mettreAJourDensite(equipementId, nouvelleDensite) {
    try {
        console.log(`🔄 Mise à jour densité pour équipement ${equipementId}: ${nouvelleDensite} personnes`);
        
        // Vérifier que Supabase est disponible
        if (!window.AppConfig?.supabase) {
            throw new Error('Client Supabase non disponible');
        }

        // Valider les paramètres
        if (!equipementId) {
            throw new Error('ID équipement requis');
        }
        
        if (typeof nouvelleDensite !== 'number' || nouvelleDensite < 0) {
            throw new Error('La densité doit être un nombre positif');
        }

        // Récupérer la capacité maximale de l'équipement
        const { data: equipement, error: errorEquip } = await window.AppConfig.supabase
            .from('equipements')
            .select('capacite_max')
            .eq('id', equipementId)
            .single();
        
        if (errorEquip) {
            console.warn('⚠️ Équipement non trouvé, utilisation de la capacité par défaut');
        }

        const capaciteMax = equipement?.capacite_max || 100;

        // Valider que la densité ne dépasse pas la capacité
        if (nouvelleDensite > capaciteMax) {
            throw new Error(`La densité (${nouvelleDensite}) ne peut pas dépasser la capacité maximale (${capaciteMax})`);
        }

        // Mettre à jour l'équipement avec la nouvelle densité
        const { error: errorUpdate } = await window.AppConfig.supabase
            .from('equipements')
            .update({ 
                densite_actuelle: nouvelleDensite,
                updated_at: new Date().toISOString()
            })
            .eq('id', equipementId);
        
        if (errorUpdate) {
            throw new Error(`Erreur mise à jour équipement: ${errorUpdate.message}`);
        }

        // Enregistrer dans l'historique des densités
        const { error: errorLog } = await window.AppConfig.supabase
            .from('densite_log')
            .insert([{
                equip_id: equipementId,
                densite_personnes: nouvelleDensite,
                timestamp: new Date().toISOString(),
                capacite_max: capaciteMax
            }]);
        
        if (errorLog) {
            console.warn('⚠️ Erreur enregistrement historique:', errorLog.message);
            // Ne pas échouer complètement pour cette erreur
        }

        // Vérifier les seuils d'alerte
        const alerteNiveau = verifierAlerteDensite(nouvelleDensite, capaciteMax);
        
        console.log(`✅ Densité mise à jour avec succès. Alerte: ${alerteNiveau.niveau}`);
        
        return { 
            succes: true, 
            message: 'Densité mise à jour avec succès',
            alerte: alerteNiveau
        };
        
    } catch (erreur) {
        console.error('❌ Erreur mise à jour densité:', erreur);
        return { 
            succes: false, 
            erreur: erreur.message 
        };
    }
}

/**
 * Récupère l'historique de densité sur les 7 derniers jours
 * @param {string|number} equipementId - ID de l'équipement
 * @param {number} jours - Nombre de jours d'historique (défaut: 7)
 * @returns {Promise<Array>} Liste des données d'historique
 */
async function obtenirHistoriqueDensite(equipementId, jours = 7) {
    try {
        console.log(`📊 Récupération historique densité pour ${equipementId} (${jours} jours)`);
        
        // Vérifier que Supabase est disponible
        if (!window.AppConfig?.supabase) {
            throw new Error('Client Supabase non disponible');
        }

        // Calculer la date limite
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - jours);
        
        // Requête Supabase pour récupérer l'historique
        const { data, error } = await window.AppConfig.supabase
            .from('densite_log')
            .select('*')
            .eq('equip_id', equipementId)
            .gte('timestamp', dateLimite.toISOString())
            .order('timestamp', { ascending: true });
        
        if (error) {
            throw new Error(`Erreur récupération historique: ${error.message}`);
        }
        
        // S'assurer que les données sont un tableau
        const historique = Array.isArray(data) ? data : [];
        
        console.log(`✅ ${historique.length} points d'historique récupérés`);
        return historique;
        
    } catch (erreur) {
        console.error('❌ Erreur récupération historique:', erreur);
        return []; // Retourner un tableau vide en cas d'erreur
    }
}

/**
 * Affiche un graphique de l'historique de densité via Canvas
 * @param {Array} historique - Données d'historique
 * @param {number} capaciteMax - Capacité maximale de l'équipement
 * @param {string} canvasId - ID du canvas (défaut: 'graphique-densite')
 * @param {Object} options - Options d'affichage
 */
function afficherGraphiqueDensite(historique, capaciteMax, canvasId = 'graphique-densite', options = {}) {
    try {
        console.log(`📈 Affichage graphique densité - ${historique.length} points`);
        
        // Configuration par défaut
        const config = {
            largeur: 800,
            hauteur: 400,
            padding: 40,
            couleurLigne: '#0055A4',
            couleurCapacite: '#E63946',
            couleurFond: '#FFFFFF',
            police: '12px Arial',
            ...options
        };
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`⚠️ Canvas '${canvasId}' non trouvé`);
            return;
        }
        
        // Définir les dimensions du canvas
        canvas.width = config.largeur;
        canvas.height = config.hauteur;
        
        const ctx = canvas.getContext('2d');
        
        // Effacer le canvas
        ctx.fillStyle = config.couleurFond;
        ctx.fillRect(0, 0, config.largeur, config.hauteur);
        
        // Vérifier s'il y a des données
        if (!historique || historique.length === 0) {
            ctx.fillStyle = '#6C757D';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Aucune donnée disponible', config.largeur / 2, config.hauteur / 2);
            return;
        }
        
        // Calculs pour le graphique
        const padding = config.padding;
        const graphWidth = config.largeur - 2 * padding;
        const graphHeight = config.hauteur - 2 * padding;
        
        const maxVal = capaciteMax > 0 ? capaciteMax : 100;
        
        // Tracer les axes
        ctx.strokeStyle = '#6C757D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, config.hauteur - padding);
        ctx.lineTo(config.largeur - padding, config.hauteur - padding);
        ctx.stroke();
        
        // Ligne de capacité maximale
        ctx.strokeStyle = config.couleurCapacite;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(config.largeur - padding, padding);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Tracer la courbe de densité
        ctx.strokeStyle = config.couleurLigne;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        historique.forEach((point, index) => {
            const x = padding + (index / Math.max(historique.length - 1, 1)) * graphWidth;
            const ratio = Math.min(point.densite_personnes / maxVal, 1.0);
            const y = config.hauteur - padding - ratio * graphHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Ajouter des points sur la courbe
            ctx.fillStyle = config.couleurLigne;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        ctx.stroke();
        
        // Ajouter les labels sur l'axe Y
        ctx.fillStyle = '#212529';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 4; i++) {
            const valeur = Math.round((maxVal / 4) * i);
            const y = config.hauteur - padding - (graphHeight / 4) * i;
            
            ctx.fillText(valeur.toString(), padding - 10, y + 5);
            
            // Ligne de grille horizontale
            ctx.strokeStyle = '#E9ECEF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(config.largeur - padding, y);
            ctx.stroke();
        }
        
        // Labels sur l'axe X (dates)
        ctx.fillStyle = '#212529';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        historique.forEach((point, index) => {
            if (index % Math.ceil(historique.length / 5) === 0 || index === historique.length - 1) {
                const x = padding + (index / Math.max(historique.length - 1, 1)) * graphWidth;
                const date = new Date(point.timestamp);
                const dateStr = date.toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                });
                ctx.fillText(dateStr, x, config.hauteur - padding + 20);
            }
        });
        
        // Titre du graphique
        ctx.fillStyle = '#212529';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Densité des derniers jours (capacité: ${maxVal})`, padding, padding - 15);
        
        // Légende
        ctx.font = '11px Arial';
        ctx.textAlign = 'left';
        
        // Légende ligne densité
        ctx.fillStyle = config.couleurLigne;
        ctx.fillRect(config.largeur - 150, 20, 20, 3);
        ctx.fillStyle = '#212529';
        ctx.fillText('Densité actuelle', config.largeur - 125, 25);
        
        // Légende capacité max
        ctx.fillStyle = config.couleurCapacite;
        ctx.fillRect(config.largeur - 150, 40, 20, 3);
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(config.largeur - 150, 42.5);
        ctx.lineTo(config.largeur - 130, 42.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#212529';
        ctx.fillText('Capacité max', config.largeur - 125, 45);
        
        console.log('✅ Graphique affiché avec succès');
        
    } catch (erreur) {
        console.error('❌ Erreur affichage graphique:', erreur);
    }
}

/**
 * Vérifie le niveau d'alerte selon la densité
 * @param {number} densiteActuelle - Densité actuelle
 * @param {number} capaciteMax - Capacité maximale
 * @returns {Object} Informations sur l'alerte
 */
function verifierAlerteDensite(densiteActuelle, capaciteMax) {
    const ratio = capaciteMax > 0 ? densiteActuelle / capaciteMax : 0;
    
    if (ratio >= 1.0) {
        return {
            niveau: 'CRITIQUE',
            couleur: '#E63946',
            message: 'Capacité maximale atteinte !',
            ratio: ratio
        };
    } else if (ratio >= 0.8) {
        return {
            niveau: 'ATTENTION',
            couleur: '#FF6B35',
            message: 'Attention, forte densité',
            ratio: ratio
        };
    } else if (ratio >= 0.5) {
        return {
            niveau: 'MODEREE',
            couleur: '#FFC107',
            message: 'Densité modérée',
            ratio: ratio
        };
    } else {
        return {
            niveau: 'NORMALE',
            couleur: '#00A94F',
            message: 'Densité normale',
            ratio: ratio
        };
    }
}

/**
 * Met à jour l'affichage de l'alerte dans l'interface
 * @param {string} equipementId - ID de l'équipement
 * @param {Object} alerte - Informations sur l'alerte
 */
function afficherAlerteDensite(equipementId, alerte) {
    try {
        const alertElement = document.getElementById(`alerte-densite-${equipementId}`);
        if (!alertElement) {
            console.warn(`⚠️ Élément alerte pour ${equipementId} non trouvé`);
            return;
        }
        
        alertElement.innerHTML = `
            <div class="alert alert-${alerte.niveau.toLowerCase()}" style="
                background-color: ${alerte.couleur}20;
                border: 2px solid ${alerte.couleur};
                color: ${alerte.couleur};
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
            ">
                <strong>${alerte.niveau}:</strong> ${alerte.message}
                <br>
                <small>Taux d'occupation: ${(alerte.ratio * 100).toFixed(1)}%</small>
            </div>
        `;
        
    } catch (erreur) {
        console.error('❌ Erreur affichage alerte:', erreur);
    }
}

/**
 * Formate l'affichage de la densité avec indicateur visuel
 * @param {number} densite - Densité actuelle
 * @param {number} capaciteMax - Capacité maximale
 * @returns {Object} Données formatées pour l'affichage
 */
function formaterAffichageDensite(densite, capaciteMax) {
    const alerte = verifierAlerteDensite(densite, capaciteMax);
    const ratio = capaciteMax > 0 ? (densite / capaciteMax) * 100 : 0;
    
    return {
        densite: densite,
        capaciteMax: capaciteMax,
        pourcentage: Math.round(ratio),
        alerte: alerte,
        barreProgression: {
            largeur: Math.min(ratio, 100),
            couleur: alerte.couleur,
            classe: `progress-bar-${alerte.niveau.toLowerCase()}`
        }
    };
}

/**
 * Exporte les données de densité au format CSV
 * @param {Array} donnees - Données à exporter
 * @returns {string} Contenu CSV
 */
function exporterDonneesDensiteCSV(donnees) {
    try {
        if (!Array.isArray(donnees) || donnees.length === 0) {
            throw new Error('Aucune donnée à exporter');
        }
        
        // En-têtes CSV
        const enTetes = ['Date', 'Équipement', 'Densité', 'Capacité Max', 'Pourcentage', 'Alerte'];
        
        // Données CSV
        const lignes = donnees.map(donnee => {
            const date = new Date(donnee.timestamp).toLocaleDateString('fr-FR');
            const pourcentage = donnee.capacite_max > 0 ? 
                Math.round((donnee.densite_personnes / donnee.capacite_max) * 100) : 0;
            const alerte = verifierAlerteDensite(donnee.densite_personnes, donnee.capacite_max);
            
            return [
                date,
                donnee.equip_id || 'N/A',
                donnee.densite_personnes,
                donnee.capacite_max || 'N/A',
                `${pourcentage}%`,
                alerte.niveau
            ].join(',');
        });
        
        // Assembler le CSV
        const csvContent = [enTetes.join(','), ...lignes].join('\n');
        
        console.log('✅ Données exportées au format CSV');
        return csvContent;
        
    } catch (erreur) {
        console.error('❌ Erreur export CSV:', erreur);
        return '';
    }
}

/**
 * Télécharge un fichier CSV avec les données
 * @param {Array} donnees - Données à exporter
 * @param {string} nomFichier - Nom du fichier (défaut: 'historique-densite.csv')
 */
function telechargerCSVdensite(donnees, nomFichier = 'historique-densite.csv') {
    try {
        const csvContent = exporterDonneesDensiteCSV(donnees);
        if (!csvContent) {
            throw new Error('Contenu CSV vide');
        }
        
        // Créer et télécharger le fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', nomFichier);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`✅ Fichier ${nomFichier} téléchargé`);
        }
        
    } catch (erreur) {
        console.error('❌ Erreur téléchargement CSV:', erreur);
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        mettreAJourDensite,
        obtenirHistoriqueDensite,
        afficherGraphiqueDensite,
        verifierAlerteDensite,
        afficherAlerteDensite,
        formaterAffichageDensite,
        exporterDonneesDensiteCSV,
        telechargerCSVdensite
    };
}

// Export global pour utilisation dans le navigateur
window.DensiteManager = {
    mettreAJourDensite,
    obtenirHistoriqueDensite,
    afficherGraphiqueDensite,
    verifierAlerteDensite,
    afficherAlerteDensite,
    formaterAffichageDensite,
    exporterDonneesDensiteCSV,
    telechargerCSVdensite
};

console.log('📊 Module de gestion de la densité chargé avec succès');