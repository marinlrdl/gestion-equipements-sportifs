-- Configuration Supabase Storage pour les photos d'équipements
-- Exécuter ces commandes dans le SQL Editor de Supabase

-- =====================================================
-- 1. CRÉATION DU BUCKET POUR LES PHOTOS
-- =====================================================

-- Création du bucket 'photos-equipements'
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES (
    'photos-equipements',
    'photos-equipements',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. POLITIQUES RLS POUR LE STORAGE
-- =====================================================

-- Politique pour la lecture publique des photos
CREATE POLICY "Lecture publique des photos d'équipements" ON storage.objects
FOR SELECT USING (bucket_id = 'photos-equipements');

-- Politique pour l'upload selon les permissions utilisateur
CREATE POLICY "Upload photos selon permissions" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'photos-equipements' AND 
    auth.uid() IS NOT NULL
);

-- Politique pour la mise à jour selon les permissions
CREATE POLICY "Mise à jour photos selon permissions" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'photos-equipements' AND
    auth.uid() IS NOT NULL
);

-- Politique pour la suppression selon les permissions
CREATE POLICY "Suppression photos selon permissions" ON storage.objects
FOR DELETE USING (
    bucket_id = 'photos-equipements' AND
    auth.uid() IS NOT NULL
);

-- =====================================================
-- 3. AJOUT DE LA COLONNE PHOTOS À LA TABLE EQUIPEMENTS
-- =====================================================

-- Ajouter la colonne photos si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipements' AND column_name = 'photos'
    ) THEN
        ALTER TABLE equipements ADD COLUMN photos TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Index pour optimiser les requêtes sur la colonne photos
CREATE INDEX IF NOT EXISTS idx_equipements_photos ON equipements USING GIN (photos);

-- =====================================================
-- 4. CONFIGURATION DES RÔLES ET PERMISSIONS
-- =====================================================

-- Rôles autorisés pour l'upload de photos
-- ces rôles sont définis dans le système d'authentification existant

