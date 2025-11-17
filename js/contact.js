/**
 * js/contact.js
 * Gestion du formulaire de contact
 */

// Vérification du client Supabase
let supabase = null;
if (typeof window !== 'undefined' && window.supabase && window.AppConfig?.supabase) {
    supabase = window.AppConfig.supabase;
} else if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(
        window.AppConfig?.SUPABASE_URL || 'https://loxrfmbesnxkusdrhfvs.supabase.co',
        window.AppConfig?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveHJmbWJlc254a3VzZHJoZnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNzc0NTQsImV4cCI6MjA3Nzc1MzQ1NH0.5FqYgUwc2gd9T5hyETBuSE88wIe8YzE3Yl2dIRWDqOs'
    );
}

/**
 * Soumet le formulaire de contact
 */
async function soumettreContact(event) {
    event.preventDefault();
    
    // Récupération des valeurs
    const equipementId = document.getElementById('equip_id')?.value;
    const entiteCibleId = document.getElementById('entite_cible_id')?.value;
    
    const contact = {
        nom: document.getElementById('contact_nom')?.value?.trim() || '',
        email: document.getElementById('contact_email')?.value?.trim() || '',
        telephone: document.getElementById('contact_telephone')?.value?.trim() || null,
        equip_id: equipementId,
        entite_cible: entiteCibleId,
        sujet: document.getElementById('contact_sujet')?.value?.trim() || '',
        message: document.getElementById('contact_message')?.value?.trim() || '',
        status: 'nouveau'
    };
    
    // Validation des champs obligatoires
    if (!contact.nom || !contact.email || !contact.sujet || !contact.message) {
        afficherNotificationErreur('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Validation email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(contact.email)) {
        afficherNotificationErreur('Adresse email invalide');
        return;
    }
    
    // Validation téléphone si fourni
    if (contact.telephone && !/^[\d\s\-\+\(\)]+$/.test(contact.telephone)) {
        afficherNotificationErreur('Numéro de téléphone invalide');
        return;
    }
    
    // Désactiver le bouton de soumission
    const submitBtn = document.getElementById('submitContactBtn');
    const originalText = submitBtn?.innerHTML;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="icon-refresh spin"></i> Envoi en cours...';
    }
    
    try {
        // Vérification que Supabase est disponible
        if (!supabase) {
            throw new Error('Client Supabase non disponible');
        }
        
        // Insertion du contact
        const { data, error } = await supabase
            .from('contacts')
            .insert([contact]);
        
        if (error) {
            console.error('Erreur Supabase:', error);
            throw error;
        }
        
        // Message de succès
        afficherNotificationSucces('Votre message a été envoyé avec succès. La collectivité vous répondra dans les plus brefs délais.');
        
        // Reset du formulaire
        const form = document.getElementById('formulaire-contact');
        if (form) {
            form.reset();
        }
        
        // Réinitialiser la sélection de l'entité cible si elle était auto-générée
        const entiteDisplay = document.getElementById('entite_cible_display');
        if (entiteDisplay) {
            entiteDisplay.textContent = 'Chargement en cours...';
        }
        
    } catch (erreur) {
        console.error('Erreur envoi contact:', erreur);
        let messageErreur = 'Erreur lors de l\'envoi du message';
        
        if (erreur.code === '23505') {
            messageErreur = 'Un message identique a déjà été envoyé récemment';
        } else if (erreur.message) {
            messageErreur = 'Erreur: ' + erreur.message;
        }
        
        afficherNotificationErreur(messageErreur);
    } finally {
        // Réactiver le bouton de soumission
        if (submitBtn && originalText) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

/**
 * Charge la collectivité gestionnaire d'un équipement
 */
async function chargerCollectiviteGestionnaire(equipement) {
    try {
        if (!supabase) {
            console.warn('Client Supabase non disponible');
            return null;
        }
        
        let query = supabase.from('users').select('id, nom_entite, role, code_commune, code_departement, code_region');
        
        // Chercher d'abord une mairie pour cette commune
        const { data: mairie } = await query
            .eq('role', 'mairie')
            .eq('code_commune', equipement.commune_code)
            .maybeSingle(); // Utilise maybeSingle pour ne pas planter si null
        
        if (mairie) return mairie;
        
        // Sinon préfecture départementale
        const { data: prefDep } = await supabase
            .from('users')
            .select('id, nom_entite, role, code_commune, code_departement, code_region')
            .eq('role', 'prefecture_departementale')
            .eq('code_departement', equipement.departement_code)
            .maybeSingle();
        
        if (prefDep) return prefDep;
        
        // Sinon préfecture régionale
        const { data: prefReg } = await supabase
            .from('users')
            .select('id, nom_entite, role, code_commune, code_departement, code_region')
            .eq('role', 'prefecture_regionale')
            .eq('code_region', equipement.region_code)
            .maybeSingle();
        
        return prefReg || null;
    } catch (erreur) {
        console.error('Erreur chargement collectivité:', erreur);
        return null;
    }
}

/**
 * Initialise le formulaire de contact pour un équipement
 */
async function initialiserFormulaireContact(equipementId) {
    try {
        if (!supabase) {
            console.warn('Client Supabase non disponible pour initialiser le formulaire');
            return;
        }
        
        // Charger les informations de l'équipement
        const { data: equipement, error } = await supabase
            .from('equipements')
            .select('*')
            .eq('equip_numero', equipementId)
            .single();
        
        if (error) {
            console.error('Erreur chargement équipement:', error);
            return;
        }
        
        // Pré-remplir l'ID de l'équipement
        const equipIdInput = document.getElementById('equip_id');
        if (equipIdInput) {
            equipIdInput.value = equipement.equip_numero;
        }
        
        // Afficher les informations de l'équipement
        const nomEquipement = document.getElementById('nom_equipement_contact');
        if (nomEquipement) {
            nomEquipement.textContent = equipement.equip_nom || 'Équipement sans nom';
        }
        
        const localisationEquipement = document.getElementById('localisation_equipement_contact');
        if (localisationEquipement) {
            const localisation = [
                equipement.commune_nom,
                equipement.departement_nom,
                equipement.region_nom
            ].filter(Boolean).join(', ');
            localisationEquipement.textContent = localisation || 'Localisation inconnue';
        }
        
        // Charger et afficher la collectivité gestionnaire
        const collectivite = await chargerCollectiviteGestionnaire(equipement);
        
        const entiteDisplay = document.getElementById('entite_cible_display');
        const entiteInput = document.getElementById('entite_cible_id');
        
        if (entiteDisplay && entiteInput) {
            if (collectivite) {
                entiteDisplay.textContent = collectivite.nom_entite;
                entiteInput.value = collectivite.id;
            } else {
                entiteDisplay.textContent = 'Aucune collectivité gestionnaire trouvée';
                entiteInput.value = '';
            }
        }
        
    } catch (erreur) {
        console.error('Erreur initialisation formulaire contact:', erreur);
        
        const entiteDisplay = document.getElementById('entite_cible_display');
        if (entiteDisplay) {
            entiteDisplay.textContent = 'Erreur lors du chargement de la collectivité';
        }
    }
}

/**
 * Valide un champ du formulaire en temps réel
 */
function validerChampContact(champ) {
    const valeur = champ.value.trim();
    const nomChamp = champ.name || champ.id;
    
    // Supprimer les anciens messages d'erreur
    supprimerErreurChamp(champ);
    
    switch (nomChamp) {
        case 'contact_nom':
            if (!valeur) {
                afficherErreurChamp(champ, 'Le nom est obligatoire');
                return false;
            }
            if (valeur.length < 2) {
                afficherErreurChamp(champ, 'Le nom doit contenir au moins 2 caractères');
                return false;
            }
            break;
            
        case 'contact_email':
            if (!valeur) {
                afficherErreurChamp(champ, 'L\'email est obligatoire');
                return false;
            }
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexEmail.test(valeur)) {
                afficherErreurChamp(champ, 'Adresse email invalide');
                return false;
            }
            break;
            
        case 'contact_telephone':
            if (valeur && !/^[\d\s\-\+\(\)]+$/.test(valeur)) {
                afficherErreurChamp(champ, 'Numéro de téléphone invalide');
                return false;
            }
            break;
            
        case 'contact_sujet':
            if (!valeur) {
                afficherErreurChamp(champ, 'Le sujet est obligatoire');
                return false;
            }
            break;
            
        case 'contact_message':
            if (!valeur) {
                afficherErreurChamp(champ, 'Le message est obligatoire');
                return false;
            }
            if (valeur.length < 10) {
                afficherErreurChamp(champ, 'Le message doit contenir au moins 10 caractères');
                return false;
            }
            break;
    }
    
    return true;
}

/**
 * Affiche une erreur pour un champ
 */
function afficherErreurChamp(champ, message) {
    const parent = champ.parentElement;
    if (!parent) return;
    
    // Créer ou mettre à jour le message d'erreur
    let erreurElement = parent.querySelector('.champ-erreur');
    if (!erreurElement) {
        erreurElement = document.createElement('div');
        erreurElement.className = 'champ-erreur';
        parent.appendChild(erreurElement);
    }
    
    erreurElement.textContent = message;
    erreurElement.style.color = '#e63946';
    erreurElement.style.fontSize = '0.875rem';
    erreurElement.style.marginTop = '0.25rem';
    
    // Ajouter classe d'erreur au champ
    champ.classList.add('champ-invalid');
}

/**
 * Supprime l'erreur d'un champ
 */
function supprimerErreurChamp(champ) {
    const parent = champ.parentElement;
    if (!parent) return;
    
    const erreurElement = parent.querySelector('.champ-erreur');
    if (erreurElement) {
        erreurElement.remove();
    }
    
    champ.classList.remove('champ-invalid');
}

/**
 * Affiche une notification de succès
 */
function afficherNotificationSucces(message) {
    if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification(message, 'success');
    } else {
        alert('✅ ' + message);
    }
}

