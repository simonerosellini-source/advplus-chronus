/**
 * Template email per invio credenziali nuovo utente
 */
export function createWelcomeEmailTemplate(params: {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  const { nome, cognome, email, password, loginUrl } = params;

  return {
    subject: `Benvenuto in Chronus+ - Credenziali di accesso`,
    html: `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Benvenuto in Chronus+</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Benvenuto in Chronus+
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">
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
                Il tuo account è stato creato con successo. Di seguito troverai le credenziali per accedere alla piattaforma Chronus+:
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

              <!-- Pulsante Accedi -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Accedi alla Piattaforma
                    </a>
                  </td>
                </tr>
              </table>

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
Benvenuto in Chronus+

Gentile ${nome} ${cognome},

Il tuo account è stato creato con successo. Di seguito troverai le credenziali per accedere alla piattaforma Chronus+:

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
