import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RuoloUtente, Sede } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email, password, nome, cognome, ruolo, legge_104, importo_trasferte, sede,
      ingresso_mattina_default, uscita_mattina_default,
      ingresso_pomeriggio_default, uscita_pomeriggio_default
    } = body;

    // Validazione
    if (!email || !password || !nome || !cognome || !ruolo) {
      return NextResponse.json(
        { error: 'Campi obbligatori mancanti' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Crea utente in auth.users con email già confermata
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Conferma email automaticamente
      user_metadata: {
        nome,
        cognome,
        ruolo,
        legge_104: legge_104 || false,
        importo_trasferte: importo_trasferte || 0,
        sede: sede || 'Viareggio',
        ingresso_mattina_default: ingresso_mattina_default || null,
        uscita_mattina_default: uscita_mattina_default || null,
        ingresso_pomeriggio_default: ingresso_pomeriggio_default || null,
        uscita_pomeriggio_default: uscita_pomeriggio_default || null,
      },
    });

    if (authError) {
      console.error('Errore creazione utente auth:', authError);
      return NextResponse.json(
        { error: authError.message || 'Errore durante la creazione dell\'utente' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Utente non creato' },
        { status: 500 }
      );
    }

    // Il trigger handle_new_user() dovrebbe creare automaticamente il record in public.users
    // Attendiamo un momento per sicurezza
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json(
      {
        message: 'Utente creato con successo',
        userId: authData.user.id
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Errore durante la creazione dell\'utente:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante la creazione dell\'utente' },
      { status: 500 }
    );
  }
}
