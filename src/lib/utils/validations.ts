// Validazioni per i form
import { z } from 'zod';

/**
 * Schema validazione per creazione/modifica utente
 */
export const userSchema = z.object({
  email: z.string().email('Email non valida'),
  nome: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  cognome: z.string().min(2, 'Il cognome deve contenere almeno 2 caratteri'),
  ruolo: z.enum(['amministratore', 'dipendente', 'collaboratore'], {
    errorMap: () => ({ message: 'Ruolo non valido' }),
  }),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri').optional(),
});

/**
 * Schema validazione per login
 */
export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password richiesta'),
});

/**
 * Schema validazione per presenza
 */
export const presenzaSchema = z.object({
  user_id: z.string().uuid('ID utente non valido'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
  ingresso_mattina: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario ingresso mattina non valido').nullable().optional(),
  uscita_mattina: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario uscita mattina non valido').nullable().optional(),
  ingresso_pomeriggio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario ingresso pomeriggio non valido').nullable().optional(),
  uscita_pomeriggio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Orario uscita pomeriggio non valido').nullable().optional(),
  note: z.string().optional(),
}).refine(
  (data) => {
    // Valida che ingresso mattina sia prima di uscita mattina
    if (data.ingresso_mattina && data.uscita_mattina) {
      return data.ingresso_mattina < data.uscita_mattina;
    }
    return true;
  },
  {
    message: 'L\'orario di ingresso mattina deve essere precedente all\'uscita mattina',
    path: ['uscita_mattina'],
  }
).refine(
  (data) => {
    // Valida che ingresso pomeriggio sia prima di uscita pomeriggio
    if (data.ingresso_pomeriggio && data.uscita_pomeriggio) {
      return data.ingresso_pomeriggio < data.uscita_pomeriggio;
    }
    return true;
  },
  {
    message: 'L\'orario di ingresso pomeriggio deve essere precedente all\'uscita pomeriggio',
    path: ['uscita_pomeriggio'],
  }
).refine(
  (data) => {
    // Valida che uscita mattina sia prima o uguale a ingresso pomeriggio
    if (data.uscita_mattina && data.ingresso_pomeriggio) {
      return data.uscita_mattina <= data.ingresso_pomeriggio;
    }
    return true;
  },
  {
    message: 'L\'orario di uscita mattina deve essere precedente all\'ingresso pomeriggio',
    path: ['ingresso_pomeriggio'],
  }
);

/**
 * Schema validazione per festività
 */
export const festivitaSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data non valida'),
  nome: z.string().min(3, 'Il nome deve contenere almeno 3 caratteri'),
  tipo: z.enum(['festivo', 'semifestivo'], {
    errorMap: () => ({ message: 'Tipo non valido' }),
  }),
  ricorrente: z.boolean().optional(),
});

/**
 * Formatta gli errori di validazione Zod in un formato leggibile
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}
