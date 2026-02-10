/**
 * Template email per richiedere inserimento ore lavoro
 */
export function createTimesheetReminderTemplate(params: {
  nome: string;
  cognome: string;
  loginUrl: string;
  logoCid?: string;
}) {
  const { nome, cognome, loginUrl, logoCid } = params;

  return {
    subject: `Presency+ - Promemoria Inserimento Ore di Lavoro`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promemoria Inserimento Ore</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          ${logoCid ? `<!-- Logo -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
              <img src="cid:${logoCid}" alt="Presency+ by Advisory+" style="max-width: 300px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>` : ''}

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); ${logoCid ? '' : 'border-radius: 8px 8px 0 0;'}">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ⏰ Promemoria Inserimento Ore
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">
                Sistema Gestione Presenze Presency+
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Gentile <strong>${nome} ${cognome}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Ti ricordiamo di inserire le tue ore di lavoro nel sistema gestionale Presency+. È importante mantenere aggiornato il tuo timesheet per garantire una corretta gestione delle presenze.
              </p>

              <!-- Box Azione Richiesta -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                      <strong>📋 Azione richiesta:</strong><br>
                      Accedi alla piattaforma Presency+ e inserisci le ore lavorate per il periodo corrente. Assicurati di compilare tutti i giorni lavorativi e di includere eventuali straordinari, ferie o permessi.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Pulsante Accedi -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Accedi a Presency+
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link testuale -->
              <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
                Oppure copia e incolla questo link nel tuo browser:<br>
                <a href="${loginUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${loginUrl}</a>
              </p>

              <!-- Avviso -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                      <strong>💡 Suggerimento:</strong> Aggiorna regolarmente le tue ore per evitare dimenticanze e facilitare la gestione amministrativa.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">
                Per qualsiasi dubbio o assistenza, non esitare a contattare l'amministrazione.
              </p>

              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Cordiali saluti,<br>
                <strong>Il Team di Advisory+</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.5;">
                Questa è una email automatica. Per favore non rispondere a questo messaggio.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Promemoria Inserimento Ore - Presency+

Gentile ${nome} ${cognome},

Ti ricordiamo di inserire le tue ore di lavoro nel sistema gestionale Presency+. È importante mantenere aggiornato il tuo timesheet per garantire una corretta gestione delle presenze.

AZIONE RICHIESTA:
Accedi alla piattaforma Presency+ e inserisci le ore lavorate per il periodo corrente. Assicurati di compilare tutti i giorni lavorativi e di includere eventuali straordinari, ferie o permessi.

Link di accesso: ${loginUrl}

SUGGERIMENTO: Aggiorna regolarmente le tue ore per evitare dimenticanze e facilitare la gestione amministrativa.

Per qualsiasi dubbio o assistenza, non esitare a contattare l'amministrazione.

Cordiali saluti,
Il Team di Advisory+

---
Questa è una email automatica. Per favore non rispondere a questo messaggio.
© ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
    `,
  };
}

/**
 * Template email per conferma inserimento orari da parte dell'utente
 */
export function createHoursConfirmationTemplate(params: {
  nome: string;
  cognome: string;
  email: string;
  mese: string;
  anno: number;
  dataInvio: string;
  adminUrl: string;
  logoCid?: string;
}) {
  const { nome, cognome, email, mese, anno, dataInvio, adminUrl, logoCid } = params;

  return {
    subject: `Conferma Inserimento Orari - ${nome} ${cognome} (${mese} ${anno})`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma Inserimento Orari</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          ${logoCid ? `<!-- Logo -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
              <img src="cid:${logoCid}" alt="Presency+ by Advisory+" style="max-width: 300px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>` : ''}

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%); ${logoCid ? '' : 'border-radius: 8px 8px 0 0;'}">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Conferma Inserimento Orari
              </h1>
              <p style="margin: 10px 0 0; color: #d1fae5; font-size: 16px;">
                Notifica Automatica Presency+
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                L'utente <strong>${nome} ${cognome}</strong> ha confermato il corretto inserimento degli orari di lavoro.
              </p>

              <!-- Box Info Dipendente -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 600;">👤 Dipendente</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${nome} ${cognome}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 600;">📧 Email</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1f2937; font-size: 16px;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 600;">📅 Periodo</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${mese} ${anno}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 600;">🕐 Data conferma</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #1f2937; font-size: 16px;">${dataInvio}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Box Azione -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                      <strong>📋 Azione suggerita:</strong> Accedi alla dashboard amministratore per verificare e validare le presenze inserite dall'utente.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Pulsante Accedi Dashboard -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Verifica Presenze
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link testuale -->
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
                Oppure copia e incolla questo link nel tuo browser:<br>
                <a href="${adminUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${adminUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.5;">
                Questa è una email automatica generata dal sistema Presency+.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Conferma Inserimento Orari - Presency+

