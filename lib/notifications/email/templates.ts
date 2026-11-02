export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[char] ?? char
  })
}

export function renderEmailLayout(
  title: string,
  intro: string,
  cta: string,
  url: string,
  footer: string,
): string {
  const safeUrl = escapeHtml(url)
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;">
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#d35f27;">Barbearia do Luiz</p>
              <p style="margin:4px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">Corte, barba e resenha</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 0 32px;">
              <h1 style="margin:0 0 14px 0;font-family:Inter,Arial,sans-serif;font-size:26px;line-height:1.2;color:#18181b;">${escapeHtml(title)}</h1>
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:15px;line-height:1.65;color:#3f3f46;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="#d35f27" style="border-radius:8px;">
                    <a href="${safeUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 26px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(cta)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 32px 0 32px;">
              <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;color:#71717a;">${escapeHtml(footer)}</p>
              <p style="margin:10px 0 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;color:#71717a;word-break:break-all;">
                <a href="${safeUrl}" target="_blank" rel="noopener" style="color:#c2410c;text-decoration:underline;">${safeUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px 32px;">
              <div style="border-top:1px solid #e4e4e7;padding-top:16px;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.6;color:#71717a;">
                Barbearia do Luiz — Belo Horizonte, MG
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function renderVerificationEmail(name: string, url: string): RenderedEmail {
  const safeName = escapeHtml(name)
  const title = 'Confirme seu e-mail'
  const intro = `Olá, ${safeName}. Toque no botão abaixo para confirmar seu e-mail e terminar a configuração da sua conta.`
  const footer = 'Se você não criou esta conta, ignore este e-mail.'
  const subject = 'Confirme seu e-mail — Barbearia do Luiz'

  return {
    subject,
    html: renderEmailLayout(title, intro, 'Confirmar e-mail', url, footer),
    text: [
      'Barbearia do Luiz',
      '',
      title,
      '',
      `Olá, ${name}. Confirme seu e-mail para terminar a configuração da sua conta.`,
      '',
      url,
      '',
      footer,
    ].join('\n'),
  }
}

export function renderPasswordResetEmail(name: string, url: string): RenderedEmail {
  const safeName = escapeHtml(name)
  const title = 'Redefina sua senha'
  const intro = `Olá, ${safeName}. Recebemos um pedido para redefinir a senha da sua conta. Este link funciona uma vez e expira em 30 minutos.`
  const footer = 'Se você não pediu isso, ignore este e-mail. Sua senha continua a mesma.'
  const subject = 'Redefina sua senha — Barbearia do Luiz'

  return {
    subject,
    html: renderEmailLayout(title, intro, 'Redefinir senha', url, footer),
    text: [
      'Barbearia do Luiz',
      '',
      title,
      '',
      `Olá, ${name}. Use o link abaixo para redefinir sua senha. Ele expira em 30 minutos.`,
      '',
      url,
      '',
      footer,
    ].join('\n'),
  }
}
