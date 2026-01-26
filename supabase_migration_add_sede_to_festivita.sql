-- Migration: Aggiungi campo sede a giorni_festivi
-- Data: 2026-01-23

-- 1. Aggiungi colonna sede (nullable per festività globali)
ALTER TABLE public.giorni_festivi
ADD COLUMN sede VARCHAR(50) NULL;

-- 2. Aggiungi constraint per validare i valori di sede
ALTER TABLE public.giorni_festivi
ADD CONSTRAINT valid_sede
CHECK (sede IS NULL OR sede IN ('Viareggio', 'Pietrasanta', 'Massa', 'Camaiore', 'Carrara'));

-- 3. Crea indice per migliorare le query filtrate per sede
CREATE INDEX idx_giorni_festivi_sede ON public.giorni_festivi(sede);

-- 4. Aggiungi commento
COMMENT ON COLUMN public.giorni_festivi.sede IS 'Sede a cui si applica la festività. NULL = valida per tutte le sedi';
