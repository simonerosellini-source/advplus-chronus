'use client';

// Modal per creazione/modifica utente
import { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';
import { createClient } from '@/lib/supabase/client';
import { userSchema } from '@/lib/utils/validations';
import type { User, RuoloUtente } from '@/types/database.types';
import { useToast } from '@/components/ui/Toast';

interface ModalUtenteProps {
  user?: User | null;
  onClose: () => void;
}

export function ModalUtente({ user, onClose }: ModalUtenteProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    nome: user?.nome || '',
    cognome: user?.cognome || '',
    ruolo: (user?.ruolo || 'dipendente') as RuoloUtente,
    password: '',
    legge_104: user?.legge_104 || false,
    importo_trasferte: user?.importo_trasferte || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { showToast } = useToast();
  const supabase = createClient();
  const isEdit = !!user;

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

  async function handleSave() {
    setLoading(true);
    setErrors({});

    try {
      // Validazione
      const dataToValidate = {
        ...formData,
        password: isEdit ? undefined : formData.password,
      };

      const validation = userSchema.safeParse(dataToValidate);
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

      if (isEdit) {
        // Modifica utente esistente
        // @ts-expect-error - TypeScript incorrectly infers update parameter type as never
        const { error } = await supabase.from('users').update({
          nome: formData.nome,
          cognome: formData.cognome,
          ruolo: formData.ruolo,
          legge_104: formData.legge_104,
          importo_trasferte: formData.importo_trasferte,
        }).eq('id', user.id);

        if (error) throw error;
        showToast('Utente aggiornato con successo', 'success');
      } else {
        // Crea nuovo utente tramite Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nome: formData.nome,
              cognome: formData.cognome,
              ruolo: formData.ruolo,
              legge_104: formData.legge_104,
              importo_trasferte: formData.importo_trasferte,
            },
          },
        });

        if (authError) throw authError;

        // Il trigger handle_new_user() creerà automaticamente il record nella tabella users
        showToast('Utente creato con successo. Email di verifica inviata.', 'success');
      }

      onClose();
    } catch (error: any) {
      console.error('Errore salvataggio utente:', error);
      if (error.message?.includes('already registered')) {
        setErrors({ email: 'Questa email è già registrata' });
        showToast('Email già registrata', 'error');
      } else {
        showToast(error.message || 'Errore durante il salvataggio', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Modifica Utente' : 'Nuovo Utente'}
      size="md"
    >
      <div className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isEdit}
            className={errors.email ? 'input-error' : 'input'}
            placeholder="utente@advisoryplus.it"
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
          {isEdit && (
            <p className="text-gray-500 text-xs mt-1">L&apos;email non può essere modificata</p>
          )}
        </div>

        {/* Nome e Cognome */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              className={errors.nome ? 'input-error' : 'input'}
              placeholder="Mario"
            />
            {errors.nome && <p className="text-red-600 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cognome *
            </label>
            <input
              type="text"
              value={formData.cognome}
              onChange={(e) => handleChange('cognome', e.target.value)}
              className={errors.cognome ? 'input-error' : 'input'}
              placeholder="Rossi"
            />
            {errors.cognome && <p className="text-red-600 text-xs mt-1">{errors.cognome}</p>}
          </div>
        </div>

        {/* Ruolo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ruolo *
          </label>
          <select
            value={formData.ruolo}
            onChange={(e) => handleChange('ruolo', e.target.value)}
            className={errors.ruolo ? 'input-error' : 'input'}
          >
            <option value="dipendente">Dipendente</option>
            <option value="collaboratore">Collaboratore</option>
            <option value="amministratore">Amministratore</option>
          </select>
          {errors.ruolo && <p className="text-red-600 text-xs mt-1">{errors.ruolo}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Gli amministratori hanno accesso completo al sistema
          </p>
        </div>

        {/* Legge 104 e Importo Trasferte */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.legge_104}
                onChange={(e) => handleChange('legge_104', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                Legge 104
              </span>
            </label>
            <p className="text-gray-500 text-xs mt-1 ml-7">
              Applica benefici previsti dalla Legge 104
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Importo Trasferte (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.importo_trasferte}
              onChange={(e) => handleChange('importo_trasferte', parseFloat(e.target.value) || 0)}
              className={errors.importo_trasferte ? 'input-error' : 'input'}
              placeholder="0.00"
            />
            {errors.importo_trasferte && (
              <p className="text-red-600 text-xs mt-1">{errors.importo_trasferte}</p>
            )}
          </div>
        </div>

        {/* Password (solo per nuovi utenti) */}
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={errors.password ? 'input-error' : 'input'}
              placeholder="Minimo 8 caratteri"
            />
            {errors.password && (
              <p className="text-red-600 text-xs mt-1">{errors.password}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              L&apos;utente riceverà un&apos;email per confermare l&apos;account
            </p>
          </div>
        )}

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
            ) : isEdit ? (
              'Salva Modifiche'
            ) : (
              'Crea Utente'
            )}
          </button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
