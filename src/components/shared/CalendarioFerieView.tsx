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
  userId: string;
  nome: string;
  cognome: string;
  email: string;
  data: string;
  ore: number;
  validate: boolean;
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

  const supabase = createClient();
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, [anno, mese, userId]);

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) setCurrentUser(data as User);
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

      // Mappa le ferie con i nomi utente e stato validazione
      const ferieList: FerieUtente[] = (presenzeData || []).map((p: Presenza) => {
        const user = usersData.find((u: User) => u.id === p.user_id);
        return {
          presenzaId: p.id,
          userId: p.user_id,
          nome: user?.nome || '',
          cognome: user?.cognome || '',
          email: user?.email || '',
          data: p.data,
          ore: p.ferie,
          validate: p.ferie_validate || false,
        };
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

  // Valida una ferie (approva)
  async function handleApprova(ferie: FerieUtente) {
    if (ferie.validate) return; // Già validata

    setValidating(ferie.presenzaId);
    try {
      // Usa API endpoint con admin client per bypassare RLS
      const response = await fetch('/api/ferie', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenzaId: ferie.presenzaId,
          action: 'approve',
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Aggiorna lo stato locale
      setFerieUtenti(prev =>
        prev.map(f =>
          f.presenzaId === ferie.presenzaId
            ? { ...f, validate: true }
            : f
        )
      );

      // Invia email di notifica
      try {
        await fetch('/api/ferie/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'approved',
            nome: ferie.nome,
            cognome: ferie.cognome,
            email: ferie.email,
            giorniFerie: [{ data: ferie.data, ore: ferie.ore }],
          }),
        });
      } catch (emailError) {
        console.error('Errore invio email approvazione:', emailError);
      }

      showToast('Ferie approvate con successo', 'success');
    } catch (error) {
      console.error('Errore approvazione ferie:', error);
      showToast('Errore durante l\'approvazione', 'error');
    } finally {
      setValidating(null);
    }
  }

  // Respingi una ferie (cancella le ferie impostando ferie=0)
  async function handleRespingi(ferie: FerieUtente) {
    setValidating(ferie.presenzaId);
    try {
      // Usa API endpoint con admin client per bypassare RLS
      // Imposta ferie=0 per rimuovere le ferie dal calendario
      const response = await fetch('/api/ferie', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenzaId: ferie.presenzaId,
          action: 'reject',
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // Rimuovi dalla lista locale (ferie=0 quindi non appare più)
      setFerieUtenti(prev =>
        prev.filter(f => f.presenzaId !== ferie.presenzaId)
      );

      // Invia email di notifica
      try {
        await fetch('/api/ferie/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rejected',
            nome: ferie.nome,
            cognome: ferie.cognome,
            email: ferie.email,
            giorniFerie: [{ data: ferie.data, ore: ferie.ore }],
          }),
        });
      } catch (emailError) {
        console.error('Errore invio email respinta:', emailError);
      }

      showToast('Ferie respinte e rimosse', 'success');
    } catch (error) {
      console.error('Errore respinta ferie:', error);
      showToast('Errore durante la respinta', 'error');
    } finally {
      setValidating(null);
    }
  }

  // Richiedi validazione ferie (utente)
  async function handleRichiestaValidazione() {
    if (!currentUser) {
      showToast('Errore: utente non trovato', 'error');
      return;
    }

    // Trova le ferie dell'utente corrente non validate
    const ferieDaValidare = ferieUtenti.filter(
      f => f.userId === currentUser.id && !f.validate
    );

    if (ferieDaValidare.length === 0) {
      showToast('Non hai ferie da validare questo mese', 'info');
      return;
    }

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
          giorniFerie: ferieDaValidare.map(f => ({ data: f.data, ore: f.ore })),
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

  // Renderizza singola ferie con pulsanti validazione
  function renderFerieItem(f: FerieUtente, inModal: boolean = false) {
    const isProcessing = validating === f.presenzaId;

    return (
      <div
        key={f.presenzaId}
        className={`text-xs px-1 py-0.5 rounded flex items-center justify-between gap-1 ${
          f.validate
            ? 'bg-green-200 text-green-900'
            : 'bg-amber-200 text-amber-900'
        } ${inModal ? 'py-2 px-3 text-sm' : 'truncate'}`}
      >
        <span className={inModal ? '' : 'truncate'}>
          {f.cognome} {f.nome[0]}. {f.ore}h
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
                {/* Ferie da validare: cerchio per approvare, X per respingere */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApprova(f);
                  }}
                  className="p-0.5 rounded hover:bg-amber-300 text-amber-700"
                  title="Approva ferie"
                >
                  <Circle className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRespingi(f);
                  }}
                  className="p-0.5 rounded hover:bg-red-200 text-red-600"
                  title="Respingi ferie"
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

  // Calcola se ci sono ferie da validare per l'utente corrente
  const ferieDaValidareUtente = currentUser
    ? ferieUtenti.filter(f => f.userId === currentUser.id && !f.validate)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con navigazione */}
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

        <div className="flex items-center gap-4 flex-wrap">
          {/* Tasto richiesta validazione */}
          {ferieDaValidareUtente.length > 0 && (
            <button
              onClick={handleRichiestaValidazione}
              disabled={sendingRequest}
              className="btn-primary flex items-center gap-2"
            >
              {sendingRequest ? (
                <LoadingSpinner className="h-4 w-4" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Richiedi Validazione ({ferieDaValidareUtente.length})
            </button>
          )}

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
              <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
              <span>Ferie (da validare)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span>Ferie (validate)</span>
            </div>
          </div>
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

      {/* Modale ferie giorno */}
      {modalGiorno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setModalGiorno(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Ferie del {new Date(modalGiorno).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
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

        {/* Ferie del mese */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            Ferie del mese
          </h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {/* Mostra ferie raggruppate per utente (sia admin che dipendente) */}
            {users
              .filter(u => ferieUtenti.some(f => f.userId === u.id))
              .map(u => {
                const ferieUser = ferieUtenti.filter(f => f.userId === u.id);
                const totaleOre = ferieUser.reduce((acc, f) => acc + f.ore, 0);
                const tutteValidate = ferieUser.every(f => f.validate);
                const nessunaValidata = ferieUser.every(f => !f.validate);
                return (
                  <div key={u.id} className="text-sm flex justify-between items-center">
                    <span className="text-gray-600">{u.cognome} {u.nome[0]}.</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${tutteValidate ? 'text-green-700' : 'text-amber-700'}`}>
                        {totaleOre}h ({ferieUser.length}gg)
                      </span>
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
              <p className="text-sm text-gray-500">Nessuna ferie questo mese</p>
            )}
          </div>
          {ferieUtenti.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
              <div className="text-sm font-semibold flex justify-between">
                <span>Totale ore ferie:</span>
                <span className="text-gray-700">
                  {ferieUtenti.reduce((acc, f) => acc + f.ore, 0)}h
                </span>
              </div>
              <div className="text-xs flex justify-between text-gray-500">
                <span>Validate:</span>
                <span className="text-green-600">
                  {ferieUtenti.filter(f => f.validate).reduce((acc, f) => acc + f.ore, 0)}h
                </span>
              </div>
              <div className="text-xs flex justify-between text-gray-500">
                <span>Da validare:</span>
                <span className="text-amber-600">
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
