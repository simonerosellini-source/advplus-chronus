import { createEmailTransport } from './smtp';
import { createWelcomeEmailTemplate, createTimesheetReminderTemplate, createHoursConfirmationTemplate } from './templates';
import path from 'path';
import fs from 'fs';

// Funzione per ottenere il path del logo
function getLogoPath(): string | null {
  // Prova diversi percorsi possibili per il logo
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'presency-plus-logo.png'),
    path.join(process.cwd(), 'presency-plus-logo.png'),
  ];

  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return logoPath;
    }
  }

  console.warn('⚠️ Logo non trovato nei percorsi:', possiblePaths);
  return null;
}

// Funzione per creare l'attachment del logo
function getLogoAttachment(): { filename: string; path: string; cid: string } | null {
  const logoPath = getLogoPath();
  if (!logoPath) return null;

  return {
    filename: 'presency-plus-logo.png',
    path: logoPath,
    cid: 'presencylogo', // Content-ID per riferimento nell'HTML
  };
}

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
      : 'https://presency.vercel.app/login';

    // Ottieni allegato logo
    const logoAttachment = getLogoAttachment();
    const logoCid = logoAttachment ? logoAttachment.cid : undefined;

    // Genera template email
    const emailTemplate = createWelcomeEmailTemplate({
      nome: params.nome,
      cognome: params.cognome,
      email: params.email,
      password: params.password,
      loginUrl,
      logoCid,
    });

    // Mittente email (amministrazione@advisoryplus.it come richiesto)
    const fromEmail = process.env.SMTP_FROM || 'amministrazione@advisoryplus.it';

    console.log(`📤 Invio email da: ${fromEmail} a: ${params.email}`);

    // Invia email con allegato logo
    const info = await transport.sendMail({
      from: `"Presency+ by Advisory+" <${fromEmail}>`,
      to: params.email,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
      attachments: logoAttachment ? [logoAttachment] : [],
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
    : 'https://presency.vercel.app/login';

  // Ottieni allegato logo
  const logoAttachment = getLogoAttachment();
  const logoCid = logoAttachment ? logoAttachment.cid : undefined;

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
        logoCid,
      });

      console.log(`📤 Invio email reminder a: ${user.email}`);

      await transport.sendMail({
        from: `"Presency+ by Advisory+" <${fromEmail}>`,
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
        attachments: logoAttachment ? [logoAttachment] : [],
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

/**
 * Invia email di conferma inserimento orari all'amministrazione
 */
export async function sendHoursConfirmationToAdmin(params: {
  nome: string;
  cognome: string;
  email: string;
  mese: string;
  anno: number;
}) {
  console.log(`📧 Tentativo invio conferma inserimento orari da ${params.email} per ${params.mese} ${params.anno}`);

  const transport = createEmailTransport();

  // Se SMTP non è configurato, logga un warning e non inviare
  if (!transport) {
    console.warn(
      `⚠️ SMTP non configurato. Email di conferma NON inviata.`
    );
    return {
      success: false,
      message: 'Configurazione SMTP non disponibile',
    };
  }

  console.log('✓ Transport SMTP creato correttamente');

  try {
    // Ottieni URL dell'applicazione
    const adminUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/admin`
      : 'https://presency.vercel.app/admin';

    // Ottieni allegato logo
    const logoAttachment = getLogoAttachment();
    const logoCid = logoAttachment ? logoAttachment.cid : undefined;

    // Data e ora corrente formattata
    const dataInvio = new Date().toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Genera template email
    const emailTemplate = createHoursConfirmationTemplate({
      nome: params.nome,
      cognome: params.cognome,
      email: params.email,
      mese: params.mese,
      anno: params.anno,
      dataInvio,
      adminUrl,
      logoCid,
    });

    // Email destinatario (amministrazione)
    const adminEmail = 'amministrazione@advisoryplus.it';
    const fromEmail = process.env.SMTP_FROM || 'amministrazione@advisoryplus.it';

    console.log(`📤 Invio email da: ${fromEmail} a: ${adminEmail}`);

    // Invia email con allegato logo
    const info = await transport.sendMail({
      from: `"Presency+ by Advisory+" <${fromEmail}>`,
      to: adminEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    console.log('✅ Email di conferma inviata con successo:', info.messageId);
    console.log(`   Destinatario: ${adminEmail}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Errore durante l\'invio dell\'email di conferma:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}

// Esporta anche le funzioni di utilità
export { createEmailTransport, verifyEmailConnection } from './smtp';
export {
  createWelcomeEmailTemplate,
  createTimesheetReminderTemplate,
  createHoursConfirmationTemplate,
  createVacationApprovedTemplate,
  createVacationRejectedTemplate,
  createVacationValidationRequestTemplate,
} from './templates';
