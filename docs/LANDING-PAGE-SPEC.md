# LANDING-PAGE-SPEC — Barbearia do Luiz

> Public entry page. Source: Figma `1-home` (390×844). Short, image-led, one job: get the customer into the catalog.

## Goal

In 10 seconds: “Barbearia do Luiz. Corte, barba e resenha de alto padrão. Agende agora.” One primary action. No long marketing page.

## Structure

### 1. Hero image

- Full-bleed barbershop image, 260px tall on mobile.
- Dark gradient overlay from left/bottom into `--background`.
- Top row: green “ABERTO AGORA” badge (only when the shop is open) and a compact “Entrar” link.
- Brand block:
  - `BARBEARIA DO LUIZ` — Inter 900, 28px, `--accent`, tracking 1px.
  - `Corte, Barba e Resenha de Alto Padrão` — Inter 400, 13px, white 80%.

The “Entrar” link is the only addition to the Figma home. It is required to reach login and account screens from the public page.

### 2. Quick booking card

- Card `--surface`, 1px border, radius 16, padding 16.
- Label: `PRONTO PARA DAR UM TAPA NO VISUAL?` — 13px 600 uppercase, `--accent`.
- Button: `AGENDAR AGORA` — primary orange, full width, 48px, radius 12.
- Route: `/servicos`.

### 3. Info card

- Address row: Lucide `map-pin`, orange stroke.
  - `Rua dos Geólogos, 698 — Alípio de Melo, BH`
- Hours rows: Lucide `clock`, orange stroke.
  - `Segunda a Sexta: 9h às 20h`
  - `Sábado: 9h às 18h`
- Values are placeholders until the real shop data is confirmed.

### 4. Perks row

- Section title: `Nossos Produtos e Diferenciais` — 15px 700.
- Three equal cards, 110px tall, `--surface`, radius 12:
  - Pomadas Premium
  - Óleos & Balm
  - Cerveja Gelada
- Each has a small image and a 12px 700 label.
- Cards link to `/loja`.

### 5. Socials

- Centered row: Instagram, Facebook, WhatsApp.
- Lucide icons, 24px, `--accent`.
- Instagram and Facebook open the shop profiles. WhatsApp opens `wa.me` with the shop number.

### 6. Footer

- `© 2026 Barbearia do Luiz`.
- Links: `Privacidade` and `Entrar`.
- One muted line: `Feito em Belo Horizonte`.

## Desktop adaptation

No desktop Figma frame exists. Compose the same content, not a new page:

- Max width 1120px, centered.
- Hero becomes two columns: brand + CTA left, image right, 420px tall.
- Info card and perks row sit side by side.
- Socials remain centered below.
- No About, Team, Services grid, testimonial carousel, pricing table, blog, or long footer.

## Copy tone

- Direct, local, numbers over adjectives.
- PT-BR only.
- Examples: `Corte clássico, barba alinhada`, not `AI-powered grooming`.
- No invented claims. No “melhor da cidade”.

## CTA behavior

- `AGENDAR AGORA` → `/servicos`.
- `Entrar` → `/entrar`; if already authenticated → `/conta/agendamentos`.
- Perk cards → `/loja`.
- WhatsApp → `https://wa.me/<shop-number>`.
- If the shop is closed, hide `ABERTO AGORA` and show `FECHADO` in muted gray. Do not disable booking; future slots remain bookable.
- If there are no active services, show an empty state: `Nenhum serviço disponível — fale com a barbearia`.

## SEO and meta

- Title: `Barbearia do Luiz — Agende seu horário`
- Description: `Corte, barba e resenha de alto padrão em Belo Horizonte. Escolha serviço, profissional e horário.`
- OG image: hero image + `BARBEARIA DO LUIZ` + `AGENDAR AGORA`.
- `lang="pt-BR"`.
- One `h1`: the shop name.
- LocalBusiness JSON-LD with address, hours, phone, and sameAs social links.

## Responsive

- Mobile 390px: stacked, 20px side padding.
- Tablet: hero two columns at `md`.
- Desktop: 1120px max content, no horizontal scroll.
- Images use `next/image`, fixed aspect ratios, and priority only on the hero.

## Accessibility

- Hero image has meaningful `alt` or is decorative with empty `alt` if the copy carries the meaning.
- `ABERTO AGORA` has text, not color alone.
- Social icon links have `aria-label`.
- Focus ring visible on every link and button.

## Out of scope

Pricing table, testimonials carousel, blog, i18n, online checkout, long About/Services/Team sections, stock photos beyond seeded assets.

## Acceptance

- Renders at `/` at 390px and 1440px without horizontal scroll.
- Every CTA routes correctly.
- Open/closed badge matches shop hours in `America/Sao_Paulo`.
- No text says `Clip`.
- Lighthouse performance and accessibility ≥ 90 on the landing page.
