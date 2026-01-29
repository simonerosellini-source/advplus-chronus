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

      const excelData: (string | number)[][] = [];
      const monthLabel = MESI_ITALIANI[mese - 1].toUpperCase();

      const headerRow = ['Nome', '', ''];
      const surnameRow = ['Cognome', '', ''];
      const categoryRow = [monthLabel, '', ''];

      users.forEach(user => {
        headerRow.push(user.nome, '', '', '', '', '', '');
        surnameRow.push(user.cognome, '', '', '', '', '', '');
        categoryRow.push('ORARIO', 'STR/SUP', 'MAL', 'FER', 'PER', 'L104', 'TR');
      });

      excelData.push(headerRow, surnameRow, categoryRow);

      const totalsByUser = new Map<string, {
        oreOrdinarie: number;
        straordinari: number;
        malattia: number;
        ferie: number;
        permessi: number;
        legge104: number;
        trasferte: number;
        importoTrasferte: number;
      }>();

      users.forEach(user => {
        totalsByUser.set(user.id, {
          oreOrdinarie: 0,
          straordinari: 0,
          malattia: 0,
          ferie: 0,
          permessi: 0,
          legge104: 0,
          trasferte: 0,
          importoTrasferte: 0,
        });
      });

      giorni.forEach(giorno => {
        const dataISO = toISODate(giorno);
        const giornoSettimana = giorno.toLocaleDateString('it-IT', { weekday: 'short' });
        const festivoGlobale = festivi.find(f => f.data === dataISO && f.sede === null);
        const dayRow: (string | number)[] = [
          giorno.getDate(),
          giornoSettimana,
          festivoGlobale ? (festivoGlobale.tipo === 'festivo' ? 'FEST' : 'SEMI') : '',
        ];

        users.forEach(user => {
          const presenza = presenze.find(
            p => p.user_id === user.id && p.data === dataISO
          );
          const festivo = festivi.find(f =>
            f.data === dataISO &&
            (f.sede === null || f.sede === user.sede)
          );

          if (!dayRow[2] && festivo) {
            dayRow[2] = festivo.tipo === 'festivo' ? 'FEST' : 'SEMI';
          }

          if (presenza) {
            const straordinari = presenza.straordinari || 0;
            const oreTotali = presenza.ore_totali || 0;
            const oreOrdinarie = Math.max(0, oreTotali - straordinari);
            const malattia = presenza.malattia || 0;
            const ferie = presenza.ferie || 0;
            const permessi = presenza.permessi || 0;
            const legge104 = presenza.legge_104 || 0;
            const trasferta = presenza.trasferta;

            const totals = totalsByUser.get(user.id);
            if (totals) {
              totals.oreOrdinarie += oreOrdinarie;
              totals.straordinari += straordinari;
              totals.malattia += malattia;
              totals.ferie += ferie;
              totals.permessi += permessi;
              totals.legge104 += legge104;
              totals.trasferte += trasferta ? 1 : 0;
            }

            dayRow.push(
              oreOrdinarie > 0 ? formatOreTotali(oreOrdinarie) : '-',
              straordinari > 0 ? formatOreTotali(straordinari) : '-',
              malattia > 0 ? formatOreTotali(malattia) : '-',
              ferie > 0 ? formatOreTotali(ferie) : '-',
              permessi > 0 ? formatOreTotali(permessi) : '-',
              legge104 > 0 ? formatOreTotali(legge104) : '-',
              trasferta ? 'TR' : '-'
            );
          } else {
            dayRow.push('-', '-', '-', '-', '-', '-', '-');
          }
        });

        excelData.push(dayRow);
      });

      const totalsRow: (string | number)[] = ['TOTALI', '', ''];
      users.forEach(user => {
        const totals = totalsByUser.get(user.id);
        if (!totals) {
          totalsRow.push('-', '-', '-', '-', '-', '-', '-');
          return;
        }
        totals.importoTrasferte = totals.trasferte * (user.importo_trasferte || 0);
        totalsRow.push(
          totals.oreOrdinarie > 0 ? formatOreTotali(totals.oreOrdinarie) : '-',
          totals.straordinari > 0 ? formatOreTotali(totals.straordinari) : '-',
          totals.malattia > 0 ? formatOreTotali(totals.malattia) : '-',
          totals.ferie > 0 ? formatOreTotali(totals.ferie) : '-',
          totals.permessi > 0 ? formatOreTotali(totals.permessi) : '-',
          totals.legge104 > 0 ? formatOreTotali(totals.legge104) : '-',
          totals.trasferte > 0 ? totals.trasferte : '-'
        );
      });

      excelData.push(totalsRow);

      const spacerRow = ['', '', ''];
      users.forEach(() => spacerRow.push('', '', '', '', '', '', ''));
      excelData.push(spacerRow);

      const labelsRow: (string | number)[] = ['', '', ''];
      users.forEach(() => {
        labelsRow.push('IMPORTO PREMIO', '', '', '', 'IMPORTO TRASFERTE', '', '');
      });
      excelData.push(labelsRow);

      const valuesRow: (string | number)[] = ['', '', ''];
      users.forEach(user => {
        const totals = totalsByUser.get(user.id);
        const importoTrasferte = totals?.importoTrasferte || 0;
        valuesRow.push(
          '',
          '',
          '',
          '',
          importoTrasferte > 0 ? `€${importoTrasferte.toFixed(2)}` : '',
          '',
          ''
        );
      });
      excelData.push(valuesRow);

      // Crea workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Imposta larghezza colonne
      const colWidths = [{ wch: 6 }, { wch: 8 }, { wch: 8 }];
      users.forEach(() => {
        colWidths.push(
          { wch: 10 }, // ORARIO
          { wch: 10 }, // STR/SUP
          { wch: 8 }, // MAL
          { wch: 8 }, // FER
          { wch: 8 }, // PER
          { wch: 8 }, // L104
          { wch: 6 } // TR
        );
      });
      ws['!cols'] = colWidths;

      // Merges per nome, cognome e blocchi importi su 7 colonne
      const merges: XLSX.Range[] = [];
      const totalsRowIndex = 3 + giorni.length;
      const labelsRowIndex = totalsRowIndex + 2;
      const valuesRowIndex = labelsRowIndex + 1;
      users.forEach((_, index) => {
        const startCol = 3 + index * 7;
        merges.push(
          { s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 6 } },
          { s: { r: 1, c: startCol }, e: { r: 1, c: startCol + 6 } },
          { s: { r: labelsRowIndex, c: startCol }, e: { r: labelsRowIndex, c: startCol + 3 } },
          { s: { r: labelsRowIndex, c: startCol + 4 }, e: { r: labelsRowIndex, c: startCol + 6 } },
          { s: { r: valuesRowIndex, c: startCol }, e: { r: valuesRowIndex, c: startCol + 3 } },
          { s: { r: valuesRowIndex, c: startCol + 4 }, e: { r: valuesRowIndex, c: startCol + 6 } }
        );
      });
      ws['!merges'] = merges;

      // Stili bordi e allineamento
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const thickBorderCols = new Set<number>();
      thickBorderCols.add(2);
      users.forEach((_, index) => {
        thickBorderCols.add(2 + (index + 1) * 7);
      });

      for (let r = range.s.r; r <= range.e.r; r += 1) {
        for (let c = range.s.c; c <= range.e.c; c += 1) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          if (!ws[cellAddress]) {
            ws[cellAddress] = { t: 's', v: '' };
          }
          const isThickRight = thickBorderCols.has(c);
          const isTotalsRow = r === totalsRowIndex;
          ws[cellAddress].s = {
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: isTotalsRow ? 'medium' : 'thin', color: { auto: 1 } },
              bottom: { style: 'thin', color: { auto: 1 } },
              left: { style: 'thin', color: { auto: 1 } },
              right: { style: isThickRight ? 'medium' : 'thin', color: { auto: 1 } },
            },
          };
        }
      }

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
