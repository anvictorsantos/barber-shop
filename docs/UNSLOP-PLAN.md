# Unslop plan — Barbearia do Luiz

A screen-by-screen plan to take the interface from "vibecoded dark theme" to a barbershop with
its own character. Features, content and section order stay. Every size, color, word and image
becomes deliberate.

## Direction

- **Product.** A neighbourhood barbershop in Belo Horizonte: clients book a cut, a beard trim or
  a grooming product; the owner and barbers run the day from the admin.
- **Character.** Warm, precise, unhurried.
- **World.** A barbershop at dusk: charcoal walls, walnut, worn leather, cold steel, tungsten
  light and brass fittings, cream paper tickets.
- **Moments.** The homepage scene in warm light; the shop's rendered product objects; the
  loyalty card as a physical card; the admin revenue chart as an instrument.
- **Signature.** The "razor rule": a brass hairline ending in a 45° notch, used on section labels
  and active states. Small two-digit index numbers mark sequences.

## Palette and type

Keep the real brand: the gold crest, the warm dark. Replace the cold blue-grey neutrals with a
warm graphite ramp, keep brass as the single accent, and let burnt orange live only inside
materials (leather, ember). Text has three roles. Semantic colors are muted.

- Ink `#121110`, shell `#0c0b0a`, surface `#1a1815`, raised `#211e1a`.
- Text `#f2ece1`, secondary `#cdc5b8`, muted `#9a9285`.
- Brass `#c8974a` with ink text `#17120a`. Success `#8fae86`, danger `#cf7a68`.
- Interface: Inter 400/500. Display: Playfair 500/600. No 700–900 headings.
- Sentence case everywhere. No uppercase + tracking labels.

## Audit

### Global

- Uppercase, wide-tracked gold eyebrow on almost every page (`text-label font-bold uppercase
  tracking-[1.8px]`).
- Inter 800/900 (`font-black`, `font-extrabold`) used for headings and numbers.
- Every card ends in a filled accent button; the accent repeats until it stops meaning anything.
- Filled orange sidebar rows, orange progress bars, orange switches, orange badges.
- Colored icon tiles, colored section icons, decorative check chips.
- Gradient hairline with a glow under the hero (`linear-gradient` + `shadow-[0_0_24px]`).
- Empty image placeholders with a lone line icon on service, product, team and service-detail
  surfaces (largest visual gaps).
- Cookie banner is a full-width uppercase bar; the privacy modal has a scale transition.
- Default white Next.js 404 on a dark product.

### Home

- Giant centered crest, all-caps 34px headline, all-caps status label, `animate-ping` dot.
- Decorative gradient strip with glow.
- Vertical "NOSSA EQUIPE" at 0.35em tracking; radial-gradient monogram tiles; dark gradient wash
  over the cards.
- Three equal stat blocks with icons and all-caps labels, stacked tall on mobile.
- Reviews pasted on a cream band with all-caps headings and gold tracked names.

### Services

- Gold 9px uppercase category on every card, same scissors icon tile for every service, price in
  accent, orange button on every card. All cards identical.
- Filter pills in orange.
- Generic page title not tied to a specific service.

### Service detail

- 650×402 empty placeholder with a lone scissors icon.
- Generic H1 "Detalhes do serviço" above the real service name.
- "PROMO COMBO" tracked badge; three check chips.
- Price and CTA are the only hierarchy.

### Shop

- Four cards with a giant empty square and a package icon.
- Bright green "Em estoque" pill on every card.
- Gold tracked eyebrow.

### Auth

- "BEM-VINDO DE VOLTA" tracked eyebrow.
- Two icon tiles as benefit decoration.
- Orange primary button, orange-bordered guest button, orange links.
- Card tabs both look selected.

### Customer account (batch 3)

- Orange gradient loyalty card (`--loyalty-gradient`) and orange ring avatars.
- "GOLD MEMBER" badge, "NÍVEL GOLD" tracked label, star row.
- Four identical quick-action tiles, three orange CTA tiles.
- Tables with uppercase headers; single-bar "Gastos por mês" chart with dead space.

### Booking (batch 2)

