import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const docsDir = path.join(process.cwd(), "docs");

export interface DocMeta {
  slug: string; // e.g. "risk-metric" or "charts/on-chain"
  title: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^\[|\]$/g, "");
  }
  return { meta, body: raw.slice(m[0].length) };
}

export function listDocs(): DocMeta[] {
  const out: DocMeta[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
      else if (entry.name.endsWith(".md")) {
        const slug = `${prefix}${entry.name.replace(/\.md$/, "")}`;
        const { meta } = parseFrontmatter(
          fs.readFileSync(path.join(dir, entry.name), "utf8"),
        );
        out.push({ slug, title: meta.title ?? slug });
      }
    }
  };
  walk(docsDir, "");
  return out;
}

/** [[target]] and [[target|label]] → site links; targets resolve relative to /docs. */
function resolveWikilinks(md: string): string {
  return md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
    const t = String(target).trim();
    const slug = t === "index" ? "" : t.replace(/\/index$/, "");
    return `[${label ?? t}](/docs/${slug})`;
  });
}

export function renderDoc(slug: string): { title: string; html: string } | null {
  const file = path.join(docsDir, `${slug || "index"}.md`);
  if (!fs.existsSync(file)) return null;
  const { meta, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
  const html = marked.parse(resolveWikilinks(body), { async: false }) as string;
  return { title: meta.title ?? slug, html };
}
