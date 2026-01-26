// Utility functions per gestione date e calcolo ore
import { format, parse, parseISO, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, isBefore, isSameDay, getYear, startOfDay } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Formatta una data nel formato italiano gg/mm/aaaa
 */
export function formatDateIT(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: it });
}

/**
 * Formatta un orario nel formato HH:mm
 */
export function formatTime(time: string | null): string {
  if (!time) return '';
  return time.substring(0, 5); // Prende solo HH:mm da HH:mm:ss
}

/**
 * Calcola la differenza in ore tra due orari (formato HH:mm)
 */
export function calcolaOre(inizio: string | null, fine: string | null): number {
  if (!inizio || !fine) return 0;

  const [oreInizio, minutiInizio] = inizio.split(':').map(Number);
  const [oreFine, minutiFine] = fine.split(':').map(Number);

  const minutiTotaliInizio = oreInizio * 60 + minutiInizio;
  const minutiTotaliFine = oreFine * 60 + minutiFine;

  const differenzaMinuti = minutiTotaliFine - minutiTotaliInizio;

  return differenzaMinuti / 60;
}

/**
 * Calcola il totale ore di una presenza
 */
export function calcolaOreTotali(
  ingressoMattina: string | null,
  uscitaMattina: string | null,
  ingressoPomeriggio: string | null,
  uscitaPomeriggio: string | null
): number {
  const oreMattina = calcolaOre(ingressoMattina, uscitaMattina);
  const orePomeriggio = calcolaOre(ingressoPomeriggio, uscitaPomeriggio);
  return oreMattina + orePomeriggio;
}

/**
 * Genera array di giorni per un mese specifico
 */
export function getGiorniMese(anno: number, mese: number): Date[] {
  const primoGiorno = startOfMonth(new Date(anno, mese - 1));
  const ultimoGiorno = endOfMonth(new Date(anno, mese - 1));
  return eachDayOfInterval({ start: primoGiorno, end: ultimoGiorno });
}

/**
 * Calcola la data di Pasqua per un dato anno (algoritmo di Meeus/Jones/Butcher)
 */
export function calcolaPasqua(anno: number): Date {
  const a = anno % 19;
  const b = Math.floor(anno / 100);
  const c = anno % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(anno, mese - 1, giorno);
}

/**
 * Calcola il Lunedì dell'Angelo (Pasquetta) - giorno dopo Pasqua
 */
export function calcolaLunediAngelo(anno: number): Date {
  const pasqua = calcolaPasqua(anno);
  return addDays(pasqua, 1);
}

/**
 * Calcola il Venerdì Santo - venerdì prima di Pasqua
 */
export function calcolaVenerdiSanto(anno: number): Date {
  const pasqua = calcolaPasqua(anno);
  return addDays(pasqua, -2);
}

/**
 * Nomi dei mesi in italiano
 */
export const MESI_ITALIANI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

/**
 * Nomi dei giorni della settimana in italiano (abbreviati)
 */
export const GIORNI_SETTIMANA = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

/**
 * Verifica se una data è oggi
 */
export function isOggi(data: Date | string): boolean {
  const d = typeof data === 'string' ? parseISO(data) : data;
  return isSameDay(d, new Date());
}

/**
 * Verifica se una data è nel futuro (confronta solo le date, ignorando l'ora)
 */
export function isFuturo(data: Date | string): boolean {
  const d = typeof data === 'string' ? parseISO(data) : data;
  // Confronta solo le date, ignorando l'ora
  return isAfter(startOfDay(d), startOfDay(new Date()));
}

/**
 * Verifica se una data è nel passato
 */
export function isPassato(data: Date | string): boolean {
  const d = typeof data === 'string' ? parseISO(data) : data;
  return isBefore(d, new Date());
}

/**
 * Converte una data in formato YYYY-MM-DD per il database
 */
export function toISODate(data: Date): string {
  return format(data, 'yyyy-MM-dd');
}

/**
 * Valida un orario in formato HH:mm
 */
export function isOrarioValido(orario: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(orario);
}

/**
 * Valida che orario1 sia prima di orario2
 */
export function isPrima(orario1: string, orario2: string): boolean {
  const [ore1, minuti1] = orario1.split(':').map(Number);
  const [ore2, minuti2] = orario2.split(':').map(Number);

  const minuti1Totali = ore1 * 60 + minuti1;
  const minuti2Totali = ore2 * 60 + minuti2;

  return minuti1Totali < minuti2Totali;
}

/**
 * Formatta ore decimali in formato "Xh Ym" (base 60)
 * Es. 5.5 -> "5h 30m", 8 -> "8h", 101.5 -> "101h 30m"
 */
export function formatOreTotali(ore: number): string {
  const oreIntere = Math.floor(ore);
  const minuti = Math.round((ore - oreIntere) * 60);
  if (minuti === 0) {
    return `${oreIntere}h`;
  }
  return `${oreIntere}h ${minuti}m`;
}
