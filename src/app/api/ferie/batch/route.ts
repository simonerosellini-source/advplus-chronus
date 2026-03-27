import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/ferie/batch
// Salva ferie o permessi per più giorni in un'unica richiesta (dipendente)
// Body: { userId: string, giorni: string[], tipo: 'ferie' | 'permessi', ore: number }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, giorni, tipo, ore } = body;

    if (!userId || !giorni || !Array.isArray(giorni) || giorni.length === 0 || !tipo || !ore) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    if (tipo !== 'ferie' && tipo !== 'permessi') {
      return NextResponse.json({ error: 'Tipo non valido (ferie o permessi)' }, { status: 400 });
    }

    if (ore <= 0 || ore > 24) {
      return NextResponse.json({ error: 'Ore non valide (1-24)' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Per ogni giorno: upsert nella tabella presenze
    // onConflict: 'user_id,data' aggiorna solo i campi specificati se il record esiste
    const records = giorni.map((data: string) => ({
      user_id: userId,
      data,
      [tipo]: ore,
    }));

    const { error } = await (supabase as any)
      .from('presenze')
      .upsert(records, {
        onConflict: 'user_id,data',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Errore salvataggio batch ferie:', error);
      return NextResponse.json({ error: 'Errore salvataggio' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: giorni.length });
  } catch (error) {
    console.error('Errore API ferie batch:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
