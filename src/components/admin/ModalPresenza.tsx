'use client';

// Modal per inserimento/modifica presenza
import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';
import { createClient } from '@/lib/supabase/client';
import { formatDateIT, calcolaOreTotali, formatTime } from '@/lib/utils/date';
import { presenzaSchema } from '@/lib/utils/validations';
import type { Presenza } from '@/types/database.types';
import { useToast } from '@/components/ui/Toast';
import { Trash2 } from 'lucide-react';

interface ModalPresenzaProps {
  userId: string;
  data: string;
  presenza?: Presenza;
  onClose: () => void;
  onSave: () => void;
}

export function ModalPresenza({ userId, data, presenza, onClose, onSave }: ModalPresenzaProps) {
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    ingresso_mattina: presenza?.ingresso_mattina ? formatTime(presenza.ingresso_mattina) : '',
    uscita_mattina: presenza?.uscita_mattina ? formatTime(presenza.uscita_mattina) : '',
    ingresso_pomeriggio: presenza?.ingresso_pomeriggio ? formatTime(presenza.ingresso_pomeriggio) : '',
    uscita_pomeriggio: presenza?.uscita_pomeriggio ? formatTime(presenza.uscita_pomeriggio) : '',
    note: presenza?.note || '',
    straordinari: presenza?.straordinari || 0,
    malattia: presenza?.malattia || 0,
    legge_104: presenza?.legge_104 || 0,
    ferie: presenza?.ferie || 0,
    ore_trasferte: presenza?.ore_trasferte || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useToast();
  const supabase = createClient();

  // Carica nome utente e orari di default
  useEffect(() => {
    async function loadUserData() {
      const { data } = await supabase
        .from('users')
        .select('nome, cognome, ingresso_mattina_default, uscita_mattina_default, ingresso_pomeriggio_default, uscita_pomeriggio_default')
        .eq('id', userId)
        .single() as {
          data: {
            nome: string;
            cognome: string;
            ingresso_mattina_default: string | null;
            uscita_mattina_default: string | null;
            ingresso_pomeriggio_default: string | null;
            uscita_pomeriggio_default: string | null;
          } | null
        };

      if (data) {
        setUserName(`${data.nome} ${data.cognome}`);

        // Se stiamo creando una nuova presenza (non modificando), usa gli orari di default
        if (!presenza && data) {
          setFormData(prev => ({
            ...prev,
            ingresso_mattina: data.ingresso_mattina_default ? formatTime(data.ingresso_mattina_default) : '',
            uscita_mattina: data.uscita_mattina_default ? formatTime(data.uscita_mattina_default) : '',
            ingresso_pomeriggio: data.ingresso_pomeriggio_default ? formatTime(data.ingresso_pomeriggio_default) : '',
            uscita_pomeriggio: data.uscita_pomeriggio_default ? formatTime(data.uscita_pomeriggio_default) : '',
          }));
        }
      }
    }
    loadUserData();
  }, [userId, presenza]);

  // Calcola ore totali in tempo reale (presenza + straordinari)
  const orePresenza = calcolaOreTotali(
    formData.ingresso_mattina || null,
    formData.uscita_mattina || null,
    formData.ingresso_pomeriggio || null,
    formData.uscita_pomeriggio || null
  );
  const oreTotali = orePresenza + (formData.straordinari || 0);

  // Gestione cambio campo
  function handleChange(field: string, value: string | boolean | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Pulisci errore del campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  // Salvataggio
  async function handleSave() {
    setLoading(true);
    setErrors({});

    try {
      // Prepara dati per validazione
      const dataToValidate = {
        user_id: userId,
        data,
        ingresso_mattina: formData.ingresso_mattina || null,
        uscita_mattina: formData.uscita_mattina || null,
        ingresso_pomeriggio: formData.ingresso_pomeriggio || null,
        uscita_pomeriggio: formData.uscita_pomeriggio || null,
        note: formData.note,
        straordinari: formData.straordinari,
        malattia: formData.malattia,
        legge_104: formData.legge_104,
        ferie: formData.ferie,
        ore_trasferte: formData.ore_trasferte,
      };

      // Validazione
      const validation = presenzaSchema.safeParse(dataToValidate);
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        showToast('Correggi gli errori nel form', 'error');
        setLoading(false);
        return;
      }

      // Upsert presenza
      // @ts-expect-error - TypeScript incorrectly infers upsert parameter type as never
      const { error } = await supabase.from('presenze').upsert({
        user_id: userId,
        data,
        ingresso_mattina: formData.ingresso_mattina || null,
        uscita_mattina: formData.uscita_mattina || null,
        ingresso_pomeriggio: formData.ingresso_pomeriggio || null,
        uscita_pomeriggio: formData.uscita_pomeriggio || null,
        note: formData.note || null,
        straordinari: formData.straordinari,
        malattia: formData.malattia,
        legge_104: formData.legge_104,
        ferie: formData.ferie,
        ore_trasferte: formData.ore_trasferte,
      }, { onConflict: 'user_id,data' });

      if (error) throw error;

      showToast('Presenza salvata con successo', 'success');
      onSave();
    } catch (error: any) {
      console.error('Errore salvataggio presenza:', error);
      showToast(error.message || 'Errore durante il salvataggio', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Eliminazione
  async function handleDelete() {
    if (!presenza) return;

    if (!confirm('Sei sicuro di voler eliminare questa presenza?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('presenze').delete().eq('id', presenza.id);

      if (error) throw error;

      showToast('Presenza eliminata', 'success');
      onSave();
    } catch (error: any) {
      console.error('Errore eliminazione presenza:', error);
      showToast(error.message || 'Errore durante l\'eliminazione', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Gestione Presenza" size="md">
      <div className="space-y-6">
        {/* Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Utente</p>
              <p className="font-medium text-primary">{userName}</p>
            </div>
            <div>
              <p className="text-gray-600">Data</p>
              <p className="font-medium">{formatDateIT(data)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-6">
          {/* Mattina */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Mattina</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingresso
              </label>
              <input
                type="time"
                value={formData.ingresso_mattina}
                onChange={(e) => handleChange('ingresso_mattina', e.target.value)}
                className={errors.ingresso_mattina ? 'input-error' : 'input'}
              />
              {errors.ingresso_mattina && (
                <p className="text-red-600 text-xs mt-1">{errors.ingresso_mattina}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uscita
              </label>
              <input
                type="time"
                value={formData.uscita_mattina}
                onChange={(e) => handleChange('uscita_mattina', e.target.value)}
                className={errors.uscita_mattina ? 'input-error' : 'input'}
              />
              {errors.uscita_mattina && (
                <p className="text-red-600 text-xs mt-1">{errors.uscita_mattina}</p>
              )}
            </div>
          </div>

          {/* Pomeriggio */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Pomeriggio</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingresso
              </label>
              <input
                type="time"
                value={formData.ingresso_pomeriggio}
                onChange={(e) => handleChange('ingresso_pomeriggio', e.target.value)}
                className={errors.ingresso_pomeriggio ? 'input-error' : 'input'}
              />
              {errors.ingresso_pomeriggio && (
                <p className="text-red-600 text-xs mt-1">{errors.ingresso_pomeriggio}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uscita
              </label>
              <input
                type="time"
                value={formData.uscita_pomeriggio}
                onChange={(e) => handleChange('uscita_pomeriggio', e.target.value)}
                className={errors.uscita_pomeriggio ? 'input-error' : 'input'}
              />
              {errors.uscita_pomeriggio && (
                <p className="text-red-600 text-xs mt-1">{errors.uscita_pomeriggio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <textarea
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            rows={3}
            className="input"
            placeholder="Note aggiuntive (opzionale)"
          />
        </div>

        {/* Campi aggiuntivi */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold text-gray-900">Informazioni Aggiuntive</h3>

          {/* Grid per tutti i campi numerici orari */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Straordinari (ore)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.straordinari}
                onChange={(e) => handleChange('straordinari', parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ore Trasferte
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.ore_trasferte}
                onChange={(e) => handleChange('ore_trasferte', parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Malattia (ore)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.malattia}
                onChange={(e) => handleChange('malattia', parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legge 104 (ore)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.legge_104}
                onChange={(e) => handleChange('legge_104', parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ferie (ore)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.ferie}
                onChange={(e) => handleChange('ferie', parseFloat(e.target.value) || 0)}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Ore totali */}
        <div className="bg-primary text-white rounded-lg p-4 text-center">
          <p className="text-sm opacity-90">Ore Totali</p>
          <p className="text-3xl font-bold">{oreTotali.toFixed(2)}h</p>
        </div>

        {/* Footer con azioni */}
        <ModalFooter>
          {presenza && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn-danger mr-auto flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Elimina
            </button>
          )}
          <button onClick={onClose} disabled={loading} className="btn-outline">
            Annulla
          </button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Salvataggio...
              </>
            ) : (
              'Salva'
            )}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
