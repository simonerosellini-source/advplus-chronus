# Istruzioni Migrazione Database - Campi Presenze

## Campi Aggiunti

Sono stati aggiunti 5 nuovi campi alla tabella `presenze`:

1. **straordinari** (numeric) - Ore di straordinario
2. **malattia** (boolean) - Indica se il giorno è di malattia
3. **legge_104** (boolean) - Indica se il giorno è per permesso Legge 104
4. **ferie** (boolean) - Indica se il giorno è di ferie
5. **ore_trasferte** (numeric) - Ore di trasferta

## Come Applicare la Migrazione

### Opzione 1: Tramite Dashboard Supabase

1. Accedi alla dashboard Supabase del progetto
2. Vai su **SQL Editor**
3. Copia e incolla il contenuto del file `supabase_migration_add_attendance_fields.sql`
4. Clicca su **Run** per eseguire la migrazione

### Opzione 2: Tramite CLI Supabase (se configurato)

```bash
supabase db push
```

## Verificare la Migrazione

Dopo aver eseguito la migrazione, verifica che le colonne siano state create:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'presenze'
  AND column_name IN ('straordinari', 'malattia', 'legge_104', 'ferie', 'ore_trasferte');
```

## Modifiche Apportate al Codice

### 1. Form di Inserimento (ModalPresenza.tsx)
- Aggiunti campi per inserire straordinari e ore trasferte
- Aggiunti checkbox per malattia, legge 104 e ferie

### 2. Visualizzazione Griglia (GrigliaPresenze.tsx)
- Le celle mostrano badge colorati per i nuovi campi:
  - **ST:Xh** (blu) - Straordinari
  - **TR:Xh** (viola) - Ore trasferte
  - **MAL** (rosso) - Malattia
  - **L104** (arancione) - Legge 104
  - **FER** (verde) - Ferie

### 3. Export Excel (PresenzeView.tsx)
- L'export Excel include tutti i nuovi campi nella cella di ogni giorno
- Formato: `7.5h (ST:2h, TR:4h, MAL)`

## Note Importanti

- Tutti i campi sono opzionali e hanno valori di default
- Non sono state modificate le funzionalità esistenti
- I campi numerici accettano valori decimali con step di 0.5 ore
- I checkbox sono indipendenti tra loro

## Compatibilità

Le modifiche sono retrocompatibili:
- Le presenze esistenti avranno valori di default (0 per numerici, false per booleani)
- Il sistema continua a funzionare normalmente per presenze senza questi campi
