// Componente Badge per mostrare ruoli, stati, ecc.
import type { RuoloUtente } from '@/types/database.types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'badge bg-gray-100 text-gray-800',
    success: 'badge bg-green-100 text-green-800',
    warning: 'badge bg-yellow-100 text-yellow-800',
    danger: 'badge bg-red-100 text-red-800',
    info: 'badge bg-blue-100 text-blue-800',
  };

  return <span className={`${variants[variant]} ${className}`}>{children}</span>;
}

// Badge specifico per i ruoli
export function RuoloBadge({ ruolo }: { ruolo: RuoloUtente }) {
  const styles = {
    amministratore: 'badge-admin',
    dipendente: 'badge-dipendente',
    collaboratore: 'badge-collaboratore',
  };

  const labels = {
    amministratore: 'Amministratore',
    dipendente: 'Dipendente',
    collaboratore: 'Collaboratore',
  };

  return <span className={styles[ruolo]}>{labels[ruolo]}</span>;
}

// Badge per stato attivo/disattivo
export function StatoBadge({ attivo }: { attivo: boolean }) {
  return (
    <Badge variant={attivo ? 'success' : 'danger'}>
      {attivo ? 'Attivo' : 'Disattivato'}
    </Badge>
  );
}
