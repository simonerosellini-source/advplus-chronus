-- Migration: Fix unique constraint per permettere festività diverse per sede
-- Data: 2026-01-25

-- 1. Rimuovi il vecchio constraint di unicità su data
ALTER TABLE public.giorni_festivi
DROP CONSTRAINT IF EXISTS giorni_festivi_data_key;

-- 2. Aggiungi nuovo constraint di unicità su (data, sede)
-- Questo permette la stessa data per sedi diverse, ma non duplicati per la stessa sede
ALTER TABLE public.giorni_festivi
ADD CONSTRAINT giorni_festivi_data_sede_key UNIQUE (data, sede);

-- 3. Aggiungi commento
COMMENT ON CONSTRAINT giorni_festivi_data_sede_key ON public.giorni_festivi IS
'Vincolo di unicità che permette la stessa data per sedi diverse, ma previene duplicati per la stessa sede. NULL in sede significa festività globale.';
