import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailConnection, sendWelcomeEmail } from '@/lib/email';

/**
 * Endpoint per testare la configurazione SMTP
 * GET /api/email/test - Verifica configurazione e connessione
 * POST /api/email/test - Invia email di test
 */

export async function GET() {
  try {
    // Log delle variabili d'ambiente (senza password)
    const config = {
      SMTP_HOST: process.env.SMTP_HOST || 'NON CONFIGURATO',
      SMTP_PORT: process.env.SMTP_PORT || 'NON CONFIGURATO',
      SMTP_USER: process.env.SMTP_USER || 'NON CONFIGURATO',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***configurato***' : 'NON CONFIGURATO',
      SMTP_FROM: process.env.SMTP_FROM || 'NON CONFIGURATO',
    };

    console.log('📧 Configurazione SMTP:', config);

    // Verifica connessione
    const result = await verifyEmailConnection();

    return NextResponse.json({
      config,
      connection: result,
    });
  } catch (error: any) {
    console.error('Errore test SMTP:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email destinatario richiesta' },
        { status: 400 }
      );
    }

    // Invia email di test
    const result = await sendWelcomeEmail({
      nome: 'Test',
      cognome: 'Utente',
      email,
      password: 'PasswordTemporanea123!',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Errore invio email di test:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
