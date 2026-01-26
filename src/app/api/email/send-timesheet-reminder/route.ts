import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendTimesheetReminderToAll } from '@/lib/email';

/**
 * POST /api/email/send-timesheet-reminder
 * Invia email di reminder per inserimento ore a tutti gli utenti attivi
 */
export async function POST(request: Request) {
  try {
    console.log('📧 Richiesta invio email reminder a tutti gli utenti');

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

    // Verifica che l'utente sia amministratore
    const { data: userData, error: userError } = (await supabase
      .from('users')
      .select('ruolo')
      .eq('id', user.id)
      .single()) as { data: { ruolo: string } | null; error: any };

    if (userError || !userData || userData.ruolo !== 'amministratore') {
      console.error('❌ Utente non autorizzato');
      return NextResponse.json(
        { error: 'Non autorizzato: solo amministratori possono inviare email' },
        { status: 403 }
      );
    }

    // Recupera tutti gli utenti attivi (esclusi amministratori se necessario)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('nome, cognome, email')
      .eq('attivo', true)
      .order('cognome', { ascending: true });

    if (usersError) {
      console.error('❌ Errore recupero utenti:', usersError);
      return NextResponse.json(
        { error: 'Errore durante il recupero degli utenti' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.warn('⚠️ Nessun utente attivo trovato');
      return NextResponse.json(
        {
          success: true,
          message: 'Nessun utente attivo da notificare',
          sent: 0,
          failed: 0,
        },
        { status: 200 }
      );
    }

    console.log(`📤 Invio email a ${users.length} utenti attivi`);

    // Invia email in background (asincrono non-bloccante)
    const result = await sendTimesheetReminderToAll(users);

    if (!result.success && result.sent === 0) {
      return NextResponse.json(
        {
          error: result.message,
          sent: 0,
          failed: result.failed,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Errore durante invio email:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante invio email' },
      { status: 500 }
    );
  }
}
