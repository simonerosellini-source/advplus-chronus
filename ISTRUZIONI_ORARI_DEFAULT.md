# Istruzioni Configurazione Orari di Lavoro Default

## Funzionalità Implementata

È ora possibile configurare l'**orario di lavoro contrattuale** per ogni dipendente/collaboratore durante la creazione o modifica utente. Questi orari verranno utilizzati automaticamente come valori di default quando si crea una nuova presenza.

## Migrazioni Database da Eseguire

### 1. Aggiungere Colonne alla Tabella Users

Esegui questo script su **Supabase Dashboard → SQL Editor**:

```sql
-- Migration: Add default work schedule fields to users table

-- Add columns for default work hours
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ingresso_mattina_default TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS uscita_mattina_default TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ingresso_pomeriggio_default TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS uscita_pomeriggio_default TIME DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.users.ingresso_mattina_default IS 'Orario ingresso mattina da contratto';
COMMENT ON COLUMN public.users.uscita_mattina_default IS 'Orario uscita mattina da contratto';
COMMENT ON COLUMN public.users.ingresso_pomeriggio_default IS 'Orario ingresso pomeriggio da contratto';
COMMENT ON COLUMN public.users.uscita_pomeriggio_default IS 'Orario uscita pomeriggio da contratto';
```

### 2. Aggiornare il Trigger handle_new_user

Esegui questo script per aggiornare il trigger che crea gli utenti:

```sql
-- Update handle_new_user trigger to include default work hours

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id, email, nome, cognome, ruolo,
    legge_104, importo_trasferte, sede,
    ingresso_mattina_default, uscita_mattina_default,
    ingresso_pomeriggio_default, uscita_pomeriggio_default
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE(NEW.raw_user_meta_data->>'ruolo', 'dipendente'),
    COALESCE((NEW.raw_user_meta_data->>'legge_104')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'importo_trasferte')::numeric, 0),
    CAST(COALESCE(NEW.raw_user_meta_data->>'sede', 'Viareggio') AS sede_type),
    NULLIF(NEW.raw_user_meta_data->>'ingresso_mattina_default', '')::time,
    NULLIF(NEW.raw_user_meta_data->>'uscita_mattina_default', '')::time,
    NULLIF(NEW.raw_user_meta_data->>'ingresso_pomeriggio_default', '')::time,
    NULLIF(NEW.raw_user_meta_data->>'uscita_pomeriggio_default', '')::time
  );
  RETURN NEW;
END;
$$;
```

## Come Funziona

### 1. Configurazione Orari (Amministratore)

Quando l'amministratore crea o modifica un utente, può specificare:
- **Mattina**: Ingresso e Uscita
- **Pomeriggio**: Ingresso e Uscita

Questi campi sono **opzionali** e appariranno nella sezione "Orario di Lavoro Contrattuale" del modal.

Esempio:
- Ingresso Mattina: 09:00
- Uscita Mattina: 13:00
- Ingresso Pomeriggio: 15:00
- Uscita Pomeriggio: 18:30

### 2. Utilizzo Automatico (Dipendenti/Amministratori)

Quando si crea una **nuova presenza** per quell'utente:
1. Il modal si apre con i campi orari **già compilati** con gli orari di default
2. L'utente può modificarli se necessario (es. uscita anticipata, straordinari)
3. Gli orari di default sono solo un punto di partenza, non un vincolo

### 3. Flessibilità

- **Utenti senza orari di default**: Campi vuoti come prima, compilazione manuale
- **Modifica presenza esistente**: Mantiene gli orari già salvati
- **Giorni particolari**: L'utente può sempre modificare gli orari proposti

## Vantaggi

✅ **Risparmio di tempo**: Non serve inserire gli stessi orari ogni giorno
✅ **Meno errori**: Orari contrattuali pre-configurati
✅ **Flessibilità**: Sempre possibile modificare per casi particolari
✅ **Opzionale**: Gli utenti senza configurazione continuano a lavorare normalmente

## Esempi di Utilizzo

### Dipendente Full-Time (8 ore)
```
Mattina:    09:00 - 13:00
Pomeriggio: 14:00 - 18:00
```

### Dipendente Part-Time (4 ore)
```
Mattina:    09:00 - 13:00
Pomeriggio: (vuoto)
```

### Collaboratore Flessibile
```
Tutti i campi vuoti - compila manualmente ogni volta
```

## Verifica Post-Migrazione

Dopo aver eseguito le migrazioni:

1. Vai su **Gestione Utenti**
2. Modifica un utente esistente
3. Verifica che appaia la sezione "Orario di Lavoro Contrattuale"
4. Compila gli orari e salva
5. Vai su **Presenze** e clicca su un giorno
6. Verifica che gli orari siano pre-compilati

## Note Tecniche

- I campi sono di tipo `TIME` nel database
- Valori `NULL` indicano nessun orario di default configurato
- Il trigger converte stringe vuote in `NULL` usando `NULLIF`
- Gli orari vengono passati tramite `user_metadata` durante la creazione utente
- Il formato tempo è HH:MM (es. "09:00")

## Compatibilità

✅ **Retrocompatibile**: Utenti esistenti senza orari continuano a funzionare normalmente
✅ **Nessun impatto**: Le funzionalità esistenti non sono state modificate
✅ **Opzionale**: Non obbligatorio configurare gli orari di default
