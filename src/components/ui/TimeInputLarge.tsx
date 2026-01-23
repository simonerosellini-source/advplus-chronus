'use client';

import { useState, useEffect } from 'react';

interface TimeInputLargeProps {
  value: string; // Formato "HH:MM" es. "09:00"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

/**
 * Input personalizzato per orari con scatti di 30 minuti - VERSIONE GRANDE
 * L'utente scrive le ore liberamente, i minuti sono selezionabili solo :00 o :30
 */
export function TimeInputLarge({
  value,
  onChange,
  placeholder = '--:--',
  disabled = false,
  className = '',
  error = false,
}: TimeInputLargeProps) {
  // Separa ore e minuti dal valore
  const [initialHours, initialMinutes] = value && value.includes(':') ? value.split(':') : ['', ''];

  const [localHours, setLocalHours] = useState(initialHours || '');
  const [localMinutes, setLocalMinutes] = useState(initialMinutes || '00');

  // Sincronizza con prop value quando cambia esternamente
  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setLocalHours(h);
      setLocalMinutes(m);
    } else if (!value) {
      setLocalHours('');
      setLocalMinutes('00');
    }
  }, [value]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHours = e.target.value;
    setLocalHours(newHours);

    // Aggiorna il valore completo
    if (newHours) {
      onChange(`${newHours}:${localMinutes}`);
    } else {
      onChange('');
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = e.target.value;
    setLocalMinutes(newMinutes);

    // Aggiorna il valore completo solo se ci sono ore
    if (localHours) {
      const paddedHours = localHours.padStart(2, '0');
      onChange(`${paddedHours}:${newMinutes}`);
    } else {
      // Se non ci sono ore, non aggiornare (i minuti da soli non hanno senso)
      // Mantieni solo il valore locale dei minuti
    }
  };

  const baseInputClass = error ? 'input-error' : 'input';
  const combinedClass = `${baseInputClass} ${className}`;

  // Genera array di ore 00-23
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="flex items-center gap-1">
      <select
        value={localHours}
        onChange={handleHoursChange}
        disabled={disabled}
        className={`${combinedClass} w-16 text-base px-2 py-2`}
      >
        <option value="">--</option>
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="text-gray-500 text-base font-medium">:</span>
      <select
        value={localMinutes}
        onChange={handleMinutesChange}
        disabled={disabled}
        className={`${combinedClass} w-16 text-base px-2 py-2`}
      >
        <option value="00">00</option>
        <option value="30">30</option>
      </select>
    </div>
  );
}
