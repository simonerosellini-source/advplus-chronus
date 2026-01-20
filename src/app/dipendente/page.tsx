// Dashboard Dipendente/Collaboratore
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PresenzePersonali } from '@/components/dipendente/PresenzePersonali';
import type { User } from '@/types/database.types';

export default async function DipendenteDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: User | null };

  if (!userData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header con benvenuto */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">
          Benvenuto, {userData.nome}!
        </h1>
        <p className="text-white/90">
          Visualizza le tue presenze mensili e le statistiche personali
        </p>
      </div>

      {/* Vista presenze personali */}
      <PresenzePersonali userId={user.id} />
    </div>
  );
}
