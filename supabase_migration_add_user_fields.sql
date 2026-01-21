-- Migration: Aggiungi campi legge_104 e importo_trasferte alla tabella users
-- Da eseguire su Supabase SQL Editor

-- 1. Aggiungi le colonne alla tabella users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS legge_104 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS importo_trasferte NUMERIC(10,2) DEFAULT 0;

-- 2. Aggiorna il trigger handle_new_user per includere i nuovi campi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, cognome, ruolo, legge_104, importo_trasferte)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE(NEW.raw_user_meta_data->>'ruolo', 'dipendente'),
    COALESCE((NEW.raw_user_meta_data->>'legge_104')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'importo_trasferte')::numeric, 0)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Commenta le colonne per documentazione
COMMENT ON COLUMN public.users.legge_104 IS 'Indica se l''utente beneficia della Legge 104';
COMMENT ON COLUMN public.users.importo_trasferte IS 'Importo in euro per le trasferte dell''utente';
