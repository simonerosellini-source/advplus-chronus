-- Migration: Add default work schedule fields to users table

-- Add columns for default work hours
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ingresso_mattina_default TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS uscita_mattina_default TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ingresso_pomeriggio_default TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS uscita_pomeriggio_default TIME DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.ingresso_mattina_default IS 'Orario ingresso mattina da contratto';
COMMENT ON COLUMN public.users.uscita_mattina_default IS 'Orario uscita mattina da contratto';
COMMENT ON COLUMN public.users.ingresso_pomeriggio_default IS 'Orario ingresso pomeriggio da contratto';
COMMENT ON COLUMN public.users.uscita_pomeriggio_default IS 'Orario uscita pomeriggio da contratto';
