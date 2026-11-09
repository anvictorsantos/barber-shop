# DESIGN-GUIDELINES — Barbearia do Luiz

> Visual language for the web app. Source of truth: Figma mobile (390×844) and desktop (1440×900) screens. Dark luxury barbershop: orange energy, gold highlights, dense queue, premium but calm.

## Principles

- **Chair first.** Service, time, barber, and price are the loudest things on screen. Labels are quiet.
- **One primary, one accent.** Orange `#D35F27` means action. Gold `#EAA83A` means value, emphasis, and brand. Never use them as decoration.
- **Dark, not neon.** No glow, no glass, no light mode. Surfaces are flat with thin borders.
- **Density with air.** Queue rows and tables are compact; cards get breathing room. The barber must read the day at a glance.
- **Mobile customer, desktop staff.** Customer screens are designed at 390px first. Admin screens are designed at 1440px first.

## Tokens

```css
:root {
  --background: #121316;
  --shell: #0E0F12;
  --surface: #1C1D22;
  --surface-input: #16171C;
  --surface-subtle: #1F2026;
  --surface-active: rgba(255, 255, 255, 0.04);

  --primary: #D35F27;
  --primary-hover: #E06D35;
  --accent: #EAA83A;
  --accent-hover: #F2B64F;

  --text: #FFFFFF;
  --text-secondary: #E5E7EB;
  --muted: #9CA3AF;
  --subtle: #6B7280;
  --inactive: #4B5563;

  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;

  --border: rgba(255, 255, 255, 0.07);
  --border-strong: rgba(255, 255, 255, 0.10);
  --border-active: rgba(255, 255, 255, 0.16);

  --primary-soft: rgba(211, 95, 39, 0.13);
  --accent-soft: rgba(234, 168, 58, 0.13);
  --success-soft: rgba(16, 185, 129, 0.10);
  --danger-soft: rgba(239, 68, 68, 0.10);

  --loyalty-gradient: linear-gradient(90deg, #D35F27 0%, #823714 100%);

  --radius-xs: 6px;
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-shell: 24px;

  --shadow-card: 0 10px 20px rgba(0, 0, 0, 0.25);
  --shadow-primary: 0 4px 12px rgba(211, 95, 39, 0.20);
}
```

No other colors. Use opacity on white for dividers and disabled states. Status colors only on status elements.

## Typography

- **Display:** Inter (variable). Brand, hero, large identity moments, at the heavier end of the scale.
- **UI:** Inter 400/500/600/700/800/900. Everything else.
- Load with `next/font`: `Inter` only.

| Role | Size / line | Weight |
|---|---|---|
| Brand desktop | 24 / 32 | Inter 900, tracking 1px |
| Brand mobile | 28 / 37 | Inter 900, tracking 1px |
| Page title | 20 / 24 | Inter 800 |
| Section title | 16 / 19 | Inter 700 |
| Card title | 15 / 18 | Inter 700 |
| Body | 13 / 16 | Inter 400 |
| Body strong | 13 / 16 | Inter 700 |
| Label | 11 / 13 | Inter 700, uppercase, tracking 0.08em |
| Metric | 22 / 27 | Inter 800 |
| Metric large | 28 / 34 | Inter 900 |
| Caption | 12 / 15 | Inter 400 |
| Micro | 10 / 12 | Inter 700 |

