// Generates writing/<slug>.html and writing/index.html from scripts/posts.mjs.
// Usage: node scripts/build-writing.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { posts } from "./posts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "writing");
mkdirSync(out, { recursive: true });

const site = "https://sakibjeebon.github.io";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (p) => p.dateLabel || new Date(p.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const monogram = `<svg viewBox="0 0 64 44" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="square" stroke-linejoin="miter"><path d="M20 10H10a6 6 0 0 0 0 12h4a6 6 0 0 1 0 12H4"/><path d="M27 8v28M41 8v28M27 22h14"/><path d="M48 10h12v18a6 6 0 0 1-12 0"/></svg>`;
const ext = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M7 17 17 7m0 0H9m8 0v8"/></svg>`;

const head = (title, desc, path, image) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="author" content="Sakib Hasan Jeebon">
  <link rel="canonical" href="${site}/${path}">
  <meta name="theme-color" content="#f3f4ef">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${site}/${path}">
  ${image ? `<meta property="og:image" content="${site}/assets/img/writing/${image}">` : ""}
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-head on-paper">
  <nav aria-label="Main">
    <a class="brand" href="../" aria-label="Sakib Hasan Jeebon, home">${monogram}<span class="brand-name">Sakib Hasan Jeebon</span></a>
    <ul class="nav-links">
      <li><a href="../#experience">Work</a></li>
      <li><a href="./">Writing</a></li>
      <li><a href="../#contact">Contact</a></li>
    </ul>
  </nav>
</header>
`;

const foot = `<footer class="foot">
  <p class="legal"><span>© ${new Date().getFullYear()} Sakib Hasan Jeebon · Dhaka</span><a href="../">Back to the portfolio</a></p>
</footer>
</body>
</html>
`;

const block = (b) => {
  if (typeof b === "string") return `<p>${b}</p>`;
  if (b.h) return `<h2>${esc(b.h)}</h2>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  return "";
};

posts.forEach((p, i) => {
  const prev = posts[i - 1], next = posts[i + 1];
  const html = head(`${p.title} · Sakib Hasan Jeebon`, p.excerpt, `writing/${p.slug}.html`, p.image) + `
<main id="main" class="wrap post">
  <article>
    <header class="post-head">
      <h1>${esc(p.title)}</h1>
      <p class="post-meta"><time datetime="${p.date}">${fmt(p)}</time><span>First posted on LinkedIn</span></p>
    </header>
    <figure class="post-figure"><img src="../assets/img/writing/${p.image}" alt="${esc(p.alt)}"></figure>
    <div class="post-body">
      ${p.body.map(block).join("\n      ")}
    </div>
    <p class="post-actions">
      <a class="btn" href="${p.url}" target="_blank" rel="noopener">Read on LinkedIn ${ext}</a>
      <a class="btn btn-quiet" href="./">All writing</a>
    </p>
  </article>
  <nav class="post-nav" aria-label="More writing">
    ${prev ? `<a href="${prev.slug}.html"><span>Newer</span><strong>${esc(prev.title)}</strong></a>` : "<span></span>"}
    ${next ? `<a class="next" href="${next.slug}.html"><span>Older</span><strong>${esc(next.title)}</strong></a>` : "<span></span>"}
  </nav>
</main>
` + foot;
  writeFileSync(join(out, `${p.slug}.html`), html);
});

const index = head("Writing · Sakib Hasan Jeebon", "Notes on energy, climate, ESG and AI by Sakib Hasan Jeebon.", "writing/", null) + `
<main id="main" class="wrap archive">
  <h1>Writing</h1>
  <ul class="rows">
    ${posts.map((p) => `<li><a class="r-title" href="${p.slug}.html">${esc(p.title)}</a><span class="r-val"><time datetime="${p.date}">${fmt(p)}</time></span><span class="r-sub">${esc(p.excerpt)}</span></li>`).join("\n    ")}
  </ul>
</main>
` + foot;
writeFileSync(join(out, "index.html"), index);
console.log(`wrote ${posts.length} posts + index`);
