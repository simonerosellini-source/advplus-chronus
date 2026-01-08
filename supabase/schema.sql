-- Schema Database Supabase per Advisory+ Calendar
-- Sistema Gestione Presenze Aziendale

-- ============================================
-- ESTENSIONI
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- Gli utenti non amministratori possono vedere solo se stessi
CREATE POLICY "Utenti possono vedere solo se stessi"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Solo gli amministratori possono inserire nuovi utenti
CREATE POLICY "Solo amministratori possono inserire utenti"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- Solo gli amministratori possono aggiornare gli utenti
CREATE POLICY "Solo amministratori possono aggiornare utenti"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- Gli utenti possono aggiornare solo alcuni campi del proprio profilo
CREATE POLICY "Utenti possono aggiornare il proprio profilo"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- POLICIES PER TABELLA: presenze
-- ============================================

-- Gli amministratori possono vedere tutte le presenze
CREATE POLICY "Amministratori possono vedere tutte le presenze"
ON public.presenze FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- Gli utenti non amministratori possono vedere solo le proprie presenze
CREATE POLICY "Utenti possono vedere solo le proprie presenze"
ON public.presenze FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Solo gli amministratori possono inserire presenze
CREATE POLICY "Solo amministratori possono inserire presenze"
ON public.presenze FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- Solo gli amministratori possono aggiornare presenze
CREATE POLICY "Solo amministratori possono aggiornare presenze"
ON public.presenze FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- Solo gli amministratori possono eliminare presenze
CREATE POLICY "Solo amministratori possono eliminare presenze"
ON public.presenze FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- ============================================
-- POLICIES PER TABELLA: giorni_festivi
-- ============================================

-- Tutti gli utenti autenticati possono leggere i giorni festivi
CREATE POLICY "Tutti possono leggere giorni festivi"
ON public.giorni_festivi FOR SELECT
TO authenticated
USING (TRUE);

-- Solo gli amministratori possono gestire i giorni festivi
CREATE POLICY "Solo amministratori possono gestire giorni festivi"
ON public.giorni_festivi FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- ============================================
-- FUNZIONI UTILITY
-- ============================================

-- Funzione per calcolare le statistiche mensili di un utente
CREATE OR REPLACE FUNCTION calcola_statistiche_mensili(
  p_user_id UUID,
  p_anno INTEGER,
  p_mese INTEGER
)
RETURNS TABLE (
  ore_totali_mese DECIMAL,
  giorni_presenza INTEGER,
  giorni_assenza INTEGER,
  media_ore_giornaliere DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH giorni_mese AS (
    SELECT generate_series(
      DATE (p_anno || '-' || p_mese || '-01'),
      DATE (p_anno || '-' || p_mese || '-01') + INTERVAL '1 month' - INTERVAL '1 day',
      INTERVAL '1 day'
    )::DATE AS data
  ),
  presenze_mese AS (
    SELECT COALESCE(SUM(ore_totali), 0) AS tot_ore,
           COUNT(*) FILTER (WHERE ore_totali > 0) AS giorni_pres
    FROM public.presenze
    WHERE user_id = p_user_id
      AND EXTRACT(YEAR FROM data) = p_anno
      AND EXTRACT(MONTH FROM data) = p_mese
  ),
  giorni_lavorativi AS (
    SELECT COUNT(*) AS tot_giorni
    FROM giorni_mese gm
    LEFT JOIN public.giorni_festivi gf ON gm.data = gf.data
    WHERE gf.data IS NULL OR gf.tipo = 'semifestivo'
  )
  SELECT
    pm.tot_ore,
    pm.giorni_pres::INTEGER,
    (gl.tot_giorni - pm.giorni_pres)::INTEGER,
    CASE
      WHEN pm.giorni_pres > 0 THEN ROUND(pm.tot_ore / pm.giorni_pres, 2)
      ELSE 0
    END
  FROM presenze_mese pm, giorni_lavorativi gl;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-creazione record user dopo signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, cognome, ruolo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE(NEW.raw_user_meta_data->>'ruolo', 'dipendente')
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
