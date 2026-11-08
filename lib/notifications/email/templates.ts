import { AUTH_EMAIL_CONTENT } from '@/lib/notifications/email/content'
import type { AuthEmailContent, AuthEmailKind } from '@/lib/notifications/email/content'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EmailDetail {
  label: string
  value: string
}

export interface EmailLink {
  label: string
  url: string
}

export interface EmailLayoutContent {
  preheader?: string
  kicker?: string
  title: string
  body: string
  details?: EmailDetail[]
  cta?: string
  links?: EmailLink[]
  expiry?: string
  ignore?: string
  footer: string
}

const SERIF = "Georgia,'Times New Roman',serif"
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

const INK = '#1D1A15'
const TEXT = '#4A443A'
const MUTED = '#6F6759'
const HAIRLINE = '#DCD2C0'
const BRASS = '#A8792F'
const LINK = '#7A4F18'
const PAPER = '#FBF8F2'
const PAGE = '#E9E2D6'
const TICKET = '#F5EFE3'

const DETAIL = `margin:0;font-family:${SANS};font-size:12px;line-height:18px;color:${MUTED};`

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

function interpolateHtml(template: string, values: Record<string, string>): string {
  return template
    .split(/(\{name\}|\{email\})/)
    .map((part) => {
      if (part === '{name}') return escapeHtml(values.name ?? '')
      if (part === '{email}') {
        return `<strong style="color:${INK};font-weight:600">${escapeHtml(values.email ?? '')}</strong>`
      }
      return escapeHtml(part)
    })
    .join('')
}

function interpolateText(template: string, values: Record<string, string>): string {
  return template.replace(/\{name\}|\{email\}/g, (token) =>
    token === '{name}' ? (values.name ?? '') : (values.email ?? ''),
  )
}

function appUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
}