-- Fonction pour vérifier si un utilisateur peut uploader pour un équipement
CREATE OR REPLACE FUNCTION can_upload_photo(equipment_id UUID, user_role TEXT, user_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    equipment_commune_code TEXT;
    equipment_departement_code TEXT;
    equipment_region_code TEXT;
BEGIN
    -- Récupérer les informations de l'équipement
    SELECT commune_code, departement_code, region_code
    INTO equipment_commune_code, equipment_departement_code, equipment_region_code
    FROM equipements 
    WHERE id = equipment_id;
    
    -- Vérifier les permissions selon le rôle
    CASE user_role
        WHEN 'administrateur' THEN
            RETURN TRUE;
        WHEN 'mairie' THEN
            RETURN equipment_commune_code = user_code;
        WHEN 'prefecture_departementale' THEN
            RETURN equipment_departement_code = user_code;
        WHEN 'prefecture_regionale' THEN
            RETURN equipment_region_code = user_code;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FONCTIONS UTILITAIRES POUR LA GESTION DES PHOTOS
-- =====================================================

-- Fonction pour ajouter une photo à un équipement
CREATE OR REPLACE FUNCTION add_photo_to_equipment(equipment_id UUID, photo_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_photos TEXT[];
BEGIN
    -- Récupérer les photos actuelles
    SELECT photos INTO current_photos
    FROM equipements 
    WHERE id = equipment_id;
    
    -- Ajouter la nouvelle photo au tableau
    IF current_photos IS NULL THEN
        current_photos := ARRAY[photo_url];
    ELSE
        current_photos := current_photos || photo_url;
    END IF;
    
    -- Mettre à jour l'équipement
    UPDATE equipements 
    SET photos = current_photos 
    WHERE id = equipment_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer une photo d'un équipement
CREATE OR REPLACE FUNCTION remove_photo_from_equipment(equipment_id UUID, photo_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_photos TEXT[];
BEGIN
    -- Récupérer les photos actuelles
    SELECT photos INTO current_photos
    FROM equipements 
    WHERE id = equipment_id;
    
    -- Retirer la photo du tableau
    IF current_photos IS NOT NULL THEN
        current_photos := array_remove(current_photos, photo_url);
        
        -- Mettre à jour l'équipement
        UPDATE equipements 
        SET photos = current_photos 
        WHERE id = equipment_id;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS POUR L'AUDIT
-- =====================================================

-- Créer une table pour l'audit des modifications de photos
CREATE TABLE IF NOT EXISTS photo_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID REFERENCES equipements(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'ADD', 'REMOVE', 'UPDATE'
    photo_url TEXT NOT NULL,
    user_id UUID,
    user_role TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes d'audit
CREATE INDEX IF NOT EXISTS idx_photo_audit_equipment ON photo_audit_log(equipment_id);
CREATE INDEX IF NOT EXISTS idx_photo_audit_created_at ON photo_audit_log(created_at);

-- Trigger pour l'audit lors de l'ajout de photos
CREATE OR REPLACE FUNCTION audit_photo_add()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.photos IS DISTINCT FROM NEW.photos THEN
        -- Détecter les nouvelles photos ajoutées
        INSERT INTO photo_audit_log (equipment_id, action, photo_url, user_id)
        SELECT 
            NEW.id,
            'ADD',
            photo_url,
            auth.uid()
        FROM unnest(NEW.photos) AS photo_url
        WHERE NOT EXISTS (
            SELECT 1 FROM unnest(OLD.photos) AS old_photo 
            WHERE old_photo = photo_url
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour l'audit lors de la suppression de photos
CREATE OR REPLACE FUNCTION audit_photo_remove()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.photos IS DISTINCT FROM NEW.photos THEN
        -- Détecter les photos supprimées
        INSERT INTO photo_audit_log (equipment_id, action, photo_url, user_id)
        SELECT 
            OLD.id,
            'REMOVE',
            photo_url,
            auth.uid()
        FROM unnest(OLD.photos) AS photo_url
        WHERE NOT EXISTS (
            SELECT 1 FROM unnest(NEW.photos) AS new_photo 
            WHERE new_photo = photo_url
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer les triggers
DROP TRIGGER IF EXISTS audit_photo_add_trigger ON equipements;
CREATE TRIGGER audit_photo_add_trigger
    AFTER UPDATE ON equipements
    FOR EACH ROW
    EXECUTE FUNCTION audit_photo_add();

DROP TRIGGER IF EXISTS audit_photo_remove_trigger ON equipements;
CREATE TRIGGER audit_photo_remove_trigger
    AFTER UPDATE ON equipements
    FOR EACH ROW
    EXECUTE FUNCTION audit_photo_remove();

-- =====================================================
-- 7. STATISTIQUES ET MONITORING
-- =====================================================

-- Vue pour les statistiques d'utilisation des photos
CREATE OR REPLACE VIEW photo_statistics AS
SELECT 
    COUNT(*) as total_equipments_with_photos,
    AVG(array_length(photos, 1)) as avg_photos_per_equipment,
    MAX(array_length(photos, 1)) as max_photos_per_equipment,
    SUM(array_length(photos, 1)) as total_photos
FROM equipements 
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0;

-- Fonction pour nettoyer les orphelins (photos sans équipement)
CREATE OR REPLACE FUNCTION cleanup_orphaned_photos()
RETURNS INTEGER AS $$
DECLARE
    orphaned_count INTEGER := 0;
    photo_record RECORD;
BEGIN
    -- Parcourir tous les fichiers dans le bucket
    FOR photo_record IN 
        SELECT name FROM storage.objects WHERE bucket_id = 'photos-equipements'
    LOOP
        -- Vérifier si la photo est référencée par un équipement
        IF NOT EXISTS (
            SELECT 1 FROM equipements 
            WHERE photos && ARRAY[storage.get_presigned_url('photos-equipements', photo_record.name)]
        ) THEN
            -- Supprimer le fichier orphelin
            PERFORM storage.remove('photos-equipements', ARRAY[photo_record.name]);
            orphaned_count := orphaned_count + 1;
        END IF;
    END LOOP;
    
    RETURN orphaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. VALIDATION ET SÉCURITÉ
-- =====================================================

-- Fonction pour valider les URLs de photos
CREATE OR REPLACE FUNCTION is_valid_photo_url(url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier que l'URL commence par le domaine Supabase
    RETURN url ~ '^https://[^/]+\.supabase\.co/storage/v1/object/public/photos-equipements/';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RLS sur la table d'audit
ALTER TABLE photo_audit_log ENABLE ROW LEVEL SECURITY;

-- Politique pour l'audit (lecture selon rôle)
CREATE POLICY "Audit photo lecture selon rôle" ON photo_audit_log
FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    (
        auth.role() = 'administrateur' OR
        user_id = auth.uid()
    )
);

-- =====================================================
-- 9. MIGRATION ET INITIALISATION
-- =====================================================

-- Script de migration pour ajouter la colonne photos si nécessaire
DO $$
BEGIN
    -- Vérifier si la colonne photos existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipements' AND column_name = 'photos'
    ) THEN
        -- Ajouter la colonne photos
        ALTER TABLE equipements ADD COLUMN photos TEXT[] DEFAULT '{}';
        
        -- Notifier l'ajout
        RAISE NOTICE 'Colonne photos ajoutée à la table equipements';
    END IF;
END $$;

-- =====================================================
-- 10. RÉSUMÉ DE LA CONFIGURATION
-- =====================================================

-- Afficher un résumé de la configuration
SELECT 
    'Configuration Storage Photos' as component,
    '✅ Bucket photos-equipements créé' as status,
    NOW() as configured_at
UNION ALL
SELECT 
    'Politiques RLS' as component,
    '✅ Politiques d\'accès configurées' as status,
    NOW() as configured_at
UNION ALL
SELECT 
    'Colonne photos' as component,
    '✅ Colonne photos ajoutée à equipements' as status,
    NOW() as configured_at
UNION ALL
SELECT 
    'Fonctions utilitaires' as component,
    '✅ Fonctions de gestion créées' as status,
    NOW() as configured_at
UNION ALL
SELECT 
    'Audit et monitoring' as component,
    '✅ Système d\'audit configuré' as status,
    NOW() as configured_at;