- Four-step progress with orange current step and orange numbers.
- Huge gold outlined initial circles as avatars.
- Selected barber card uses orange border plus orange button; bottom duplicate CTA.
- Summary rail repeats the accent button.

### Admin (batch 4)

- Filled orange sidebar row; green uppercase "BARBEARIA ABERTA" pill; orange notification badge.
- Four stat cards with decorative icons, extrabold figures, no comparison framing.
- Revenue area chart is a single spike with a gradient fill and no context; finance chart same.
- Uppercase table headers, colored status pills, no tabular figures.
- "Novo agendamento" amber button next to the period picker.

## Per-page plan

| Page | Problems | Plan |
| --- | --- | --- |
| `/` | Shouty all-caps hero, giant crest, gradient strip, heavy placeholders, all-caps stats | Full-bleed barbershop scene with text on the calm left; sentence-case serif headline; quiet status line; one primary + one text action. Team as monogram cards with index numbers. Stats as a quiet hairline band. Reviews as cream paper with serif heading, no stars. |
| `/servicos` | Repeated icon tiles, orange button per card, gold 9px labels | Editorial list: real category photography, category as muted caption, name, duration, price, quiet "Agendar →". Filters as text tabs with a brass underline. Sidebar summary quieted. |
| `/servicos/[slug]` | Empty hero image, generic H1, promo badge | Real service photograph; breadcrumb + service name as H1; price and duration in one line; inclusions as a hairline list; one primary CTA; promo as brass text. |
| `/loja` | Empty product squares, green pills | Code-rendered product objects (tin, bottle, dropper, glass) on a warm panel; price and stock as quiet text; favourite heart quiet. |
| `/entrar` and modes | Greeting eyebrow, icon tiles, orange links/buttons | Section label + serif headline about the account; numbered benefit list; quiet card with segmented tabs; brass primary; guest as text link. |
| `/privacidade` | Unstyled placeholder | Quiet prose page with the shared header/footer treatment. |
| 404 | Default white page | Dark not-found page with crest, serif title and two quiet links. |
| `/carrinho` | Checkout step shown when empty; empty state generic | Batch 2: only show progress with items; empty state as a service invitation. |
| `/agendar/*` | Loud progress, placeholder avatars, duplicate CTAs | Batch 2: quiet numbered progress, monogram avatars, one CTA per step, selection as a hairline + brass mark. |
| `/pedido/[code]` | Uppercase status, tracking badges | Batch 2: ticket-like order page with quiet status and receipt typography. |
| `/conta/*` | Gradient loyalty card, over-badged profile, orange CTAs, weak charts | Batch 3: physical loyalty card in cream + brass stock; quiet stat rows; tables with sentence-case headers; charts replaced by deliberate small visuals. |
| `/admin` | Loud sidebar, green pill, icon stat cards, single-spike chart | Batch 4: instrument-like revenue chart as the screen's moment; stat cards as figures with comparison lines; quiet sidebar selection. |
| `/admin/agenda` | Loud empty state and date chrome | Batch 4: timeline-first layout, quiet toolbar, clear day state. |
| `/admin/clientes` + detail | Uppercase headers, colored pills, dense rows | Batch 4: sentence-case headers, status as dot + text, aligned numeric columns. |
| `/admin/catalogo` | Bright status pills, tab duplication | Batch 4: quiet list rows with edit affordances, status text. |
| `/admin/financeiro` | Spike chart, uppercase headers, yellow period button | Batch 4: period as text switch, chart with context (bars for sparse days), aligned table. |
| `/admin/configuracoes` | Form-heavy, inherited slop | Batch 4: sectioned settings with hairline dividers and clear save states. |

## Batches

1. **Public surfaces (this PR).** Tokens, type, buttons, cards, inputs, status, header, footer,
   consent banner; home, services, service detail, shop, auth modes, privacy, 404.
2. **Booking and checkout.** Booking progress, professional, time, summary, cart, order.
3. **Customer account.** Shell, nav, appointments, history, favourites, profile, loyalty card.
4. **Admin.** Shell, nav, dashboard, agenda, clients, catalogue, finance, settings.

Each batch ships as its own PR. The next batch starts after the previous one merges.
