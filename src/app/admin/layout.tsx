// Layout per la dashboard amministratore
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ToastProvider } from '@/components/ui/Toast';

export default async function AdminLayout({
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

  // Verifica ruolo amministratore
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userData || userData.ruolo !== 'amministratore') {
    redirect('/dipendente');
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
