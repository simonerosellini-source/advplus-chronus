'use client';

// Modal per aggiungere festività personalizzata
import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';
import { createClient } from '@/lib/supabase/client';
import { festivitaSchema } from '@/lib/utils/validations';
import type { TipoFestivita, Sede } from '@/types/database.types';
import { useToast } from '@/components/ui/Toast';

interface ModalFestivoProps {
  onClose: () => void;
}

export function ModalFestivo({ onClose }: ModalFestivoProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    data: string;
    nome: string;
    tipo: TipoFestivita;
    sede: Sede | 'tutte';
  }>({
    data: '',
    nome: '',
    tipo: 'festivo',
    sede: 'tutte',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useToast();
  const supabase = createClient();

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  async function handleSave() {
    setLoading(true);
    setErrors({});

    try {
      // Validazione
      const validation = festivitaSchema.safeParse(formData);
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

      // Estrai anno dalla data
      const anno = new Date(formData.data).getFullYear();

      // Prepara sede: "tutte" diventa null per festività globali
      const sede = formData.sede === 'tutte' ? null : formData.sede;

      // @ts-expect-error - TypeScript incorrectly infers insert parameter type as never
      const { error } = await supabase.from('giorni_festivi').insert({
        data: formData.data,
        nome: formData.nome,
        tipo: formData.tipo,
        anno,
        sede,
      });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          setErrors({ data: 'Esiste già una festività per questa data' });
          showToast('Data già esistente', 'error');
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      showToast('Festività aggiunta con successo', 'success');
      onClose();
    } catch (error: any) {
      console.error('Errore salvataggio festività:', error);
      showToast(error.message || 'Errore durante il salvataggio', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Aggiungi Festività" size="md">
      <div className="space-y-6">
        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
          <input
            type="date"
            value={formData.data}
            onChange={(e) => handleChange('data', e.target.value)}
            className={errors.data ? 'input-error' : 'input'}
          />
          {errors.data && <p className="text-red-600 text-xs mt-1">{errors.data}</p>}
        </div>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            className={errors.nome ? 'input-error' : 'input'}
            placeholder="Es: Santo Patrono - San Giovanni"
          />
          {errors.nome && <p className="text-red-600 text-xs mt-1">{errors.nome}</p>}
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
          <select
            value={formData.tipo}
            onChange={(e) => handleChange('tipo', e.target.value)}
            className={errors.tipo ? 'input-error' : 'input'}
          >
            <option value="festivo">Festivo (0 ore lavorative)</option>
            <option value="semifestivo">Semifestivo (4 ore: 09:00-13:00)</option>
          </select>
          {errors.tipo && <p className="text-red-600 text-xs mt-1">{errors.tipo}</p>}
          <p className="text-gray-500 text-xs mt-1">
            I giorni festivi non permettono inserimento presenze. I semifestivi hanno orario fisso
            09:00-13:00.
          </p>
        </div>

        {/* Sede */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sede *</label>
          <select
            value={formData.sede}
            onChange={(e) => handleChange('sede', e.target.value)}
            className={errors.sede ? 'input-error' : 'input'}
          >
            <option value="tutte">Tutte le sedi (festività globale)</option>
            <option value="Viareggio">Viareggio</option>
            <option value="Pietrasanta">Pietrasanta</option>
            <option value="Massa">Massa</option>
            <option value="Camaiore">Camaiore</option>
            <option value="Carrara">Carrara</option>
          </select>
          {errors.sede && <p className="text-red-600 text-xs mt-1">{errors.sede}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Seleziona &quot;Tutte le sedi&quot; per festività nazionali o una sede specifica per festività locali.
          </p>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">ℹ️ Informazioni</p>
          <p>
            {formData.sede === 'tutte'
              ? 'Questa festività verrà applicata a tutti gli utenti di tutte le sedi.'
              : `Questa festività verrà applicata solo agli utenti della sede di ${formData.sede}.`
            }
            {' '}Le festività predefinite (Art. 31) vengono generate automaticamente ogni anno.
          </p>
        </div>

        {/* Footer */}
        <ModalFooter>
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
              'Aggiungi'
            )}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
