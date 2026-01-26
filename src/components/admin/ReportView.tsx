'use client';

// Vista Report e Statistiche
import { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, TrendingUp, Calendar, Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { MESI_ITALIANI, formatOreTotali } from '@/lib/utils/date';
import type { User, Presenza } from '@/types/database.types';
import * as XLSX from 'xlsx';

interface UserStats {
  user: User;
  totaleOre: number;
  giorniPresenza: number;
  mediaOre: number;
}

interface MonthlyStats {
  mese: number;
  anno: number;
  totaleOre: number;
  giorniLavorativi: number;
}

export function ReportView() {
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);

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

      setUsers(usersData || []);
      setPresenze(presenzeData || []);

      // Calcola statistiche
      calculateStats(usersData || [], presenzeData || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      showToast('Errore durante il caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(usersData: User[], presenzeData: Presenza[]) {
    // Statistiche per utente
    const stats: UserStats[] = usersData.map(user => {
      const userPresenze = presenzeData.filter(p => p.user_id === user.id);
      const totaleOre = userPresenze.reduce((sum, p) => sum + (p.ore_totali || 0), 0);
      const giorniPresenza = userPresenze.length;
      const mediaOre = giorniPresenza > 0 ? totaleOre / giorniPresenza : 0;

      return {
        user,
        totaleOre,
        giorniPresenza,
        mediaOre,
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

      // Sheet 1: Riepilogo per utente
      const userSheetData = [
        ['Nome', 'Cognome', 'Email', 'Totale Ore', 'Giorni Presenza', 'Media Ore/Giorno'],
        ...userStats.map(stat => [
          stat.user.nome,
          stat.user.cognome,
          stat.user.email,
          formatOreTotali(stat.totaleOre),
          stat.giorniPresenza,
          formatOreTotali(stat.mediaOre),
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
