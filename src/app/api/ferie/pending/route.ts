import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/ferie/pending?userId=xxx
// Restituisce TUTTE le ferie e permessi da validare dell'utente (tutti i mesi)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId mancante' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Carica TUTTE le presenze con ferie > 0 O permessi > 0 non validate
    const { data: presenzeData, error: presenzeError } = await (supabase as any)
      .from('presenze')
      .select('*')
      .eq('user_id', userId)
      .or('ferie.gt.0,permessi.gt.0')
      .or('ferie_validate.is.null,ferie_validate.eq.false')
      .order('data', { ascending: true });

    if (presenzeError) {
      console.error('Errore caricamento ferie/permessi pending:', presenzeError);
      return NextResponse.json({ error: 'Errore caricamento dati' }, { status: 500 });
    }

    // Filtra solo quelle non validate con ferie > 0 o permessi > 0
    const pendingData = (presenzeData || []).filter((p: any) =>
      !p.ferie_validate && (p.ferie > 0 || p.permessi > 0)
    );

    return NextResponse.json({
      presenze: pendingData,
      totale: pendingData.length,
      totaleFerie: pendingData.filter((p: any) => p.ferie > 0).length,
      totalePermessi: pendingData.filter((p: any) => p.permessi > 0).length,
    });
  } catch (error) {
    console.error('Errore API ferie pending:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
