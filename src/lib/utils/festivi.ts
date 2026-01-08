// Utility per gestione giorni festivi predefiniti (Art. 31)
import { calcolaLunediAngelo, calcolaVenerdiSanto, toISODate } from './date';
import type { FestivitaFormData } from '@/types/database.types';

/**
 * Genera l'elenco completo dei giorni festivi predefiniti per un anno
 * Basato su Art. 31 - Festività
 */
export function generaFestiviAnno(anno: number, giornoPatrono?: { giorno: number; mese: number; nome: string }): FestivitaFormData[] {
  const festivi: FestivitaFormData[] = [
    // Festività fisse
    {
      data: toISODate(new Date(anno, 0, 1)),
      nome: 'Capodanno',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 0, 6)),
      nome: 'Epifania del Signore',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 3, 25)),
      nome: 'Anniversario della Liberazione',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 4, 1)),
      nome: 'Festa del Lavoro',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 5, 2)),
      nome: 'Festa della Repubblica',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 7, 15)),
      nome: 'Assunzione di M.V.',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 7, 16)),
      nome: 'Giorno successivo all\'Assunzione',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 10, 1)),
      nome: 'Ognissanti',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 11, 8)),
      nome: 'Immacolata Concezione',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 11, 24)),
      nome: 'Vigilia di Natale',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 11, 25)),
      nome: 'Natale',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 11, 26)),
      nome: 'S. Stefano',
      tipo: 'festivo',
      ricorrente: true,
    },
  ];

  // Festività mobili (dipendono da Pasqua)
  const lunediAngelo = calcolaLunediAngelo(anno);
  const venerdiSanto = calcolaVenerdiSanto(anno);

  festivi.push(
    {
      data: toISODate(lunediAngelo),
      nome: 'Giorno dell\'angelo (Lunedì dopo Pasqua)',
      tipo: 'festivo',
      ricorrente: true,
    },
    {
      data: toISODate(venerdiSanto),
      nome: 'Venerdì Santo',
      tipo: 'festivo',
      ricorrente: true,
    }
  );

  // Santo Patrono (se configurato)
  if (giornoPatrono) {
    festivi.push({
      data: toISODate(new Date(anno, giornoPatrono.mese - 1, giornoPatrono.giorno)),
      nome: `Santo Patrono - ${giornoPatrono.nome}`,
      tipo: 'festivo',
      ricorrente: true,
    });
  }

  // Giorni semifestivi
  festivi.push(
    {
      data: toISODate(new Date(anno, 7, 14)),
      nome: 'Vigilia dell\'Assunzione di M.V.',
      tipo: 'semifestivo',
      ricorrente: true,
    },
    {
      data: toISODate(new Date(anno, 11, 31)),
      nome: 'Ultimo giorno dell\'anno',
      tipo: 'semifestivo',
      ricorrente: true,
    }
  );

  return festivi;
}

/**
 * Orari predefiniti per giorni semifestivi
 */
export const ORARI_SEMIFESTIVO = {
  ingresso_mattina: '09:00',
  uscita_mattina: '13:00',
  ingresso_pomeriggio: null,
  uscita_pomeriggio: null,
  ore_totali: 4,
};

/**
 * Verifica se una data è un giorno festivo
 */
export function isFestivo(data: string, festivi: any[]): boolean {
  return festivi.some(f => f.data === data && f.tipo === 'festivo');
}

/**
 * Verifica se una data è un giorno semifestivo
 */
export function isSemifestivo(data: string, festivi: any[]): boolean {
  return festivi.some(f => f.data === data && f.tipo === 'semifestivo');
}

/**
 * Ottiene il nome del festivo per una data
 */
export function getNomeFestivo(data: string, festivi: any[]): string | null {
  const festivo = festivi.find(f => f.data === data);
  return festivo ? festivo.nome : null;
}
