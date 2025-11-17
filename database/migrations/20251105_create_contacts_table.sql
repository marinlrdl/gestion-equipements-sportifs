-- Migration pour la table contacts
-- Date: 2025-11-05
-- Description: Création de la table contacts pour le système de formulaire de contact

-- Création de la table contacts
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informations du contact
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    
    -- Référence à l'équipement concerné
    equip_id VARCHAR(255) REFERENCES equipements(equip_numero) ON DELETE SET NULL,
    
    -- Destinataire (collectivité gestionnaire)
    entite_cible UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Contenu du message
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Statut du contact
    status VARCHAR(50) DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'traite', 'ferme')),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_contacts_equip_id ON contacts(equip_id);
CREATE INDEX IF NOT EXISTS idx_contacts_entite_cible ON contacts(entite_cible);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Politiques RLS (Row Level Security)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion de nouveaux contacts (public)
CREATE POLICY "contacts_insert_public" ON contacts
    FOR INSERT 
    WITH CHECK (true);

-- Politique pour permettre la lecture des contacts par les collectivités propriétaires
CREATE POLICY "contacts_select_owners" ON contacts
    FOR SELECT 
    USING (
        entite_cible = auth.uid() OR 
        auth.jwt() ->> 'role' = 'administrateur'
    );

-- Politique pour permettre la mise à jour par les collectivités propriétaires
CREATE POLICY "contacts_update_owners" ON contacts
    FOR UPDATE 
    USING (
        entite_cible = auth.uid() OR 
        auth.jwt() ->> 'role' = 'administrateur'
    )
    WITH CHECK (
        entite_cible = auth.uid() OR 
        auth.jwt() ->> 'role' = 'administrateur'
    );

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Insertion de données de test (optionnel)
-- Ces données peuvent être supprimées en production
INSERT INTO contacts (nom, email, telephone, equip_id, sujet, message, status) VALUES
(
    'Jean Dupont',
    'jean.dupont@example.com',
    '01 23 45 67 89',
    'TEST001',
    'Information générale',
    'Bonjour, je souhaite avoir des informations sur les horaires d''ouverture de cet équipement.',
    'nouveau'
),
(
    'Marie Martin',
    'marie.martin@example.com',
    NULL,
    'TEST002',
    'Réservation',
    'Bonjour, j''aimerais réserver cet équipement pour un tournoi le weekend prochain.',
    'en_cours'
),
(
    'Pierre Durand',
    'pierre.durand@example.com',
    '06 78 90 12 34',
    'TEST001',
    'Problème technique',
    'L''éclairage de l''équipement ne fonctionne pas correctement depuis quelques jours.',
    'traite'
) ON CONFLICT (id) DO NOTHING;

-- Commentaires pour documenter la table
COMMENT ON TABLE contacts IS 'Table pour stocker les demandes de contact des citoyens vers les collectivités';
COMMENT ON COLUMN contacts.id IS 'Identifiant unique du message';
COMMENT ON COLUMN contacts.nom IS 'Nom complet de l''expéditeur';
COMMENT ON COLUMN contacts.email IS 'Adresse email de l''expéditeur';
COMMENT ON COLUMN contacts.telephone IS 'Numéro de téléphone de l''expéditeur (optionnel)';
COMMENT ON COLUMN contacts.equip_id IS 'Référence à l''équipement concerné';
COMMENT ON COLUMN contacts.entite_cible IS 'Référence à la collectivité gestionnaire destinataire';
COMMENT ON COLUMN contacts.sujet IS 'Sujet du message';
COMMENT ON COLUMN contacts.message IS 'Contenu du message';
COMMENT ON COLUMN contacts.status IS 'Statut du traitement du message';
COMMENT ON COLUMN contacts.created_at IS 'Date de création du message';
COMMENT ON COLUMN contacts.updated_at IS 'Date de dernière modification';
COMMENT ON COLUMN contacts.responded_at IS 'Date de réponse au message';

-- Affichage du résultat
SELECT 
    'Table contacts créée avec succès' as result,
    COUNT(*) as nombre_contacts_test
FROM contacts;

-- Information sur les politiques RLS créées
SELECT 
    'Politiques RLS créées' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'contacts';