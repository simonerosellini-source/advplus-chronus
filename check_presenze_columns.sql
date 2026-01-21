-- Script di verifica: Controlla il tipo dei campi presenze
-- Esegui questo per vedere lo stato attuale dei campi

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'presenze'
  AND column_name IN ('straordinari', 'malattia', 'legge_104', 'ferie', 'ore_trasferte')
ORDER BY column_name;

-- Se i campi mostrano data_type = 'boolean', devi eseguire la migrazione completa
-- dal file: supabase_migration_add_attendance_fields.sql