Numbers use `font-variant-numeric: tabular-nums`. BRL via `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

## Layout

- Customer max width: 420px content, centered, with full-bleed hero.
- Desktop content: `max-w-[1440px]`, 40px page padding.
- Admin shell: sidebar 260px, main flexible, optional queue rail 320px.
- Admin content padding: 32px; card gaps 16–24px.
- Bottom nav on mobile customer: 2–4 items depending on role. Admin has no bottom nav.
- Cards: `background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20–24px`.
- Thin dividers: 1px `var(--border)`.
- Radii follow the token scale. Pills and avatars use full radius.

## Components

| Component | Shape |
|---|---|
| Primary button | `--primary`, white text, 700, radius 12, height 48–52 |
| Outline button | transparent, `--border`, white text |
| Danger button | transparent, `--danger` border and text |
| Gold button | `--accent`, `--background` text, 700 |
| Icon button | 38–40px square, `--surface`, 1px border, radius 10 |
| Card | `--surface`, 1px border, radius 16 |
| Stat card | label 13 muted, metric 22 800, icon tile 44px soft |
| Service card | image 70px, name 12 700, price 13 700 accent, mini CTA 26px |
| Barber card | avatar 64px with 2px accent ring, name 16 700, rating 10 accent, availability line 12 success |
| Product card | image 56px, name 14 800, price 15 800 accent, stock status |
| Queue row | time 12 700 accent, status pill, client 14 700, service 12 muted |
| Status pill | 10 700, radius 4, soft background + status color |
| Slot picker | calendar + selectable rows; each row 44px, clock icon, time 14 700, radio control on the right |
| Calendar | 7-column grid, 36px cells, selected `--primary`, availability dot accent |
| Toggle | 36×20 track, 14px knob; on `--primary`, off `--inactive` |
| Input | `--surface-input`, 1px border, radius 8, 40px tall, 13px text |
| Search | leading Lucide search icon, muted placeholder |
| Table | header 12 700 muted, rows 13, 14px vertical padding, divider lines |
| Chart | Recharts. Bars `--accent` at 40% opacity; current month `--primary`; labels muted 12 |
| Loyalty card | gradient, radius 20, stamp count 28 900, progress track white 20%, fill accent |
| Stamp grid | 48px circles, earned `--primary-soft` + primary border + check, empty `--background` + border |
| Empty state | icon, title, one line, CTA |
| Skeleton | surface pulse blocks matching final row height |
| Toast | bottom center on mobile, bottom right on desktop, dark surface, status icon |
| Modal/drawer | desktop centered 480–560px; mobile bottom sheet |

## Icons

- **Lucide only** via `lucide-react`. One consistent stroke width (2px).
- Names match Figma: `layout-dashboard`, `calendar`, `users`, `scissors`, `dollar-sign`, `settings`, `bell`, `chevron-left`, `chevron-right`, `chevron-down`, `clock`, `map-pin`, `message-circle`, `heart`, `star`, `trash-2`, `download`, `camera`, `search`, `check`, `refresh-cw`, `award`, `shopping-bag`, `droplet`, `bottle-wine`, `tag`, `shield-check`, `edit-2`, `plus`.
- No emoji in UI. No custom SVG icon set.

## Charts

- Library: Recharts.
- Dark tooltip surface, 1px border, 12px text.
- Monthly revenue: bars, active month primary, others accent/40%.
- Expense chart: same grammar, smaller.
- Always include an accessible summary, e.g. `aria-label="Faturamento mensal: ..."` plus a visually hidden table.

## States

- **Loading:** skeletons shaped like the final content. No spinner-only screens.
- **Empty:** icon, noun-first title, one sentence, one CTA. Examples: “Nenhum agendamento hoje — ver disponibilidade”, “Nenhum produto no carrinho — abrir loja”.
- **Error:** inline message under the field, or a toast for submit failures. Keep the form values.
- **Success:** toast, then route change. Confirmation pages are explicit screens, not toasts.
- **Disabled:** 40% opacity, cursor not-allowed, no hover.

## Motion

- 150–200ms ease-out for hover, focus, toggles, drawers.
- No looping animation, no parallax, no confetti.

## Accessibility

- Text contrast ≥ 4.5:1. Muted text on `--surface` passes; do not go lighter than `--muted` for body copy.
- Focus ring: 2px `--accent` with 2px offset.
- Click targets ≥ 44px on mobile.
- Slot picker is a radio group, not a set of switches, even if the visual control looks like a switch.
- Charts, stamp grids, and calendars have text alternatives.
- Forms have labels and error text tied by `aria-describedby`.
- No information conveyed by color alone; status pills include text.

## What not to do

- No light default. No theme toggle in v1.
- No glassmorphism, neumorphism, glow, or heavy gradients.
- No second serif, no second sans, no font weights outside the scale.
- No marketing adjectives on admin screens. Labels are nouns: “Hoje”, “Próximos”, “Histórico”.
- No stock-photo filler beyond seeded service/product/barber images.
- No emoji as icons.
- No green as a primary action. Green means success only.
- No destructive action without confirmation.

## File location

- Tokens: `app/globals.css` (CSS custom properties) and `tailwind.config.ts` (theme mapping).
- UI primitives: `components/ui/*`.
- Shells: `components/layout/*`.
- Charts: `components/charts/*`.
- Icons: imported directly from `lucide-react`; no local icon files.
