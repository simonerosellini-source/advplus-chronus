import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/email';
import type { RuoloUtente, Sede } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      nome,
      cognome,
      ruolo,
      legge_104,
      importo_trasferte,
      sede,
      orari_settimanali
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
        orari_settimanali: orari_settimanali || null,
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

    // Invia email di benvenuto con le credenziali
    // L'invio è asincrono e non bloccante - se fallisce non impedisce la creazione dell'utente
    console.log(`🚀 Avvio invio email di benvenuto per: ${email}`);

    sendWelcomeEmail({
      nome,
      cognome,
      email,
      password,
    })
      .then((result) => {
        if (result.success) {
          console.log(`✅ Email inviata con successo a: ${email}`);
        } else {
          console.error(`❌ Invio email fallito per ${email}:`, result.message);
        }
      })
      .catch((error) => {
        console.error('❌ Errore durante l\'invio dell\'email di benvenuto:', error);
        // Non propagare l'errore - l'utente è stato creato comunque
      });

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
