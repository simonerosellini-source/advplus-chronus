-- Migration: Add new attendance fields
-- Fields: straordinari, malattia, legge_104, ferie, ore_trasferte
-- All fields are NUMERIC to track hours

-- Add columns to presenze table (or alter if they exist)
ALTER TABLE public.presenze
ADD COLUMN IF NOT EXISTS straordinari NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS malattia NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS legge_104 NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ferie NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ore_trasferte NUMERIC(5,2) DEFAULT 0;

-- If columns already exist as BOOLEAN, alter them to NUMERIC
-- This will convert false to 0 and true to 1 automatically
DO $$
BEGIN
    -- Change malattia from BOOLEAN to NUMERIC if exists
    BEGIN
        ALTER TABLE public.presenze
        ALTER COLUMN malattia TYPE NUMERIC(5,2) USING (CASE WHEN malattia THEN 8 ELSE 0 END);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Change legge_104 from BOOLEAN to NUMERIC if exists
    BEGIN
        ALTER TABLE public.presenze
        ALTER COLUMN legge_104 TYPE NUMERIC(5,2) USING (CASE WHEN legge_104 THEN 8 ELSE 0 END);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    -- Change ferie from BOOLEAN to NUMERIC if exists
    BEGIN
        ALTER TABLE public.presenze
        ALTER COLUMN ferie TYPE NUMERIC(5,2) USING (CASE WHEN ferie THEN 8 ELSE 0 END);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.presenze.straordinari IS 'Ore di straordinario lavorate';
COMMENT ON COLUMN public.presenze.malattia IS 'Ore di malattia';
COMMENT ON COLUMN public.presenze.legge_104 IS 'Ore permesso Legge 104';
COMMENT ON COLUMN public.presenze.ferie IS 'Ore di ferie';
COMMENT ON COLUMN public.presenze.ore_trasferte IS 'Ore di trasferta';
