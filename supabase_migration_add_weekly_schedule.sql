-- Migration: Add weekly schedule configuration to users table

-- Add JSONB column for weekly work schedule
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS orari_settimanali JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.users.orari_settimanali IS 'Configurazione orari settimanali: { "lunedi": { "abilitato": true, "ingresso_mattina": "09:00", "uscita_mattina": "13:00", "ingresso_pomeriggio": "15:00", "uscita_pomeriggio": "18:30" }, ... }';

-- Example structure:
-- {
--   "lunedi": { "abilitato": true, "ingresso_mattina": "09:00", "uscita_mattina": "13:00", "ingresso_pomeriggio": "15:00", "uscita_pomeriggio": "18:30" },
--   "martedi": { "abilitato": true, "ingresso_mattina": "09:00", "uscita_mattina": "13:00", "ingresso_pomeriggio": null, "uscita_pomeriggio": null },
--   "mercoledi": { "abilitato": true, "ingresso_mattina": "09:00", "uscita_mattina": "13:00", "ingresso_pomeriggio": "15:00", "uscita_pomeriggio": "18:30" },
--   "giovedi": { "abilitato": true, "ingresso_mattina": "09:00", "uscita_mattina": "13:00", "ingresso_pomeriggio": "15:00", "uscita_pomeriggio": "18:30" },
--   "venerdi": { "abilitato": true, "ingresso_mattina": "09:00", "uscita_mattina": "13:00", "ingresso_pomeriggio": "15:00", "uscita_pomeriggio": "18:30" },
--   "sabato": { "abilitato": false, "ingresso_mattina": null, "uscita_mattina": null, "ingresso_pomeriggio": null, "uscita_pomeriggio": null },
--   "domenica": { "abilitato": false, "ingresso_mattina": null, "uscita_mattina": null, "ingresso_pomeriggio": null, "uscita_pomeriggio": null }
-- }
