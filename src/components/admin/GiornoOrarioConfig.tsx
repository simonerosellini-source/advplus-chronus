'use client';

import { TimeInput } from '@/components/ui/TimeInput';
import type { OrarioGiornaliero } from '@/types/database.types';

interface GiornoOrarioConfigProps {
  giorno: string;
  orario: OrarioGiornaliero;
  onChange: (orario: OrarioGiornaliero) => void;
  errors?: {
    ingresso_mattina?: string;
    uscita_mattina?: string;
    ingresso_pomeriggio?: string;
    uscita_pomeriggio?: string;
  };
}

/**
 * Componente per configurare gli orari di un singolo giorno della settimana
 */
export function GiornoOrarioConfig({
  giorno,
  orario,
  onChange,
  errors = {},
}: GiornoOrarioConfigProps) {
  const handleToggle = () => {
    onChange({
      ...orario,
      abilitato: !orario.abilitato,
      // Resetta gli orari se disabilito
      ...(!orario.abilitato
        ? {}
        : {
            ingresso_mattina: null,
            uscita_mattina: null,
            ingresso_pomeriggio: null,
            uscita_pomeriggio: null,
          }),
    });
  };

  const handleChangeField = (
    field: keyof OrarioGiornaliero,
    value: string | null
  ) => {
    onChange({
      ...orario,
      [field]: value || null,
    });
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      {/* Header con nome giorno e checkbox */}
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={orario.abilitato}
            onChange={handleToggle}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm font-semibold text-gray-700 capitalize">
            {giorno}
          </span>
        </label>
      </div>

      {/* Sezioni Mattina e Pomeriggio (visibili solo se abilitato) */}
      {orario.abilitato && (
        <div className="space-y-4">
          {/* Mattina */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Mattina
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Ingresso
                </label>
                <TimeInput
                  value={orario.ingresso_mattina || ''}
                  onChange={(val) => handleChangeField('ingresso_mattina', val)}
                  error={!!errors.ingresso_mattina}
                />
                {errors.ingresso_mattina && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.ingresso_mattina}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Uscita
                </label>
                <TimeInput
                  value={orario.uscita_mattina || ''}
                  onChange={(val) => handleChangeField('uscita_mattina', val)}
                  error={!!errors.uscita_mattina}
                />
                {errors.uscita_mattina && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.uscita_mattina}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pomeriggio */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Pomeriggio
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Ingresso
                </label>
                <TimeInput
                  value={orario.ingresso_pomeriggio || ''}
                  onChange={(val) =>
                    handleChangeField('ingresso_pomeriggio', val)
                  }
                  error={!!errors.ingresso_pomeriggio}
                />
                {errors.ingresso_pomeriggio && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.ingresso_pomeriggio}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Uscita
                </label>
                <TimeInput
                  value={orario.uscita_pomeriggio || ''}
                  onChange={(val) =>
                    handleChangeField('uscita_pomeriggio', val)
                  }
                  error={!!errors.uscita_pomeriggio}
                />
                {errors.uscita_pomeriggio && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.uscita_pomeriggio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
