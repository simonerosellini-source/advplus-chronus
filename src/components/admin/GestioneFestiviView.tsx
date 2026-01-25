'use client';

// Vista Gestione Festività
import { useState, useEffect } from 'react';
import { Plus, Calendar, Trash2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner, TableSkeleton } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { ModalFestivo } from './ModalFestivo';
import { formatDateIT } from '@/lib/utils/date';
import { generaFestiviAnno } from '@/lib/utils/festivi';
import type { GiornoFestivo } from '@/types/database.types';

export function GestioneFestiviView() {
  const [loading, setLoading] = useState(true);
  const [festivi, setFestivi] = useState<GiornoFestivo[]>([]);
  const [selectedAnno, setSelectedAnno] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatingYear, setGeneratingYear] = useState<number | null>(null);

  const { showToast } = useToast();
  const supabase = createClient();

  // Carica festività
  useEffect(() => {
    loadFestivi();
  }, [selectedAnno]);

  async function loadFestivi() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('giorni_festivi')
        .select('*')
        .eq('anno', selectedAnno)
        .order('data', { ascending: true });

      if (error) throw error;
      setFestivi(data || []);
    } catch (error: any) {
      console.error('Errore caricamento festività:', error);
      showToast('Errore durante il caricamento delle festività', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneraAnno(anno: number) {
    if (
      !confirm(
        `Vuoi generare automaticamente tutte le festività predefinite per l'anno ${anno}?`
      )
    ) {
      return;
    }

    setGeneratingYear(anno);
    try {
      const festiviAnno = generaFestiviAnno(anno);

      // Inserisci tutte le festività (globali, valide per tutte le sedi)
      const { error } = await supabase.from('giorni_festivi').insert(
        festiviAnno.map((f) => ({
          data: f.data,
          nome: f.nome,
          tipo: f.tipo,
          anno,
          sede: null, // Festività globale valida per tutte le sedi
        })) as any
      );

      if (error) throw error;

      showToast(`Festività generate per l'anno ${anno}`, 'success');
      if (anno === selectedAnno) {
        loadFestivi();
      }
    } catch (error: any) {
      console.error('Errore generazione festività:', error);
      showToast(error.message || 'Errore durante la generazione', 'error');
    } finally {
      setGeneratingYear(null);
    }
  }

  async function handleDeleteFestivo(festivo: GiornoFestivo) {
    if (!confirm(`Sei sicuro di voler eliminare "${festivo.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('giorni_festivi')
        .delete()
        .eq('id', festivo.id);

      if (error) throw error;

      showToast('Festività eliminata', 'success');
      loadFestivi();
    } catch (error: any) {
      console.error('Errore eliminazione festività:', error);
      showToast(error.message || 'Errore durante l\'eliminazione', 'error');
    }
  }

  function handleModalClose() {
    setIsModalOpen(false);
    loadFestivi();
  }

  const anni = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  if (loading) {
    return <TableSkeleton rows={10} cols={4} />;
  }

  const festiviCount = festivi.filter((f) => f.tipo === 'festivo').length;
  const semifestiviCount = festivi.filter((f) => f.tipo === 'semifestivo').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">Calendario Festività</h2>
          <p className="text-gray-600 text-sm mt-1">
            {festiviCount} giorni festivi, {semifestiviCount} giorni semifestivi
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Aggiungi Festività
        </button>
      </div>

      {/* Selettore anno e azioni */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Anno:</label>
            <select
              value={selectedAnno}
              onChange={(e) => setSelectedAnno(Number(e.target.value))}
              className="input w-32"
            >
              {anni.map((anno) => (
                <option key={anno} value={anno}>
                  {anno}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleGeneraAnno(selectedAnno)}
            disabled={generatingYear === selectedAnno}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {generatingYear === selectedAnno ? (
              <>
                <LoadingSpinner className="h-4 w-4" />
                Generazione...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Genera Festività Anno {selectedAnno}
              </>
            )}
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-3">
          La funzione &quot;Genera Festività Anno&quot; crea automaticamente tutte le festività predefinite
          (Art. 31) incluse Pasqua e Venerdì Santo
        </p>
      </div>

      {/* Lista festività */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ore Lavorative
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {festivi.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Nessuna festività configurata per l&apos;anno {selectedAnno}
                    </p>
                    <button
                      onClick={() => handleGeneraAnno(selectedAnno)}
                      className="btn-secondary mt-4 text-sm"
                    >
                      Genera Festività Predefinite
                    </button>
                  </td>
                </tr>
              ) : (
                festivi.map((festivo) => (
                  <tr key={festivo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatDateIT(festivo.data)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{festivo.nome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={festivo.tipo === 'festivo' ? 'danger' : 'warning'}>
                        {festivo.tipo === 'festivo' ? 'Festivo' : 'Semifestivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {festivo.tipo === 'festivo' ? '0 ore' : '4 ore (09:00-13:00)'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteFestivo(festivo)}
                        className="text-red-600 hover:text-red-800"
                        title="Elimina"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal aggiunta festività */}
      {isModalOpen && <ModalFestivo onClose={handleModalClose} />}
    </div>
  );
}
