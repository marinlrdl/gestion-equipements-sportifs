-- ===================================
-- MIGRATION : Création des tables de gestion de densité
-- Date: 2025-11-05
-- Description: Table densite_log pour historique des densités d'équipements
-- ===================================

-- Création de la table densite_log pour l'historique des densités
CREATE TABLE IF NOT EXISTS densite_log (
    id BIGSERIAL PRIMARY KEY,
    equip_id TEXT NOT NULL REFERENCES equipements(equip_numero) ON DELETE CASCADE,
    densite_personnes INTEGER NOT NULL CHECK (densite_personnes >= 0),
    capacite_max INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    utilisateur_id UUID REFERENCES auth.users(id),
    notes TEXT,
    
    -- Index pour optimiser les requêtes
    CONSTRAINT fk_equipement FOREIGN KEY (equip_id) REFERENCES equipements(equip_numero) ON DELETE CASCADE
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_densite_log_equip_id ON densite_log(equip_id);
CREATE INDEX IF NOT EXISTS idx_densite_log_timestamp ON densite_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_densite_log_equip_timestamp ON densite_log(equip_id, timestamp DESC);

-- Index partiel pour les 7 derniers jours (optimisation)
CREATE INDEX IF NOT EXISTS idx_densite_log_recent ON densite_log(equip_id, timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '7 days';

-- Fonction pour nettoyer les anciennes données (plus de 30 jours)
CREATE OR REPLACE FUNCTION cleanup_old_density_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM densite_log 
    WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Planifier le nettoyage automatique (exécution quotidienne à 2h du matin)
SELECT cron.schedule('cleanup-density-logs', '0 2 * * *', 'SELECT cleanup_old_density_logs();');

-- Fonction pour obtenir la dernière densité d'un équipement
CREATE OR REPLACE FUNCTION get_last_density(equipment_id TEXT)
RETURNS TABLE(
    densite_personnes INTEGER,
    capacite_max INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT dl.densite_personnes, dl.capacite_max, dl.timestamp
    FROM densite_log dl
    WHERE dl.equip_id = equipment_id
    ORDER BY dl.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir l'historique de densité d'un équipement
CREATE OR REPLACE FUNCTION get_density_history(equipment_id TEXT, days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    id BIGINT,
    equip_id TEXT,
    densite_personnes INTEGER,
    capacite_max INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE,
    utilisateur_id UUID,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT dl.id, dl.equip_id, dl.densite_personnes, dl.capacite_max, 
           dl.timestamp, dl.utilisateur_id, dl.notes
    FROM densite_log dl
    WHERE dl.equip_id = equipment_id 
      AND dl.timestamp >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY dl.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les statistiques de densité
CREATE OR REPLACE FUNCTION get_density_stats(equipment_id TEXT, days_back INTEGER DEFAULT 7)
RETURNS TABLE(
    total_records BIGINT,
    densite_moyenne NUMERIC,
    densite_max INTEGER,
    densite_min INTEGER,
    taux_occupation_moyen NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_records,
        ROUND(AVG(dl.densite_personnes), 2) as densite_moyenne,
        MAX(dl.densite_personnes) as densite_max,
        MIN(dl.densite_personnes) as densite_min,
        ROUND(AVG(
            CASE 
                WHEN dl.capacite_max > 0 THEN 
                    (dl.densite_personnes::NUMERIC / dl.capacite_max::NUMERIC) * 100
                ELSE 0 
            END
        ), 2) as taux_occupation_moyen
    FROM densite_log dl
    WHERE dl.equip_id = equipment_id 
      AND dl.timestamp >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) pour densite_log
ALTER TABLE densite_log ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique (données non sensibles)
CREATE POLICY "densite_log_select_public" ON densite_log
    FOR SELECT USING (true);

-- Politique pour insertion selon les rôles
CREATE POLICY "densite_log_insert" ON densite_log
    FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Politique pour mise à jour selon les permissions équipement
CREATE POLICY "densite_log_update" ON densite_log
    FOR UPDATE USING (
        auth.role() IN ('authenticated', 'service_role') AND
        EXISTS (
            SELECT 1 FROM equipements e
            WHERE e.equip_numero = densite_log.equip_id
            AND (
                auth.jwt() ->> 'role' = 'administrateur' OR
                (auth.jwt() ->> 'role' = 'prefecture_regionale' AND e.region_code = (auth.jwt() ->> 'region_code')) OR
                (auth.jwt() ->> 'role' = 'prefecture_departementale' AND e.departement_code = (auth.jwt() ->> 'departement_code')) OR
                (auth.jwt() ->> 'role' = 'mairie' AND e.commune_code = (auth.jwt() ->> 'commune_code'))
            )
        )
    );

-- Politique pour suppression (admin uniquement)
CREATE POLICY "densite_log_delete_admin" ON densite_log
    FOR DELETE USING (auth.jwt() ->> 'role' = 'administrateur');

-- Trigger pour mettre à jour la date de modification sur equipements
CREATE OR REPLACE FUNCTION update_densite_actuelle()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour la densité actuelle de l'équipement
    UPDATE equipements 
    SET densite_actuelle = NEW.densite_personnes,
        updated_at = NEW.timestamp
    WHERE equip_numero = NEW.equip_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger à la table densite_log
CREATE TRIGGER trigger_update_densite_actuelle
    AFTER INSERT ON densite_log
    FOR EACH ROW
    EXECUTE FUNCTION update_densite_actuelle();

-- Vue pour simplifier les requêtes de densité récente
CREATE OR REPLACE VIEW densite_recent AS
SELECT 
    dl.equip_id,
    dl.densite_personnes,
    dl.capacite_max,
    dl.timestamp,
    e.equip_nom,
    e.commune_nom,
    e.departement_nom,
    e.equip_type_name,
    -- Calculer le taux d'occupation
    CASE 
        WHEN dl.capacite_max > 0 THEN 
            ROUND((dl.densite_personnes::NUMERIC / dl.capacite_max::NUMERIC) * 100, 1)
        ELSE 0 
    END as taux_occupation_pct,
    -- Déterminer le niveau d'alerte
    CASE 
        WHEN dl.capacite_max > 0 AND dl.densite_personnes >= dl.capacite_max THEN 'CRITIQUE'
        WHEN dl.capacite_max > 0 AND dl.densite_personnes >= (dl.capacite_max * 0.8)::INTEGER THEN 'ATTENTION'
        WHEN dl.capacite_max > 0 AND dl.densite_personnes >= (dl.capacite_max * 0.5)::INTEGER THEN 'MODEREE'
        ELSE 'NORMALE'
    END as niveau_alerte
FROM densite_log dl
JOIN equipements e ON dl.equip_id = e.equip_numero
WHERE dl.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY dl.timestamp DESC;

-- Insertion de données de test pour valider le système
INSERT INTO densite_log (equip_id, densite_personnes, capacite_max, timestamp, notes)
SELECT 
    e.equip_numero,
    FLOOR(RANDOM() * 50) + 10, -- Densité entre 10 et 60
    100 as capacite_max,
    NOW() - (INTERVAL '1 day' * FLOOR(RANDOM() * 7)), -- Dans les 7 derniers jours
    'Données de test automatiques'
FROM equipements e
LIMIT 50; -- Limiter à 50 équipements pour les tests

-- Commentaires de documentation
COMMENT ON TABLE densite_log IS 'Historique des densités d''occupation des équipements sportifs';
COMMENT ON COLUMN densite_log.equip_id IS 'Référence vers l''équipement (equip_numero)';
COMMENT ON COLUMN densite_log.densite_personnes IS 'Nombre de personnes présentes sur l''équipement';
COMMENT ON COLUMN densite_log.capacite_max IS 'Capacité maximale de l''équipement au moment de la mesure';
COMMENT ON COLUMN densite_log.utilisateur_id IS 'Utilisateur qui a effectué la mise à jour';
COMMENT ON COLUMN densite_log.notes IS 'Notes optionnelles sur la mesure';

-- Statistiques post-migration
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM information_schema.tables 
    WHERE table_name = 'densite_log';
    
    SELECT COUNT(*) INTO index_count FROM pg_indexes 
    WHERE tablename = 'densite_log';
    
    RAISE NOTICE 'Table densite_log créée avec succès: %', CASE WHEN table_count > 0 THEN 'OUI' ELSE 'NON' END;
    RAISE NOTICE 'Index créés: %', index_count;
    RAISE NOTICE 'Données de test insérées pour validation du système';
END $$;

-- ===================================
-- FIN DE LA MIGRATION
-- ===================================

-- Pour appliquer cette migration, exécutez ce script dans votre base Supabase :
-- 1. Via l'interface SQL de Supabase
-- 2. Via l'outil en ligne de commande Supabase CLI
-- 3. Via les migrations automatisées de votre application

-- Cette migration :
-- ✅ Crée la table densite_log avec toutes les contraintes nécessaires
-- ✅ Ajoute les index pour optimiser les performances
-- ✅ Configure les politiques RLS selon les rôles utilisateur
-- ✅ Crée les fonctions utilitaires pour les requêtes fréquentes
-- ✅ Configure le nettoyage automatique des anciennes données
-- ✅ Insère des données de test pour validation
-- ✅ Crée une vue simplifiée pour les requêtes récentes