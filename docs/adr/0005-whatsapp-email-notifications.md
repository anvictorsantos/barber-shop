# ADR 0005 — WhatsApp and email notifications, calendar as links

- Status: accepted
- Date: 2026-11-01

## Context

Customers must receive WhatsApp and email messages after booking. The Figma confirmation screen shows WhatsApp reminders, and the settings screen shows a 24-hour reminder toggle. The user explicitly asked to copy the email structure, configuration, and provider approach from `pacepilot`. SMS is optional in the Figma settings and was ruled out. Google Calendar and Instagram appear as “connected” in the mock settings.

## Decision

- **Email:** Resend through plain `fetch`, with the `EmailSender` port, factory, console adapter, and inline-table templates copied from `pacepilot`.
- **WhatsApp:** Meta WhatsApp Cloud API through plain `fetch`, with the same port/factory/console-adapter shape.
- **Messages:** booking confirmation, 24-hour reminder, cancellation, reschedule, receipt link, no-show block, OTP, email verification, password reset.
- **Calendar:** ICS attachment plus a Google Calendar link in the confirmation page and email. No OAuth sync.
- **Instagram:** profile link only. No API.
- **SMS:** not implemented and hidden.
- **Failure policy:** delivery is best-effort and logged. A provider outage never rolls back a booking or payment.
- **Idempotency:** `NotificationLog.dedupeKey` prevents duplicate reminders and confirmations.
- **Cron:** hourly reminder scan for appointments 23–25 hours away.

## Consequences

- Meta business verification and approved message templates are production prerequisites.
- Templates are language-specific and business-initiated; each kind needs an approved template name in env.
- Local development uses console adapters; the UI must work with notifications disabled.
- Calendar is a file/link, not a live sync; the Figma “Conectado” badge must be honest or omitted.
- Notification logs become the audit trail for support.

## Alternatives considered

- **Twilio WhatsApp** — faster sandbox, higher per-message cost and another vendor.
- **`wa.me` link only** — no automatic confirmation, fails the requirement.
- **Google Calendar OAuth sync** — real value, but a separate consent flow, token storage, and two-way conflict rules.
- **SMS** — extra cost and no requirement.
