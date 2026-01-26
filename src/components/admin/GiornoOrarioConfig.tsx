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
 * con possibilità di abilitare/disabilitare mattina e pomeriggio separatamente
 */
export function GiornoOrarioConfig({
  giorno,
  orario,
  onChange,
  errors = {},
}: GiornoOrarioConfigProps) {
  const handleToggleGiorno = () => {
    const nuovoAbilitato = !orario.abilitato;
    onChange({
      ...orario,
      abilitato: nuovoAbilitato,
      // Se disabilito il giorno, disabilito anche mattina e pomeriggio
      ...(!nuovoAbilitato
        ? {
            mattina_abilitata: false,
            pomeriggio_abilitato: false,
            ingresso_mattina: null,
            uscita_mattina: null,
            ingresso_pomeriggio: null,
            uscita_pomeriggio: null,
          }
        : {}),
    });
  };

  const handleToggleMattina = () => {
    const nuovoAbilitato = !orario.mattina_abilitata;
    onChange({
      ...orario,
      mattina_abilitata: nuovoAbilitato,
      // Se disabilito la mattina, resetta gli orari
      ...(!nuovoAbilitato
        ? {
            ingresso_mattina: null,
            uscita_mattina: null,
          }
        : {}),
    });
  };

  const handleTogglePomeriggio = () => {
    const nuovoAbilitato = !orario.pomeriggio_abilitato;
    onChange({
      ...orario,
      pomeriggio_abilitato: nuovoAbilitato,
      // Se disabilito il pomeriggio, resetta gli orari
      ...(!nuovoAbilitato
        ? {
            ingresso_pomeriggio: null,
            uscita_pomeriggio: null,
          }
        : {}),
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
    <div className="border rounded-lg p-1.5 bg-white shadow-sm">
      {/* Header con nome giorno e checkbox */}
      <div className="mb-1.5 pb-1 border-b">
        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={orario.abilitato}
            onChange={handleToggleGiorno}
            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-gray-800 capitalize">
            {giorno}
          </span>
        </label>
      </div>

      {/* Sezioni Mattina e Pomeriggio (visibili solo se giorno abilitato) */}
      {orario.abilitato && (
        <div className="space-y-1.5">
          {/* Mattina */}
          <div className="bg-blue-50 rounded p-1">
            <label className="flex items-center space-x-1 cursor-pointer mb-1">
              <input
                type="checkbox"
                checked={orario.mattina_abilitata}
                onChange={handleToggleMattina}
                className="w-2.5 h-2.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Mattina
              </span>
            </label>

            {orario.mattina_abilitata && (
              <div className="flex items-start gap-1 mt-1">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">
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
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">
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
            )}
          </div>

          {/* Pomeriggio */}
          <div className="bg-orange-50 rounded p-1">
            <label className="flex items-center space-x-1 cursor-pointer mb-1">
              <input
                type="checkbox"
                checked={orario.pomeriggio_abilitato}
                onChange={handleTogglePomeriggio}
                className="w-2.5 h-2.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-xs font-medium text-gray-700">
                Pomeriggio
              </span>
            </label>

            {orario.pomeriggio_abilitato && (
              <div className="flex items-start gap-1 mt-1">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">
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
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
