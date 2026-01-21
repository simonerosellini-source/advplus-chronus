-- Migration: Aggiungi campo sede alla tabella users
-- Da eseguire su Supabase SQL Editor

-- 1. Crea il tipo ENUM per le sedi
DO $$ BEGIN
  CREATE TYPE sede_type AS ENUM ('Viareggio', 'Pietrasanta', 'Massa', 'Camaiore', 'Carrara');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Aggiungi la colonna sede alla tabella users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS sede sede_type DEFAULT 'Viareggio';

-- 3. Aggiorna il trigger handle_new_user per includere il campo sede
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, cognome, ruolo, legge_104, importo_trasferte, sede)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE(NEW.raw_user_meta_data->>'ruolo', 'dipendente'),
    COALESCE((NEW.raw_user_meta_data->>'legge_104')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'importo_trasferte')::numeric, 0),
    COALESCE((NEW.raw_user_meta_data->>'sede')::sede_type, 'Viareggio')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Commenta la colonna per documentazione
COMMENT ON COLUMN public.users.sede IS 'Sede di lavoro dell''utente (Viareggio, Pietrasanta, Massa, Camaiore, Carrara)';
