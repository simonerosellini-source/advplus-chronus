import { createEmailTransport } from './smtp';
import { createWelcomeEmailTemplate } from './templates';

/**
 * Invia email di benvenuto con credenziali di accesso
 */
export async function sendWelcomeEmail(params: {
  nome: string;
  cognome: string;
  email: string;
  password: string;
}) {
  console.log(`📧 Tentativo invio email di benvenuto a: ${params.email}`);

  const transport = createEmailTransport();

  // Se SMTP non è configurato, logga un warning e non inviare
  if (!transport) {
    console.warn(
      `⚠️ SMTP non configurato. Email di benvenuto NON inviata a: ${params.email}`
    );
    return {
      success: false,
      message: 'Configurazione SMTP non disponibile',
    };
  }

  console.log('✓ Transport SMTP creato correttamente');

  try {
    // Ottieni URL dell'applicazione
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
      : 'http://localhost:3000/login';

    // Genera template email
    const emailTemplate = createWelcomeEmailTemplate({
      nome: params.nome,
      cognome: params.cognome,
      email: params.email,
      password: params.password,
      loginUrl,
    });

    // Mittente email (commerciale@advisoryplus.it come richiesto)
    const fromEmail = process.env.SMTP_FROM || 'commerciale@advisoryplus.it';

    console.log(`📤 Invio email da: ${fromEmail} a: ${params.email}`);

    // Invia email
    const info = await transport.sendMail({
      from: `"Advisory+ - Chronus+" <${fromEmail}>`,
      to: params.email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    console.log('✅ Email di benvenuto inviata con successo:', info.messageId);
    console.log(`   Destinatario: ${params.email}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Errore durante l\'invio dell\'email:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Esporta anche le funzioni di utilità
export { createEmailTransport, verifyEmailConnection } from './smtp';
export { createWelcomeEmailTemplate } from './templates';
