'use client';

// Componente Griglia Presenze tipo Excel
import { Plus } from 'lucide-react';
import { getGiorniMese, formatTime, toISODate, isFuturo, formatOreTotali } from '@/lib/utils/date';
import type { User, Presenza, GiornoFestivo, GiornoCalendario, RigaPresenze, PremioMensile } from '@/types/database.types';

interface GrigliaPresenzeProps {
  anno: number;
  mese: number;
  users: User[];
  presenze: Presenza[];
  festivi: GiornoFestivo[];
  premi?: PremioMensile[];
  onCellClick: (userId: string, data: string) => void;
  onPremioClick?: (user: User) => void;
}

export function GrigliaPresenze({
  anno,
  mese,
  users,
  presenze,
  festivi,
  premi = [],
  onCellClick,
  onPremioClick,
}: GrigliaPresenzeProps) {
  const giorniMese = getGiorniMese(anno, mese);

  // Debug: verifica formato date
  console.log('GrigliaPresenze - Mese:', mese, 'Anno:', anno);
  console.log('GrigliaPresenze - Ricevute festività:', festivi.length);
  console.log('GrigliaPresenze - Tutte le date festività:', festivi.map(f => f.data));

  // Prepara mappa presenze per lookup veloce
  const presenzeMap = new Map<string, Presenza>();
  presenze.forEach((p) => {
    presenzeMap.set(`${p.user_id}-${p.data}`, p);
  });

  // Calcola dati per ogni riga (utente)
  const righe: RigaPresenze[] = users.map((user) => {
    // Filtra festività per questo utente: include solo festività globali (sede = null)
    // e festività specifiche della sede dell'utente
    const festiviUtente = festivi.filter(f => f.sede === null || f.sede === user.sede);

    // Crea mappa festività per questo utente con gestione duplicati
    // (priorità a festività specifiche della sede rispetto a quelle globali)
    const festiviMapUtente = new Map<string, GiornoFestivo>();
    festiviUtente.forEach(f => {
      const existing = festiviMapUtente.get(f.data);
      // Se non c'è una festività per questa data, o se questa festività ha una sede specifica
      // (che ha priorità su quella globale), la impostiamo
      if (!existing || (f.sede !== null && existing.sede === null)) {
        festiviMapUtente.set(f.data, f);
      }
    });

    console.log(`GrigliaPresenze - User: ${user.nome} ${user.cognome}, Sede: ${user.sede}, Festività: ${festiviMapUtente.size}`);

    const giorni: GiornoCalendario[] = giorniMese.map((dataObj) => {
      const data = toISODate(dataObj);
      const festivo = festiviMapUtente.get(data);
      const presenza = presenzeMap.get(`${user.id}-${data}`);
      const futuro = isFuturo(data);

      let tipo: GiornoCalendario['tipo'] = 'normale';
      // I festivi hanno priorità sui giorni futuri per visibilità
      if (festivo?.tipo === 'festivo') tipo = 'festivo';
      else if (festivo?.tipo === 'semifestivo') tipo = 'semifestivo';
      else if (futuro) tipo = 'futuro';

      return {
        data,
        giorno: dataObj.getDate(),
        tipo,
        presenza,
        festivo,
      };
    });

    // Calcola totali mensili dettagliati per l'utente
    const totaliMensili = giorni.reduce((acc, g) => {
      if (!g.presenza) return acc;

      const p = g.presenza;
      const orePresenza = p.ore_totali || 0;
      const straordinari = p.straordinari || 0;

      // Ore ordinarie = ore totali - straordinari
      const oreOrdinarie = orePresenza - straordinari;

      return {
        oreOrdinarie: acc.oreOrdinarie + oreOrdinarie,
        straordinari: acc.straordinari + straordinari,
        malattia: acc.malattia + (p.malattia || 0),
        legge_104: acc.legge_104 + (p.legge_104 || 0),
        ferie: acc.ferie + (p.ferie || 0),
        permessi: acc.permessi + (p.permessi || 0),
        trasferte: acc.trasferte + (p.trasferta ? 1 : 0),
      };
    }, {
      oreOrdinarie: 0,
      straordinari: 0,
      malattia: 0,
      legge_104: 0,
      ferie: 0,
      permessi: 0,
      trasferte: 0,
    });

    // Mantieni ore_totali per compatibilità con altri componenti
    const ore_totali = totaliMensili.oreOrdinarie + totaliMensili.straordinari;

    return { user, giorni, ore_totali, totaliMensili };
  });

  // Determina classe CSS per la cella
  function getCellaClassName(giorno: GiornoCalendario): string {
    const dataObj = new Date(giorno.data);
    const isWeekend = dataObj.getDay() === 0 || dataObj.getDay() === 6;

    if (giorno.tipo === 'festivo') return 'cella-festivo';
    if (giorno.tipo === 'semifestivo') return 'cella-semifestivo';
    if (giorno.tipo === 'futuro') return 'cella-futuro';

    if (giorno.presenza) {
      const ore = giorno.presenza.ore_totali || 0;
      if (ore >= 7) return isWeekend ? 'cella-presente-weekend' : 'cella-presente';
      if (ore > 0) return isWeekend ? 'cella-parziale-weekend' : 'cella-parziale';
    }

    return isWeekend ? 'cella-weekend' : 'cella-assente';
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

    // I giorni futuri ora mostrano le stesse informazioni dei giorni passati/correnti
    // La distinzione visiva è mantenuta tramite la classe CSS 'cella-futuro'
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
          <div className="font-bold mt-0.5">{formatOreTotali(p.ore_totali)}</div>

          {/* Indicatori aggiuntivi */}
          <div className="flex flex-wrap gap-0.5 mt-1">
            {p.straordinari > 0 && (
              <span className="bg-blue-100 text-blue-800 px-1 rounded text-[9px]">
                STR/SUP:{formatOreTotali(p.straordinari)}
              </span>
            )}
            {p.trasferta && (
              <span className="bg-purple-100 text-purple-800 px-1 rounded text-[9px]">
                TR
              </span>
            )}
            {p.malattia > 0 && (
              <span className="bg-red-100 text-red-800 px-1 rounded text-[9px]">
                MAL:{formatOreTotali(p.malattia)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {p.legge_104 > 0 && (
              <span className="bg-orange-100 text-orange-800 px-1 rounded text-[9px]">
                L104:{formatOreTotali(p.legge_104)}
              </span>
            )}
            {p.ferie > 0 && (
              <span className="bg-green-100 text-green-800 px-1 rounded text-[9px]">
                FER:{formatOreTotali(p.ferie)}
              </span>
            )}
            {p.permessi > 0 && (
              <span className="bg-violet-100 text-violet-800 px-1 rounded text-[9px]">
                PER:{formatOreTotali(p.permessi)}
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
                <div className="flex items-center gap-1">
                  <span>{riga.user.nome} {riga.user.cognome[0]}.</span>
                  {onPremioClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPremioClick(riga.user);
                      }}
                      className="p-0.5 text-primary hover:bg-primary/10 rounded"
                      title="Aggiungi premio"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {premi.find(p => p.user_id === riga.user.id)?.importo ? (
                    <span className="text-[9px] text-green-600 font-semibold">
                      €{premi.find(p => p.user_id === riga.user.id)?.importo.toFixed(0)}
                    </span>
                  ) : null}
                </div>
              </td>
              {riga.giorni.map((giorno) => (
                <td
                  key={giorno.data}
                  className={getCellaClassName(giorno)}
                  onClick={() => {
                    if (giorno.tipo !== 'festivo') {
                      onCellClick(riga.user.id, giorno.data);
                    }
                  }}
                >
                  {renderCellaContent(giorno)}
                </td>
              ))}
              <td className="bg-gray-50 border-l-2 border-gray-300 p-2">
                <div className="text-[10px] space-y-0.5">
                  <div className="font-bold text-gray-900">
                    Ord: {formatOreTotali(riga.totaliMensili.oreOrdinarie)}
                  </div>
                  {riga.totaliMensili.straordinari > 0 && (
                    <div className="text-blue-700">
                      Str/Sup: {formatOreTotali(riga.totaliMensili.straordinari)}
                    </div>
                  )}
                  {riga.totaliMensili.malattia > 0 && (
                    <div className="text-red-700">
                      Mal: {formatOreTotali(riga.totaliMensili.malattia)}
                    </div>
                  )}
                  {riga.totaliMensili.legge_104 > 0 && (
                    <div className="text-orange-700">
                      L104: {formatOreTotali(riga.totaliMensili.legge_104)}
                    </div>
                  )}
                  {riga.totaliMensili.ferie > 0 && (
                    <div className="text-green-700">
                      Fer: {formatOreTotali(riga.totaliMensili.ferie)}
                    </div>
                  )}
                  {riga.totaliMensili.permessi > 0 && (
                    <div className="text-violet-700">
                      Per: {formatOreTotali(riga.totaliMensili.permessi)}
                    </div>
                  )}
                  {riga.totaliMensili.trasferte > 0 && (
                    <div className="text-purple-700">
                      Tras: {riga.totaliMensili.trasferte}gg
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
