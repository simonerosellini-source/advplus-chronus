-- Schema Database Supabase per Advisory+ Calendar
-- Sistema Gestione Presenze Aziendale

-- ============================================
-- ESTENSIONI
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TIPI ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE sede_type AS ENUM ('Viareggio', 'Pietrasanta', 'Massa', 'Camaiore', 'Carrara');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABELLA: users
-- Estende auth.users di Supabase con informazioni aggiuntive
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  ruolo TEXT NOT NULL CHECK (ruolo IN ('amministratore', 'dipendente', 'collaboratore')),
  legge_104 BOOLEAN DEFAULT false,
  importo_trasferte NUMERIC(10,2) DEFAULT 0,
  sede sede_type DEFAULT 'Viareggio',
  orari_settimanali JSONB DEFAULT NULL,
  data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attivo BOOLEAN DEFAULT TRUE,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indici per performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_ruolo ON public.users(ruolo);
CREATE INDEX idx_users_attivo ON public.users(attivo);

-- ============================================
-- TABELLA: presenze
-- Gestisce le presenze giornaliere degli utenti
-- ============================================
CREATE TABLE IF NOT EXISTS public.presenze (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  ingresso_mattina TIME,
  uscita_mattina TIME,
  ingresso_pomeriggio TIME,
  uscita_pomeriggio TIME,
  note TEXT,
  ore_totali DECIMAL(5,2) GENERATED ALWAYS AS (
    COALESCE(
      EXTRACT(EPOCH FROM (uscita_mattina - ingresso_mattina)) / 3600, 0
    ) + COALESCE(
      EXTRACT(EPOCH FROM (uscita_pomeriggio - ingresso_pomeriggio)) / 3600, 0
    )
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, data),
  CONSTRAINT valid_orari_mattina CHECK (
    (ingresso_mattina IS NULL AND uscita_mattina IS NULL) OR
    (ingresso_mattina IS NOT NULL AND uscita_mattina IS NOT NULL AND ingresso_mattina < uscita_mattina)
  ),
  CONSTRAINT valid_orari_pomeriggio CHECK (
    (ingresso_pomeriggio IS NULL AND uscita_pomeriggio IS NULL) OR
    (ingresso_pomeriggio IS NOT NULL AND uscita_pomeriggio IS NOT NULL AND ingresso_pomeriggio < uscita_pomeriggio)
  ),
  CONSTRAINT valid_orari_giornata CHECK (
    (uscita_mattina IS NULL OR ingresso_pomeriggio IS NULL) OR
    (uscita_mattina <= ingresso_pomeriggio)
  )
);

-- Indici per performance
CREATE INDEX idx_presenze_user_id ON public.presenze(user_id);
CREATE INDEX idx_presenze_data ON public.presenze(data);
CREATE INDEX idx_presenze_user_data ON public.presenze(user_id, data);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_presenze_updated_at
BEFORE UPDATE ON public.presenze
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELLA: giorni_festivi
-- Gestisce il calendario delle festività
-- ============================================
CREATE TABLE IF NOT EXISTS public.giorni_festivi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('festivo', 'semifestivo')),
  anno INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX idx_giorni_festivi_data ON public.giorni_festivi(data);
CREATE INDEX idx_giorni_festivi_anno ON public.giorni_festivi(anno);
CREATE INDEX idx_giorni_festivi_tipo ON public.giorni_festivi(tipo);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giorni_festivi ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES PER TABELLA: users
-- ============================================

-- Gli amministratori possono vedere tutti gli utenti
CREATE POLICY "Amministratori possono vedere tutti gli utenti"
ON public.users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.ruolo = 'amministratore'
  )
);

-- Gli utenti possono vedere il proprio profilo
CREATE POLICY "Utenti possono vedere il proprio profilo"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Gli amministratori possono modificare tutti gli utenti
CREATE POLICY "Amministratori possono modificare tutti gli utenti"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.ruolo = 'amministratore'
  )
);

-- ============================================
-- TRIGGER: Auto-creazione record user dopo signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    nome,
    cognome,
    ruolo,
    legge_104,
    importo_trasferte,
    sede,
    orari_settimanali
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'ruolo', ''), 'dipendente'),
    COALESCE((NULLIF(NEW.raw_user_meta_data->>'legge_104', ''))::boolean, false),
    COALESCE((NULLIF(NEW.raw_user_meta_data->>'importo_trasferte', ''))::numeric, 0),
    COALESCE((NULLIF(NEW.raw_user_meta_data->>'sede', ''))::sede_type, 'Viareggio'),
    NEW.raw_user_meta_data->'orari_settimanali'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger che si attiva quando un nuovo utente viene creato in auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA: Utente amministratore iniziale
-- ============================================
-- NOTA: Questo utente deve essere creato manualmente tramite Supabase Auth
-- dopo aver configurato l'istanza, poi aggiornare il record nella tabella users

-- ============================================
-- COMMENTI SULLE TABELLE
-- ============================================
COMMENT ON TABLE public.users IS 'Tabella utenti estesa con informazioni profilo';
COMMENT ON TABLE public.presenze IS 'Tabella presenze giornaliere con calcolo automatico ore';
COMMENT ON TABLE public.giorni_festivi IS 'Calendario festività aziendali (Art. 31)';

COMMENT ON COLUMN public.presenze.ore_totali IS 'Colonna calcolata automaticamente dalla somma ore mattina + pomeriggio';
COMMENT ON COLUMN public.giorni_festivi.tipo IS 'festivo = 0 ore, semifestivo = 4 ore (09:00-13:00)';
