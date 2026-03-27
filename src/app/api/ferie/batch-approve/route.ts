import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createEmailTransport } from '@/lib/email/smtp';
import { createVacationApprovedTemplate } from '@/lib/email/templates';
import path from 'path';
import fs from 'fs';

function getLogoAttachment(): { filename: string; path: string; cid: string } | null {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'presency-plus-logo.png'),
    path.join(process.cwd(), 'presency-plus-logo.png'),
  ];
  for (const logoPath of possiblePaths) {
    if (fs.existsSync(logoPath)) {
      return { filename: 'presency-plus-logo.png', path: logoPath, cid: 'presencylogo' };
    }
  }
  return null;
}

// POST /api/ferie/batch-approve
// Approva più ferie/permessi in una sola azione e invia UNA email riepilogativa
// Body: { presenzaIds: string[], nome: string, cognome: string, email: string }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { presenzaIds, nome, cognome, email } = body;

    if (!presenzaIds || !Array.isArray(presenzaIds) || presenzaIds.length === 0) {
      return NextResponse.json({ error: 'presenzaIds mancanti' }, { status: 400 });
    }
    if (!nome || !cognome || !email) {
      return NextResponse.json({ error: 'Dati dipendente mancanti' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Approva tutti i record
    const { error: updateError } = await (supabase as any)
      .from('presenze')
      .update({ ferie_validate: true })
      .in('id', presenzaIds);

    if (updateError) {
      console.error('Errore approvazione batch:', updateError);
      return NextResponse.json({ error: 'Errore approvazione' }, { status: 500 });
    }

    // Recupera i dettagli dei record approvati per la email
    const { data: presenzeApprovate, error: fetchError } = await (supabase as any)
      .from('presenze')
      .select('data, ferie, permessi')
      .in('id', presenzaIds)
      .order('data', { ascending: true });

    if (fetchError) {
      console.error('Errore recupero presenze approvate:', fetchError);
      // L'approvazione è già avvenuta, continua senza email
      return NextResponse.json({ success: true, count: presenzaIds.length, emailSent: false });
    }

    // Costruisce la lista giorni per l'email (ferie e permessi separati)
    const giorniFerie: Array<{ data: string; ore: number; tipo: 'ferie' | 'permessi' }> = [];
    for (const p of (presenzeApprovate || [])) {
      if (p.ferie > 0) giorniFerie.push({ data: p.data, ore: p.ferie, tipo: 'ferie' });
      if (p.permessi > 0) giorniFerie.push({ data: p.data, ore: p.permessi, tipo: 'permessi' });
    }

    // Invia UNA email riepilogativa
    const transport = createEmailTransport();
    if (!transport) {
      console.warn('⚠️ SMTP non configurato. Email riepilogo NON inviata.');
      return NextResponse.json({ success: true, count: presenzaIds.length, emailSent: false });
    }

    const logoAttachment = getLogoAttachment();
    const emailTemplate = createVacationApprovedTemplate({
      nome,
      cognome,
      giorniFerie,
      logoCid: logoAttachment?.cid,
    });

    const fromEmail = process.env.SMTP_FROM || 'amministrazione@advisoryplus.it';

    try {
      const info = await transport.sendMail({
        from: `"Presency+ by Advisory+" <${fromEmail}>`,
        to: email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
        attachments: logoAttachment ? [logoAttachment] : [],
      });
      console.log(`✅ Email riepilogo approvazione inviata: ${info.messageId}`);
    } catch (emailError) {
      console.error('Errore invio email riepilogo:', emailError);
      // L'approvazione è già avvenuta, non bloccare la risposta
    }

    return NextResponse.json({ success: true, count: presenzaIds.length, emailSent: true });
  } catch (error) {
    console.error('Errore API batch-approve:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
