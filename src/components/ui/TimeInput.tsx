'use client';

import { useState, useEffect } from 'react';

interface TimeInputProps {
  value: string; // Formato "HH:MM" es. "09:00"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

/**
 * Input personalizzato per orari con scatti di 30 minuti
 * L'utente scrive le ore liberamente, i minuti sono selezionabili solo :00 o :30
 */
export function TimeInput({
  value,
  onChange,
  placeholder = '--:--',
  disabled = false,
  className = '',
  error = false,
}: TimeInputProps) {
  // Separa ore e minuti dal valore
  const [hours, minutes] = value && value.includes(':') ? value.split(':') : ['', ''];

  const [localHours, setLocalHours] = useState(hours || '');
  const [localMinutes, setLocalMinutes] = useState(minutes || '00');

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

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHours = e.target.value.replace(/\D/g, ''); // Solo numeri

    // Limita a 2 cifre
    if (newHours.length > 2) {
      newHours = newHours.slice(0, 2);
    }

    // Valida range 0-23
    const hoursNum = parseInt(newHours, 10);
    if (newHours && (hoursNum < 0 || hoursNum > 23)) {
      return;
    }

    setLocalHours(newHours);

    // Aggiorna il valore completo
    if (newHours) {
      const paddedHours = newHours.padStart(2, '0');
      onChange(`${paddedHours}:${localMinutes}`);
    } else {
      onChange('');
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinutes = e.target.value;
    setLocalMinutes(newMinutes);

    // Aggiorna il valore completo
    if (localHours) {
      const paddedHours = localHours.padStart(2, '0');
      onChange(`${paddedHours}:${newMinutes}`);
    }
  };

  const handleHoursBlur = () => {
    // Padding a 2 cifre quando perde il focus
    if (localHours && localHours.length === 1) {
      const paddedHours = localHours.padStart(2, '0');
      setLocalHours(paddedHours);
      onChange(`${paddedHours}:${localMinutes}`);
    }
  };

  const baseInputClass = error ? 'input-error' : 'input';
  const combinedClass = `${baseInputClass} ${className}`;

  return (
    <div className="flex items-center gap-0.5">
      <input
        type="text"
        inputMode="numeric"
        value={localHours}
        onChange={handleHoursChange}
        onBlur={handleHoursBlur}
        placeholder="--"
        disabled={disabled}
        className={`${combinedClass} w-8 text-center text-xs px-0.5 py-0.5`}
        maxLength={2}
      />
      <span className="text-gray-500 text-xs">:</span>
      <select
        value={localMinutes}
        onChange={handleMinutesChange}
        disabled={disabled}
        className={`${combinedClass} w-10 text-xs px-0 py-0.5`}
      >
        <option value="00">00</option>
        <option value="30">30</option>
      </select>
    </div>
  );
}
