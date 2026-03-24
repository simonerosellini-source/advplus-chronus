'use client';

// Vista Report e Statistiche
import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, TrendingUp, Calendar, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { MESI_ITALIANI, formatOreTotali, calcolaOre } from '@/lib/utils/date';
import type { User, Presenza, GiornoFestivo, GiornoSettimana } from '@/types/database.types';
import * as XLSX from 'xlsx';

const dayOfWeekToGiorno: Record<number, GiornoSettimana> = {
  0: 'domenica',
  1: 'lunedi',
  2: 'martedi',
  3: 'mercoledi',
  4: 'giovedi',
  5: 'venerdi',
  6: 'sabato',
};

interface UserDetailedStats {
  user: User;
  // Existing
  totaleOre: number;
  giorniPresenza: number;
  mediaOre: number;
  // Ad oggi
  giorniLavorativiAdOggi: number;
  oreLavorateAdOggi: number;
  oreFerieGoduteAdOggi: number;
  orePermessiAdOggi: number;
  oreLegge104AdOggi: number;
  numTrasferteAdOggi: number;
  oreMalattiaAdOggi: number;
  // Annuali
  oreLavorativeAnnuali: number;
  oreLavorateAnnuali: number;
  oreFerieProgrammate: number;
  oreFerieAnnuali: number;
  orePermessiAnnuali: number;
  oreLegge104Annuali: number;
  numTrasferteAnnuali: number;
  oreMalattiaAnnuali: number;
}

interface MonthlyStats {
  mese: number;
  anno: number;
  totaleOre: number;
  giorniLavorativi: number;
}

/**
 * Calcola giorni lavorativi e ore previste per un utente in un intervallo di date,
 * basandosi sugli orari_settimanali dell'utente o sul default Lun-Ven.
 */
