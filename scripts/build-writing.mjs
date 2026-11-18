// Generates writing/<slug>.html, writing/index.html and the post cards on the home page
// (between the <!-- posts:start --> and <!-- posts:end --> markers in index.html)
// from scripts/posts.mjs. Terminal-style pages that share the portfolio's nav, footer and script.
// Usage: node scripts/build-writing.mjs
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { posts } from "./posts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "writing");
mkdirSync(out, { recursive: true });

const site = "https://sakibjeebon.github.io";
const csp = readFileSync(join(root, "scripts/csp.txt"), "utf8").trim();
// responsive webp variants sit next to the jpg: <slug>-480.webp plus one wider file when the source allows
const webp = (img, prefix) => {
  const s = img.replace(/\.jpg$/, "");
  const dir = join(root, "assets/img/writing");
  const base = prefix + "assets/img/writing/" + s;
  const extra = [960, ...Array.from({ length: 480 }, (_, i) => 959 - i)].find((w) => existsSync(join(dir, `${s}-${w}.webp`)));
  return { src: `${base}-480.webp`, srcset: `${base}-480.webp 480w${extra ? `, ${base}-${extra}.webp ${extra}w` : ""}` };
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (p) => p.dateLabel || new Date(p.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const short = (p) => p.dateLabel || new Date(p.date + "T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).toLowerCase();

const head = (title, desc, path, image) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="author" content="Sakib Hasan Jeebon">
  <link rel="canonical" href="${site}/${path}">
  <meta name="theme-color" content="#0a0e0d">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${site}/${path}">
  ${image ? `<meta property="og:image" content="${site}/assets/img/writing/${image}">` : ""}
  <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
  <link rel="stylesheet" href="../assets/css/style.css">
  <script>document.documentElement.classList.add("js")</script>
  <script defer src="../assets/js/main.js"></script>
</head>
<body>
<header class="nav" id="header">
  <nav aria-label="Main">
    <a class="nav-brand" href="../#top">shj<span class="cursor-block">▮</span></a>
    <div class="nav-links">
      <a href="../#about">about</a>
      <a href="../#impact">impact</a>
      <a href="../#experience">experience</a>
      <a href="./" class="active">writing</a>
      <a href="../#research">research</a>
      <a href="../#education">education</a>
      <a href="../#certification">credentials</a>
      <a href="../#contacts">contact</a>
    </div>
  </nav>
</header>
`;

const foot = `<footer class="footer">
  <div class="wrap">
    <p>&copy; <span id="year">${new Date().getFullYear()}</span> Sakib Hasan Jeebon &middot; vanilla html/css/js &middot; no trackers &middot; no frameworks</p>
  </div>
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
<main id="top">
  <article class="post">
    <p class="kicker">// writing &middot; <time datetime="${p.date}">${fmt(p)}</time> &middot; first posted on linkedin</p>
    <h1>${esc(p.title)}</h1>
    <figure class="post-fig"><img src="${webp(p.image, "../").src}" srcset="${webp(p.image, "../").srcset}" sizes="(max-width: 46rem) 100vw, 46rem" alt="${esc(p.alt)}" width="${p.w || 1024}" height="${p.h || 1024}" fetchpriority="high" decoding="async"></figure>
    <div class="post-body">
      ${p.body.map(block).join("\n      ")}
    </div>
    <p class="post-actions">
      <a class="btn btn-solid" href="${p.url}" target="_blank" rel="noopener noreferrer">read on linkedin ↗</a>
      <a class="btn" href="./">all writing</a>
    </p>
    <nav class="post-nav" aria-label="More writing">
      ${prev ? `<a href="${prev.slug}.html"><span>newer</span><strong>${esc(prev.title)}</strong></a>` : `<a href="./"><span>writing</span><strong>all posts</strong></a>`}
      ${next ? `<a class="next" href="${next.slug}.html"><span>older</span><strong>${esc(next.title)}</strong></a>` : `<a class="next" href="../"><span>back</span><strong>the portfolio</strong></a>`}
    </nav>
  </article>
</main>
` + foot;
  writeFileSync(join(out, `${p.slug}.html`), html);
});

const index = head("Writing · Sakib Hasan Jeebon", "Notes on energy, climate, ESG and AI by Sakib Hasan Jeebon.", "writing/", null) + `
<main id="top">
  <div class="post">
    <p class="kicker">// writing</p>
    <h1>writing</h1>
    <ul class="archive-list">
      ${posts.map((p) => `<li><a class="r-title" href="${p.slug}.html">${esc(p.title)}</a><span class="r-val"><time datetime="${p.date}">${short(p)}</time></span><span class="r-sub">${esc(p.excerpt)}</span></li>`).join("\n      ")}
    </ul>
  </div>
</main>
` + foot;
writeFileSync(join(out, "index.html"), index);

// home page cards
const cards = posts.map((p) => `        <a class="post-card" href="writing/${p.slug}.html">
          <img src="${webp(p.image, "").src}" srcset="${webp(p.image, "").srcset}" sizes="(max-width: 700px) 100vw, 360px" alt="" width="400" height="250" loading="lazy" decoding="async">
          <div class="post-card-body">
            <p class="card-tag">${short(p)}</p>
            <h3>${esc(p.title)}</h3>
            <p>${esc(p.excerpt)}</p>
          </div>
        </a>`).join("\n");
const idxPath = join(root, "index.html");
let home = readFileSync(idxPath, "utf8");
const a = home.indexOf("<!-- posts:start -->"), b = home.indexOf("<!-- posts:end -->");
if (a < 0 || b < 0) throw new Error("posts markers missing in index.html");
home = home.slice(0, a) + "<!-- posts:start -->\n" + cards + "\n" + home.slice(b);
writeFileSync(idxPath, home);
console.log(`wrote ${posts.length} posts, index and home cards`);
