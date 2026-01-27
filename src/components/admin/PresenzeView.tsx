'use client';

// Vista Presenze - Griglia tipo Excel
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Upload, Plus, Lock, Unlock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner, TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { GrigliaPresenze } from './GrigliaPresenze';
import { ModalPresenza } from './ModalPresenza';
import { ModalImport } from './ModalImport';
import { getGiorniMese, MESI_ITALIANI, toISODate, formatOreTotali } from '@/lib/utils/date';
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
  const [isLocked, setIsLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const { showToast } = useToast();
  const supabase = createClient();

  // Carica dati
  useEffect(() => {
    loadData();
    loadLockStatus();
  }, [anno, mese]);

  async function loadData() {
    setLoading(true);
    try {
      // Carica utenti attivi
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
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
      // Include festività globali (sede = null) e festività delle sedi degli utenti
      const sediUtenti: string[] = [];
      if (usersData) {
        (usersData as User[]).forEach(u => {
          if (u.sede) sediUtenti.push(u.sede);
        });
      }
      const sediUniche = [...new Set(sediUtenti)];

      // Filtra per sede: include festività globali (sede IS NULL) e festività delle sedi degli utenti
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Caricamento festività admin per anno:`, anno, 'sedi:', sediUniche);

      const sedeFilter = sediUniche.length > 0
        ? `sede.is.null,sede.in.(${sediUniche.join(',')})`
        : 'sede.is.null';
      const { data: festiviData, error: festiviError } = await supabase
        .from('giorni_festivi')
        .select('*')
        .eq('anno', anno)
        .or(sedeFilter)
        .order('data', { ascending: true });

      if (festiviError) throw festiviError;

      console.log(`[${timestamp}] Festività admin caricate:`, festiviData?.length, festiviData);

      setUsers(usersData || []);
      setPresenze(presenzeData || []);
      setFestivi(festiviData || []);

      console.log(`[${timestamp}] State aggiornato`);
    } catch (error: any) {
      console.error('Errore caricamento dati:', error);
      const errorMessage = error?.message || 'Errore durante il caricamento dei dati';
      showToast(errorMessage, 'error');
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

  // Carica lo stato del lock per il mese corrente
  async function loadLockStatus() {
    try {
      const response = await fetch(`/api/presenze-locks/status?anno=${anno}&mese=${mese}`);
      const data = await response.json();

      if (response.ok) {
        setIsLocked(data.locked);
      } else {
        console.error('Errore durante il caricamento dello stato del lock:', data.error);
      }
    } catch (error: any) {
      console.error('Errore durante il caricamento dello stato del lock:', error);
    }
  }

  // Toggle del lock per il mese corrente
  async function handleToggleLock() {
    setLockLoading(true);
    try {
      const response = await fetch('/api/presenze-locks/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anno, mese }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLocked(data.locked);
        showToast(data.message, 'success');
      } else {
        showToast(data.error || 'Errore durante il toggle del lock', 'error');
      }
    } catch (error: any) {
      console.error('Errore durante il toggle del lock:', error);
      showToast('Errore durante il toggle del lock', 'error');
    } finally {
      setLockLoading(false);
    }
  }

  // Invia email reminder a tutti gli utenti
  async function handleSendTimesheetReminder() {
    if (!confirm('Sei sicuro di voler inviare una email a tutti gli utenti attivi per richiedere l\'inserimento delle ore di lavoro?')) {
      return;
    }

    setSendingEmail(true);
    try {
      const response = await fetch('/api/email/send-timesheet-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (data.sent > 0) {
          showToast(
            `Email inviate con successo a ${data.sent} ${data.sent === 1 ? 'utente' : 'utenti'}${data.failed > 0 ? ` (${data.failed} fallite)` : ''}`,
            data.failed > 0 ? 'info' : 'success'
          );
        } else {
          showToast(data.message || 'Nessuna email inviata', 'info');
        }
      } else {
        showToast(data.error || 'Errore durante l\'invio delle email', 'error');
      }
    } catch (error: any) {
      console.error('Errore durante l\'invio delle email:', error);
      showToast('Errore durante l\'invio delle email', 'error');
    } finally {
      setSendingEmail(false);
    }
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

      // Header row con giorni del mese e nuove colonne totali
      const headerRow = ['Nome', 'Cognome'];
      giorni.forEach(giorno => {
        headerRow.push(`${giorno.getDate()}`);
      });
      headerRow.push('Ore Lavorate');
      headerRow.push('Ore Straordinario/Suppletivo');
      headerRow.push('Ore Ferie');
      headerRow.push('Ore Malattie');
      headerRow.push('Ore 104');
      headerRow.push('N° Trasferte');
      headerRow.push('Importo Trasferte');
      excelData.push(headerRow);

      // Seconda riga con giorni settimana
      const dayNamesRow = ['', ''];
      giorni.forEach(giorno => {
        const giornoSettimana = giorno.toLocaleDateString('it-IT', { weekday: 'short' });
        dayNamesRow.push(giornoSettimana);
      });
      // Aggiungi celle vuote per le nuove colonne totali
      dayNamesRow.push('', '', '', '', '', '', '');
      excelData.push(dayNamesRow);

      // Righe per ogni utente
      users.forEach(user => {
        const row = [user.nome, user.cognome];

        // Variabili per calcolare i totali
        let totaleOreUtente = 0;
        let totaleStraordinari = 0;
        let totaleFerie = 0;
        let totaleMalattie = 0;
        let totale104 = 0;
        let numeroTrasferte = 0;

        giorni.forEach(giorno => {
          const dataISO = toISODate(giorno);
          const presenza = presenze.find(
            p => p.user_id === user.id && p.data === dataISO
          );
          // Filtra festività per sede: include solo globali (sede = null) o quelle della sede utente
          const festivo = festivi.find(f =>
            f.data === dataISO &&
            (f.sede === null || f.sede === user.sede)
          );

          if (festivo) {
            row.push(festivo.tipo === 'festivo' ? 'FEST' : 'SEMI');
          } else if (presenza) {
            const ore = presenza.ore_totali || 0;
            totaleOreUtente += ore;
            totaleStraordinari += presenza.straordinari || 0;
            totaleFerie += presenza.ferie || 0;
            totaleMalattie += presenza.malattia || 0;
            totale104 += presenza.legge_104 || 0;
            if (presenza.trasferta) {
              numeroTrasferte += 1;
            }

            // Costruisci stringa con tutti i dettagli
            let cellValue = formatOreTotali(ore);
            const dettagli = [];

            if (presenza.straordinari > 0) {
              dettagli.push(`STR/SUP:${presenza.straordinari}h`);
            }
            if (presenza.trasferta) {
              dettagli.push(`TR`);
            }
            if (presenza.malattia > 0) {
              dettagli.push(`MAL:${presenza.malattia}h`);
            }
            if (presenza.legge_104 > 0) {
              dettagli.push(`L104:${presenza.legge_104}h`);
            }
            if (presenza.ferie > 0) {
              dettagli.push(`FER:${presenza.ferie}h`);
            }

            if (dettagli.length > 0) {
              cellValue += ` (${dettagli.join(', ')})`;
            }

            row.push(cellValue);
          } else {
            row.push('-');
          }
        });

        // Calcola ore lavorate (ore ordinarie = totale - straordinari)
        const oreLavorate = totaleOreUtente - totaleStraordinari;

        // Calcola importo trasferte (numero giorni * importo per trasferta)
        const importoTrasferte = numeroTrasferte * (user.importo_trasferte || 0);

        // Aggiungi colonne totali
        row.push(formatOreTotali(oreLavorate));
        row.push(formatOreTotali(totaleStraordinari));
        row.push(formatOreTotali(totaleFerie));
        row.push(formatOreTotali(totaleMalattie));
        row.push(formatOreTotali(totale104));
        row.push(numeroTrasferte > 0 ? numeroTrasferte.toString() : '-');
        row.push(importoTrasferte > 0 ? `€${importoTrasferte.toFixed(2)}` : '-');

        excelData.push(row);
      });

      // Crea workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Imposta larghezza colonne
      const colWidths = [{ wch: 15 }, { wch: 15 }];
      giorni.forEach(() => colWidths.push({ wch: 8 }));
      // Aggiungi larghezza per le nuove colonne totali
      colWidths.push({ wch: 15 }); // Ore Lavorate
      colWidths.push({ wch: 20 }); // Ore Straordinario/Suppletivo
      colWidths.push({ wch: 12 }); // Ore Ferie
      colWidths.push({ wch: 12 }); // Ore Malattie
      colWidths.push({ wch: 12 }); // Ore 104
      colWidths.push({ wch: 15 }); // N° Trasferte
      colWidths.push({ wch: 18 }); // Importo Trasferte
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

  // Debug: log festività prima del render
  console.log('PresenzeView render - festivi.length:', festivi.length, 'mese:', mese, 'anno:', anno);

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
          <button
            onClick={handleSendTimesheetReminder}
            disabled={sendingEmail}
            className="btn-primary text-sm py-2 px-3 flex items-center gap-2"
            title="Invia email a tutti gli utenti per richiedere inserimento ore"
          >
            {sendingEmail ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {sendingEmail ? 'Invio...' : 'Invia Reminder'}
            </span>
          </button>
          <button
            onClick={handleToggleLock}
            disabled={lockLoading}
            className={`text-sm py-2 px-3 flex items-center gap-2 ${
              isLocked
                ? 'btn-danger'
                : 'btn-outline'
            }`}
            title={isLocked ? 'Sblocca presenze per tutti gli utenti' : 'Blocca presenze per utenti non admin'}
          >
            {lockLoading ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isLocked ? 'Sblocca Presenze' : 'Blocca Presenze'}
            </span>
          </button>
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
        festivi={(() => {
          console.log('Passando festivi a GrigliaPresenze:', festivi.length, 'festività');
          return festivi;
        })()}
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
          isLocked={isLocked}
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
