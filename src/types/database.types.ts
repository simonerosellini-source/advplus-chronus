// Tipi TypeScript per il database Supabase

export type RuoloUtente = 'amministratore' | 'dipendente' | 'collaboratore';
export type TipoFestivita = 'festivo' | 'semifestivo';
export type Sede = 'Viareggio' | 'Pietrasanta' | 'Massa' | 'Camaiore' | 'Carrara';
export type GiornoSettimana = 'lunedi' | 'martedi' | 'mercoledi' | 'giovedi' | 'venerdi' | 'sabato' | 'domenica';

// Struttura per gli orari di un singolo giorno
export interface OrarioGiornaliero {
  abilitato: boolean; // Flag generale per il giorno
  mattina_abilitata: boolean; // Flag per la sessione mattina
  ingresso_mattina: string | null;
  uscita_mattina: string | null;
  pomeriggio_abilitato: boolean; // Flag per la sessione pomeriggio
  ingresso_pomeriggio: string | null;
  uscita_pomeriggio: string | null;
}

// Struttura completa per gli orari settimanali
export type OrariSettimanali = {
  [K in GiornoSettimana]: OrarioGiornaliero;
};

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: RuoloUtente;
  data_creazione: string;
  attivo: boolean;
  legge_104: boolean;
  importo_trasferte: number;
  sede: Sede;
  ingresso_mattina_default: string | null;
  uscita_mattina_default: string | null;
  ingresso_pomeriggio_default: string | null;
  uscita_pomeriggio_default: string | null;
  orari_settimanali: OrariSettimanali | null;
}

export interface Presenza {
  id: string;
  user_id: string;
  data: string;
  ingresso_mattina: string | null;
  uscita_mattina: string | null;
  ingresso_pomeriggio: string | null;
  uscita_pomeriggio: string | null;
  note: string | null;
  ore_totali: number;
  straordinari: number;
  malattia: number;
  legge_104: number;
  ferie: number;
  trasferta: boolean;
  created_at: string;
  updated_at: string;
  // Relazioni
  user?: User;
}

export interface GiornoFestivo {
  id: string;
  data: string;
  nome: string;
  tipo: TipoFestivita;
  anno: number;
  sede: Sede | null; // null = festività globale valida per tutte le sedi
  created_at: string;
}

export interface PresenzeLock {
  id: string;
  anno: number;
  mese: number;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

// Tipi per le form
export interface UserFormData {
  email: string;
  nome: string;
  cognome: string;
  ruolo: RuoloUtente;
  password?: string;
  legge_104?: boolean;
  importo_trasferte?: number;
  sede?: Sede;
  ingresso_mattina_default?: string;
  uscita_mattina_default?: string;
  ingresso_pomeriggio_default?: string;
  uscita_pomeriggio_default?: string;
  orari_settimanali?: OrariSettimanali | null;
}

export interface PresenzaFormData {
  user_id: string;
  data: string;
  ingresso_mattina?: string;
  uscita_mattina?: string;
  ingresso_pomeriggio?: string;
  uscita_pomeriggio?: string;
  note?: string;
  straordinari?: number;
  malattia?: number;
  legge_104?: number;
  ferie?: number;
  trasferta?: boolean;
}

export interface FestivitaFormData {
  data: string;
  nome: string;
  tipo: TipoFestivita;
  sede?: Sede | null; // null = festività globale valida per tutte le sedi
  ricorrente?: boolean;
}

// Tipo per la vista calendario
export interface GiornoCalendario {
  data: string;
  giorno: number;
  tipo: 'festivo' | 'semifestivo' | 'normale' | 'futuro';
  presenza?: Presenza;
  festivo?: GiornoFestivo;
}

export interface RigaPresenze {
  user: User;
  giorni: GiornoCalendario[];
  ore_totali: number;
  totaliMensili: {
    oreOrdinarie: number;
    straordinari: number;
    malattia: number;
    legge_104: number;
    ferie: number;
    trasferte: number; // Numero di giorni con trasferta
  };
}

// Statistiche
export interface StatisticheUtente {
  user_id: string;
  nome_completo: string;
  ore_totali_mese: number;
  giorni_presenza: number;
  giorni_assenza: number;
  media_ore_giornaliere: number;
}

// Database schema type per Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'data_creazione'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      presenze: {
        Row: Presenza;
        Insert: Omit<Presenza, 'id' | 'created_at' | 'updated_at' | 'ore_totali'>;
        Update: Partial<Omit<Presenza, 'id' | 'created_at'>>;
      };
      giorni_festivi: {
        Row: GiornoFestivo;
        Insert: Omit<GiornoFestivo, 'id' | 'created_at'>;
        Update: Partial<Omit<GiornoFestivo, 'id' | 'created_at'>>;
      };
      presenze_locks: {
        Row: PresenzeLock;
        Insert: Omit<PresenzeLock, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PresenzeLock, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
