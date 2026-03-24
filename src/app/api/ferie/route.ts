import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/ferie?anno=2026&mese=2
// Restituisce tutte le ferie del mese (usa admin client per bypassare RLS)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const anno = parseInt(searchParams.get('anno') || new Date().getFullYear().toString());
    const mese = parseInt(searchParams.get('mese') || (new Date().getMonth() + 1).toString());

    const supabase = createAdminClient();

    const primoGiorno = `${anno}-${String(mese).padStart(2, '0')}-01`;
    const ultimoGiorno = new Date(anno, mese, 0);
    const ultimoGiornoStr = `${anno}-${String(mese).padStart(2, '0')}-${ultimoGiorno.getDate()}`;

    // Carica presenze con ferie O permessi del mese (tutti gli utenti)
    const { data: presenzeData, error: presenzeError } = await supabase
      .from('presenze')
      .select('*')
      .gte('data', primoGiorno)
      .lte('data', ultimoGiornoStr)
      .or('ferie.gt.0,permessi.gt.0');

    if (presenzeError) {
      console.error('Errore caricamento ferie:', presenzeError);
      return NextResponse.json({ error: 'Errore caricamento ferie' }, { status: 500 });
    }

    // Carica utenti per i nomi
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, nome, cognome, email')
      .order('cognome', { ascending: true });

    if (usersError) {
      console.error('Errore caricamento utenti:', usersError);
      return NextResponse.json({ error: 'Errore caricamento utenti' }, { status: 500 });
    }

    return NextResponse.json({
      presenze: presenzeData || [],
      users: usersData || [],
    });
  } catch (error) {
    console.error('Errore API ferie:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// PATCH /api/ferie - Approva o respingi ferie/permessi
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { presenzaId, action, tipo } = body; // tipo: 'ferie' | 'permessi'

    if (!presenzaId || !action) {
      return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (action === 'approve') {
      // Approva: imposta ferie_validate a true
      // Cast as any per bypassare tipi Supabase che non includono ferie_validate
      const { error } = await (supabase as any)
        .from('presenze')
        .update({ ferie_validate: true })
        .eq('id', presenzaId);

      if (error) {
        console.error('Errore approvazione:', error);
        return NextResponse.json({ error: 'Errore approvazione' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'approved' });
    } else if (action === 'reject') {
      // Respingi: imposta ferie o permessi a 0 in base al tipo
      const updateData = tipo === 'permessi'
        ? { permessi: 0, ferie_validate: false }
        : { ferie: 0, ferie_validate: false };

      const { error } = await (supabase as any)
        .from('presenze')
        .update(updateData)
        .eq('id', presenzaId);

      if (error) {
        console.error('Errore respinta:', error);
        return NextResponse.json({ error: 'Errore respinta' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: 'rejected' });
    } else {
      return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Errore API ferie PATCH:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
