-- Update handle_new_user trigger to include default work hours

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id, email, nome, cognome, ruolo,
    legge_104, importo_trasferte, sede,
    ingresso_mattina_default, uscita_mattina_default,
    ingresso_pomeriggio_default, uscita_pomeriggio_default,
    orari_settimanali
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE(NEW.raw_user_meta_data->>'ruolo', 'dipendente'),
    COALESCE((NEW.raw_user_meta_data->>'legge_104')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'importo_trasferte')::numeric, 0),
    CAST(COALESCE(NEW.raw_user_meta_data->>'sede', 'Viareggio') AS sede_type),
    NULLIF(NEW.raw_user_meta_data->>'ingresso_mattina_default', '')::time,
    NULLIF(NEW.raw_user_meta_data->>'uscita_mattina_default', '')::time,
    NULLIF(NEW.raw_user_meta_data->>'ingresso_pomeriggio_default', '')::time,
    NULLIF(NEW.raw_user_meta_data->>'uscita_pomeriggio_default', '')::time,
    CASE
      WHEN NEW.raw_user_meta_data->>'orari_settimanali' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'orari_settimanali')::jsonb
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;
