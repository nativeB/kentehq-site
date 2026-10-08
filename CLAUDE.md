# kentehq.com: company site for Kente HQ

Static site (`site/`, served by nginx in Docker). SEO/answer-engine checks: `./scripts/check.sh` (needs Docker). After editing page copy run `node scripts/gen-llms-full.mjs`; keep the FAQ JSON-LD in `site/index.html` identical to the visible FAQ, and bump `lastmod` in `site/sitemap.xml` for changed pages. Kente HQ is a product studio from Ghana with five SaaS products, each on its own subdomain.

## Task: polish the site into a real company homepage

The current page is a solid first draft: the brand idea is **kente cloth, separate strips woven into one cloth; each product is a strip**. Keep that idea and the existing copy's facts, and make it a page a payment-provider reviewer, a customer and a partner would all trust at a glance.

**Use the skills, in this order:** invoke `design-taste-frontend` and `emil-design-eng` with the Skill tool before writing code, read `high-end-visual-design`, then write a short `DESIGN.md` (direction, type, colour tokens, the "not doing" list) and commit it first.

**Requirements:**
- Static HTML/CSS only (a little vanilla JS is fine). No frameworks, no build step. Fonts from Google Fonts are fine.
- Hero that states what Kente HQ is. Make the woven-strip motif the one memorable visual, done with CSS/SVG, not stock images.
- The five products: name, who it's for, one-line value, and status. **Zoning Watchdog is Live** (link https://zoning.kentehq.com). The others are "Opening soon" with no dead links: Invoice Collector (invoices.kentehq.com), No-Show Recovery (dental.kentehq.com), Gatekeeper (creator.kentehq.com), Gift Ledger (gifts.kentehq.com).
- Trust section: billing via Dodo Payments as merchant of record, data handling, support at support@kentehq.com (shown as text, also a mailto link), based in Ghana, serving customers worldwide.
- Keep `/privacy`, `/terms`, `/refunds` (same content, restyled to match). Add a simple `/about`.
- SEO: title, description, Open Graph/Twitter tags, an OG image (1200×630, SVG-rendered to PNG or a static PNG), favicon (SVG + PNG).
- Light and dark mode. Works at 360px with no horizontal scroll. Respects reduced motion. Accessible focus states.
- No fake testimonials, logos, user counts or claims.
- Run `break-ui` (long product names, narrow widths) and `mobile-native` on the result.

**Done:** commit screenshots (`docs/screenshots/`, 1440px and 390px, light and dark) and open a PR titled `Polish kentehq.com` with the screenshots embedded and a "Skills used" section. Then stop.
