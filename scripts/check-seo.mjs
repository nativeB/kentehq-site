#!/usr/bin/env node
// SEO / answer-engine checks for kentehq.com. No dependencies (Node 18+).
//   node scripts/check-seo.mjs                          static checks on site/ only
//   node scripts/check-seo.mjs --base http://localhost:8080   also fetch the served site (raw HTML, no JS)
// scripts/check.sh builds the Docker image, serves it and runs both.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildLlmsFull, PAGES } from "./gen-llms-full.mjs";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const ORIGIN = "https://kentehq.com";
const argBase = process.argv.indexOf("--base");
const BASE = argBase > 0 ? process.argv[argBase + 1].replace(/\/$/, "") : null;

const AI_AND_SEARCH_BOTS = [
  "Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User",
  "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot",
];
const PRIVATE_PATHS = ["/app/", "/admin/", "/api/", "/pay/", "/review/", "/reset/"];
// Copy that must be in the raw HTML (what a crawler sees without running JavaScript).
const REQUIRED_COPY = {
  "/": ["Kente HQ is a product studio in Ghana", "Zoning Watchdog", "Invoice Collector", "No-Show Recovery",
    "Gatekeeper", "Gift Ledger", "Opening soon", "Live", "How Zoning Watchdog works", "Dodo Payments as merchant of record",
    "support@kentehq.com", "Accidental Genius LTD", "What is Kente HQ?", "How much do Kente HQ products cost?"],
  "/about": ["About Kente HQ", "Accidental Genius LTD", "Accra, Ghana", "support@kentehq.com"],
  "/privacy": ["Privacy policy", "What we collect", "European Union", "Your rights"],
  "/terms": ["Terms of service", "Acceptable use", "Dodo Payments is the merchant of record"],
  "/refunds": ["Refund policy", "within 14 days", "Dodo Payments"],
};

let failures = 0;
const fail = (where, msg) => { failures++; console.error(`FAIL ${where}: ${msg}`); };
const ok = (cond, where, msg) => { if (!cond) fail(where, msg); return cond; };

const unescape = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const meta = (html, attr, key) => {
  const m = html.match(new RegExp(`<meta\\s+${attr}="${key}"\\s+content="([^"]*)"`, "i"));
  return m ? unescape(m[1]) : null;
};
const visibleText = (html) => unescape(
  html.replace(/<head>[\s\S]*?<\/head>/, "").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
).replace(/\s+/g, " ");

function jsonLd(html, where) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const nodes = [];
  for (const b of blocks) {
    try {
      const data = JSON.parse(b);
      ok(data["@context"] === "https://schema.org", where, "JSON-LD @context must be https://schema.org");
      nodes.push(...(data["@graph"] || [data]));
    } catch (e) { fail(where, `JSON-LD does not parse: ${e.message}`); }
  }
  return nodes;
}

