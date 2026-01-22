import { createClient } from '@/lib/supabase/client';
import { getGiorniMese, toISODate, isFuturo } from '@/lib/utils/date';
import type { GiornoFestivo } from '@/types/database.types';

interface UserDefaultHours {
  ingresso_mattina_default: string | null;
  uscita_mattina_default: string | null;
  ingresso_pomeriggio_default: string | null;
  uscita_pomeriggio_default: string | null;
}

/**
 * Calcola ore totali da orari
 */
function calcolaOreTotali(
  ingressoMattina: string | null,
  uscitaMattina: string | null,
  ingressoPomeriggio: string | null,
  uscitaPomeriggio: string | null
): number {
  let oreTotali = 0;

  if (ingressoMattina && uscitaMattina) {
    const [hIn, mIn] = ingressoMattina.split(':').map(Number);
    const [hOut, mOut] = uscitaMattina.split(':').map(Number);
    const minutiMattina = hOut * 60 + mOut - (hIn * 60 + mIn);
    oreTotali += minutiMattina / 60;
  }

  if (ingressoPomeriggio && uscitaPomeriggio) {
    const [hIn, mIn] = ingressoPomeriggio.split(':').map(Number);
    const [hOut, mOut] = uscitaPomeriggio.split(':').map(Number);
    const minutiPomeriggio = hOut * 60 + mOut - (hIn * 60 + mIn);
    oreTotali += minutiPomeriggio / 60;
  }

  return oreTotali;
}

/**
 * Crea presenze di default per un mese per un utente
 * Salta sabati, domeniche, festivi e giorni futuri
 * Per semifestivi crea solo la mattina (09:00-13:00)
 */
export async function creaPresenzeDefault(
  userId: string,
  anno: number,
  mese: number,
  defaultHours: UserDefaultHours,
  festivi: GiornoFestivo[]
): Promise<void> {
  // Se l'utente non ha orari di default configurati, non fare nulla
  if (!defaultHours.ingresso_mattina_default && !defaultHours.ingresso_pomeriggio_default) {
    return;
  }

  const supabase = createClient();
  const giorniMese = getGiorniMese(anno, mese);
  const festiviMap = new Map(festivi.map((f) => [f.data, f]));

  // Recupera le presenze esistenti per questo utente e mese
  const primoGiorno = `${anno}-${String(mese).padStart(2, '0')}-01`;
  const ultimoGiorno = new Date(anno, mese, 0);
  const ultimoGiornoStr = `${anno}-${String(mese).padStart(2, '0')}-${ultimoGiorno.getDate()}`;

  const { data: presenzeEsistenti } = await supabase
    .from('presenze')
    .select('data')
    .eq('user_id', userId)
    .gte('data', primoGiorno)
    .lte('data', ultimoGiornoStr);

  const presenzeEsistentiSet = new Set(presenzeEsistenti?.map((p: { data: string }) => p.data) || []);

  // Prepara array di presenze da inserire
  const presenzeDaInserire: Array<{
    user_id: string;
    data: string;
    ingresso_mattina: string | null;
    uscita_mattina: string | null;
    ingresso_pomeriggio: string | null;
    uscita_pomeriggio: string | null;
    ore_totali: number;
    straordinari: number;
    malattia: number;
    legge_104: number;
    ferie: number;
    ore_trasferte: number;
    note: string | null;
  }> = [];

  for (const dataObj of giorniMese) {
    const data = toISODate(dataObj);

    // Salta se già esiste una presenza per questo giorno
    if (presenzeEsistentiSet.has(data)) {
      continue;
    }

    // Salta giorni futuri
    if (isFuturo(data)) {
      continue;
    }

    // Salta weekend (sabato = 6, domenica = 0)
    const dayOfWeek = dataObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    const festivo = festiviMap.get(data);

    // Salta festivi
    if (festivo?.tipo === 'festivo') {
      continue;
    }

    // Per i semifestivi, crea solo la mattina (09:00-13:00)
    if (festivo?.tipo === 'semifestivo') {
      const oreTotali = calcolaOreTotali('09:00', '13:00', null, null);
      presenzeDaInserire.push({
        user_id: userId,
        data,
        ingresso_mattina: '09:00',
        uscita_mattina: '13:00',
        ingresso_pomeriggio: null,
        uscita_pomeriggio: null,
        ore_totali: oreTotali,
        straordinari: 0,
        malattia: 0,
        legge_104: 0,
        ferie: 0,
        ore_trasferte: 0,
        note: null,
      });
      continue;
    }

    // Giorno normale: crea presenza con orari di default
    const oreTotali = calcolaOreTotali(
      defaultHours.ingresso_mattina_default,
      defaultHours.uscita_mattina_default,
      defaultHours.ingresso_pomeriggio_default,
      defaultHours.uscita_pomeriggio_default
    );

    presenzeDaInserire.push({
      user_id: userId,
      data,
      ingresso_mattina: defaultHours.ingresso_mattina_default,
      uscita_mattina: defaultHours.uscita_mattina_default,
      ingresso_pomeriggio: defaultHours.ingresso_pomeriggio_default,
      uscita_pomeriggio: defaultHours.uscita_pomeriggio_default,
      ore_totali: oreTotali,
      straordinari: 0,
      malattia: 0,
      legge_104: 0,
      ferie: 0,
      ore_trasferte: 0,
      note: null,
    });
  }

  // Inserisci tutte le presenze in batch se ce ne sono
  if (presenzeDaInserire.length > 0) {
    const { error } = await supabase.from('presenze').insert(presenzeDaInserire as any);

    if (error) {
      console.error('Errore creazione presenze di default:', error);
      throw error;
    }
  }
}
