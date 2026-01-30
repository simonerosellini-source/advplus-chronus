import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendHoursConfirmationToAdmin } from '@/lib/email';
import { MESI_ITALIANI } from '@/lib/utils/date';

/**
 * POST /api/email/send-hours-confirmation
 * Invia email di conferma inserimento orari all'amministrazione
 * Richiede nel body: { mese: number, anno: number }
 */
export async function POST(request: Request) {
  try {
    console.log('📧 Richiesta invio email conferma inserimento orari');

    // Verifica autenticazione
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Utente non autenticato');
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    // Recupera i dati dell'utente
    const { data: userData, error: userError } = (await supabase
      .from('users')
      .select('nome, cognome, email')
      .eq('id', user.id)
      .single()) as { data: { nome: string; cognome: string; email: string } | null; error: any };

    if (userError || !userData) {
      console.error('❌ Errore recupero dati utente:', userError);
      return NextResponse.json(
        { error: 'Errore durante il recupero dei dati utente' },
        { status: 500 }
      );
    }

    // Leggi mese e anno dal body della richiesta
    const body = await request.json();
    const { mese, anno } = body;

    if (!mese || !anno || mese < 1 || mese > 12) {
      console.error('❌ Parametri mese/anno non validi');
      return NextResponse.json(
        { error: 'Parametri mese e anno richiesti (mese: 1-12)' },
        { status: 400 }
      );
    }

    // Converti numero mese in nome italiano
    const meseNome = MESI_ITALIANI[mese - 1];

    console.log(`📤 Invio conferma per ${userData.nome} ${userData.cognome} - ${meseNome} ${anno}`);

    // Invia email di conferma all'amministrazione
    const result = await sendHoursConfirmationToAdmin({
      nome: userData.nome,
      cognome: userData.cognome,
      email: userData.email,
      mese: meseNome,
      anno: anno,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message || 'Errore durante invio email',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email di conferma inviata con successo all\'amministrazione',
        messageId: result.messageId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Errore durante invio email conferma:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante invio email' },
      { status: 500 }
    );
  }
}
