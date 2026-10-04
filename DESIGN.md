# kentehq.com design

## Design read

A company homepage for three readers at once: a payment-provider reviewer checking that
the business is real, a customer looking for the product they heard about, and a partner
deciding whether to email us. Trust-first, with one memorable visual.

Dials (design-taste-frontend): **VARIANCE 5 / MOTION 3 / DENSITY 4**. Trust-first pulls
variance and motion down from the landing-page default; the page should read as calm and
specific, not as an agency showcase.

## Direction

**One cloth, five strips.** Kente is woven in narrow strips that are then sewn edge to
edge into one cloth. Each Kente HQ product is a strip. The hero shows the cloth: five
vertical strips, each with its own woven pattern, sewn together with thin seams. Each
product card carries its strip as a swatch down its edge, so the motif links the hero to
the products instead of only decorating it.

The cloth is inline SVG (`<pattern>` per product), no images. It is the only decorative
element on the page; everything else is type, spacing and hairlines.

Layout families, one per section:

1. **Hero:** split. Text left, cloth right. Stacks on mobile with the cloth shortened.
2. **Products:** featured + grid. The live product (Zoning Watchdog) gets a full-width card
   with its link; the four "Opening soon" products sit in a 2x2 grid (1 column on mobile).
   Five items, five cells.
3. **How we work (trust):** headline column + definition list of plain facts (billing,
   data, support, where we are).
4. **Contact:** one large email address, as text and as a `mailto:` link.

## Type

- Display: **Bricolage Grotesque** 600, tight tracking. Replaces Fraunces (the skill's
  most-flagged default serif); a grotesk with a little character suits a software studio.
- Body: **Instrument Sans** 400/500/600, kept from the first draft for continuity.
- Scale: h1 `clamp(2.25rem, 5vw, 3.75rem)` / h2 `clamp(1.6rem, 3vw, 2.25rem)` / h3 22px /
  body 17px / small 14px. Line length capped at 60-65ch.

## Colour tokens

UI colours (one accent: kente green). Neutrals are true greys, not cream.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | `#f6f6f4` | `#121211` | page |
| `--surface` | `#fcfcfb` | `#1a1a18` | cards |
| `--fg` | `#141413` | `#ecebe6` | text |
| `--muted` | `#5b5a55` | `#a4a39c` | secondary text (AA on bg and surface) |
| `--line` | `#e1e0db` | `#2c2b28` | hairlines, card borders |
| `--accent` | `#1d6a43` | `#5cbb88` | links, focus ring, Live status, primary button |
| `--accent-ink` | `#fcfcfb` | `#0f1a14` | text on accent |

Thread colours (cloth only, never UI chrome). Same in both modes: the cloth is a physical
object and does not invert.

| Token | Value |
| --- | --- |
| `--t-gold` | `#d9a521` |
| `--t-green` | `#1f7a4a` |
| `--t-red` | `#b8352c` |
| `--t-blue` | `#22508f` |
| `--t-ink` | `#161512` |

Shape rule: cards 14px radius, buttons and status pills full-pill, cloth strips 2px.

## Motion

- Hero strips settle into place once on load (translateY 20px + opacity, 700ms,
  `cubic-bezier(0.23, 1, 0.32, 1)`, 70ms stagger). Purpose: the strips come together into
  one cloth. Seen once per visit.
- Buttons: `scale(0.97)` on `:active`, 160ms ease-out. Hover colour changes gated behind
  `(hover: hover) and (pointer: fine)`.
- `prefers-reduced-motion: reduce` removes all movement.

## Not doing

- No testimonials, logo walls, user counts, ratings or "trusted by" claims. We have none.
- No stock or generated photography; the cloth is the visual (task requirement, and fake
  imagery undermines a trust page).
- No fake product screenshots or div-built dashboards.
- No dead links: "Opening soon" products show their subdomain as plain text, not a link.
- No double-bezel cards, floating glass nav, scroll-reveal on every block, or magnetic
  buttons from high-end-visual-design. They fight the trust-first read; we take its
  spacing, custom easing and restraint on shadows instead.
- No eyebrows, section numbers, decorative dots (the Live dot is real state), em-dashes,
  scroll cues or locale strips.
- No sticky header, no frameworks, no build step, no tracking scripts.
- No light/dark section flipping: one theme per page, following the system setting.
