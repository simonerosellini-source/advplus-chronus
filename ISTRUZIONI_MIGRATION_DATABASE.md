# Istruzioni per Migration Database

## ⚠️ IMPORTANTE: Devi eseguire queste migration SQL sul database Supabase

Il sistema ha bisogno di alcune modifiche al database per funzionare correttamente. Segui questi passaggi:

### 1. Accedi a Supabase

1. Vai su https://supabase.com
2. Accedi al tuo progetto
3. Nel menu laterale, clicca su **SQL Editor**

### 2. Esegui le Migration in Ordine

Esegui questi file SQL **nell'ordine indicato**:

#### Step 1: Aggiungi colonna orari_settimanali

Copia e incolla il contenuto del file:
```
supabase_migration_add_weekly_schedule.sql
```

Clicca su **Run** per eseguire la query.

#### Step 2: Aggiorna il trigger per gestire orari_settimanali

Copia e incolla il contenuto del file:
```
supabase_update_trigger_default_hours.sql
```

Clicca su **Run** per eseguire la query.

### 3. Verifica

Dopo aver eseguito le migration, puoi verificare che tutto sia andato a buon fine:

1. Vai su **Table Editor** nel menu laterale
2. Seleziona la tabella `users`
3. Verifica che esista la colonna `orari_settimanali` (tipo JSONB)

### 4. Ricarica l'applicazione

Una volta eseguite le migration:
1. Ricarica completamente la pagina (CTRL+F5 o CMD+SHIFT+R)
2. L'errore "Could not find the 'orari_settimanali' column" dovrebbe scomparire

---

## Contenuto delle Migration

### Migration 1: Aggiungi colonna orari_settimanali

```sql
-- Migration: Add weekly schedule configuration to users table

-- Add JSONB column for weekly work schedule
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS orari_settimanali JSONB DEFAULT NULL;
```

Questa migration aggiunge la colonna `orari_settimanali` alla tabella `users` per memorizzare la configurazione degli orari settimanali di ogni utente.

### Migration 2: Aggiorna trigger

La seconda migration aggiorna il trigger `handle_new_user()` per includere il campo `orari_settimanali` quando viene creato un nuovo utente.

---

## Troubleshooting

### Errore: "column already exists"
Se ricevi questo errore, significa che la migration è già stata eseguita. Puoi procedere con la migration successiva.

### Errore: "permission denied"
Assicurati di avere i permessi di amministratore sul database Supabase.

### L'errore persiste dopo le migration
1. Assicurati di aver eseguito **entrambe** le migration
2. Ricarica completamente la pagina (CTRL+F5)
3. Svuota la cache del browser se necessario
