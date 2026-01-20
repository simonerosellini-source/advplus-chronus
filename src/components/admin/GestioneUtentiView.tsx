'use client';

// Vista Gestione Utenti - CRUD completo
import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner, TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { RuoloBadge, StatoBadge } from '@/components/ui/Badge';
import { ModalUtente } from './ModalUtente';
import type { User } from '@/types/database.types';
import { formatDateIT } from '@/lib/utils/date';

export function GestioneUtentiView() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { showToast } = useToast();
  const supabase = createClient();

  // Carica utenti
  useEffect(() => {
    loadUsers();
  }, []);

  // Filtra utenti in base al termine di ricerca
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.nome.toLowerCase().includes(term) ||
          u.cognome.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('cognome', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Errore caricamento utenti:', error);
      showToast('Errore durante il caricamento degli utenti', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleNewUser() {
    setSelectedUser(null);
    setIsModalOpen(true);
  }

  function handleEditUser(user: User) {
    setSelectedUser(user);
    setIsModalOpen(true);
  }

  async function handleDeleteUser(user: User) {
    if (!confirm(`Sei sicuro di voler eliminare l'utente ${user.nome} ${user.cognome}?`)) {
      return;
    }

    try {
      // Chiama API route per eliminare sia da public.users che da auth.users
      const response = await fetch(`/api/users/${user.id}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'eliminazione');
      }

      showToast('Utente eliminato con successo', 'success');
      loadUsers();
    } catch (error: any) {
      console.error('Errore eliminazione utente:', error);
      showToast(error.message || 'Errore durante l\'eliminazione', 'error');
    }
  }

  async function handleToggleActive(user: User) {
    try {
      const updateData = { attivo: !user.attivo };
      // @ts-expect-error - TypeScript incorrectly infers update parameter type as never
      const { error } = await supabase.from('users').update(updateData).eq('id', user.id);

      if (error) throw error;

      showToast(
        `Utente ${user.attivo ? 'disattivato' : 'attivato'} con successo`,
        'success'
      );
      loadUsers();
    } catch (error: any) {
      console.error('Errore aggiornamento stato:', error);
      showToast(error.message || 'Errore durante l\'aggiornamento', 'error');
    }
  }

  function handleModalClose() {
    setIsModalOpen(false);
    setSelectedUser(null);
    loadUsers();
  }

  if (loading) {
    return <TableSkeleton rows={8} cols={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header con azioni */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Gestione Utenti</h2>
          <p className="text-gray-600 text-sm mt-1">
            Totale: {users.length} utenti ({users.filter((u) => u.attivo).length} attivi)
          </p>
        </div>

        <button onClick={handleNewUser} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Nuovo Utente
        </button>
      </div>

      {/* Ricerca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per nome, cognome o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Tabella utenti */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruolo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Creazione
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nessun utente trovato
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {user.nome} {user.cognome}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RuoloBadge ruolo={user.ruolo} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatoBadge attivo={user.attivo} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateIT(user.data_creazione)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-primary hover:text-primary-light"
                          title="Modifica"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`${
                            user.attivo ? 'text-orange-600' : 'text-green-600'
                          } hover:opacity-75`}
                          title={user.attivo ? 'Disattiva' : 'Attiva'}
                        >
                          {user.attivo ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800"
                          title="Elimina"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal creazione/modifica utente */}
      {isModalOpen && (
        <ModalUtente
          user={selectedUser}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
