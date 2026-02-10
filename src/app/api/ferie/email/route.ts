import { NextResponse } from 'next/server';
import { createEmailTransport } from '@/lib/email/smtp';
import {
  createVacationApprovedTemplate,
  createVacationRejectedTemplate,
  createVacationValidationRequestTemplate,
} from '@/lib/email/templates';
import path from 'path';
import fs from 'fs';

// Funzione per ottenere il path del logo
function getLogoPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'presency-plus-logo.png'),
    path.join(process.cwd(), 'presency-plus-logo.png'),
  ];

  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return logoPath;
    }
  }
  return null;
}

function getLogoAttachment(): { filename: string; path: string; cid: string } | null {
  const logoPath = getLogoPath();
  if (!logoPath) return null;

  return {
    filename: 'presency-plus-logo.png',
    path: logoPath,
    cid: 'presencylogo',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, nome, cognome, email, giorniFerie } = body;

    if (!type || !nome || !cognome || !giorniFerie) {
      return NextResponse.json(
        { error: 'Parametri mancanti' },
        { status: 400 }
      );
    }

    const transport = createEmailTransport();

    if (!transport) {
      console.warn('⚠️ SMTP non configurato. Email NON inviata.');
      return NextResponse.json(
        { success: false, message: 'Configurazione SMTP non disponibile' },
        { status: 200 }
      );
    }

    const logoAttachment = getLogoAttachment();
    const logoCid = logoAttachment ? logoAttachment.cid : undefined;
    const fromEmail = process.env.SMTP_FROM || 'amministrazione@advisoryplus.it';

    let emailTemplate;
    let toEmail: string;

    switch (type) {
      case 'approved':
        if (!email) {
          return NextResponse.json({ error: 'Email utente mancante' }, { status: 400 });
        }
        emailTemplate = createVacationApprovedTemplate({
          nome,
          cognome,
          giorniFerie,
          logoCid,
        });
        toEmail = email;
        break;

      case 'rejected':
        if (!email) {
          return NextResponse.json({ error: 'Email utente mancante' }, { status: 400 });
        }
        emailTemplate = createVacationRejectedTemplate({
          nome,
          cognome,
          giorniFerie,
          logoCid,
        });
        toEmail = email;
        break;

      case 'validation_request':
        if (!email) {
          return NextResponse.json({ error: 'Email utente mancante' }, { status: 400 });
        }
        emailTemplate = createVacationValidationRequestTemplate({
          nome,
          cognome,
          email,
          giorniFerie,
          logoCid,
        });
        // Invia a Daniele Simonini come richiesto
        toEmail = 'daniele.simonini@advisoryplus.it';
        break;

      default:
        return NextResponse.json({ error: 'Tipo email non valido' }, { status: 400 });
    }

    console.log(`📧 Invio email ${type} a: ${toEmail}`);

    const info = await transport.sendMail({
      from: `"Presency+ by Advisory+" <${fromEmail}>`,
      to: toEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    console.log(`✅ Email inviata con successo: ${info.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('❌ Errore invio email ferie:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
