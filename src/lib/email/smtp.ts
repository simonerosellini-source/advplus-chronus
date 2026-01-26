import nodemailer from 'nodemailer';

/**
 * Crea e configura il transport SMTP per l'invio email
 */
export function createEmailTransport() {
  // Verifica che le variabili d'ambiente siano configurate
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('⚠️ Configurazione SMTP incompleta. Le email non verranno inviate.');
    return null;
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true per porta 465, false per altre porte
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transport;
}

/**
 * Verifica la connessione SMTP
 */
export async function verifyEmailConnection() {
  const transport = createEmailTransport();

  if (!transport) {
    return { success: false, message: 'Configurazione SMTP non trovata' };
  }

  try {
    await transport.verify();
    return { success: true, message: 'Connessione SMTP verificata con successo' };
  } catch (error: any) {
    console.error('Errore verifica connessione SMTP:', error);
    return { success: false, message: error.message };
  }
}
