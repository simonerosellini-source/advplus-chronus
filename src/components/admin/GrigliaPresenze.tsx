'use client';

// Componente Griglia Presenze tipo Excel
import { getGiorniMese, formatTime, toISODate, isFuturo } from '@/lib/utils/date';
import type { User, Presenza, GiornoFestivo, GiornoCalendario, RigaPresenze } from '@/types/database.types';

interface GrigliaPresenzeProps {
  anno: number;
  mese: number;
  users: User[];
  presenze: Presenza[];
  festivi: GiornoFestivo[];
  onCellClick: (userId: string, data: string) => void;
}

export function GrigliaPresenze({
  anno,
  mese,
  users,
  presenze,
  festivi,
  onCellClick,
}: GrigliaPresenzeProps) {
  const giorniMese = getGiorniMese(anno, mese);

  // Prepara mappa festivi per lookup veloce
  const festiviMap = new Map(festivi.map((f) => [f.data, f]));

  // Prepara mappa presenze per lookup veloce
  const presenzeMap = new Map<string, Presenza>();
  presenze.forEach((p) => {
    presenzeMap.set(`${p.user_id}-${p.data}`, p);
  });

  // Calcola dati per ogni riga (utente)
  const righe: RigaPresenze[] = users.map((user) => {
    const giorni: GiornoCalendario[] = giorniMese.map((dataObj) => {
      const data = toISODate(dataObj);
      const festivo = festiviMap.get(data);
      const presenza = presenzeMap.get(`${user.id}-${data}`);
      const futuro = isFuturo(data);

      let tipo: GiornoCalendario['tipo'] = 'normale';
      if (futuro) tipo = 'futuro';
      else if (festivo?.tipo === 'festivo') tipo = 'festivo';
      else if (festivo?.tipo === 'semifestivo') tipo = 'semifestivo';

      return {
        data,
        giorno: dataObj.getDate(),
        tipo,
        presenza,
        festivo,
      };
    });

    // Calcola ore totali del mese per l'utente
    const ore_totali = giorni.reduce((sum, g) => sum + (g.presenza?.ore_totali || 0), 0);

    return { user, giorni, ore_totali };
  });

  // Determina classe CSS per la cella
  function getCellaClassName(giorno: GiornoCalendario): string {
    if (giorno.tipo === 'festivo') return 'cella-festivo';
    if (giorno.tipo === 'semifestivo') return 'cella-semifestivo';
    if (giorno.tipo === 'futuro') return 'cella-futuro';

    if (giorno.presenza) {
      const ore = giorno.presenza.ore_totali || 0;
      if (ore >= 7) return 'cella-presente';
      if (ore > 0) return 'cella-parziale';
    }

    return 'cella-assente';
  }

  // Render contenuto cella
  function renderCellaContent(giorno: GiornoCalendario): React.ReactNode {
    if (giorno.tipo === 'festivo') {
      return (
        <div className="text-center text-xs">
          <div className="font-bold">F</div>
          {giorno.festivo && <div className="text-[10px]">{giorno.festivo.nome.substring(0, 15)}</div>}
        </div>
      );
    }

    if (giorno.tipo === 'semifestivo') {
      return (
        <div className="text-center text-xs">
          <div className="font-bold">SF</div>
          <div>09:00-13:00</div>
          <div className="text-[10px]">{giorno.festivo?.nome.substring(0, 15)}</div>
        </div>
      );
    }

    if (giorno.tipo === 'futuro') {
      return <div className="text-center text-xs text-gray-400">-</div>;
    }

    if (giorno.presenza) {
      const p = giorno.presenza;
      return (
        <div className="text-[10px] leading-tight">
          {p.ingresso_mattina && (
            <div>
              {formatTime(p.ingresso_mattina)}-{formatTime(p.uscita_mattina)}
            </div>
          )}
          {p.ingresso_pomeriggio && (
            <div>
              {formatTime(p.ingresso_pomeriggio)}-{formatTime(p.uscita_pomeriggio)}
            </div>
          )}
          <div className="font-bold mt-0.5">{p.ore_totali.toFixed(1)}h</div>

          {/* Indicatori aggiuntivi */}
          <div className="flex flex-wrap gap-0.5 mt-1">
            {p.straordinari > 0 && (
              <span className="bg-blue-100 text-blue-800 px-1 rounded text-[9px]">
                ST:{p.straordinari}h
              </span>
            )}
            {p.ore_trasferte > 0 && (
              <span className="bg-purple-100 text-purple-800 px-1 rounded text-[9px]">
                TR:{p.ore_trasferte}h
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {p.malattia && (
              <span className="bg-red-100 text-red-800 px-1 rounded text-[9px] font-semibold">
                MAL
              </span>
            )}
            {p.legge_104 && (
              <span className="bg-orange-100 text-orange-800 px-1 rounded text-[9px] font-semibold">
                L104
              </span>
            )}
            {p.ferie && (
              <span className="bg-green-100 text-green-800 px-1 rounded text-[9px] font-semibold">
                FER
              </span>
            )}
          </div>
        </div>
      );
    }

    return <div className="text-center text-xs text-gray-400">-</div>;
  }

  return (
    <div className="presenze-grid">
      <table className="presenze-table">
        <thead>
          <tr>
            <th className="sticky left-0 bg-primary z-20 min-w-[150px]">Nome</th>
            {giorniMese.map((data) => {
              const giorno = data.getDate();
              const giornoSettimana = ['D', 'L', 'M', 'M', 'G', 'V', 'S'][data.getDay()];
              const isWeekend = data.getDay() === 0 || data.getDay() === 6;
              return (
                <th
                  key={giorno}
                  className={`min-w-[60px] ${isWeekend ? 'bg-primary-dark' : ''}`}
                >
                  <div>{giorno}</div>
                  <div className="text-[10px] font-normal">{giornoSettimana}</div>
                </th>
              );
            })}
            <th className="min-w-[80px] bg-primary-dark">TOT</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((riga) => (
            <tr key={riga.user.id}>
              <td className="sticky left-0 bg-white z-10 font-medium border-r-2 border-gray-300">
                {riga.user.nome} {riga.user.cognome[0]}.
              </td>
              {riga.giorni.map((giorno) => (
                <td
                  key={giorno.data}
                  className={getCellaClassName(giorno)}
                  onClick={() => {
                    if (giorno.tipo !== 'festivo' && giorno.tipo !== 'futuro') {
                      onCellClick(riga.user.id, giorno.data);
                    }
                  }}
                >
                  {renderCellaContent(giorno)}
                </td>
              ))}
              <td className="text-center font-bold bg-gray-50 border-l-2 border-gray-300">
                {riga.ore_totali.toFixed(1)}h
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