function renderDetails(details?: EmailDetail[]): string {
  if (!details?.length) return ''

  const rows = details
    .map((detail, index) => {
      const top = index === 0 ? '0' : '10px'
      return `<tr class="detail-row">
                      <td class="detail-label" width="92" style="width:92px;padding:${top} 0 0 0;vertical-align:top;font-family:${SANS};font-size:11px;line-height:18px;color:${MUTED};">${escapeHtml(detail.label)}</td>
                      <td class="detail-value" style="padding:${top} 0 0 0;font-family:${SANS};font-size:14px;line-height:20px;color:${INK};">${escapeHtml(detail.value)}</td>
                    </tr>`
    })
    .join('')

  return `<tr>
            <td class="px" style="padding:24px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${TICKET};border:1px solid ${HAIRLINE};border-radius:6px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${rows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
}

export function renderEmailLayout(
  content: EmailLayoutContent,
  url?: string | null,
  values: Record<string, string> = {},
): string {
  const safeUrl = url ? escapeHtml(url) : null
  const siteUrl = escapeHtml(appUrl())
  const logoUrl = escapeHtml(`${appUrl()}/brand/logo.png`)

  const preheader = content.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAGE};mso-hide:all;">${escapeHtml(content.preheader)}</div>`
    : ''
  const kicker = content.kicker
    ? `<td style="padding-left:8px;font-family:${SANS};font-size:11px;line-height:16px;color:${MUTED};">${escapeHtml(content.kicker)}</td>`
    : ''
  const cta =
    content.cta && safeUrl
      ? `<tr>
            <td class="px" style="padding:24px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${INK}" style="border-radius:6px;">
                    <a href="${safeUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 22px;font-family:${SANS};font-size:14px;line-height:20px;font-weight:600;color:${PAPER};text-decoration:none;border-radius:6px;">${escapeHtml(content.cta)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
      : ''
  const links = content.links?.length
    ? `<tr>
            <td class="px" style="padding:14px 32px 0 32px;">
              <p style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${MUTED};">
                Adicionar à sua agenda:
                ${content.links
                  .map(
                    (link, index) =>
                      `${index > 0 ? `<span style="color:${HAIRLINE};"> · </span>` : ' '}<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" style="color:${LINK};text-decoration:underline;">${escapeHtml(link.label)}</a>`,
                  )
                  .join('')}
              </p>
            </td>
          </tr>`
    : ''
  const expiry = content.expiry
    ? `<p style="margin:0;${DETAIL}">${escapeHtml(content.expiry)}</p>`
    : ''
  const ignore = content.ignore
    ? `<p style="margin:${content.expiry ? '6px' : '0'} 0 0 0;${DETAIL}">${escapeHtml(content.ignore)}</p>`
    : ''
  const finePrint =
    content.expiry || content.ignore
      ? `<tr>
            <td class="px" style="padding:22px 32px 0 32px;">
              ${expiry}${ignore}
            </td>
          </tr>`
      : ''
  const fallback = safeUrl
    ? `<tr>
            <td class="px" style="padding:18px 32px 0 32px;">
              <p style="margin:0;font-family:${SANS};font-size:11px;line-height:18px;color:${MUTED};">
                Se o botão não abrir, copie este endereço:<br>
                <a href="${safeUrl}" target="_blank" rel="noopener" style="color:${LINK};text-decoration:underline;word-break:break-all;">${safeUrl}</a>
              </p>
            </td>
          </tr>`
    : ''

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(content.title)}</title>
  <style>
    @media only screen and (max-width: 480px) {
      .px { padding-left: 20px !important; padding-right: 20px !important; }
      .email-title { font-size: 24px !important; }
      .detail-label { display: block !important; width: auto !important; padding-top: 12px !important; }
      .detail-value { display: block !important; padding-top: 2px !important; }
      .detail-row:first-child .detail-label { padding-top: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${PAGE};-webkit-text-size-adjust:100%;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${PAPER};border:1px solid ${HAIRLINE};border-radius:6px;">
          <tr>
            <td class="px" style="padding:28px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="40" height="40" align="center" valign="middle" bgcolor="#17130D" style="width:40px;height:40px;border-radius:6px;">
                    <img src="${logoUrl}" width="28" height="32" alt="Barbearia do Luiz" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;">
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <a href="${siteUrl}" target="_blank" rel="noopener" style="font-family:${SERIF};font-size:16px;line-height:20px;color:${INK};text-decoration:none;">Barbearia do Luiz</a><br>
                    <span style="font-family:${SANS};font-size:11px;line-height:16px;color:${MUTED};">Belo Horizonte, MG</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="px" style="padding:28px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="28" height="1" style="width:28px;border-top:1px solid ${BRASS};font-size:0;line-height:0;">&nbsp;</td>
                  <td style="padding-left:6px;font-family:${SANS};font-size:10px;line-height:10px;color:${BRASS};">&#9670;</td>
                  ${kicker}
                </tr>
              </table>
              <h1 class="email-title" style="margin:16px 0 0 0;font-family:${SERIF};font-size:28px;line-height:1.2;font-weight:400;color:${INK};">${escapeHtml(content.title)}</h1>
              <p style="margin:12px 0 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${TEXT};">${interpolateHtml(content.body, values)}</p>
            </td>
          </tr>
          ${renderDetails(content.details)}
          ${cta}
          ${links}
          ${finePrint}
          ${fallback}
          <tr>
            <td class="px" style="padding:28px 32px 28px 32px;">
              <div style="border-top:1px solid ${HAIRLINE};padding-top:16px;font-family:${SANS};font-size:11px;line-height:18px;color:${MUTED};">${escapeHtml(content.footer)}</div>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-family:${SANS};font-size:11px;line-height:18px;color:#655D50;">Barbearia do Luiz · Belo Horizonte, MG</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderAuthEmailText(
  content: AuthEmailContent,
  url: string,
  values: Record<string, string>,
): string {
  return [
    content.title,
    '',
    interpolateText(content.body, values),
    '',
    content.cta,
    url,
    '',
    content.expiry,
    content.ignore,
    '',
    content.footer,
  ].join('\n')
}

function renderAuthEmail(
  kind: AuthEmailKind,
  name: string,
  email: string,
  url: string,
): RenderedEmail {
  const content = AUTH_EMAIL_CONTENT[kind]
  const values = { name, email }

  return {
    subject: content.subject,
    html: renderEmailLayout(content, url, values),
    text: renderAuthEmailText(content, url, values),
  }
}

export function renderVerificationEmail(name: string, email: string, url: string): RenderedEmail {
  return renderAuthEmail('verification', name, email, url)
}

export function renderPasswordResetEmail(name: string, email: string, url: string): RenderedEmail {
  return renderAuthEmail('reset', name, email, url)
}
