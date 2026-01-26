-- Migration: Aggiungere tabella per gestire i lock mensili delle presenze
-- Data: 2026-01-26
-- Descrizione: Permette agli amministratori di bloccare/sbloccare l'editing delle presenze per mese

-- ============================================
-- TABELLA: presenze_locks
-- Gestisce lo stato di blocco per mese/anno
-- ============================================
CREATE TABLE IF NOT EXISTS public.presenze_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anno INTEGER NOT NULL,
  mese INTEGER NOT NULL CHECK (mese >= 1 AND mese <= 12),
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(anno, mese)
);

-- Indici per performance
CREATE INDEX idx_presenze_locks_anno_mese ON public.presenze_locks(anno, mese);
CREATE INDEX idx_presenze_locks_locked ON public.presenze_locks(locked);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_presenze_locks_updated_at
BEFORE UPDATE ON public.presenze_locks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Abilita RLS sulla tabella
ALTER TABLE public.presenze_locks ENABLE ROW LEVEL SECURITY;

-- Tutti gli utenti autenticati possono leggere i lock
CREATE POLICY "Tutti possono leggere presenze locks"
ON public.presenze_locks FOR SELECT
TO authenticated
USING (TRUE);

-- Solo gli amministratori possono gestire i lock
CREATE POLICY "Solo amministratori possono gestire presenze locks"
ON public.presenze_locks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND ruolo = 'amministratore'
  )
);

-- ============================================
-- COMMENTI SULLA TABELLA
-- ============================================
COMMENT ON TABLE public.presenze_locks IS 'Tabella per gestire lo stato di blocco delle presenze per mese/anno';
COMMENT ON COLUMN public.presenze_locks.locked IS 'TRUE = presenze bloccate per utenti non admin, FALSE = presenze editabili da tutti';
