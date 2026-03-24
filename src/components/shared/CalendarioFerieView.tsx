'use client';

// Componente Calendario Ferie/Festività condiviso tra admin e dipendente
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Circle, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { getGiorniMese, MESI_ITALIANI, toISODate } from '@/lib/utils/date';
import type { GiornoFestivo, Presenza, User } from '@/types/database.types';

interface CalendarioFerieViewProps {
  userId?: string; // Se specificato, mostra solo le ferie di questo utente (modalità dipendente)
  isAdmin?: boolean; // Se true, mostra le ferie di tutti gli utenti
}

interface FerieUtente {
  presenzaId: string;
  odataPresenza: string; // ID originale della presenza per lookup
  userId: string;
  nome: string;
  cognome: string;
  email: string;
  data: string;
  ore: number;
  validate: boolean;
  tipo: 'ferie' | 'permessi';
}

interface PendingItem {
  data: string;
  ferie: number;
  permessi: number;
}

export function CalendarioFerieView({ userId, isAdmin = false }: CalendarioFerieViewProps) {
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [mese, setMese] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [festivi, setFestivi] = useState<GiornoFestivo[]>([]);
  const [ferieUtenti, setFerieUtenti] = useState<FerieUtente[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [validating, setValidating] = useState<string | null>(null);
  const [modalGiorno, setModalGiorno] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allPendingItems, setAllPendingItems] = useState<PendingItem[]>([]);

  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, [anno, mese, userId]);

  // Carica utente corrente e TUTTE le ferie/permessi pendenti
  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) {
        setCurrentUser(data as User);
        // Carica tutte le ferie/permessi pendenti dell'utente
        loadAllPending(user.id);
      }
    }
  }

  // Carica TUTTE le ferie e permessi da validare (tutti i mesi)
  async function loadAllPending(uid: string) {
    try {
      const response = await fetch(`/api/ferie/pending?userId=${uid}`);
      if (response.ok) {
        const { presenze } = await response.json();
        setAllPendingItems(presenze || []);
      }
    } catch (error) {
      console.error('Errore caricamento pending:', error);
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      // Carica festività dell'anno
      const { data: festiviData, error: festiviError } = await supabase
        .from('giorni_festivi')
        .select('*')
        .eq('anno', anno)
        .order('data', { ascending: true });

      if (festiviError) throw festiviError;

      // Usa API endpoint per caricare ferie (bypassa RLS per dipendenti)
      const response = await fetch(`/api/ferie?anno=${anno}&mese=${mese}`);
      if (!response.ok) {
        throw new Error('Errore caricamento ferie da API');
      }
      const { presenze: presenzeData, users: usersData } = await response.json();

      // Mappa le ferie E i permessi con i nomi utente e stato validazione
      const ferieList: FerieUtente[] = [];
      (presenzeData || []).forEach((p: Presenza) => {
        const user = usersData.find((u: User) => u.id === p.user_id);
        // Aggiungi ferie se > 0
        if (p.ferie > 0) {
          ferieList.push({
            presenzaId: `${p.id}-ferie`,
            odataPresenza: p.id,
            userId: p.user_id,
            nome: user?.nome || '',
            cognome: user?.cognome || '',
            email: user?.email || '',
            data: p.data,
            ore: p.ferie,
            validate: p.ferie_validate || false,
            tipo: 'ferie',
          });
        }
        // Aggiungi permessi se > 0
        if (p.permessi > 0) {
          ferieList.push({
            presenzaId: `${p.id}-permessi`,
            odataPresenza: p.id,
            userId: p.user_id,
            nome: user?.nome || '',
            cognome: user?.cognome || '',
            email: user?.email || '',
            data: p.data,
            ore: p.permessi,
            validate: p.ferie_validate || false,
            tipo: 'permessi',
          });
        }
      });

      setFestivi(festiviData || []);
      setFerieUtenti(ferieList);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Errore caricamento dati calendario:', error);
    } finally {
      setLoading(false);
    }
  }

  // Valida una ferie/permesso (approva)
  async function handleApprova(item: FerieUtente) {
    if (item.validate) return; // Già validata

    setValidating(item.presenzaId);
    try {
      // Usa API endpoint con admin client per bypassare RLS
      const response = await fetch('/api/ferie', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenzaId: item.odataPresenza,
          action: 'approve',
          tipo: item.tipo,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Aggiorna lo stato locale - approva tutti gli item con stessa presenza
      setFerieUtenti(prev =>
        prev.map(f =>
          f.odataPresenza === item.odataPresenza
            ? { ...f, validate: true }
            : f
        )
      );

      // Invia email di notifica
      const tipoLabel = item.tipo === 'permessi' ? 'Permesso approvato' : 'Ferie approvate';
      try {
        await fetch('/api/ferie/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'approved',
            nome: item.nome,
            cognome: item.cognome,
            email: item.email,
            giorniFerie: [{ data: item.data, ore: item.ore }],
          }),
        });
      } catch (emailError) {
        console.error('Errore invio email approvazione:', emailError);
      }

      showToast(`${tipoLabel} con successo`, 'success');
    } catch (error) {
      console.error('Errore approvazione:', error);
      showToast('Errore durante l\'approvazione', 'error');
    } finally {
      setValidating(null);
    }
  }

  // Respingi una ferie/permesso (cancella impostando a 0)
  async function handleRespingi(item: FerieUtente) {
    setValidating(item.presenzaId);
    try {
      // Usa API endpoint con admin client per bypassare RLS
      const response = await fetch('/api/ferie', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenzaId: item.odataPresenza,
          action: 'reject',
          tipo: item.tipo,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Rimuovi dalla lista locale solo questo item (ferie o permesso)
      setFerieUtenti(prev =>
        prev.filter(f => f.presenzaId !== item.presenzaId)
      );

      // Invia email di notifica
      try {
        await fetch('/api/ferie/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rejected',
            nome: item.nome,
            cognome: item.cognome,
            email: item.email,
            giorniFerie: [{ data: item.data, ore: item.ore }],
          }),
        });
      } catch (emailError) {
        console.error('Errore invio email respinta:', emailError);
      }

      const tipoLabel = item.tipo === 'permessi' ? 'Permesso respinto' : 'Ferie respinte';
      showToast(`${tipoLabel} e rimosso`, 'success');
    } catch (error) {
      console.error('Errore respinta ferie:', error);
      showToast('Errore durante la respinta', 'error');
    } finally {
      setValidating(null);
    }
  }

  // Richiedi validazione ferie e permessi (utente) - TUTTE quelle pendenti
  async function handleRichiestaValidazione() {
    if (!currentUser) {
      showToast('Errore: utente non trovato', 'error');
      return;
    }

    if (allPendingItems.length === 0) {
      showToast('Non hai ferie o permessi da validare', 'info');
      return;
    }

    // Prepara lista con ferie e permessi
    const giorniDaValidare: Array<{ data: string; ore: number; tipo: 'ferie' | 'permessi' }> = [];

    allPendingItems.forEach(p => {
      if (p.ferie > 0) {
        giorniDaValidare.push({ data: p.data, ore: p.ferie, tipo: 'ferie' });
      }
      if (p.permessi > 0) {
        giorniDaValidare.push({ data: p.data, ore: p.permessi, tipo: 'permessi' });
      }
    });

    setSendingRequest(true);
    try {
      const response = await fetch('/api/ferie/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'validation_request',
          nome: currentUser.nome,
          cognome: currentUser.cognome,
          email: currentUser.email,
          giorniFerie: giorniDaValidare,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast('Richiesta di validazione inviata con successo', 'success');
      } else {
        showToast('Errore nell\'invio della richiesta', 'error');
      }
    } catch (error) {
      console.error('Errore richiesta validazione:', error);
      showToast('Errore nell\'invio della richiesta', 'error');
    } finally {
      setSendingRequest(false);
    }
  }

  // Navigazione mesi
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

  // Genera array giorni del mese con padding per allineamento settimana
  function getCalendarDays() {
    const giorni = getGiorniMese(anno, mese);
    const firstDay = giorni[0].getDay(); // 0 = domenica
    const startPadding = firstDay === 0 ? 6 : firstDay - 1; // Lunedì = 0

    const calendarDays: (Date | null)[] = [];

    // Padding iniziale
    for (let i = 0; i < startPadding; i++) {
      calendarDays.push(null);
    }

    // Giorni del mese
    giorni.forEach(g => calendarDays.push(g));

    // Padding finale per completare l'ultima settimana
    while (calendarDays.length % 7 !== 0) {
      calendarDays.push(null);
    }

    return calendarDays;
  }

  // Ottieni info festivo per una data
  function getFestivo(data: string): GiornoFestivo | undefined {
    return festivi.find(f => f.data === data);
  }

  // Ottieni ferie per una data
  function getFerieGiorno(data: string): FerieUtente[] {
    return ferieUtenti.filter(f => f.data === data);
  }

  // Determina classe CSS per il giorno
  function getDayClassName(data: string, giorno: Date): string {
    const festivo = getFestivo(data);
    const isWeekend = giorno.getDay() === 0 || giorno.getDay() === 6;
    const ferie = getFerieGiorno(data);
    const oggi = new Date();
    const isOggi = toISODate(oggi) === data;

    let classes = 'min-h-[100px] p-2 border border-gray-200 transition-colors ';

    if (isOggi) {
      classes += 'ring-2 ring-primary ring-inset ';
    }

    if (festivo?.tipo === 'festivo') {
      classes += 'bg-red-100 ';
    } else if (festivo?.tipo === 'semifestivo') {
      classes += 'bg-orange-100 ';
    } else if (isWeekend) {
      classes += 'bg-gray-100 ';
    } else if (ferie.length > 0) {
      // Colore basato sulla validazione: tutte validate = verde, altrimenti ambra
      const tutteValidate = ferie.every(f => f.validate);
      classes += tutteValidate ? 'bg-green-50 ' : 'bg-amber-50 ';
    } else {
      classes += 'bg-white hover:bg-gray-50 ';
    }

    return classes;
  }

  // Renderizza singola ferie/permesso con pulsanti validazione
  function renderFerieItem(f: FerieUtente, inModal: boolean = false) {
    const isProcessing = validating === f.presenzaId;
    const isPermesso = f.tipo === 'permessi';

    // Colori: validato = verde, permessi = blu, ferie = ambra
    const getColorClasses = () => {
      if (f.validate) return 'bg-green-200 text-green-900';
      return isPermesso ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900';
    };

    const getHoverClasses = () => {
      if (f.validate) return 'hover:bg-green-300';
      return isPermesso ? 'hover:bg-blue-300' : 'hover:bg-amber-300';
    };

    const getButtonClasses = () => {
      if (f.validate) return 'text-green-700';
      return isPermesso ? 'text-blue-700' : 'text-amber-700';
    };

    return (
      <div
        key={f.presenzaId}
        className={`text-xs px-1 py-0.5 rounded flex items-center justify-between gap-1 ${getColorClasses()} ${inModal ? 'py-2 px-3 text-sm' : 'truncate'}`}
      >
        <span className={inModal ? '' : 'truncate'}>
          {isPermesso ? 'P: ' : ''}{f.cognome} {f.nome[0]}. {f.ore}h
        </span>
        {isAdmin && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {isProcessing ? (
              <LoadingSpinner className="h-3 w-3" />
            ) : f.validate ? (
              <>
                {/* Ferie validata: mostra spunta verde e X per annullare */}
                <span className="text-green-600" title="Validata">
                  <Check className="h-3 w-3" />
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRespingi(f);
                  }}
                  className="p-0.5 rounded hover:bg-green-300 text-green-700"
                  title="Rimuovi validazione"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                {/* Ferie/Permesso da validare: cerchio per approvare, X per respingere */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprova(f);
                  }}
                  className={`p-0.5 rounded ${getHoverClasses()} ${getButtonClasses()}`}
                  title={isPermesso ? 'Approva permesso' : 'Approva ferie'}
                >
                  <Circle className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRespingi(f);
                  }}
                  className="p-0.5 rounded hover:bg-red-200 text-red-600"
                  title={isPermesso ? 'Respingi permesso' : 'Respingi ferie'}
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        )}
        {!isAdmin && f.validate && (
          <span className="text-green-600 flex-shrink-0" title="Validata">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>
    );
  }

  const isCurrentMonth = anno === new Date().getFullYear() && mese === new Date().getMonth() + 1;
  const calendarDays = getCalendarDays();
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Calcola totale ferie e permessi pendenti (tutti i mesi)
  const totalePendingFerie = allPendingItems.filter(p => p.ferie > 0).length;
  const totalePendingPermessi = allPendingItems.filter(p => p.permessi > 0).length;
  const totalePending = totalePendingFerie + totalePendingPermessi;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con navigazione e tasto validazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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

        {/* Tasto richiesta validazione */}
        {totalePending > 0 && (
          <div className="flex flex-col items-end">
            <button
              onClick={handleRichiestaValidazione}
              disabled={sendingRequest}
              className="btn-primary flex items-center gap-2 shadow-lg"
            >
              {sendingRequest ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Richiedi Validazione ({totalePending})
            </button>
            {(totalePendingFerie > 0 || totalePendingPermessi > 0) && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {totalePendingFerie > 0 && <span>{totalePendingFerie} ferie</span>}
                {totalePendingFerie > 0 && totalePendingPermessi > 0 && <span> + </span>}
                {totalePendingPermessi > 0 && <span>{totalePendingPermessi} permessi</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
          <span>Festivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded" />
          <span>Semifestivo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-200 border border-amber-400 rounded" />
          <span>Ferie</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded" />
          <span>Permessi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border border-green-400 rounded" />
          <span>Validato</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header giorni settimana */}
        <div className="grid grid-cols-7 bg-primary text-white">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Griglia giorni */}
        <div className="grid grid-cols-7">
          {calendarDays.map((giorno, idx) => {
            if (!giorno) {
              return <div key={`empty-${idx}`} className="min-h-[100px] bg-gray-50 border border-gray-200" />;
            }

            const data = toISODate(giorno);
            const festivo = getFestivo(data);
            const ferie = getFerieGiorno(data);

            return (
              <div key={data} className={getDayClassName(data, giorno)}>
                {/* Numero giorno */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    giorno.getDay() === 0 || giorno.getDay() === 6 ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {giorno.getDate()}
                  </span>
                </div>

                {/* Festivo */}
                {festivo && (
                  <div className={`text-xs px-1 py-0.5 rounded mb-1 ${
                    festivo.tipo === 'festivo'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-orange-200 text-orange-800'
                  }`}>
                    {festivo.nome.length > 12 ? festivo.nome.substring(0, 12) + '...' : festivo.nome}
                  </div>
                )}

                {/* Ferie utenti */}
                {ferie.length > 0 && (
                  <div className="space-y-1">
                    {ferie.slice(0, 3).map((f) => renderFerieItem(f))}
                    {ferie.length > 3 && (
                      <button
                        onClick={() => setModalGiorno(data)}
                        className="text-xs text-gray-600 hover:text-primary hover:underline cursor-pointer"
                      >
                        +{ferie.length - 3} altri
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modale ferie/permessi giorno */}
      {modalGiorno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalGiorno(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Ferie e Permessi del {new Date(modalGiorno).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setModalGiorno(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
              {getFerieGiorno(modalGiorno).map((f) => renderFerieItem(f, true))}
            </div>
          </div>
        </div>
      )}

      {/* Riepilogo mensile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Festivi del mese */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            Festivi del mese
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {festivi
              .filter(f => f.tipo === 'festivo' && f.data.startsWith(`${anno}-${String(mese).padStart(2, '0')}`))
              .map(f => (
                <div key={f.id} className="text-sm flex justify-between">
                  <span className="text-gray-600">
                    {new Date(f.data).getDate()} {MESI_ITALIANI[mese - 1].substring(0, 3)}
                  </span>
                  <span className="font-medium text-gray-900">{f.nome}</span>
                </div>
              ))}
            {festivi.filter(f => f.tipo === 'festivo' && f.data.startsWith(`${anno}-${String(mese).padStart(2, '0')}`)).length === 0 && (
              <p className="text-sm text-gray-500">Nessun festivo questo mese</p>
            )}
          </div>
        </div>

        {/* Semifestivi del mese */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            Semifestivi del mese
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {festivi
              .filter(f => f.tipo === 'semifestivo' && f.data.startsWith(`${anno}-${String(mese).padStart(2, '0')}`))
              .map(f => (
                <div key={f.id} className="text-sm flex justify-between">
                  <span className="text-gray-600">
                    {new Date(f.data).getDate()} {MESI_ITALIANI[mese - 1].substring(0, 3)}
                  </span>
                  <span className="font-medium text-gray-900">{f.nome}</span>
                </div>
              ))}
            {festivi.filter(f => f.tipo === 'semifestivo' && f.data.startsWith(`${anno}-${String(mese).padStart(2, '0')}`)).length === 0 && (
              <p className="text-sm text-gray-500">Nessun semifestivo questo mese</p>
            )}
          </div>
        </div>

        {/* Ferie e Permessi del mese */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-amber-500 rounded" />
              <div className="w-3 h-3 bg-blue-500 rounded" />
            </div>
            Ferie e Permessi del mese
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {/* Mostra ferie e permessi raggruppati per utente */}
            {users
              .filter(u => ferieUtenti.some(f => f.userId === u.id))
              .map(u => {
                const itemsUser = ferieUtenti.filter(f => f.userId === u.id);
                const ferieUser = itemsUser.filter(f => f.tipo === 'ferie');
                const permessiUser = itemsUser.filter(f => f.tipo === 'permessi');
                const tutteValidate = itemsUser.every(f => f.validate);
                const nessunaValidata = itemsUser.every(f => !f.validate);
                return (
                  <div key={u.id} className="text-sm flex justify-between items-center">
                    <span className="text-gray-600">{u.cognome} {u.nome[0]}.</span>
                    <div className="flex items-center gap-2">
                      {ferieUser.length > 0 && (
                        <span className="text-amber-700 font-medium">
                          F: {ferieUser.reduce((acc, f) => acc + f.ore, 0)}h
                        </span>
                      )}
                      {permessiUser.length > 0 && (
                        <span className="text-blue-700 font-medium">
                          P: {permessiUser.reduce((acc, f) => acc + f.ore, 0)}h
                        </span>
                      )}
                      {tutteValidate && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                      {!tutteValidate && !nessunaValidata && (
                        <span className="text-xs text-gray-500">parziale</span>
                      )}
                    </div>
                  </div>
                );
              })}
            {ferieUtenti.length === 0 && (
              <p className="text-sm text-gray-500">Nessuna ferie o permesso questo mese</p>
            )}
          </div>
          {ferieUtenti.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
              <div className="text-sm font-semibold flex justify-between">
                <span>Totale Ferie:</span>
                <span className="text-amber-700">
                  {ferieUtenti.filter(f => f.tipo === 'ferie').reduce((acc, f) => acc + f.ore, 0)}h
                </span>
              </div>
              <div className="text-sm font-semibold flex justify-between">
                <span>Totale Permessi:</span>
                <span className="text-blue-700">
                  {ferieUtenti.filter(f => f.tipo === 'permessi').reduce((acc, f) => acc + f.ore, 0)}h
                </span>
              </div>
              <div className="text-xs flex justify-between text-gray-500 pt-1">
                <span>Validati:</span>
                <span className="text-green-600">
                  {ferieUtenti.filter(f => f.validate).reduce((acc, f) => acc + f.ore, 0)}h
                </span>
              </div>
              <div className="text-xs flex justify-between text-gray-500">
                <span>Da validare:</span>
                <span className="text-gray-600">
                  {ferieUtenti.filter(f => !f.validate).reduce((acc, f) => acc + f.ore, 0)}h
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
