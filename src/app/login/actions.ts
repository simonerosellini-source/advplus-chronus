'use server';

// Server Actions per autenticazione
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/utils/validations';
import type { User } from '@/types/database.types';
import type { z } from 'zod';

/**
 * Action per il login
 */
export async function login(formData: FormData) {
  const supabase = await createClient();

  // Validazione dati form
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const validation = loginSchema.safeParse(data);
  if (!validation.success) {
    return { error: 'Email o password non validi' };
  }

  // Tentativo di login
  const { error: authError } = await supabase.auth.signInWithPassword(data);

  if (authError) {
    return { error: 'Credenziali non valide. Verifica email e password.' };
  }

  // Ottieni informazioni utente per determinare il ruolo
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Errore durante l\'autenticazione' };
  }

  // Ottieni il ruolo dell'utente usando admin client per bypassare RLS
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createAdminClient();

  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('ruolo, attivo')
    .eq('id', user.id)
    .single() as { data: Pick<User, 'ruolo' | 'attivo'> | null; error: any };

  if (userError || !userData) {
    return { error: 'Errore durante il recupero dei dati utente' };
  }

  if (!userData.attivo) {
    await supabase.auth.signOut();
    return { error: 'Account disattivato. Contatta l\'amministratore.' };
  }

  // Reindirizza in base al ruolo
  revalidatePath('/', 'layout');

  if (userData.ruolo === 'amministratore') {
    redirect('/admin');
  } else {
    redirect('/dipendente');
  }
}

/**
 * Action per il logout
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Action per reset password
 */
export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Email non valida' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: 'Errore durante l\'invio dell\'email di reset' };
  }

  return { success: 'Email di reset password inviata. Controlla la tua casella di posta.' };
}
