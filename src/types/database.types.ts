// Tipi TypeScript per il database Supabase

export type RuoloUtente = 'amministratore' | 'dipendente' | 'collaboratore';
export type TipoFestivita = 'festivo' | 'semifestivo';

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: RuoloUtente;
  data_creazione: string;
  attivo: boolean;
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
  created_at: string;
}

// Tipi per le form
export interface UserFormData {
  email: string;
  nome: string;
  cognome: string;
  ruolo: RuoloUtente;
  password?: string;
}

export interface PresenzaFormData {
  user_id: string;
  data: string;
  ingresso_mattina?: string;
  uscita_mattina?: string;
  ingresso_pomeriggio?: string;
  uscita_pomeriggio?: string;
  note?: string;
}

export interface FestivitaFormData {
  data: string;
  nome: string;
  tipo: TipoFestivita;
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
    };
  };
}
