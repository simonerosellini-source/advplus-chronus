-- Migration: Converti ore_trasferte (DECIMAL) in trasferta (BOOLEAN)
-- Data: 2026-01-23

-- 1. Aggiungi nuova colonna booleana
ALTER TABLE public.presenze
ADD COLUMN trasferta BOOLEAN DEFAULT false;

-- 2. Migra i dati esistenti (se ore_trasferte > 0 allora trasferta = true)
UPDATE public.presenze
SET trasferta = (ore_trasferte > 0)
WHERE ore_trasferte IS NOT NULL;

-- 3. Rimuovi la vecchia colonna
ALTER TABLE public.presenze
DROP COLUMN ore_trasferte;

-- 4. Aggiungi commento
COMMENT ON COLUMN public.presenze.trasferta IS 'Flag per indicare se la giornata include una trasferta';
