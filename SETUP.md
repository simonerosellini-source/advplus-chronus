# Setup Rapido - Presency+ by Advisory+

Guida veloce per mettere in produzione l'applicazione in 15 minuti.

## ⚡ Quick Start (3 Step)

### 1️⃣ Setup Supabase (5 minuti)

```bash
# 1. Vai su https://supabase.com e crea un progetto
# 2. Copia URL e Keys dalla sezione API
# 3. Vai su SQL Editor ed esegui questi file nell'ordine:

# File 1: supabase/schema.sql
# File 2: supabase/seed-festivi.sql

# 4. Vai su Authentication → Users e crea l'admin:
#    Email: admin@advisoryplus.it
#    Password: [scegli una password sicura]
#    User Metadata:
#    {
#      "nome": "Admin",
#      "cognome": "Sistema",
#      "ruolo": "amministratore"
#    }
```

### 2️⃣ Setup Progetto (3 minuti)

```bash
# Clona e installa
git clone [your-repo-url]
cd presency-plus
npm install

# Configura environment
cp .env.example .env.local

# Modifica .env.local con le tue credenziali Supabase:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
# SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Avvia il server
npm run dev
```

### 3️⃣ Deploy Vercel (2 minuti)

```bash
# Opzione A: Da GitHub (consigliato)
# 1. Push su GitHub
# 2. Vai su vercel.com → Import Project
# 3. Aggiungi le 3 variabili d'ambiente
# 4. Deploy!

# Opzione B: Da CLI
npm install -g vercel
vercel login
vercel --prod
```

## ✅ Checklist Post-Deploy

- [ ] Login admin funziona
- [ ] Crea 2-3 utenti di test
- [ ] Genera festività per l'anno corrente
- [ ] Inserisci alcune presenze di test
- [ ] Verifica dashboard dipendente
- [ ] Test su mobile/tablet
- [ ] Configura dominio personalizzato (opzionale)

## 🎯 Primi Passi nell'App

### Come Amministratore

1. **Login**: `admin@advisoryplus.it` + password scelta
2. **Tab "Calendario Festività"**: Clicca "Genera Festività Anno"
3. **Tab "Gestione Utenti"**: Crea i tuoi dipendenti/collaboratori
4. **Tab "Presenze"**: Inizia a inserire le presenze cliccando sulle celle

### Come Dipendente

1. Login con email e password ricevute
2. Visualizza le tue presenze e statistiche mensili
3. Naviga tra i mesi per vedere lo storico

## 🔐 Credenziali di Default

**⚠️ IMPORTANTE**: Dopo il primo deploy, cambia immediatamente:
- Password amministratore
- Email amministratore (se necessario)

## 🆘 Problemi Comuni

| Problema | Soluzione |
|----------|-----------|
| "Invalid JWT" | Verifica variabili ambiente Supabase |
| "RLS Policy Error" | Controlla che lo schema SQL sia stato eseguito completamente |
| "User not found" | Crea l'utente admin manualmente in Supabase Auth |
| Build error su Vercel | Verifica che tutte le env vars siano configurate |

## 📞 Supporto

Se hai problemi durante il setup:
1. Controlla il README.md completo
2. Verifica i log nella console browser (F12)
3. Controlla i log Supabase in Dashboard → Logs
4. Contatta il supporto tecnico

## 🚀 Next Steps

Una volta che tutto funziona:
- [ ] Importa gli utenti esistenti
- [ ] Configura SMTP per email personalizzate
- [ ] Personalizza il logo e i colori
- [ ] Forma i dipendenti sull'uso del sistema
- [ ] Configura backup automatici su Supabase

---

**Tempo stimato setup completo**: 10-15 minuti ⏱️

Buon lavoro! 🎉