function calcolaGiorniEOrePreviste(
  user: User,
  startDate: Date,
  endDate: Date,
  festiviMap: Map<string, GiornoFestivo>
): { giorni: number; ore: number } {
  let giorni = 0;
  let ore = 0;

  const current = new Date(startDate);
  while (current <= endDate) {
    const isoDate = current.toISOString().slice(0, 10);
    const dayOfWeek = current.getDay();
    const giornoSettimana = dayOfWeekToGiorno[dayOfWeek];

    const festivo = festiviMap.get(isoDate);

    // Salta festivi
    if (festivo?.tipo === 'festivo') {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Semifestivo: 4 ore (09:00-13:00) se l'utente lavora quel giorno
    if (festivo?.tipo === 'semifestivo') {
      const isWorkingDay = user.orari_settimanali
        ? user.orari_settimanali[giornoSettimana]?.abilitato
        : (dayOfWeek >= 1 && dayOfWeek <= 5);

      if (isWorkingDay) {
        giorni++;
        ore += 4;
      }
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Giorno normale: controlla se l'utente lavora
    if (user.orari_settimanali) {
      const orarioGiorno = user.orari_settimanali[giornoSettimana];
      if (orarioGiorno?.abilitato) {
        giorni++;
        let oreGiorno = 0;
        if (orarioGiorno.mattina_abilitata && orarioGiorno.ingresso_mattina && orarioGiorno.uscita_mattina) {
          oreGiorno += calcolaOre(orarioGiorno.ingresso_mattina, orarioGiorno.uscita_mattina);
        }
        if (orarioGiorno.pomeriggio_abilitato && orarioGiorno.ingresso_pomeriggio && orarioGiorno.uscita_pomeriggio) {
          oreGiorno += calcolaOre(orarioGiorno.ingresso_pomeriggio, orarioGiorno.uscita_pomeriggio);
        }
        ore += oreGiorno;
      }
    } else {
      // Default: Lun-Ven
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        giorni++;
        let oreGiorno = 0;
        if (user.ingresso_mattina_default && user.uscita_mattina_default) {
          oreGiorno += calcolaOre(user.ingresso_mattina_default, user.uscita_mattina_default);
        }
        if (user.ingresso_pomeriggio_default && user.uscita_pomeriggio_default) {
          oreGiorno += calcolaOre(user.ingresso_pomeriggio_default, user.uscita_pomeriggio_default);
        }
        // Se non ha orari default configurati, assume 8h
        if (oreGiorno === 0) oreGiorno = 8;
        ore += oreGiorno;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return { giorni, ore };
}

export function ReportView() {
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [userStats, setUserStats] = useState<UserDetailedStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const { showToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [anno]);

  async function loadData() {
    setLoading(true);
    try {
      // Carica utenti attivi
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('attivo', true)
        .order('cognome', { ascending: true });

      if (usersError) throw usersError;

      // Carica presenze dell'anno
      const primoGiorno = `${anno}-01-01`;
      const ultimoGiorno = `${anno}-12-31`;

      const { data: presenzeData, error: presenzeError } = await supabase
        .from('presenze')
        .select('*')
        .gte('data', primoGiorno)
        .lte('data', ultimoGiorno);

      if (presenzeError) throw presenzeError;

      // Carica festività dell'anno
      const { data: festiviData, error: festiviError } = await supabase
        .from('giorni_festivi')
        .select('*')
        .eq('anno', anno);

      if (festiviError) throw festiviError;

      setUsers(usersData || []);
      setPresenze(presenzeData || []);

      // Calcola statistiche
      calculateStats(usersData || [], presenzeData || [], festiviData || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      showToast('Errore durante il caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(usersData: User[], presenzeData: Presenza[], festiviData: GiornoFestivo[]) {
    const festiviMap = new Map<string, GiornoFestivo>();
    festiviData.forEach(f => festiviMap.set(f.data, f));

    const oggi = new Date();
    const inizioAnno = new Date(anno, 0, 1);
    const fineAnno = new Date(anno, 11, 31);

    // Per "ad oggi": usa il minore tra oggi e fine anno
    const dataAdOggi = oggi < fineAnno ? oggi : fineAnno;

    // Statistiche per utente
    const stats: UserDetailedStats[] = usersData.map(user => {
      const userPresenze = presenzeData.filter(p => p.user_id === user.id);

      // Filtro presenze "ad oggi"
      const oggiStr = dataAdOggi.toISOString().slice(0, 10);
      const presenzeAdOggi = userPresenze.filter(p => p.data <= oggiStr);

      // Calcoli "ad oggi"
      const userFestiviMap = new Map<string, GiornoFestivo>();
      festiviData
        .filter(f => f.sede === null || f.sede === user.sede)
        .forEach(f => userFestiviMap.set(f.data, f));

      const { giorni: giorniLavorativiAdOggi } = calcolaGiorniEOrePreviste(
        user, inizioAnno, dataAdOggi, userFestiviMap
      );

      const oreLavorateAdOggi = presenzeAdOggi.reduce((sum, p) => sum + (p.ore_totali || 0), 0);
      const oreFerieGoduteAdOggi = presenzeAdOggi.reduce((sum, p) => sum + (p.ferie || 0), 0);
      const orePermessiAdOggi = presenzeAdOggi.reduce((sum, p) => sum + (p.permessi || 0), 0);
      const oreLegge104AdOggi = presenzeAdOggi.reduce((sum, p) => sum + (p.legge_104 || 0), 0);
      const numTrasferteAdOggi = presenzeAdOggi.filter(p => p.trasferta).length;
      const oreMalattiaAdOggi = presenzeAdOggi.reduce((sum, p) => sum + (p.malattia || 0), 0);

      // Calcoli annuali
      const { ore: oreLavorativeAnnuali } = calcolaGiorniEOrePreviste(
        user, inizioAnno, fineAnno, userFestiviMap
      );

      const oreLavorateAnnuali = userPresenze.reduce((sum, p) => sum + (p.ore_totali || 0), 0);
      const oreFerieProgrammate = userPresenze
        .filter(p => (p as any).ferie_validate === true && (p.ferie || 0) > 0)
        .reduce((sum, p) => sum + (p.ferie || 0), 0);
      const oreFerieAnnuali = userPresenze.reduce((sum, p) => sum + (p.ferie || 0), 0);
      const orePermessiAnnuali = userPresenze.reduce((sum, p) => sum + (p.permessi || 0), 0);
      const oreLegge104Annuali = userPresenze.reduce((sum, p) => sum + (p.legge_104 || 0), 0);
      const numTrasferteAnnuali = userPresenze.filter(p => p.trasferta).length;
      const oreMalattiaAnnuali = userPresenze.reduce((sum, p) => sum + (p.malattia || 0), 0);

      const giorniPresenza = userPresenze.length;
      const mediaOre = giorniPresenza > 0 ? oreLavorateAnnuali / giorniPresenza : 0;

      return {
        user,
        totaleOre: oreLavorateAnnuali,
        giorniPresenza,
        mediaOre,
        giorniLavorativiAdOggi,
        oreLavorateAdOggi,
        oreFerieGoduteAdOggi,
        orePermessiAdOggi,
        oreLegge104AdOggi,
        numTrasferteAdOggi,
        oreMalattiaAdOggi,
        oreLavorativeAnnuali,
        oreLavorateAnnuali,
        oreFerieProgrammate,
        oreFerieAnnuali,
        orePermessiAnnuali,
        oreLegge104Annuali,
        numTrasferteAnnuali,
        oreMalattiaAnnuali,
      };
    });

    stats.sort((a, b) => b.totaleOre - a.totaleOre);
    setUserStats(stats);

    // Statistiche mensili
    const monthly: MonthlyStats[] = [];
    for (let mese = 1; mese <= 12; mese++) {
      const presenzeMonth = presenzeData.filter(p => {
        const data = new Date(p.data);
        return data.getFullYear() === anno && data.getMonth() + 1 === mese;
      });

      const totaleOre = presenzeMonth.reduce((sum, p) => sum + (p.ore_totali || 0), 0);
      const giorniLavorativi = new Set(presenzeMonth.map(p => p.data)).size;

      monthly.push({
        mese,
        anno,
        totaleOre,
        giorniLavorativi,
      });
    }
    setMonthlyStats(monthly);
  }

  function handleExportReport() {
    try {
      // Crea workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Riepilogo per utente con tutti i campi
      const userSheetData = [
        [
          'Nome', 'Cognome', 'Email',
          'Gg Lavorativi Ad Oggi', 'Ore Lavorate Ad Oggi', 'Ore Ferie Godute Ad Oggi',
          'Ore Permessi Ad Oggi', 'Ore Legge 104 Ad Oggi', 'N° Trasferte Ad Oggi', 'Ore Malattia Ad Oggi',
          'Ore Lavorative Annuali', 'Ore Lavorate Annuali', 'Ore Ferie Programmate',
          'Ore Ferie Annuali', 'Ore Permessi Annuali', 'Ore Legge 104 Annuali',
          'N° Trasferte Annuali', 'Ore Malattia Annuali',
        ],
        ...userStats.map(stat => [
          stat.user.nome,
          stat.user.cognome,
          stat.user.email,
          stat.giorniLavorativiAdOggi,
          formatOreTotali(stat.oreLavorateAdOggi),
          formatOreTotali(stat.oreFerieGoduteAdOggi),
          formatOreTotali(stat.orePermessiAdOggi),
          formatOreTotali(stat.oreLegge104AdOggi),
          stat.numTrasferteAdOggi,
          formatOreTotali(stat.oreMalattiaAdOggi),
          formatOreTotali(stat.oreLavorativeAnnuali),
          formatOreTotali(stat.oreLavorateAnnuali),
          formatOreTotali(stat.oreFerieProgrammate),
          formatOreTotali(stat.oreFerieAnnuali),
          formatOreTotali(stat.orePermessiAnnuali),
          formatOreTotali(stat.oreLegge104Annuali),
          stat.numTrasferteAnnuali,
          formatOreTotali(stat.oreMalattiaAnnuali),
        ]),
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(userSheetData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Riepilogo Utenti');

      // Sheet 2: Statistiche mensili
      const monthlySheetData = [
        ['Mese', 'Totale Ore', 'Giorni Lavorativi'],
        ...monthlyStats.map(stat => [
          MESI_ITALIANI[stat.mese - 1],
          formatOreTotali(stat.totaleOre),
          stat.giorniLavorativi,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(monthlySheetData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Riepilogo Mensile');

      // Salva file
      const filename = `Report_${anno}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast('Report esportato con successo', 'success');
    } catch (error) {
      console.error('Errore export report:', error);
      showToast('Errore durante l\'esportazione', 'error');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const totaleOreAnno = userStats.reduce((sum, stat) => sum + stat.totaleOre, 0);
  const mediaOreUtente = userStats.length > 0 ? totaleOreAnno / userStats.length : 0;
  const maxOre = Math.max(...userStats.map(s => s.totaleOre), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Report {anno}</h2>
          <p className="text-gray-600 text-sm mt-1">Statistiche e analisi presenze</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={anno}
            onChange={(e) => setAnno(Number(e.target.value))}
            className="input"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleExportReport} className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Esporta Report</span>
          </button>
        </div>
      </div>

      {/* Card statistiche globali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Utenti Attivi</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 rounded-lg p-3">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Totale Ore {anno}</p>
              <p className="text-2xl font-bold text-gray-900">{formatOreTotali(totaleOreAnno)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Media Ore/Utente</p>
              <p className="text-2xl font-bold text-gray-900">{formatOreTotali(mediaOreUtente)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 rounded-lg p-3">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Presenze Totali</p>
              <p className="text-2xl font-bold text-gray-900">{presenze.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Utenti per ore lavorate */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Ore Lavorate per Utente
        </h3>
        <div className="space-y-4">
          {userStats.slice(0, 10).map((stat, index) => (
            <div key={stat.user.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">
                  {index + 1}. {stat.user.nome} {stat.user.cognome}
                </span>
                <span className="text-gray-600">
                  {formatOreTotali(stat.totaleOre)} ({stat.giorniPresenza} giorni)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(stat.totaleOre / maxOre) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dettaglio Statistiche per Utente */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Dettaglio Statistiche per Utente
        </h3>
        <div className="space-y-2">
          {userStats.map(stat => {
            const isExpanded = expandedUser === stat.user.id;
            return (
              <div key={stat.user.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : stat.user.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                      {stat.user.nome[0]}{stat.user.cognome[0]}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{stat.user.nome} {stat.user.cognome}</span>
                      <span className="text-gray-500 text-sm ml-2">{stat.user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{formatOreTotali(stat.totaleOre)} totali</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Sezione Ad Oggi */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                          Ad Oggi
                        </h4>
                        <div className="space-y-2">
                          <StatRow label="Giorni Lavorativi" value={`${stat.giorniLavorativiAdOggi}`} />
                          <StatRow label="Ore Lavorate" value={formatOreTotali(stat.oreLavorateAdOggi)} />
                          <StatRow label="Ore Ferie Godute" value={formatOreTotali(stat.oreFerieGoduteAdOggi)} />
                          <StatRow label="Ore Permessi" value={formatOreTotali(stat.orePermessiAdOggi)} />
                          <StatRow label="Ore Legge 104" value={formatOreTotali(stat.oreLegge104AdOggi)} />
                          <StatRow label="N. Trasferte" value={`${stat.numTrasferteAdOggi}`} />
                          <StatRow label="Ore Malattia" value={formatOreTotali(stat.oreMalattiaAdOggi)} />
                        </div>
                      </div>

                      {/* Sezione Annuali */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                          Annuali ({anno})
                        </h4>
                        <div className="space-y-2">
                          <StatRow label="Ore Lavorative Previste" value={formatOreTotali(stat.oreLavorativeAnnuali)} />
                          <StatRow label="Ore Lavorate" value={formatOreTotali(stat.oreLavorateAnnuali)} />
                          <StatRow label="Ore Ferie Programmate" value={formatOreTotali(stat.oreFerieProgrammate)} highlight />
                          <StatRow label="Ore Ferie" value={formatOreTotali(stat.oreFerieAnnuali)} />
                          <StatRow label="Ore Permessi" value={formatOreTotali(stat.orePermessiAnnuali)} />
                          <StatRow label="Ore Legge 104" value={formatOreTotali(stat.oreLegge104Annuali)} />
                          <StatRow label="N. Trasferte" value={`${stat.numTrasferteAnnuali}`} />
                          <StatRow label="Ore Malattia" value={formatOreTotali(stat.oreMalattiaAnnuali)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistiche mensili */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Andamento Mensile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyStats.filter(m => m.totaleOre > 0).map(stat => (
            <div key={stat.mese} className="border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-900">{MESI_ITALIANI[stat.mese - 1]}</p>
              <p className="text-2xl font-bold text-primary mt-2">{formatOreTotali(stat.totaleOre)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {stat.giorniLavorativi} giorni lavorativi
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded-md bg-white">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}
