'use client';

// Vista Presenze Personali per dipendenti/collaboratori
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { ModalPresenza } from '@/components/admin/ModalPresenza';
import {
  getGiorniMese,
  MESI_ITALIANI,
  formatTime,
  formatDateIT,
  toISODate,
  isFuturo,
  formatOreTotali,
} from '@/lib/utils/date';
import type { User, Presenza, GiornoFestivo, GiornoCalendario } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';

interface PresenzePersonaliProps {
  userId: string;
}

export function PresenzePersonali({ userId }: PresenzePersonaliProps) {
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [mese, setMese] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [presenze, setPresenze] = useState<Presenza[]>([]);
  const [festivi, setFestivi] = useState<GiornoFestivo[]>([]);
  const [selectedPresenza, setSelectedPresenza] = useState<{
    userId: string;
    data: string;
    presenza?: Presenza;
  } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);

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
      // Carica presenze del mese
      const primoGiorno = `${anno}-${String(mese).padStart(2, '0')}-01`;
      const ultimoGiorno = new Date(anno, mese, 0);
      const ultimoGiornoStr = `${anno}-${String(mese).padStart(2, '0')}-${ultimoGiorno.getDate()}`;

      const { data: presenzeData, error: presenzeError } = await supabase
        .from('presenze')
        .select('*')
        .eq('user_id', userId)
        .gte('data', primoGiorno)
        .lte('data', ultimoGiornoStr);

      if (presenzeError) throw presenzeError;

      // Carica sede dell'utente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('sede')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Carica festività dell'anno
      // Include festività globali (sede = null) e festività della sede dell'utente
      const userSede = (userData as Pick<User, 'sede'>).sede;

      // Debug: log per verificare cosa viene caricato
      console.log('Caricamento festività per anno:', anno, 'sede utente:', userSede);

      // Filtra per sede: include festività globali (sede IS NULL) e festività della sede utente
      const sedeFilter = userSede ? `sede.is.null,sede.eq.${userSede}` : 'sede.is.null';
      const { data: festiviData, error: festiviError } = await supabase
        .from('giorni_festivi')
        .select('*')
        .eq('anno', anno)
        .or(sedeFilter)
        .order('data', { ascending: true });

      if (festiviError) throw festiviError;

      console.log('Festività caricate:', festiviData?.length, festiviData);

      setPresenze(presenzeData || []);
      setFestivi(festiviData || []);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
      showToast('Errore durante il caricamento dei dati', 'error');
    } finally {
      setLoading(false);
    }
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

  // Gestione click su cella per modificare presenza
  function handleCellClick(data: string, presenza?: Presenza) {
    setSelectedPresenza({ userId, data, presenza });
  }

  // Salvataggio presenza
  async function handleSavePresenza() {
    await loadData();
    setSelectedPresenza(null);
  }

  // Invia conferma inserimento orari all'amministrazione
  async function handleSendConfirmation() {
    setSendingConfirmation(true);
    try {
      const response = await fetch('/api/email/send-hours-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mese, anno }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Conferma inviata con successo all\'amministrazione', 'success');
      } else {
        showToast(data.error || 'Errore durante l\'invio della conferma', 'error');
      }
    } catch (error: any) {
      console.error('Errore durante l\'invio della conferma:', error);
      showToast('Errore durante l\'invio della conferma', 'error');
    } finally {
      setSendingConfirmation(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner className="h-12 w-12 text-primary" />
      </div>
    );
  }

  const giorniMese = getGiorniMese(anno, mese);
  const festiviMap = new Map(festivi.map((f) => [f.data, f]));
  const presenzeMap = new Map(presenze.map((p) => [p.data, p]));

  // Debug: verifica formato date
  console.log('Mese visualizzato:', mese, 'Anno:', anno);
  console.log('festiviMap keys:', Array.from(festiviMap.keys()));
  console.log('Esempio data dal calendario:', giorniMese.length > 0 ? toISODate(giorniMese[0]) : 'N/A');

  // Prepara giorni con dati
  const giorni: GiornoCalendario[] = giorniMese.map((dataObj) => {
    const data = toISODate(dataObj);
    const festivo = festiviMap.get(data);
    const presenza = presenzeMap.get(data);
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

  // Calcola statistiche
  const oreTotaliMese = presenze.reduce((sum, p) => sum + (p.ore_totali || 0), 0);
  const giorniPresenza = presenze.filter((p) => p.ore_totali > 0).length;
  const giorniLavorativi = giorni.filter(
    (g) => {
      const dataObj = new Date(g.data);
      const isWeekend = dataObj.getDay() === 0 || dataObj.getDay() === 6;
      return g.tipo !== 'festivo' && g.tipo !== 'futuro' && !isWeekend;
    }
  ).length;
  const giorniAssenza = giorniLavorativi - giorniPresenza;
  const mediaOreGiornaliere = giorniPresenza > 0 ? oreTotaliMese / giorniPresenza : 0;

  const isCurrentMonth = anno === new Date().getFullYear() && mese === new Date().getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore Totali</p>
              <p className="text-2xl font-bold text-primary">{formatOreTotali(oreTotaliMese)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Giorni Presenza</p>
              <p className="text-2xl font-bold text-green-600">{giorniPresenza}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Giorni Assenza</p>
              <p className="text-2xl font-bold text-red-600">{giorniAssenza}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-secondary/10 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Media Ore/Giorno</p>
              <p className="text-2xl font-bold text-secondary">{formatOreTotali(mediaOreGiornaliere)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottone Conferma Inserimento */}
      <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Hai completato l&apos;inserimento degli orari?
            </h3>
            <p className="text-sm text-green-700">
              Clicca qui per inviare una conferma all&apos;amministrazione che hai inserito correttamente tutti gli orari per {MESI_ITALIANI[mese - 1]} {anno}
            </p>
          </div>
          <button
            onClick={handleSendConfirmation}
            disabled={sendingConfirmation}
            className="btn-primary flex items-center gap-2 ml-4 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingConfirmation ? (
              <>
                <LoadingSpinner className="h-5 w-5" />
                Invio in corso...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Conferma Inserimento
              </>
            )}
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="card">
        {/* Header navigazione */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="btn-outline p-2">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
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

          <button onClick={nextMonth} className="btn-outline p-2">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Griglia calendario */}
        <div className="grid grid-cols-7 gap-2">
          {/* Header giorni settimana */}
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((giorno) => (
            <div
              key={giorno}
              className="text-center text-xs font-bold text-gray-600 py-2"
            >
              {giorno}
            </div>
          ))}

          {/* Celle vuote per allineamento */}
          {Array.from({ length: (giorniMese[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Giorni del mese */}
          {giorni.map((giorno) => {
            const dataObj = new Date(giorno.data);
            const isWeekend = dataObj.getDay() === 0 || dataObj.getDay() === 6;

            let bgColor = 'bg-white hover:bg-gray-50';
            if (giorno.tipo === 'festivo') bgColor = 'bg-red-50';
            else if (giorno.tipo === 'semifestivo') bgColor = 'bg-orange-50';
            else if (giorno.tipo === 'futuro') bgColor = 'bg-gray-50';
            else if (giorno.presenza) bgColor = isWeekend ? 'bg-gray-200 hover:bg-gray-300' : 'bg-green-50';
            else if (isWeekend) bgColor = 'bg-gray-100 hover:bg-gray-200';

            const borderColor =
              giorno.tipo === 'festivo'
                ? 'border-red-200'
                : giorno.tipo === 'semifestivo'
                ? 'border-orange-200'
                : isWeekend
                ? 'border-gray-300'
                : 'border-gray-200';

            const isClickable = giorno.tipo !== 'festivo';

            return (
              <div
                key={giorno.data}
                className={`${bgColor} border ${borderColor} rounded-lg p-3 min-h-[100px] relative ${
                  isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
                }`}
                onClick={() => {
                  if (isClickable) {
                    handleCellClick(giorno.data, giorno.presenza);
                  }
                }}
              >
                <div className="font-bold text-primary mb-1">{giorno.giorno}</div>

                {giorno.festivo && (
                  <div className="text-[10px] text-gray-600 mb-1">
                    {giorno.festivo.nome.substring(0, 20)}
                  </div>
                )}

                {giorno.presenza && (
                  <div className="text-xs space-y-1">
                    {giorno.presenza.ingresso_mattina && (
                      <div className="text-gray-700">
                        🌅 {formatTime(giorno.presenza.ingresso_mattina)}-
                        {formatTime(giorno.presenza.uscita_mattina)}
                      </div>
                    )}
                    {giorno.presenza.ingresso_pomeriggio && (
                      <div className="text-gray-700">
                        🌆 {formatTime(giorno.presenza.ingresso_pomeriggio)}-
                        {formatTime(giorno.presenza.uscita_pomeriggio)}
                      </div>
                    )}
                    <div className="font-bold text-primary mt-1">
                      {formatOreTotali(giorno.presenza.ore_totali)}
                    </div>

                    {/* Badge per campi aggiuntivi */}
                    {(giorno.presenza.straordinari > 0 ||
                      giorno.presenza.trasferta ||
                      giorno.presenza.malattia > 0 ||
                      giorno.presenza.legge_104 > 0 ||
                      giorno.presenza.ferie > 0) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {giorno.presenza.straordinari > 0 && (
                          <span className="bg-blue-100 text-blue-800 px-1 rounded text-[8px]">
                            STR/SUP:{giorno.presenza.straordinari}h
                          </span>
                        )}
                        {giorno.presenza.trasferta && (
                          <span className="bg-purple-100 text-purple-800 px-1 rounded text-[8px]">
                            TR
                          </span>
                        )}
                        {giorno.presenza.malattia > 0 && (
                          <span className="bg-red-100 text-red-800 px-1 rounded text-[8px]">
                            MAL:{giorno.presenza.malattia}h
                          </span>
                        )}
                        {giorno.presenza.legge_104 > 0 && (
                          <span className="bg-orange-100 text-orange-800 px-1 rounded text-[8px]">
                            L104:{giorno.presenza.legge_104}h
                          </span>
                        )}
                        {giorno.presenza.ferie > 0 && (
                          <span className="bg-green-100 text-green-800 px-1 rounded text-[8px]">
                            FER:{giorno.presenza.ferie}h
                          </span>
                        )}
                      </div>
                    )}

                    {giorno.presenza.note && (
                      <div className="text-[10px] text-gray-500 italic">
                        📝 {giorno.presenza.note.substring(0, 30)}
                      </div>
                    )}
                  </div>
                )}

                {!giorno.presenza && giorno.tipo === 'normale' && !isWeekend && (
                  <div className="text-xs text-gray-400 text-center mt-4">Assente</div>
                )}

                {!giorno.presenza && giorno.tipo === 'futuro' && (
                  <div className="text-xs text-gray-400 text-center mt-4">Click per programmare ferie</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal modifica presenza */}
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
    </div>
  );
}
