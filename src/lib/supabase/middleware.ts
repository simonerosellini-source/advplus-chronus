// Middleware client Supabase per gestire la sessione
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';
import { createAdminClient } from './admin';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: Evitare di scrivere logica tra createServerClient e supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protezione delle routes
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isDipendenteRoute = request.nextUrl.pathname.startsWith('/dipendente');

  // Se non autenticato e non è la pagina di login, redirect a login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Se autenticato e sulla pagina di login, redirect alla dashboard appropriata
  if (user && isLoginPage) {
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('ruolo')
      .eq('id', user.id)
      .single() as { data: { ruolo: string } | null };

    // Se l'utente non esiste nella tabella users, fare logout
    if (!userData) {
      await supabase.auth.signOut();
      return NextResponse.redirect(request.nextUrl);
    }

    const url = request.nextUrl.clone();
    url.pathname = userData.ruolo === 'amministratore' ? '/admin' : '/dipendente';
    return NextResponse.redirect(url);
  }

  // Controllo permessi per route admin
  if (user && isAdminRoute) {
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('ruolo')
      .eq('id', user.id)
      .single() as { data: { ruolo: string } | null };

    // Se l'utente non esiste nella tabella users, fare logout
    if (!userData) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (userData.ruolo !== 'amministratore') {
      const url = request.nextUrl.clone();
      url.pathname = '/dipendente';
      return NextResponse.redirect(url);
    }
  }

  // Controllo permessi per route dipendente/collaboratore
  if (user && isDipendenteRoute) {
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient
      .from('users')
      .select('ruolo')
      .eq('id', user.id)
      .single() as { data: { ruolo: string } | null };

    // Se l'utente non esiste nella tabella users, fare logout
    if (!userData) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (userData.ruolo === 'amministratore') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
