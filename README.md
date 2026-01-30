# Presency+ by Advisory+

Sistema completo di gestione presenze aziendali con interfaccia web moderna, sviluppato con Next.js 14, Supabase e Tailwind CSS.

![Advisory+ Logo](public/images/logo-preview.png)

## 📋 Indice

- [Caratteristiche](#caratteristiche)
- [Stack Tecnologico](#stack-tecnologico)
- [Installazione e Setup](#installazione-e-setup)
- [Configurazione Supabase](#configurazione-supabase)
- [Deploy su Vercel](#deploy-su-vercel)
- [Struttura del Progetto](#struttura-del-progetto)
- [Funzionalità](#funzionalità)
- [Gestione Utenti](#gestione-utenti)
- [Festività Predefinite](#festività-predefinite)
- [Sviluppo Locale](#sviluppo-locale)
- [Licenza](#licenza)

## ✨ Caratteristiche

- **Dashboard Amministratore** con griglia presenze stile Excel
- **Sistema multi-ruolo** (Amministratore, Dipendente, Collaboratore)
- **Gestione completa presenze** con calcolo automatico delle ore
- **Calendario festività** con giorni festivi e semifestivi predefiniti (Art. 31)
- **Dashboard personale** per dipendenti e collaboratori
- **Autenticazione sicura** con Supabase Auth
- **Row Level Security (RLS)** per protezione dati
- **Design responsive** e mobile-first
- **Interfaccia in italiano** con branding Advisory+

## 🛠 Stack Tecnologico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Autenticazione**: Supabase Auth
- **Deployment**: Vercel
- **Librerie**: date-fns, lucide-react, zod, xlsx

## 🚀 Installazione e Setup

### Prerequisiti

- Node.js 18+ installato
- Account Supabase (gratuito)
- Account Vercel (gratuito)
- Git

### 1. Clona il Repository

```bash
git clone https://github.com/your-org/presency-plus.git
cd presency-plus
```

### 2. Installa le Dipendenze

```bash
npm install
# oppure
pnpm install
# oppure
yarn install
```

### 3. Configura le Variabili d'Ambiente

Copia il file `.env.example` in `.env.local`:

```bash
cp .env.example .env.local
```

Modifica `.env.local` con le tue credenziali Supabase (vedi sezione successiva).

## 🗄️ Configurazione Supabase

### Passo 1: Crea un Nuovo Progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un account
2. Crea un nuovo progetto
3. Attendi che il progetto sia pronto (circa 2 minuti)

### Passo 2: Configura il Database

1. Nella dashboard Supabase, vai su **SQL Editor**
2. Crea una nuova query e incolla il contenuto di `supabase/schema.sql`
3. Esegui la query per creare tutte le tabelle e policies
4. Crea una seconda query e incolla il contenuto di `supabase/seed-festivi.sql`
5. Esegui la query per popolare le festività predefinite

### Passo 3: Ottieni le Credenziali

1. Vai su **Project Settings** → **API**
2. Copia i seguenti valori nel tuo `.env.local`:
   - **URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` (usa con cautela!)

### Passo 4: Crea il Primo Utente Amministratore

1. Vai su **Authentication** → **Users**
2. Clicca su **Add user** → **Create new user**
3. Inserisci:
   - Email: `admin@advisoryplus.it`
   - Password: (scegli una password sicura)
   - User Metadata:
     ```json
     {
       "nome": "Admin",
       "cognome": "Sistema",
       "ruolo": "amministratore"
     }
     ```
4. Conferma l'email manualmente o disabilita la conferma email in **Authentication** → **Settings**

Il trigger automatico creerà il record nella tabella `users`.

### Passo 5: Configura le Email (Opzionale)

Per inviare email di verifica personalizzate:

1. Vai su **Authentication** → **Email Templates**
2. Personalizza i template per match il branding Advisory+
3. Configura SMTP custom in **Project Settings** → **Auth**

## 🌐 Deploy su Vercel

### Metodo 1: Deploy da GitHub (Consigliato)

1. Fai push del codice su GitHub
2. Vai su [vercel.com](https://vercel.com) e importa il repository
3. Configura le variabili d'ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Clicca su **Deploy**

### Metodo 2: Deploy da CLI

```bash
# Installa Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configurazione Dominio Personalizzato

1. In Vercel, vai su **Settings** → **Domains**
2. Aggiungi il tuo dominio (es: `presenze.advisoryplus.it`)
3. Configura i record DNS come indicato da Vercel

## 📁 Struttura del Progetto

```
presency-plus/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD workflow
├── public/
│   └── images/                 # Immagini statiche
├── src/
│   ├── app/
│   │   ├── admin/              # Dashboard amministratore
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── dipendente/         # Dashboard dipendente
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── login/              # Pagina login
│   │   │   ├── page.tsx
│   │   │   └── actions.ts
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (redirect)
│   │   └── globals.css         # Stili globali
│   ├── components/
│   │   ├── admin/              # Componenti admin
│   │   │   ├── PresenzeView.tsx
│   │   │   ├── GrigliaPresenze.tsx
│   │   │   ├── ModalPresenza.tsx
│   │   │   ├── GestioneUtentiView.tsx
│   │   │   ├── ModalUtente.tsx
│   │   │   ├── GestioneFestiviView.tsx
│   │   │   └── ModalFestivo.tsx
│   │   ├── dipendente/         # Componenti dipendente
│   │   │   └── PresenzePersonali.tsx
│   │   ├── layout/             # Layout components
│   │   │   └── Header.tsx
│   │   └── ui/                 # UI components riutilizzabili
│   │       ├── Logo.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── Loading.tsx
│   │       └── Badge.tsx
│   ├── lib/
│   │   ├── supabase/           # Client Supabase
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── utils/              # Utility functions
│   │       ├── date.ts
│   │       ├── festivi.ts
│   │       └── validations.ts
│   ├── types/
│   │   └── database.types.ts   # TypeScript types
│   └── middleware.ts           # Next.js middleware
├── supabase/
│   ├── schema.sql              # Schema database
│   └── seed-festivi.sql        # Seed festività
├── .env.example                # Template variabili ambiente
├── .gitignore
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                 # Config Vercel
└── README.md
```

## 🎯 Funzionalità

### Dashboard Amministratore

#### 1. Gestione Presenze
- **Griglia mensile** stile Excel con tutti gli utenti
- Visualizzazione **orari ingresso/uscita** mattina e pomeriggio
- **Calcolo automatico ore totali** per giorno e mese
- **Colori intuitivi**:
  - 🔴 Rosso: Giorni festivi
  - 🟠 Arancione: Giorni semifestivi
  - 🟢 Verde: Presenze complete
  - 🟡 Giallo: Presenze parziali
  - ⚪ Bianco: Assenze
- **Inserimento rapido** tramite click sulla cella
- **Modal dettagliato** per inserimento preciso
- Navigazione **mese per mese**
- Export Excel mensile

#### 2. Gestione Utenti
- Creazione nuovi utenti (Amministratore/Dipendente/Collaboratore)
- Modifica dati utente
- Attivazione/disattivazione account
- Eliminazione utenti
- Ricerca e filtri
- Invio automatico credenziali via email

#### 3. Calendario Festività
- Visualizzazione festività annuali
- **Generazione automatica** festività predefinite (Art. 31)
- Calcolo automatico di Pasqua e Lunedì dell'Angelo
- Aggiunta festività personalizzate
- Gestione Santo Patrono locale
- Distinzione tra festivi (0 ore) e semifestivi (4 ore: 09:00-13:00)

### Dashboard Dipendente/Collaboratore

- **Vista calendario personale** con proprie presenze
- **Statistiche mensili**:
  - Ore totali lavorate
  - Giorni di presenza
  - Giorni di assenza
  - Media ore giornaliere
- Visualizzazione dettagliata orari per ogni giorno
- Note presenze
- Navigazione mensile

## 👥 Gestione Utenti

### Ruoli

#### Amministratore
- Accesso completo al sistema
- Gestione tutti gli utenti
- Inserimento/modifica presenze di tutti
- Gestione calendario festività
- Visualizzazione report e statistiche

#### Dipendente / Collaboratore
- Visualizzazione solo proprie presenze
- Visualizzazione statistiche personali
- Nessuna modifica dati
- Cambio password

### Creazione Nuovo Utente

1. Login come amministratore
2. Tab **Gestione Utenti** → **Nuovo Utente**
3. Compila il form:
   - Email aziendale
   - Nome e Cognome
   - Ruolo
   - Password iniziale
4. L'utente riceverà un'email di conferma
5. Al primo accesso può cambiare la password

## 📅 Festività Predefinite

Le festività sono basate sull'**Art. 31 - Festività** e includono:

### Giorni Festivi (0 ore lavorative)
1. Capodanno (1° gennaio)
2. Epifania del Signore (6 gennaio)
3. Lunedì dell'Angelo (Pasquetta) - calcolato automaticamente
4. Anniversario della Liberazione (25 aprile)
5. Festa del Lavoro (1° maggio)
6. Festa della Repubblica (2 giugno)
7. Assunzione di M.V. (15 agosto)
8. Giorno successivo all'Assunzione (16 agosto)
9. Ognissanti (1° novembre)
10. Immacolata Concezione (8 dicembre)
11. Vigilia di Natale (24 dicembre)
12. Natale (25 dicembre)
13. S. Stefano (26 dicembre)
14. Venerdì Santo - calcolato automaticamente
15. Santo Patrono della città (configurabile)

### Giorni Semifestivi (4 ore: 09:00-13:00)
1. Vigilia dell'Assunzione di M.V. (14 agosto)
2. Ultimo giorno dell'anno (31 dicembre)

### Generazione Automatica

Usa la funzione **"Genera Festività Anno"** nella dashboard admin per popolare automaticamente tutte le festività predefinite per un anno specifico. La funzione calcola automaticamente:
- Data di Pasqua (algoritmo di Meeus/Jones/Butcher)
- Lunedì dell'Angelo (giorno dopo Pasqua)
- Venerdì Santo (2 giorni prima di Pasqua)

## 💻 Sviluppo Locale

### Avvia il Server di Sviluppo

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### Comandi Disponibili

```bash
# Sviluppo
npm run dev

# Build produzione
npm run build

# Avvia server produzione
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

### Testing delle Funzionalità

1. **Login** come amministratore (credenziali create in Supabase)
2. **Genera festività** per l'anno corrente
3. **Crea alcuni utenti** di test
4. **Inserisci presenze** per testare la griglia
5. **Fai logout** e login come dipendente per testare la vista personale

## 🔒 Sicurezza

- **Row Level Security (RLS)** attivo su tutte le tabelle
- **Middleware Next.js** per protezione routes
- **Validazione input** con Zod
- **Prepared statements** per prevenire SQL injection
- **HTTPS** obbligatorio in produzione
- **Password hashing** gestito da Supabase Auth
- **Session management** sicura

## 🎨 Personalizzazione Branding

### Colori

I colori del brand Advisory+ sono definiti in `tailwind.config.ts`:

```typescript
colors: {
  primary: '#003366',      // Blu navy
  secondary: '#00B4D8',    // Turchese
  accent: '#90E0EF',       // Azzurro chiaro
}
```

### Logo

Il logo è un componente React in `src/components/ui/Logo.tsx` e può essere personalizzato modificando il codice SVG.

## 📱 Responsive Design

L'applicazione è completamente responsive e ottimizzata per:
- 📱 Mobile (320px+)
- 💻 Tablet (768px+)
- 🖥️ Desktop (1024px+)
- 🖥️ Large Desktop (1920px+)

## 🐛 Troubleshooting

### Errore: "Invalid JWT"

- Verifica che le variabili d'ambiente Supabase siano corrette
- Controlla che l'URL Supabase non abbia trailing slash
- Riavvia il server di sviluppo

### Errore: "Row Level Security Error"

- Verifica che le policies RLS siano state create correttamente
- Controlla che l'utente abbia il ruolo corretto nella tabella `users`
- Verifica che il trigger `handle_new_user` sia attivo

### Le festività non vengono generate

- Controlla che la funzione `genera_festivi_anno` sia stata creata in Supabase
- Verifica i permessi dell'utente
- Controlla i log della console per errori

### Le email non vengono inviate

- Configura SMTP custom in Supabase
- Verifica le email templates in Authentication → Email Templates
- Controlla lo spam della casella email

## 📄 Licenza

Copyright © 2024 Advisory+. Tutti i diritti riservati.

Questo software è di proprietà esclusiva di Advisory+ ed è protetto dalle leggi sul copyright.
Non è consentita la riproduzione, distribuzione o modifica senza autorizzazione scritta.

## 🤝 Supporto

Per supporto tecnico o domande:
- Email: support@advisoryplus.it
- Telefono: +39 XXX XXX XXXX

## 📝 Note di Rilascio

### Versione 1.0.0 (2024)

**Funzionalità Iniziali:**
- ✅ Sistema di autenticazione completo
- ✅ Dashboard amministratore con griglia Excel-like
- ✅ Gestione utenti (CRUD)
- ✅ Gestione presenze con calcolo ore automatico
- ✅ Calendario festività con generazione automatica
- ✅ Dashboard personale dipendenti
- ✅ Design responsive e mobile-first
- ✅ Row Level Security
- ✅ Deploy su Vercel

**Prossime Funzionalità (Roadmap):**
- 🔄 Export/Import Excel avanzato
- 🔄 Report e statistiche dettagliate
- 🔄 Notifiche email automatiche
- 🔄 Gestione permessi e ferie
- 🔄 Timbratura presenze tramite app mobile
- 🔄 Integrazione con sistemi HR esterni

---

Sviluppato con ❤️ per Advisory+
