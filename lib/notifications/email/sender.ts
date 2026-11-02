export interface EmailAttachment {
  filename: string
  contentBase64: string
}

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  attachments?: EmailAttachment[]
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>
}
