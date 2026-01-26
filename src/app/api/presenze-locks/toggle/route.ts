import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PresenzeLock, Database } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anno, mese } = body;

    // Validazione
    if (!anno || !mese) {
      return NextResponse.json(
        { error: 'Anno e mese sono obbligatori' },
        { status: 400 }
      );
    }

    if (mese < 1 || mese > 12) {
      return NextResponse.json(
        { error: 'Mese deve essere tra 1 e 12' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verifica se esiste già un record per questo mese/anno
    const { data, error: fetchError } = await adminClient
      .from('presenze_locks')
      .select('*')
      .eq('anno', anno)
      .eq('mese', mese)
      .maybeSingle();

    if (fetchError) {
      console.error('Errore durante la ricerca del lock:', fetchError);
      return NextResponse.json(
        { error: fetchError.message || 'Errore durante la ricerca del lock' },
        { status: 500 }
      );
    }

    const existingLock = data as PresenzeLock | null;
    let newLockedState = true;

    if (existingLock) {
      // Toggle dello stato esistente
      newLockedState = !existingLock.locked;

      const { error: updateError } = await adminClient
        .from('presenze_locks')
        // @ts-expect-error - TypeScript incorrectly infers update parameter type as never
        .update({ locked: newLockedState })
        .eq('anno', anno)
        .eq('mese', mese);

      if (updateError) {
        console.error('Errore durante l\'aggiornamento del lock:', updateError);
        return NextResponse.json(
          { error: updateError.message || 'Errore durante l\'aggiornamento del lock' },
          { status: 500 }
        );
      }
    } else {
      // Crea nuovo record (default: locked = true)
      const { error: insertError } = await adminClient
        .from('presenze_locks')
        // @ts-expect-error - TypeScript incorrectly infers insert parameter type as never
        .insert({ anno, mese, locked: true });

      if (insertError) {
        console.error('Errore durante la creazione del lock:', insertError);
        return NextResponse.json(
          { error: insertError.message || 'Errore durante la creazione del lock' },
          { status: 500 }
        );
      }
      newLockedState = true;
    }

    return NextResponse.json(
      {
        message: newLockedState ? 'Presenze bloccate' : 'Presenze sbloccate',
        locked: newLockedState
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Errore durante il toggle del lock:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante il toggle del lock' },
      { status: 500 }
    );
  }
}