/**
 * Affiche une notification d'erreur
 */
function afficherNotificationErreur(message) {
    if (typeof window !== 'undefined' && window.showNotification) {
        window.showNotification(message, 'error');
    } else {
        alert('❌ ' + message);
    }
}

/**
 * Initialise les event listeners du formulaire de contact
 */
function initialiserEventListenersContact() {
    // Soumission du formulaire
    const form = document.getElementById('formulaire-contact');
    if (form) {
        form.addEventListener('submit', soumettreContact);
    }
    
    // Validation en temps réel
    const champs = ['contact_nom', 'contact_email', 'contact_telephone', 'contact_sujet', 'contact_message'];
    champs.forEach(champId => {
        const champ = document.getElementById(champId);
        if (champ) {
            champ.addEventListener('blur', () => validerChampContact(champ));
            champ.addEventListener('input', () => {
                // Supprimer l'erreur pendant la saisie
                if (champ.classList.contains('champ-invalid')) {
                    supprimerErreurChamp(champ);
                }
            });
        }
    });
}

/**
 * Charge les contacts existants pour l'administration (optionnel)
 */
async function chargerContactsAdministration(filtres = {}) {
    try {
        if (!supabase) {
            throw new Error('Client Supabase non disponible');
        }
        
        let query = supabase
            .from('contacts')
            .select(`
                *,
                equipements (equip_nom, commune_nom, departement_nom),
                users (nom_entite, role)
            `);
        
        // Appliquer les filtres
        if (filtres.status) {
            query = query.eq('status', filtres.status);
        }
        if (filtres.entite_cible) {
            query = query.eq('entite_cible', filtres.entite_cible);
        }
        if (filtres.date_debut) {
            query = query.gte('created_at', filtres.date_debut);
        }
        if (filtres.date_fin) {
            query = query.lte('created_at', filtres.date_fin);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return data || [];
        
    } catch (erreur) {
        console.error('Erreur chargement contacts administration:', erreur);
        throw erreur;
    }
}

/**
 * Marque un contact comme traité
 */
async function marquerContactTraite(contactId, nouveauStatus = 'traite') {
    try {
        if (!supabase) {
            throw new Error('Client Supabase non disponible');
        }
        
        const { data, error } = await supabase
            .from('contacts')
            .update({ status: nouveauStatus })
            .eq('id', contactId);
        
        if (error) throw error;
        
        return { success: true };
        
    } catch (erreur) {
        console.error('Erreur mise à jour statut contact:', erreur);
        throw erreur;
    }
}

// Export des fonctions pour utilisation globale
if (typeof window !== 'undefined') {
    window.ContactManager = {
        soumettreContact,
        chargerCollectiviteGestionnaire,
        initialiserFormulaireContact,
        validerChampContact,
        chargerContactsAdministration,
        marquerContactTraite,
        initialiserEventListenersContact
    };
}

// Export pour Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        soumettreContact,
        chargerCollectiviteGestionnaire,
        initialiserFormulaireContact,
        validerChampContact,
        chargerContactsAdministration,
        marquerContactTraite,
        initialiserEventListenersContact
    };
}

console.log('📧 Module contact chargé avec succès');