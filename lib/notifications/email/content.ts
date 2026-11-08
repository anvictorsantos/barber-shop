export type AuthEmailKind = 'verification' | 'reset' | 'activation'

export interface AuthEmailContent {
  subject: string
  /** Hidden preview text shown by inbox clients. */
  preheader: string
  /** Sentence-case label next to the razor rule. */
  kicker: string
  title: string
  /** `{name}` and `{email}` are replaced by the renderer. */
  body: string
  cta: string
  expiry: string
  ignore: string
  footer: string
}

export const AUTH_EMAIL_CONTENT: Record<AuthEmailKind, AuthEmailContent> = {
  verification: {
    subject: 'Confirme seu e-mail',
    preheader: 'Falta um passo para ativar sua conta.',
    kicker: 'Sua conta',
    title: 'Confirme seu e-mail',
    body: 'Olá, {name}. Falta um passo para ativar sua conta: confirme {email} pelo botão abaixo.',
    cta: 'Confirmar e-mail',
    expiry: 'O link expira em 24 horas.',
    ignore: 'Se você não criou esta conta, ignore este e-mail.',
    footer: 'Você recebeu este e-mail porque tem uma conta na Barbearia do Luiz.',
  },
  reset: {
    subject: 'Redefina sua senha',
    preheader: 'Redefina a senha da sua conta. O link expira em 30 minutos.',
    kicker: 'Sua conta',
    title: 'Escolha uma nova senha',
    body: 'Olá, {name}. Pediram para redefinir a senha de {email}. Use o botão abaixo para escolher uma nova.',
    cta: 'Redefinir senha',
    expiry: 'O link expira em 30 minutos e funciona uma única vez.',
    ignore: 'Se não foi você, ignore este e-mail. Sua senha continua a mesma.',
    footer: 'Você recebeu este e-mail porque tem uma conta na Barbearia do Luiz.',
  },
  activation: {
    subject: 'Defina sua senha — Barbearia do Luiz',
    preheader: 'Ative sua conta e acompanhe seus agendamentos.',
    kicker: 'Sua conta',
    title: 'Defina sua senha',
    body: 'Olá, {name}. Use o link abaixo para ativar {email} e definir sua senha.',
    cta: 'Definir senha',
    expiry: 'O link expira em 24 horas.',
    ignore: 'Se você não fez um agendamento, ignore este e-mail.',
    footer: 'Você recebeu este e-mail porque fez um agendamento na Barbearia do Luiz.',
  },
}
