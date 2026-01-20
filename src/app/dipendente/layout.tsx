// Layout per la dashboard dipendente/collaboratore
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ToastProvider } from '@/components/ui/Toast';
import type { User } from '@/types/database.types';

export default async function DipendenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verifica autenticazione
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Ottieni dati utente usando admin client
  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: User | null };

  if (!userData) {
    redirect('/login');
  }

  // Verifica che non sia amministratore
  if (userData.ruolo === 'amministratore') {
    redirect('/admin');
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Header user={userData} />
        <main className="container mx-auto px-4 py-6">{children}</main>
      </div>
    </ToastProvider>
  );
}
