import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PresenzeLock } from '@/types/database.types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const anno = searchParams.get('anno');
    const mese = searchParams.get('mese');

    // Validazione
    if (!anno || !mese) {
      return NextResponse.json(
        { error: 'Anno e mese sono obbligatori' },
        { status: 400 }
      );
    }

    const meseNum = parseInt(mese);
    const annoNum = parseInt(anno);

    if (meseNum < 1 || meseNum > 12) {
      return NextResponse.json(
        { error: 'Mese deve essere tra 1 e 12' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Recupera lo stato del lock per il mese/anno specificato
    const { data, error } = await supabase
      .from('presenze_locks')
      .select('*')
      .eq('anno', annoNum)
      .eq('mese', meseNum)
      .maybeSingle();

    if (error) {
      console.error('Errore durante il recupero del lock:', error);
      return NextResponse.json(
        { error: error.message || 'Errore durante il recupero del lock' },
        { status: 500 }
      );
    }

    // Se non esiste un record, il mese è sbloccato
    const lock = data as PresenzeLock | null;
    const locked = lock?.locked ?? false;

    return NextResponse.json(
      {
        locked,
        anno: annoNum,
        mese: meseNum
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Errore durante il recupero dello stato del lock:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante il recupero dello stato del lock' },
      { status: 500 }
    );
  }
}