function checkPage(path, html, seen) {
  const where = path;
  const url = ORIGIN + path;
  ok(/<html lang="en">/.test(html), where, "missing <html lang=\"en\">");
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  ok(title && title.length >= 10 && title.length <= 70, where, `title missing or not 10-70 chars: ${title}`);
  const desc = meta(html, "name", "description");
  ok(desc && desc.length >= 50 && desc.length <= 170, where, `meta description missing or not 50-170 chars (${desc?.length})`);
  ok(!seen.titles.has(title), where, `duplicate title: ${title}`); seen.titles.add(title);
  ok(!seen.descs.has(desc), where, "duplicate meta description"); seen.descs.add(desc);
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  ok(canonical === url, where, `canonical ${canonical} != ${url}`);
  ok(!/noindex/i.test(meta(html, "name", "robots") || ""), where, "public page has meta robots noindex");
  for (const [attr, key] of [["property", "og:title"], ["property", "og:description"], ["property", "og:image"], ["property", "og:type"],
    ["name", "twitter:card"], ["name", "twitter:title"], ["name", "twitter:description"], ["name", "twitter:image"]]) {
    ok(meta(html, attr, key), where, `missing ${key}`);
  }
  ok(meta(html, "property", "og:url") === url, where, "og:url must equal the canonical URL");
  ok((html.match(/<h1[\s>]/g) || []).length === 1, where, "must have exactly one <h1>");
  for (const img of html.match(/<img\b[^>]*>/g) || []) ok(/\balt="/.test(img), where, `<img> without alt: ${img}`);
  for (const svg of html.match(/<svg\b[^>]*role="img"[^>]*>/g) || []) ok(/aria-label="[^"]+"/.test(svg), where, "svg role=img without aria-label");

  const text = visibleText(html);
  for (const copy of REQUIRED_COPY[path] || []) ok(text.includes(copy), where, `copy not in raw HTML: "${copy}"`);

  const nodes = jsonLd(html, where);
  const types = nodes.map((n) => n["@type"]);
  ok(nodes.length > 0, where, "no JSON-LD");
  ok(!JSON.stringify(nodes).includes("aggregateRating"), where, "aggregateRating present but there are no real reviews");
  if (path === "/") {
    for (const t of ["Organization", "WebSite", "SoftwareApplication", "FAQPage"]) ok(types.includes(t), where, `JSON-LD missing ${t}`);
    const org = nodes.find((n) => n["@type"] === "Organization");
    ok(org?.legalName === "Accidental Genius LTD", where, "Organization.legalName");
    ok(org?.contactPoint?.some((c) => c.email === "support@kentehq.com"), where, "Organization.contactPoint email");
    ok(org?.logo?.url, where, "Organization.logo");
    for (const app of nodes.filter((n) => n["@type"] === "SoftwareApplication")) {
      ok(app.name && app.applicationCategory && app.operatingSystem === "Web", where, `SoftwareApplication ${app.name} fields`);
      const offers = [].concat(app.offers || []);
      ok(offers.length && offers.every((o) => o.price !== undefined && /^[A-Z]{3}$/.test(o.priceCurrency)), where, `${app.name} offers need price + priceCurrency`);
    }
    // FAQPage must mirror the visible FAQ exactly, question and answer.
    const faq = nodes.find((n) => n["@type"] === "FAQPage");
    const visibleQs = [...html.matchAll(/<summary><h3>([\s\S]*?)<\/h3><\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [unescape(m[1]), unescape(m[2])]);
    ok(faq?.mainEntity?.length === visibleQs.length && visibleQs.length >= 5, where, "FAQPage question count must match the visible FAQ");
    (faq?.mainEntity || []).forEach((q, i) => {
      ok(q["@type"] === "Question" && q.acceptedAnswer?.["@type"] === "Answer", where, `FAQ item ${i} shape`);
      ok(visibleQs[i] && q.name === visibleQs[i][0] && q.acceptedAnswer?.text === visibleQs[i][1], where, `FAQ item ${i} differs from visible text: ${q.name}`);
    });
  } else {
    ok(types.includes("BreadcrumbList"), where, "JSON-LD missing BreadcrumbList");
    const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList");
    ok(crumbs?.itemListElement?.at(-1)?.item === url, where, "last breadcrumb must be this page");
  }
  return html;
}

function checkRobots(txt) {
  const where = "robots.txt";
  ok(txt.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), where, "missing Sitemap line");
  for (const bot of AI_AND_SEARCH_BOTS) ok(new RegExp(`^User-agent: ${bot}$`, "m").test(txt), where, `missing User-agent: ${bot}`);
  ok(!/^Disallow: \/\s*$/m.test(txt), where, "a group disallows the whole site");
  for (const group of txt.split(/\n\s*\n/).filter((g) => /^User-agent:/m.test(g))) {
    ok(/^Allow: \/$/m.test(group), where, "every group must Allow: /");
    for (const p of PRIVATE_PATHS) ok(group.split("\n").includes(`Disallow: ${p}`), where, `group missing Disallow: ${p}`);
  }
}

function checkSitemap(xml) {
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const locs = urls.map((u) => (u.match(/<loc>([^<]+)<\/loc>/) || [])[1]);
  urls.forEach((u, i) => ok(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(u), "sitemap.xml", `no lastmod for ${locs[i]}`));
  ok(JSON.stringify(locs.sort()) === JSON.stringify(PAGES.map(([, p]) => ORIGIN + p).sort()), "sitemap.xml", `URLs ${locs} do not match public pages`);
}

function checkLlms(llms, full, homeHtml) {
  ok(llms.startsWith("# Kente HQ\n\n> "), "llms.txt", "must start with '# Kente HQ' and a '>' summary (llmstxt.org)");
  for (const [, p] of PAGES) ok(llms.includes(`(${ORIGIN}${p})`), "llms.txt", `no link to ${ORIGIN}${p}`);
  ok(llms.includes(`${ORIGIN}/llms-full.txt`), "llms.txt", "no link to llms-full.txt");
  for (const m of homeHtml.matchAll(/<summary><h3>([\s\S]*?)<\/h3><\/summary>/g)) ok(full.includes(unescape(m[1])), "llms-full.txt", `missing FAQ "${m[1]}"`);
}

// --- Static checks on the files in site/ ---
const read = (f) => readFileSync(join(SITE, f), "utf8");
{
  const seen = { titles: new Set(), descs: new Set() };
  for (const [file, path] of PAGES) checkPage(path, read(file), seen);
  checkRobots(read("robots.txt"));
  checkSitemap(read("sitemap.xml"));
  checkLlms(read("llms.txt"), read("llms-full.txt"), read("index.html"));
  ok(read("llms-full.txt") === buildLlmsFull(), "llms-full.txt", "stale: run node scripts/gen-llms-full.mjs");
}

// --- HTTP checks against the served site (nginx), raw HTML only ---
if (BASE) {
  const get = (path) => fetch(BASE + path, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } });
  const secHeaders = (res, where) => {
    ok(res.headers.get("x-content-type-options") === "nosniff", where, "X-Content-Type-Options header missing");
    ok(res.headers.get("referrer-policy") === "strict-origin-when-cross-origin", where, "Referrer-Policy header missing");
  };
  const seen = { titles: new Set(), descs: new Set() };
  const internal = new Set();
  let home = "";
  for (const [, path] of PAGES) {
    const res = await get(path);
    if (!ok(res.status === 200, path, `HTTP ${res.status}`)) continue;
    ok(/^text\/html; charset=utf-8$/i.test(res.headers.get("content-type")), path, `content-type ${res.headers.get("content-type")}`);
    ok(!/noindex/i.test(res.headers.get("x-robots-tag") || ""), path, "public page sent X-Robots-Tag noindex");
    secHeaders(res, path);
    // ld+json is data, never executed, so a CSP script-src cannot block it; flag a CSP anyway so this check is revisited.
    if (res.headers.get("content-security-policy")) console.log(`note ${path}: CSP present: ${res.headers.get("content-security-policy")}`);
    const html = checkPage(path, await res.text(), seen);
    if (path === "/") home = html;
    for (const m of html.matchAll(/href="(\/[^"#]*)/g)) internal.add(m[1] || "/");
  }
  for (const link of internal) {
    const res = await get(link);
    ok(res.status === 200, "internal link", `${link} -> HTTP ${res.status}`);
  }
  const text = async (path, type) => {
    const res = await get(path);
    ok(res.status === 200, path, `HTTP ${res.status}`);
    ok(res.headers.get("content-type")?.startsWith(type), path, `content-type ${res.headers.get("content-type")}`);
    secHeaders(res, path);
    return res.text();
  };
  checkRobots(await text("/robots.txt", "text/plain"));
  checkSitemap(await text("/sitemap.xml", "text/xml"));
  checkLlms(await text("/llms.txt", "text/plain"), await text("/llms-full.txt", "text/plain"), home);
  for (const [from, to] of [["/index.html", "/"], ["/about.html", "/about"], ["/privacy.html?x=1", "/privacy?x=1"]]) {
    const res = await get(from);
    ok(res.status === 301 && new URL(res.headers.get("location"), BASE).pathname + new URL(res.headers.get("location"), BASE).search === to,
      from, `expected 301 to ${to}, got ${res.status} ${res.headers.get("location")}`);
  }
  for (const p of ["/app", "/admin/", "/api/x", "/pay/abc123", "/review/tok", "/reset/tok"]) {
    const res = await get(p);
    ok(res.status === 404 && /noindex/.test(res.headers.get("x-robots-tag") || ""), p, `expected 404 + X-Robots-Tag noindex, got ${res.status} ${res.headers.get("x-robots-tag")}`);
  }
}

if (failures) { console.error(`\n${failures} check(s) failed`); process.exit(1); }
console.log(`SEO checks passed (${BASE ? "static + " + BASE : "static only"})`);
