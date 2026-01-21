# Istruzioni Migrazione Database - Campi Presenze

## Campi Aggiunti

Sono stati aggiunti 5 nuovi campi alla tabella `presenze`, **tutti di tipo NUMERIC** per tracciare le ore:

1. **straordinari** (numeric) - Ore di straordinario
2. **malattia** (numeric) - Ore di malattia
3. **legge_104** (numeric) - Ore permesso Legge 104
4. **ferie** (numeric) - Ore di ferie
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
- Aggiunti 5 campi numerici per inserire le ore:
  - Straordinari (ore)
  - Ore Trasferte
  - Malattia (ore)
  - Legge 104 (ore)
  - Ferie (ore)
- Tutti i campi accettano valori decimali con step di 0.5 ore

### 2. Visualizzazione Griglia (GrigliaPresenze.tsx)
- Le celle mostrano badge colorati con le ore per i nuovi campi:
  - **ST:Xh** (blu) - Straordinari
  - **TR:Xh** (viola) - Ore trasferte
  - **MAL:Xh** (rosso) - Malattia
  - **L104:Xh** (arancione) - Legge 104
  - **FER:Xh** (verde) - Ferie

### 3. Export Excel (PresenzeView.tsx)
- L'export Excel include tutti i nuovi campi con le ore nella cella di ogni giorno
- Formato: `7.5h (ST:2h, TR:4h, MAL:8h, L104:4h, FER:8h)`

## Note Importanti

- Tutti i campi sono opzionali e hanno valori di default pari a 0
- Non sono state modificate le funzionalità esistenti
- Tutti i 5 campi sono di tipo NUMERIC e accettano valori decimali con step di 0.5 ore
- I campi sono indipendenti tra loro e possono essere compilati tutti o solo alcuni

## Compatibilità

Le modifiche sono retrocompatibili:
- Le presenze esistenti avranno valori di default pari a 0 per tutti i campi
- Se i campi malattia, legge_104 e ferie esistevano come booleani, verranno convertiti automaticamente:
  - `true` → 8 ore (giornata intera)
  - `false` → 0 ore
- Il sistema continua a funzionare normalmente per presenze senza questi campi
