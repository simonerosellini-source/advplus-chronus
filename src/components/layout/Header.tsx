'use client';

// Componente Header comune per le dashboard
import { LogOut, User, Calendar } from 'lucide-react';
import { LogoCompact } from '@/components/ui/Logo';
import { logout } from '@/app/login/actions';
import type { User as UserType } from '@/types/database.types';
import { RuoloBadge } from '@/components/ui/Badge';

interface HeaderProps {
  user: UserType;
}

export function Header({ user }: HeaderProps) {
  const nomeCompleto = `${user.nome} ${user.cognome}`;

  async function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
      await logout();
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e titolo */}
          <div className="flex items-center gap-4">
            <LogoCompact />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-primary flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sistema Gestione Presenze
              </h1>
            </div>
          </div>

          {/* Info utente e logout */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2 justify-end">
                <User className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium text-gray-900">{nomeCompleto}</p>
              </div>
              <div className="flex items-center gap-2 justify-end mt-1">
                <RuoloBadge ruolo={user.ruolo} />
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn-outline py-2 px-4 flex items-center gap-2 text-sm"
              title="Esci"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Esci</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
