-- Script per popolare i giorni festivi predefiniti (Art. 31)
-- Eseguire dopo la creazione dello schema principale
-- Questo script genera le festività per l'anno corrente e i prossimi 2 anni

-- Funzione helper per calcolare la data di Pasqua (algoritmo di Meeus/Jones/Butcher)
CREATE OR REPLACE FUNCTION calcola_pasqua(anno INTEGER)
RETURNS DATE AS $$
DECLARE
  a INTEGER;
  b INTEGER;
  c INTEGER;
  d INTEGER;
  e INTEGER;
  f INTEGER;
  g INTEGER;
  h INTEGER;
  i INTEGER;
  k INTEGER;
  l INTEGER;
  m INTEGER;
  mese INTEGER;
  giorno INTEGER;
BEGIN
  a := anno % 19;
  b := anno / 100;
  c := anno % 100;
  d := b / 4;
  e := b % 4;
  f := (b + 8) / 25;
  g := (b - f + 1) / 3;
  h := (19 * a + b - d - g + 15) % 30;
  i := c / 4;
  k := c % 4;
  l := (32 + 2 * e + 2 * i - h - k) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  mese := (h + l - 7 * m + 114) / 31;
  giorno := ((h + l - 7 * m + 114) % 31) + 1;

  RETURN make_date(anno, mese, giorno);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Funzione per generare tutte le festività di un anno
CREATE OR REPLACE FUNCTION genera_festivi_anno(anno INTEGER)
RETURNS VOID AS $$
DECLARE
  pasqua DATE;
  lunedi_angelo DATE;
  venerdi_santo DATE;
BEGIN
  -- Calcola Pasqua e festività correlate
  pasqua := calcola_pasqua(anno);
  lunedi_angelo := pasqua + INTERVAL '1 day';
  venerdi_santo := pasqua - INTERVAL '2 days';

  -- Inserisci festività fisse
  INSERT INTO public.giorni_festivi (data, nome, tipo, anno)
  VALUES
    (make_date(anno, 1, 1), 'Capodanno', 'festivo', anno),
    (make_date(anno, 1, 6), 'Epifania del Signore', 'festivo', anno),
    (make_date(anno, 4, 25), 'Anniversario della Liberazione', 'festivo', anno),
    (make_date(anno, 5, 1), 'Festa del Lavoro', 'festivo', anno),
    (make_date(anno, 6, 2), 'Festa della Repubblica', 'festivo', anno),
    (make_date(anno, 8, 15), 'Assunzione di M.V.', 'festivo', anno),
    (make_date(anno, 8, 16), 'Giorno successivo all''Assunzione', 'festivo', anno),
    (make_date(anno, 11, 1), 'Ognissanti', 'festivo', anno),
    (make_date(anno, 12, 8), 'Immacolata Concezione', 'festivo', anno),
    (make_date(anno, 12, 24), 'Vigilia di Natale', 'festivo', anno),
    (make_date(anno, 12, 25), 'Natale', 'festivo', anno),
    (make_date(anno, 12, 26), 'S. Stefano', 'festivo', anno)
  ON CONFLICT (data) DO NOTHING;

  -- Inserisci festività mobili (dipendono da Pasqua)
  INSERT INTO public.giorni_festivi (data, nome, tipo, anno)
  VALUES
    (lunedi_angelo, 'Giorno dell''angelo (Lunedì dopo Pasqua)', 'festivo', anno),
    (venerdi_santo, 'Venerdì Santo', 'festivo', anno)
  ON CONFLICT (data) DO NOTHING;

  -- Inserisci giorni semifestivi
  INSERT INTO public.giorni_festivi (data, nome, tipo, anno)
  VALUES
    (make_date(anno, 8, 14), 'Vigilia dell''Assunzione di M.V.', 'semifestivo', anno),
    (make_date(anno, 12, 31), 'Ultimo giorno dell''anno', 'semifestivo', anno)
  ON CONFLICT (data) DO NOTHING;

  -- NOTA: Il Santo Patrono deve essere aggiunto manualmente dall'interfaccia
  -- in base alla città/sede dell'azienda

  RAISE NOTICE 'Festività generate per l''anno %', anno;
END;
$$ LANGUAGE plpgsql;

-- Genera festività per l'anno corrente e i prossimi 2 anni
DO $$
DECLARE
  anno_corrente INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  PERFORM genera_festivi_anno(anno_corrente);
  PERFORM genera_festivi_anno(anno_corrente + 1);
  PERFORM genera_festivi_anno(anno_corrente + 2);
END $$;

-- Verifica dati inseriti
SELECT anno, tipo, COUNT(*) as totale
FROM public.giorni_festivi
GROUP BY anno, tipo
ORDER BY anno, tipo;

COMMENT ON FUNCTION calcola_pasqua IS 'Calcola la data di Pasqua per un dato anno usando l''algoritmo di Meeus/Jones/Butcher';
COMMENT ON FUNCTION genera_festivi_anno IS 'Genera tutte le festività predefinite (Art. 31) per un anno specifico';
