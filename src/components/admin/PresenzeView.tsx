'use client';

// Vista Presenze - Griglia tipo Excel
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Upload, Plus, Lock, Unlock, Mail, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner, TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { GrigliaPresenze } from './GrigliaPresenze';
import { ModalPresenza } from './ModalPresenza';
import { ModalImport } from './ModalImport';
import { getGiorniMese, MESI_ITALIANI, toISODate, formatOreTotali } from '@/lib/utils/date';
import type { User, Presenza, GiornoFestivo, RigaPresenze, PremioMensile } from '@/types/database.types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PresenzeView() {
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [mese, setMese] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [festivi, setFestivi] = useState<GiornoFestivo[]>([]);
  const [premi, setPremi] = useState<PremioMensile[]>([]);
  const [selectedPresenza, setSelectedPresenza] = useState<{
    userId: string;
    data: string;
    presenza?: Presenza;
  } | null>(null);
  const [selectedUserForPremio, setSelectedUserForPremio] = useState<User | null>(null);
  const [premioInput, setPremioInput] = useState<string>('');
  const [savingPremio, setSavingPremio] = useState(false);
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

      // Carica premi mensili
      const { data: premiData, error: premiError } = await (supabase as any)
        .from('premi_mensili')
        .select('*')
        .eq('anno', anno)
        .eq('mese', mese);

      if (premiError) {
        console.warn('Errore caricamento premi (tabella potrebbe non esistere):', premiError);
      }

      setUsers(usersData || []);
      setPresenze(presenzeData || []);
      setFestivi(festiviData || []);
      setPremi(premiData || []);

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

  // Apri modal premio
  function handleOpenPremioModal(user: User) {
    const premioEsistente = premi.find(p => p.user_id === user.id);
    setSelectedUserForPremio(user);
    setPremioInput(premioEsistente ? premioEsistente.importo.toString() : '');
  }

  // Salva premio
  async function handleSavePremio() {
    if (!selectedUserForPremio) return;

    setSavingPremio(true);
    try {
      const importo = parseFloat(premioInput) || 0;
      const premioEsistente = premi.find(p => p.user_id === selectedUserForPremio.id);

      if (premioEsistente) {
        // Aggiorna premio esistente
        const { error } = await (supabase as any)
          .from('premi_mensili')
          .update({ importo })
          .eq('id', premioEsistente.id);

        if (error) throw error;
      } else if (importo > 0) {
        // Crea nuovo premio solo se importo > 0
        const { error } = await (supabase as any)
          .from('premi_mensili')
          .insert({
            user_id: selectedUserForPremio.id,
            anno,
            mese,
            importo,
          });

        if (error) throw error;
      }

      await loadData();
      setSelectedUserForPremio(null);
      setPremioInput('');
      showToast('Premio salvato con successo', 'success');
    } catch (error: any) {
      console.error('Errore salvataggio premio:', error);
      showToast('Errore durante il salvataggio del premio', 'error');
    } finally {
      setSavingPremio(false);
    }
  }

  // Export Excel - Layout verticale
  function handleExportExcel() {
    try {
      const giorni = getGiorniMese(anno, mese);
      const numGiorni = giorni.length;
      const numUsers = users.length;
      const COLS_PER_USER = 7; // ORARIO, STR/SUP, MAL, FER, PER, L104, TR
      const FIXED_COLS = 3; // Giorno, Giorno Settimana, Festivo

      // Abbreviazioni giorni settimana
      const giorniSettimana = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

      // Crea i dati per Excel
      const excelData: (string | number | null)[][] = [];

      // === RIGA 1: Nome ===
      const row1: (string | null)[] = ['Nome', '', ''];
      users.forEach(user => {
        row1.push(user.nome);
        for (let i = 1; i < COLS_PER_USER; i++) row1.push(null);
      });
      excelData.push(row1);

      // === RIGA 2: Cognome ===
      const row2: (string | null)[] = ['Cognome', '', ''];
      users.forEach(user => {
        row2.push(user.cognome);
        for (let i = 1; i < COLS_PER_USER; i++) row2.push(null);
      });
      excelData.push(row2);

      // === RIGA 3: Intestazioni colonne ===
      const row3: (string | null)[] = [MESI_ITALIANI[mese - 1].toUpperCase(), '', ''];
      users.forEach(() => {
        row3.push('ORARIO', 'STR/SUP', 'MAL', 'FER', 'PER', 'L104', 'TR');
      });
      excelData.push(row3);

      // === RIGHE DATI: Giorni del mese ===
      // Variabili per totali per utente
      const totaliUtenti = users.map(() => ({
        orario: 0,
        straordinari: 0,
        malattia: 0,
        ferie: 0,
        permessi: 0,
        legge104: 0,
        trasferte: 0,
      }));

      giorni.forEach((giorno, idx) => {
        const dataISO = toISODate(giorno);
        const dayOfWeek = giorniSettimana[giorno.getDay()];
        const dayNum = giorno.getDate();

        // Verifica se è festivo (globale)
        const festivoGlobale = festivi.find(f => f.data === dataISO && f.sede === null);
        const isFestivo = festivoGlobale?.tipo === 'festivo';
        const isSemifestivo = festivoGlobale?.tipo === 'semifestivo';

        const row: (string | number | null)[] = [
          dayNum,
          dayOfWeek,
          isFestivo ? 'FEST' : (isSemifestivo ? 'SEMI' : null),
        ];

        users.forEach((user, userIdx) => {
          // Verifica festivo per sede utente
          const festivoUtente = festivi.find(f =>
            f.data === dataISO &&
            (f.sede === null || f.sede === user.sede)
          );
          const isUserFestivo = festivoUtente?.tipo === 'festivo';

          const presenza = presenze.find(
            p => p.user_id === user.id && p.data === dataISO
          );

          if (isUserFestivo && !presenza) {
            // Giorno festivo senza presenza
            row.push(null, null, null, null, null, null, null);
          } else if (presenza) {
            const oreTotali = presenza.ore_totali || 0;
            const straordinari = presenza.straordinari || 0;
            const malattia = presenza.malattia || 0;
            const ferie = presenza.ferie || 0;
            const permessi = presenza.permessi || 0;
            const legge104 = presenza.legge_104 || 0;
            const trasferta = presenza.trasferta ? 1 : 0;

            // Accumula totali
            totaliUtenti[userIdx].orario += oreTotali;
            totaliUtenti[userIdx].straordinari += straordinari;
            totaliUtenti[userIdx].malattia += malattia;
            totaliUtenti[userIdx].ferie += ferie;
            totaliUtenti[userIdx].permessi += permessi;
            totaliUtenti[userIdx].legge104 += legge104;
            totaliUtenti[userIdx].trasferte += trasferta;

            row.push(
              oreTotali > 0 ? formatOreTotali(oreTotali) : '-',
              straordinari > 0 ? formatOreTotali(straordinari) : null,
              malattia > 0 ? formatOreTotali(malattia) : null,
              ferie > 0 ? formatOreTotali(ferie) : null,
              permessi > 0 ? formatOreTotali(permessi) : null,
              legge104 > 0 ? formatOreTotali(legge104) : null,
              trasferta > 0 ? trasferta : null
            );
          } else {
            row.push('-', null, null, null, null, null, null);
          }
        });

        excelData.push(row);
      });

      // === RIGA TOTALI ===
      const rowTotali: (string | number | null)[] = ['', 'TOTALI', ''];
      totaliUtenti.forEach((totali) => {
        rowTotali.push(
          formatOreTotali(totali.orario),
          totali.straordinari > 0 ? formatOreTotali(totali.straordinari) : null,
          totali.malattia > 0 ? formatOreTotali(totali.malattia) : null,
          totali.ferie > 0 ? formatOreTotali(totali.ferie) : null,
          totali.permessi > 0 ? formatOreTotali(totali.permessi) : null,
          totali.legge104 > 0 ? formatOreTotali(totali.legge104) : null,
          totali.trasferte > 0 ? totali.trasferte : null
        );
      });
      excelData.push(rowTotali);

      // === RIGA VUOTA ===
      excelData.push([]);

      // === RIGA IMPORTO PREMIO (etichetta + valore sotto ogni utente) ===
      const rowPremio: (string | number | null)[] = ['', '', ''];
      users.forEach((user) => {
        const premio = premi.find(p => p.user_id === user.id);
        const importo = premio?.importo || 0;
        // Colonne: IMPORTO PREMIO (span 3) | valore | vuoto | vuoto | vuoto
        rowPremio.push('IMPORTO PREMIO', null, null, importo > 0 ? `€${importo.toFixed(2)}` : null, null, null, null);
      });
      excelData.push(rowPremio);

      // === RIGA IMPORTO TRASFERTE (etichetta + valore sotto ogni utente) ===
      const rowTrasferte: (string | number | null)[] = ['', '', ''];
      users.forEach((user, userIdx) => {
        const importo = totaliUtenti[userIdx].trasferte * (user.importo_trasferte || 0);
        // Colonne: IMPORTO TRASFERTE (span 3) | valore | vuoto | vuoto | vuoto
        rowTrasferte.push('IMPORTO TRASFERTE', null, null, importo > 0 ? `€${importo.toFixed(2)}` : null, null, null, null);
      });
      excelData.push(rowTrasferte);

      // === CREA WORKBOOK E WORKSHEET ===
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // === IMPOSTA LARGHEZZA COLONNE ===
      const colWidths: { wch: number }[] = [
        { wch: 4 },  // Giorno numero
        { wch: 8 },  // Giorno settimana / TOTALI
        { wch: 5 },  // FEST
      ];
      users.forEach(() => {
        colWidths.push(
          { wch: 10 },  // ORARIO / IMPORTO PREMIO label
          { wch: 8 },  // STR/SUP
          { wch: 8 },  // MAL
          { wch: 12 },  // FER / importo valore
          { wch: 8 },  // PER
          { wch: 8 },  // L104
          { wch: 4 }   // TR
        );
      });
      ws['!cols'] = colWidths;

      // === MERGE CELLE per nomi, cognomi e righe importi ===
      const merges: XLSX.Range[] = [];
      const rowIdxTotali = 3 + numGiorni; // riga 0=Nome, 1=Cognome, 2=Headers, 3...=giorni
      const rowIdxPremio = rowIdxTotali + 2; // dopo TOTALI e riga vuota
      const rowIdxTrasferte = rowIdxPremio + 1;

      users.forEach((_, userIdx) => {
        const startCol = FIXED_COLS + userIdx * COLS_PER_USER;
        const endCol = startCol + COLS_PER_USER - 1;
        // Merge Nome (riga 0)
        merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: endCol } });
        // Merge Cognome (riga 1)
        merges.push({ s: { r: 1, c: startCol }, e: { r: 1, c: endCol } });
        // Merge IMPORTO PREMIO label (prime 3 colonne del blocco utente)
        merges.push({ s: { r: rowIdxPremio, c: startCol }, e: { r: rowIdxPremio, c: startCol + 2 } });
        // Merge IMPORTO TRASFERTE label (prime 3 colonne del blocco utente)
        merges.push({ s: { r: rowIdxTrasferte, c: startCol }, e: { r: rowIdxTrasferte, c: startCol + 2 } });
      });
      ws['!merges'] = merges;

      // === AGGIUNGI WORKSHEET AL WORKBOOK ===
      XLSX.utils.book_append_sheet(wb, ws, `Presenze ${MESI_ITALIANI[mese - 1]}`);

      // === SALVA FILE ===
      const filename = `Presenze_${MESI_ITALIANI[mese - 1]}_${anno}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast('Excel esportato con successo', 'success');
    } catch (error) {
      console.error('Errore export Excel:', error);
      showToast('Errore durante l\'esportazione', 'error');
    }
  }

  // Export PDF - Un dipendente per pagina
  function handleExportPDF() {
    try {
      const giorni = getGiorniMese(anno, mese);
      const giorniSettimana = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

      // Crea documento PDF in formato A4 portrait
      const doc = new jsPDF('portrait', 'mm', 'a4');

      users.forEach((user, userIdx) => {
        // Aggiungi nuova pagina per ogni utente (tranne il primo)
        if (userIdx > 0) {
          doc.addPage();
        }

        // === INTESTAZIONE ===
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${MESI_ITALIANI[mese - 1].toUpperCase()} ${anno}`, 14, 15);

        doc.setFontSize(12);
        doc.text(`${user.nome} ${user.cognome}`, 14, 22);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const ruoloText = user.ruolo === 'amministratore' ? 'Amministratore' :
                         user.ruolo === 'dipendente' ? 'Dipendente' : 'Collaboratore';
        doc.text(ruoloText, 14, 28);

        // === CALCOLA TOTALI PER QUESTO UTENTE ===
        let totaleOreOrdinarie = 0;
        let totaleStraordinari = 0;
        let totaleMalattia = 0;
        let totaleFerie = 0;
        let totalePermessi = 0;
        let totaleLegge104 = 0;
        let totaleTrasferte = 0;

        // === PREPARA DATI TABELLA ===
        const tableData: (string | number)[][] = [];

        giorni.forEach((giorno) => {
          const dataISO = toISODate(giorno);
          const dayOfWeek = giorniSettimana[giorno.getDay()];
          const dayNum = giorno.getDate();

          // Verifica festivo per sede utente
          const festivoUtente = festivi.find(f =>
            f.data === dataISO &&
            (f.sede === null || f.sede === user.sede)
          );
          const isFestivo = festivoUtente?.tipo === 'festivo';
          const isSemifestivo = festivoUtente?.tipo === 'semifestivo';

          const presenza = presenze.find(
            p => p.user_id === user.id && p.data === dataISO
          );

          let orario = '-';
          let strSup = '';
          let mal = '';
          let fer = '';
          let per = '';
          let l104 = '';
          let tr = '';

          if (presenza) {
            const oreTotali = presenza.ore_totali || 0;
            const straordinari = presenza.straordinari || 0;
            const malattia = presenza.malattia || 0;
            const ferie = presenza.ferie || 0;
            const permessi = presenza.permessi || 0;
            const legge104 = presenza.legge_104 || 0;
            const trasferta = presenza.trasferta ? 1 : 0;

            // Ore ordinarie = ore totali - straordinari (come nella griglia web)
            const oreOrdinarie = oreTotali - straordinari;

            // Accumula totali
            totaleOreOrdinarie += oreOrdinarie;
            totaleStraordinari += straordinari;
            totaleMalattia += malattia;
            totaleFerie += ferie;
            totalePermessi += permessi;
            totaleLegge104 += legge104;
            totaleTrasferte += trasferta;

            orario = oreOrdinarie > 0 ? formatOreTotali(oreOrdinarie) : '-';
            strSup = straordinari > 0 ? formatOreTotali(straordinari) : '';
            mal = malattia > 0 ? formatOreTotali(malattia) : '';
            fer = ferie > 0 ? formatOreTotali(ferie) : '';
            per = permessi > 0 ? formatOreTotali(permessi) : '';
            l104 = legge104 > 0 ? formatOreTotali(legge104) : '';
            tr = trasferta > 0 ? '1' : '';
          }

          tableData.push([
            dayNum,
            dayOfWeek,
            isFestivo ? 'FEST' : (isSemifestivo ? 'SEMI' : ''),
            orario,
            strSup,
            mal,
            fer,
            per,
            l104,
            tr
          ]);
        });

        // === RIGA TOTALI ===
        tableData.push([
          '',
          'TOTALI',
          '',
          formatOreTotali(totaleOreOrdinarie),
          totaleStraordinari > 0 ? formatOreTotali(totaleStraordinari) : '',
          totaleMalattia > 0 ? formatOreTotali(totaleMalattia) : '',
          totaleFerie > 0 ? formatOreTotali(totaleFerie) : '',
          totalePermessi > 0 ? formatOreTotali(totalePermessi) : '',
          totaleLegge104 > 0 ? formatOreTotali(totaleLegge104) : '',
          totaleTrasferte > 0 ? totaleTrasferte.toString() : ''
        ]);

        // === GENERA TABELLA ===
        autoTable(doc, {
          startY: 32,
          head: [['', '', '', 'ORARIO', 'STR/SUP', 'MAL', 'FER', 'PER', 'L104', 'TR']],
          body: tableData,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 1.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [30, 64, 175], // primary color
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, // Giorno numero
            1: { cellWidth: 16, halign: 'center' }, // Giorno settimana / TOTALI
            2: { cellWidth: 12, halign: 'center', textColor: [0, 128, 0] }, // FEST (verde)
            3: { cellWidth: 18, halign: 'center' }, // ORARIO
            4: { cellWidth: 18, halign: 'center' }, // STR/SUP
            5: { cellWidth: 18, halign: 'center' }, // MAL
            6: { cellWidth: 18, halign: 'center' }, // FER
            7: { cellWidth: 18, halign: 'center' }, // PER
            8: { cellWidth: 18, halign: 'center' }, // L104
            9: { cellWidth: 10, halign: 'center' }, // TR
          },
          didParseCell: function(data) {
            // Testo sempre nero
            data.cell.styles.textColor = [0, 0, 0];
            // Evidenzia riga TOTALI
            if (data.row.index === tableData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 240, 240];
            }
            // Colora weekend (sab, dom)
            const rawRow = data.row.raw as string[];
            const weekday = rawRow?.[1];
            if ((weekday === 'sab' || weekday === 'dom') && data.row.index < tableData.length - 1) {
              data.cell.styles.fillColor = [255, 245, 230]; // arancione chiaro
            }
            // Colora festivi
            const festivo = rawRow?.[2];
            if (festivo === 'FEST' && data.row.index < tableData.length - 1) {
              data.cell.styles.fillColor = [255, 230, 230]; // rosso chiaro
            }
            // Colora giorni lavorativi con presenza
            const orario = rawRow?.[3];
            if (orario && orario !== '-' && weekday !== 'sab' && weekday !== 'dom' && festivo !== 'FEST' && data.row.index < tableData.length - 1) {
              data.cell.styles.fillColor = [230, 255, 230]; // verde chiaro
            }
          },
        });

        // === IMPORTI IN FONDO ===
        const finalY = (doc as any).lastAutoTable.finalY + 5;

        // Premio
        const premio = premi.find(p => p.user_id === user.id);
        const importoPremio = premio?.importo || 0;

        // Trasferte
        const importoTrasferte = totaleTrasferte * (user.importo_trasferte || 0);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');

        if (importoPremio > 0) {
          doc.text(`IMPORTO PREMIO: €${importoPremio.toFixed(2)}`, 14, finalY);
        }

        if (importoTrasferte > 0) {
          doc.text(`IMPORTO TRASFERTE: €${importoTrasferte.toFixed(2)}`, 14, finalY + (importoPremio > 0 ? 5 : 0));
        }
      });

      // === SALVA PDF ===
      const filename = `Presenze_${MESI_ITALIANI[mese - 1]}_${anno}.pdf`;
      doc.save(filename);

      showToast('PDF esportato con successo', 'success');
    } catch (error) {
      console.error('Errore export PDF:', error);
      showToast('Errore durante l\'esportazione PDF', 'error');
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
          <button onClick={handleExportPDF} className="btn-outline text-sm py-2 px-3 flex items-center gap-2" title="Esporta presenze in PDF (1 dipendente per pagina)">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Esporta PDF</span>
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
        premi={premi}
        onCellClick={handleCellClick}
        onPremioClick={handleOpenPremioModal}
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

      {/* Modal inserimento premio */}
      {selectedUserForPremio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Premio per {selectedUserForPremio.nome} {selectedUserForPremio.cognome}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {MESI_ITALIANI[mese - 1]} {anno}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Importo Premio (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={premioInput}
                onChange={(e) => setPremioInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedUserForPremio(null);
                  setPremioInput('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                disabled={savingPremio}
              >
                Annulla
              </button>
              <button
                onClick={handleSavePremio}
                disabled={savingPremio}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-md disabled:opacity-50"
              >
                {savingPremio ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
