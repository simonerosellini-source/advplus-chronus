import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utente mancante' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Prima elimina da public.users
    const { error: publicError } = await adminClient
      .from('users')
      .delete()
      .eq('id', userId);

    if (publicError) {
      console.error('Errore eliminazione da public.users:', publicError);
      return NextResponse.json(
        { error: 'Errore durante l\'eliminazione dell\'utente dal database' },
        { status: 500 }
      );
    }

    // Poi elimina da auth.users usando admin client
    const { error: authError } = await adminClient.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error('Errore eliminazione da auth.users:', authError);
      // Non ritorniamo errore perché l'utente è già stato eliminato da public.users
      // e l'eliminazione da auth.users è secondaria
      console.warn('Utente eliminato da public.users ma non da auth.users');
    }

    return NextResponse.json(
      { message: 'Utente eliminato con successo' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Errore durante l\'eliminazione dell\'utente:', error);
    return NextResponse.json(
      { error: error.message || 'Errore durante l\'eliminazione dell\'utente' },
      { status: 500 }
    );
  }
}
