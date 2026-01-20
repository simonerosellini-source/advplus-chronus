'use client';

// Vista Presenze - Griglia tipo Excel
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Upload, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner, TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { GrigliaPresenze } from './GrigliaPresenze';
import { ModalPresenza } from './ModalPresenza';
import { ModalImport } from './ModalImport';
import { getGiorniMese, MESI_ITALIANI } from '@/lib/utils/date';
import type { User, Presenza, GiornoFestivo, RigaPresenze } from '@/types/database.types';
import * as XLSX from 'xlsx';

export function PresenzeView() {
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [mese, setMese] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [festivi, setFestivi] = useState<GiornoFestivo[]>([]);
  const [selectedPresenza, setSelectedPresenza] = useState<{
    userId: string;
    data: string;
    presenza?: Presenza;
  } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const { showToast } = useToast();
  const supabase = createClient();

  // Carica dati
  useEffect(() => {
    loadData();
  }, [anno, mese]);

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

      // Carica presenze del mese
      const primoGiorno = `${anno}-${String(mese).padStart(2, '0')}-01`;
      const ultimoGiorno = new Date(anno, mese, 0);
      const ultimoGiornoStr = `${anno}-${String(mese).padStart(2, '0')}-${ultimoGiorno.getDate()}`;

      const { data: presenzeData, error: presenzeError } = await supabase
        .from('presenze')
        .select('*')
        .gte('data', primoGiorno)
        .lte('data', ultimoGiornoStr);

      if (presenzeError) throw presenzeError;

      // Carica festività dell'anno
      const { data: festiviData, error: festiviError } = await supabase
        .from('giorni_festivi')
        .select('*')
        .eq('anno', anno)
        .order('data', { ascending: true });

      if (festiviError) throw festiviError;

      setUsers(usersData || []);
      setPresenze(presenzeData || []);
      setFestivi(festiviData || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      showToast('Errore durante il caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Naviga mesi
  function prevMonth() {
    if (mese === 1) {
      setMese(12);
      setAnno(anno - 1);
    } else {
      setMese(mese - 1);
    }
  }

  function nextMonth() {
    if (mese === 12) {
      setMese(1);
      setAnno(anno + 1);
    } else {
      setMese(mese + 1);
    }
  }

  function goToCurrentMonth() {
    setAnno(new Date().getFullYear());
    setMese(new Date().getMonth() + 1);
  }

  // Gestione click su cella
  function handleCellClick(userId: string, data: string) {
    const presenza = presenze.find((p) => p.user_id === userId && p.data === data);
    setSelectedPresenza({ userId, data, presenza });
  }

  // Salvataggio presenza
  async function handleSavePresenza() {
    await loadData();
    setSelectedPresenza(null);
    showToast('Presenza salvata con successo', 'success');
  }

  // Export Excel
  function handleExportExcel() {
    try {
      const giorni = getGiorniMese(anno, mese);

      // Crea i dati per Excel
      const excelData = [];

      // Header row con giorni del mese
      const headerRow = ['Nome', 'Cognome'];
      giorni.forEach(giorno => {
        headerRow.push(`${giorno.giorno}`);
      });
      headerRow.push('Totale Ore');
      excelData.push(headerRow);

      // Seconda riga con giorni settimana
      const dayNamesRow = ['', ''];
      giorni.forEach(giorno => {
        const data = new Date(giorno.data);
        const giornoSettimana = data.toLocaleDateString('it-IT', { weekday: 'short' });
        dayNamesRow.push(giornoSettimana);
      });
      dayNamesRow.push('');
      excelData.push(dayNamesRow);

      // Righe per ogni utente
      users.forEach(user => {
        const row = [user.nome, user.cognome];
        let totaleOreUtente = 0;

        giorni.forEach(giorno => {
          const presenza = presenze.find(
            p => p.user_id === user.id && p.data === giorno.data
          );
          const festivo = festivi.find(f => f.data === giorno.data);

          if (festivo) {
            row.push(festivo.tipo === 'festivo' ? 'FEST' : 'SEMI');
          } else if (presenza) {
            const ore = presenza.ore_totali || 0;
            totaleOreUtente += ore;
            row.push(`${ore}h`);
          } else {
            row.push('-');
          }
        });

        row.push(`${totaleOreUtente.toFixed(1)}h`);
        excelData.push(row);
      });

      // Crea workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Imposta larghezza colonne
      const colWidths = [{ wch: 15 }, { wch: 15 }];
      giorni.forEach(() => colWidths.push({ wch: 8 }));
      colWidths.push({ wch: 12 });
      ws['!cols'] = colWidths;

      // Aggiungi worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, `Presenze ${MESI_ITALIANI[mese - 1]}`);

      // Salva file
      const filename = `Presenze_${MESI_ITALIANI[mese - 1]}_${anno}_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast('Excel esportato con successo', 'success');
    } catch (error) {
      console.error('Errore export Excel:', error);
      showToast('Errore durante l\'esportazione', 'error');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <TableSkeleton rows={10} cols={32} />
      </div>
    );
  }

  const isCurrentMonth = anno === new Date().getFullYear() && mese === new Date().getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* Header con controlli */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigazione mese */}
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="btn-outline p-2" title="Mese precedente">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center min-w-[200px]">
            <h2 className="text-2xl font-bold text-primary">
              {MESI_ITALIANI[mese - 1]} {anno}
            </h2>
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="text-sm text-secondary hover:underline mt-1"
              >
                Vai al mese corrente
              </button>
            )}
          </div>

          <button onClick={nextMonth} className="btn-outline p-2" title="Mese successivo">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Azioni */}
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-outline text-sm py-2 px-3 flex items-center gap-2" title="Importa presenze da file">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importa</span>
          </button>
          <button onClick={handleExportExcel} className="btn-secondary text-sm py-2 px-3 flex items-center gap-2" title="Esporta presenze in Excel">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Esporta Excel</span>
          </button>
        </div>
      </div>

      {/* Info utenti */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          <span className="font-medium">{users.length}</span> {users.length === 1 ? 'utente' : 'utenti'} attivi
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
            <span>Festivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded" />
            <span>Semifestivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded" />
            <span>Presente</span>
          </div>
        </div>
      </div>

      {/* Griglia Presenze */}
      <GrigliaPresenze
        anno={anno}
        mese={mese}
        users={users}
        presenze={presenze}
        festivi={festivi}
        onCellClick={handleCellClick}
      />

      {/* Modal inserimento/modifica presenza */}
      {selectedPresenza && (
        <ModalPresenza
          userId={selectedPresenza.userId}
          data={selectedPresenza.data}
          presenza={selectedPresenza.presenza}
          onClose={() => setSelectedPresenza(null)}
          onSave={handleSavePresenza}
        />
      )}

      {/* Modal import presenze */}
      {showImportModal && (
        <ModalImport
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            loadData();
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}
