-- Migration: Add new attendance fields
-- Fields: straordinari, malattia, legge_104, ferie, ore_trasferte

-- Add columns to presenze table
ALTER TABLE public.presenze
ADD COLUMN IF NOT EXISTS straordinari NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS malattia BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS legge_104 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ferie BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ore_trasferte NUMERIC(5,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.presenze.straordinari IS 'Ore di straordinario lavorate';
COMMENT ON COLUMN public.presenze.malattia IS 'Indica se il giorno è di malattia';
COMMENT ON COLUMN public.presenze.legge_104 IS 'Indica se il giorno è per permesso Legge 104';
COMMENT ON COLUMN public.presenze.ferie IS 'Indica se il giorno è di ferie';
COMMENT ON COLUMN public.presenze.ore_trasferte IS 'Ore di trasferta';
