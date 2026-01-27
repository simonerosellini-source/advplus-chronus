import { createEmailTransport } from './smtp';
import { createWelcomeEmailTemplate, createTimesheetReminderTemplate } from './templates';

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

    // Mittente email (amministrazione@advisoryplus.it come richiesto)
    const fromEmail = process.env.SMTP_FROM || 'amministrazione@advisoryplus.it';

    console.log(`📤 Invio email da: ${fromEmail} a: ${params.email}`);

    // Invia email
    const info = await transport.sendMail({
      from: `"Presency+ by Advisory+" <${fromEmail}>`,
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

/**
 * Invia email di reminder per inserimento ore a tutti gli utenti
 */
export async function sendTimesheetReminderToAll(
  users: Array<{ nome: string; cognome: string; email: string }>
) {
  console.log(`📧 Tentativo invio email reminder a ${users.length} utenti`);

  const transport = createEmailTransport();

  // Se SMTP non è configurato, logga un warning e non inviare
  if (!transport) {
    console.warn('⚠️ SMTP non configurato. Email NON inviate.');
    return {
      success: false,
      message: 'Configurazione SMTP non disponibile',
      sent: 0,
      failed: 0,
    };
  }

  console.log('✓ Transport SMTP creato correttamente');

  // Ottieni URL dell'applicazione
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
    : 'http://localhost:3000/login';

  const fromEmail = process.env.SMTP_FROM || 'amministrazione@advisoryplus.it';

  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  // Invia email a ciascun utente
  for (const user of users) {
    try {
      const emailTemplate = createTimesheetReminderTemplate({
        nome: user.nome,
        cognome: user.cognome,
        loginUrl,
      });

      console.log(`📤 Invio email reminder a: ${user.email}`);

      await transport.sendMail({
        from: `"Presency+ by Advisory+" <${fromEmail}>`,
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });

      console.log(`✅ Email inviata con successo a: ${user.email}`);
      sent++;
    } catch (error: any) {
      console.error(`❌ Errore invio email a ${user.email}:`, error);
      failed++;
      errors.push({ email: user.email, error: error.message });
    }
  }

  console.log(
    `📊 Riepilogo invio: ${sent} inviate con successo, ${failed} fallite`
  );

  return {
    success: sent > 0,
    message: `Email inviate: ${sent}, fallite: ${failed}`,
    sent,
    failed,
    errors,
  };
}

// Esporta anche le funzioni di utilità
export { createEmailTransport, verifyEmailConnection } from './smtp';
export { createWelcomeEmailTemplate, createTimesheetReminderTemplate } from './templates';
