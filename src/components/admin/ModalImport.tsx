'use client';

// Modale per import presenze da Excel/CSV
import { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '../ui/Toast';
import type { User } from '@/types/database.types';

interface ModalImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  total: number;
  success: number;
  errors: Array<{ row: number; error: string }>;
}

export function ModalImport({ onClose, onSuccess }: ModalImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { showToast } = useToast();
  const supabase = createClient();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  }

  async function handleImport() {
    if (!file) {
      showToast('Seleziona un file da importare', 'error');
      return;
    }

    setLoading(true);
    try {
      // Leggi il file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Salta le prime 2 righe (header)
      const rows = jsonData.slice(2);

      const errors: Array<{ row: number; error: string }> = [];
      const presenzeToInsert: Array<{
        user_id: string;
        data: string;
        ingresso_mattina: string | null;
        uscita_mattina: string | null;
        ingresso_pomeriggio: string | null;
        uscita_pomeriggio: string | null;
        note: string | null;
      }> = [];

      // Carica tutti gli utenti per mapping email -> ID
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, nome, cognome') as { data: User[] | null; error: any };

      if (usersError) throw usersError;

      // Processa ogni riga
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 4) continue; // Salta righe vuote

        try {
          const email = row[2]; // Colonna C: Email
          const data = row[3]; // Colonna D: Data
          const ingresso_mattina = row[4] || null;
          const uscita_mattina = row[5] || null;
          const ingresso_pomeriggio = row[6] || null;
          const uscita_pomeriggio = row[7] || null;
          const note = row[8] || null;

          // Trova utente
          const user = users?.find(u => u.email === email);
          if (!user) {
            errors.push({ row: i + 3, error: `Utente non trovato: ${email}` });
            continue;
          }

          // Valida data
          if (!data || typeof data !== 'string') {
            errors.push({ row: i + 3, error: 'Data non valida' });
            continue;
          }

          presenzeToInsert.push({
            user_id: user.id,
            data: data,
            ingresso_mattina,
            uscita_mattina,
            ingresso_pomeriggio,
            uscita_pomeriggio,
            note,
          });
        } catch (error: any) {
          errors.push({ row: i + 3, error: error.message });
        }
      }

      // Inserisci in batch
      let successCount = 0;
      if (presenzeToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('presenze')
          .upsert(presenzeToInsert as any, { onConflict: 'user_id,data' });

        if (insertError) {
          throw insertError;
        }
        successCount = presenzeToInsert.length;
      }

      setResult({
        total: rows.length,
        success: successCount,
        errors,
      });

      if (successCount > 0) {
        showToast(`${successCount} presenze importate con successo`, 'success');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Errore import:', error);
      showToast(error.message || 'Errore durante l\'importazione', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={true} title="Importa Presenze" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 mb-2">Formato file richiesto:</p>
          <ul className="text-blue-700 space-y-1 list-disc list-inside">
            <li>Formato: Excel (.xlsx) o CSV</li>
            <li>Colonne: Nome, Cognome, Email, Data, Ing.Mattina, Usc.Mattina, Ing.Pomeriggio, Usc.Pomeriggio, Note</li>
            <li>Data formato: YYYY-MM-DD</li>
            <li>Orari formato: HH:MM</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleziona file
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary-dark
              file:cursor-pointer cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              File selezionato: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {result.success} / {result.total} presenze importate
              </span>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{result.errors.length} errori:</span>
                </div>
                <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>
                      Riga {err.row}: {err.error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="font-medium">
                      ... e altri {result.errors.length - 10} errori
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-outline" disabled={loading}>
            {result ? 'Chiudi' : 'Annulla'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Importazione...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importa
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