L'utente ${nome} ${cognome} ha confermato il corretto inserimento degli orari di lavoro.

DETTAGLI CONFERMA:
- Dipendente: ${nome} ${cognome}
- Email: ${email}
- Periodo: ${mese} ${anno}
- Data conferma: ${dataInvio}

AZIONE SUGGERITA:
Accedi alla dashboard amministratore per verificare e validare le presenze inserite dall'utente.

Link dashboard: ${adminUrl}

---
Questa è una email automatica generata dal sistema Presency+.
© ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
    `,
  };
}

/**
 * Template email per invio credenziali nuovo utente
 */
/**
 * Template email per notifica ferie validate
 */
export function createVacationApprovedTemplate(params: {
  nome: string;
  cognome: string;
  giorniFerie: Array<{ data: string; ore: number }>;
  logoCid?: string;
}) {
  const { nome, cognome, giorniFerie, logoCid } = params;

  const listaGiorni = giorniFerie
    .map(g => `${new Date(g.data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${g.ore}h`)
    .join('<br>');

  const listaGiorniText = giorniFerie
    .map(g => `- ${new Date(g.data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${g.ore}h`)
    .join('\n');

  return {
    subject: `Presency+ - Ferie Approvate`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ferie Approvate</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          ${logoCid ? `<tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
              <img src="cid:${logoCid}" alt="Presency+ by Advisory+" style="max-width: 300px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>` : ''}

          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%); ${logoCid ? '' : 'border-radius: 8px 8px 0 0;'}">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Ferie Approvate
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Gentile <strong>${nome} ${cognome}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Le tue ferie sono state <strong style="color: #059669;">approvate</strong>.
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #d1fae5; border: 2px solid #10b981; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 10px; color: #065f46; font-size: 14px; font-weight: 600;">Giorni approvati:</p>
                    <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.8;">
                      ${listaGiorni}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Cordiali saluti,<br>
                <strong>Il Team di Advisory+</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Ferie Approvate - Presency+

Gentile ${nome} ${cognome},

Le tue ferie sono state APPROVATE.

Giorni approvati:
${listaGiorniText}

Cordiali saluti,
Il Team di Advisory+
    `,
  };
}

/**
 * Template email per notifica ferie respinte
 */
export function createVacationRejectedTemplate(params: {
  nome: string;
  cognome: string;
  giorniFerie: Array<{ data: string; ore: number }>;
  logoCid?: string;
}) {
  const { nome, cognome, giorniFerie, logoCid } = params;

  const listaGiorni = giorniFerie
    .map(g => `${new Date(g.data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${g.ore}h`)
    .join('<br>');

  const listaGiorniText = giorniFerie
    .map(g => `- ${new Date(g.data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${g.ore}h`)
    .join('\n');

  return {
    subject: `Presency+ - Ferie Non Approvate`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ferie Non Approvate</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          ${logoCid ? `<tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
              <img src="cid:${logoCid}" alt="Presency+ by Advisory+" style="max-width: 300px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>` : ''}

          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); ${logoCid ? '' : 'border-radius: 8px 8px 0 0;'}">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ❌ Ferie Non Approvate
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Gentile <strong>${nome} ${cognome}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Le tue ferie <strong style="color: #dc2626;">non sono state approvate</strong>. Ti invitiamo a contattare l'amministrazione per maggiori informazioni.
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 10px; color: #991b1b; font-size: 14px; font-weight: 600;">Giorni non approvati:</p>
                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.8;">
                      ${listaGiorni}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Cordiali saluti,<br>
                <strong>Il Team di Advisory+</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Ferie Non Approvate - Presency+

Gentile ${nome} ${cognome},

Le tue ferie NON SONO STATE APPROVATE. Ti invitiamo a contattare l'amministrazione per maggiori informazioni.

Giorni non approvati:
${listaGiorniText}

Cordiali saluti,
Il Team di Advisory+
    `,
  };
}

/**
 * Template email per richiesta validazione ferie
 */
export function createVacationValidationRequestTemplate(params: {
  nome: string;
  cognome: string;
  email: string;
  giorniFerie: Array<{ data: string; ore: number }>;
  logoCid?: string;
}) {
  const { nome, cognome, email, giorniFerie, logoCid } = params;

  const totaleOre = giorniFerie.reduce((acc, g) => acc + g.ore, 0);

  const listaGiorni = giorniFerie
    .map(g => `${new Date(g.data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${g.ore}h`)
    .join('<br>');

  const listaGiorniText = giorniFerie
    .map(g => `- ${new Date(g.data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - ${g.ore}h`)
    .join('\n');

  const adminUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/admin`
    : 'https://presency.vercel.app/admin';

  return {
    subject: `Richiesta Validazione Ferie - ${nome} ${cognome}`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Richiesta Validazione Ferie</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          ${logoCid ? `<tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
              <img src="cid:${logoCid}" alt="Presency+ by Advisory+" style="max-width: 300px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>` : ''}

          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); ${logoCid ? '' : 'border-radius: 8px 8px 0 0;'}">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📋 Richiesta Validazione Ferie
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                L'utente <strong>${nome} ${cognome}</strong> (${email}) richiede la validazione delle seguenti ferie:
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 10px; color: #92400e; font-size: 14px; font-weight: 600;">Giorni da validare (${giorniFerie.length} giorni - ${totaleOre}h totali):</p>
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.8;">
                      ${listaGiorni}
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Vai al Calendario Ferie
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
                <a href="${adminUrl}" style="color: #3b82f6; text-decoration: none;">${adminUrl}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Richiesta Validazione Ferie - Presency+

L'utente ${nome} ${cognome} (${email}) richiede la validazione delle seguenti ferie:

Giorni da validare (${giorniFerie.length} giorni - ${totaleOre}h totali):
${listaGiorniText}

Vai al Calendario Ferie: ${adminUrl}

---
© ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
    `,
  };
}

/**
 * Template email per invio credenziali nuovo utente
 */
export function createWelcomeEmailTemplate(params: {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  loginUrl: string;
  logoCid?: string;
}) {
  const { nome, cognome, email, password, loginUrl, logoCid } = params;

  return {
    subject: `Benvenuto in Presency+ - Credenziali di accesso`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto in Presency+</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          ${logoCid ? `<!-- Logo -->
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; background-color: #ffffff; border-radius: 8px 8px 0 0;">
              <img src="cid:${logoCid}" alt="Presency+ by Advisory+" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>` : ''}

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); ${logoCid ? '' : 'border-radius: 8px 8px 0 0;'}">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Benvenuto in Presency+
              </h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                Sistema Gestione Presenze
              </p>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Gentile <strong>${nome} ${cognome}</strong>,
              </p>

              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Il tuo account è stato creato con successo. Di seguito troverai le credenziali per accedere alla piattaforma Presency+:
              </p>

              <!-- Box Credenziali -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Username / Email</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 20px;">
                          <span style="color: #1f2937; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace;">${email}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Password</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0;">
                          <span style="color: #1f2937; font-size: 18px; font-weight: 600; font-family: 'Courier New', monospace;">${password}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Testo introduttivo link -->
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">
                Per accedere fai click sul link di seguito riportato:
              </p>

              <!-- Link principale -->
              <p style="margin: 0 0 15px; text-align: center;">
                <a href="${loginUrl}" style="color: #3b82f6; text-decoration: none; font-size: 18px; font-weight: 600; word-break: break-all;">${loginUrl}</a>
              </p>

              <!-- Nota copia link -->
              <p style="margin: 0 0 30px; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.6;">
                Oppure copia e incolla questo link nel tuo browser
              </p>

              <!-- Avviso sicurezza -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                      <strong>🔒 Sicurezza:</strong> Conserva le tue credenziali in modo sicuro e non condividerle con nessuno. Puoi modificare la password in qualsiasi momento dalle impostazioni del tuo profilo.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6;">
                Se hai bisogno di assistenza o hai domande, non esitare a contattarci.
              </p>

              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Cordiali saluti,<br>
                <strong>Il Team di Advisory+</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.5;">
                Questa è una email automatica. Per favore non rispondere a questo messaggio.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Benvenuto in Presency+

Gentile ${nome} ${cognome},

Il tuo account è stato creato con successo. Di seguito troverai le credenziali per accedere alla piattaforma Presency+:

Username / Email: ${email}
Password: ${password}

Link di accesso: ${loginUrl}

SICUREZZA: Conserva le tue credenziali in modo sicuro e non condividerle con nessuno. Puoi modificare la password in qualsiasi momento dalle impostazioni del tuo profilo.

Se hai bisogno di assistenza o hai domande, non esitare a contattarci.

Cordiali saluti,
Il Team di Advisory+

---
Questa è una email automatica. Per favore non rispondere a questo messaggio.
© ${new Date().getFullYear()} Advisory+ | Tutti i diritti riservati
    `,
  };
}
