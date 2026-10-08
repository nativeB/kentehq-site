#!/usr/bin/env node
// Writes site/llms-full.txt: the readable text of every public page as Markdown, for AI answer engines.
// Run after editing page copy: node scripts/gen-llms-full.mjs   (check-seo.mjs --static fails if it is stale)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const BASE = "https://kentehq.com";
export const PAGES = [
  ["index.html", "/"],
  ["about.html", "/about"],
  ["privacy.html", "/privacy"],
  ["terms.html", "/terms"],
  ["refunds.html", "/refunds"],
];

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
const unescape = (s) => s.replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? m);
const abs = (href) => (href.startsWith("/") ? BASE + href : href);

function toMarkdown(html) {
  let s = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
  s = s
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<figure[\s\S]*?<\/figure>/g, "")
    .replace(/<div class="actions">[\s\S]*?<\/div>/g, "")
    .replace(/<\/a><a /g, "</a> · <a ")
    // Ordered steps ("How Zoning Watchdog works") become a numbered list.
    .replace(/<ol class="steps">([\s\S]*?)<\/ol>/g, (_, list) => {
      let n = 0;
      return list.replace(/<li><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/li>/g, (__, t, d) => `\n${++n}. **${t}.** ${d}\n`);
    })
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, (_, h, t) => {
      const text = t.replace(/<[^>]+>/g, "").trim();
      return h.startsWith("mailto:") ? text : `[${text}](${abs(h)})`;
    })
    .replace(/<summary><h3[^>]*>([\s\S]*?)<\/h3><\/summary>/g, "\n\n#### $1\n\n")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, "\n\n## $1\n\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, "\n\n### $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, "\n\n#### $1\n\n")
    .replace(/<span class="status[^"]*">([\s\S]*?)<\/span>/g, "Status: $1\n\n")
    .replace(/<span class="domain">([\s\S]*?)<\/span>/g, "Address: $1")
    .replace(/<dt>([\s\S]*?)<\/dt>\s*<dd[^>]*>/g, "\n\n**$1:** ")
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<\/(p|li|dd|details|section|ol|ul|div)>/g, "\n\n")
    .replace(/<[^>]+>/g, "");
  s = unescape(s)
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

export function buildLlmsFull() {
  const parts = [
    "# Kente HQ: full site text",
    "",
    "> The complete public text of kentehq.com in one file, for AI assistants and answer engines. Summary and links: https://kentehq.com/llms.txt",
  ];
  for (const [file, path] of PAGES) {
    parts.push("", "---", "", `Source: ${BASE}${path}`, "", toMarkdown(readFileSync(join(SITE, file), "utf8")));
  }
  return parts.join("\n") + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(join(SITE, "llms-full.txt"), buildLlmsFull());
  console.log("wrote site/llms-full.txt");
}
