// Generates writing/<slug>.html and writing/index.html from scripts/posts.mjs.
// The pages share the portfolio's header, colour chapters, footer and script.
// Usage: node scripts/build-writing.mjs
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { posts } from "./posts.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "writing");
mkdirSync(out, { recursive: true });

const site = "https://sakibjeebon.github.io";
const csp = readFileSync(join(root, "scripts/csp.txt"), "utf8").trim();
// responsive webp variants sit next to the jpg: <slug>-480.webp (+ -960.webp when the source is wide enough)
const webp = (img) => {
  const s = img.replace(/\.jpg$/, "");
  const dir = join(root, "assets/img/writing");
  const base = "../assets/img/writing/" + s;
  const extra = [960, ...Array.from({ length: 480 }, (_, i) => 959 - i)].find((w) => existsSync(join(dir, `${s}-${w}.webp`)));
  return { src: `${base}-480.webp`, srcset: `${base}-480.webp 480w${extra ? `, ${base}-${extra}.webp ${extra}w` : ""}` };
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (p) => p.dateLabel || new Date(p.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const arrow = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M5 12h14m0 0-6-6m6 6-6 6"/></svg>`;
const ext = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M7 17 17 7m0 0H9m8 0v8"/></svg>`;

const head = (title, desc, path, image, type = "article") => `<!DOCTYPE html>
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
  <meta name="theme-color" content="#ff6831">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${site}/${path}">
  ${image ? `<meta property="og:image" content="${site}/assets/img/writing/${image}">` : ""}
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
  <link rel="apple-touch-icon" href="../apple-touch-icon.png">
  <link rel="preload" href="../assets/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="../assets/css/style.css">
  <script>document.documentElement.classList.add("js")</script>
  <script defer src="../assets/js/main.js"></script>
</head>
<body class="no-hero">
<a class="skip" href="#main">Skip to content</a>
<header class="site-head" id="head">
  <a class="brand" href="../" aria-label="Sakib Hasan Jeebon, home">
    <svg viewBox="0 2 64 40" aria-hidden="true"><path class="logo-line" pathLength="1" d="M20 10H10a6 6 0 0 0 0 12h4a6 6 0 0 1 0 12H4"/><path class="logo-line" pathLength="1" d="M27 8v28M41 8v28M27 22h14"/><path class="logo-line" pathLength="1" d="M48 10h12v18a6 6 0 0 1-12 0"/></svg>
    <span class="brand-name">Sakib Hasan Jeebon</span>
  </a>
  <ul class="nav-links">
    <li class="wide"><a href="../#about">About</a></li>
    <li><a href="../#experience">Work</a></li>
    <li><a href="./">Writing</a></li>
    <li class="wide"><a href="../#credentials">Credentials</a></li>
    <li><a href="../#contact">Contact</a></li>
  </ul>
</header>
`;

const foot = `<footer class="foot">
  <div class="foot-cols">
    <ul><li>Sakib Hasan Jeebon</li><li>Sustainability and decarbonization</li></ul>
    <ul><li>Read</li><li><a href="../#about">About</a></li><li><a href="../#experience">Experience</a></li><li><a href="./">Writing</a></li></ul>
    <ul><li>More</li><li><a href="../#education">Education</a></li><li><a href="../#research">Research</a></li><li><a href="../#credentials">Credentials</a></li></ul>
    <ul><li>Elsewhere</li><li><a href="https://www.linkedin.com/in/sakibjeebon" target="_blank" rel="noopener noreferrer">LinkedIn</a></li><li><a href="mailto:sakibjeebon@gmail.com">Email</a></li><li><a href="../">Back to the portfolio</a></li></ul>
  </div>
  <p class="legal"><span>© ${new Date().getFullYear()} Sakib Hasan Jeebon</span><span>Plain HTML, CSS and JavaScript</span></p>
</footer>
</body>
</html>
`;

const block = (b, n) => {
  const r = `class="rise" style="--i:${n % 3}"`;
  if (typeof b === "string") return `<p ${r}>${b}</p>`;
  if (b.h) return `<h2 ${r}>${esc(b.h)}</h2>`;
  if (b.ul) return `<ul ${r}>${b.ul.map((x) => `<li>${x}</li>`).join("")}</ul>`;
  return "";
};

const tones = ["c-orange", "c-mint", "c-grey"];

posts.forEach((p, i) => {
  const prev = posts[i - 1], next = posts[i + 1];
  const tone = tones[i % tones.length];
  const html = head(`${p.title} · Sakib Hasan Jeebon`, p.excerpt, `writing/${p.slug}.html`, p.image) + `
<main id="main">
  <section class="chapter ${tone} post-top" aria-labelledby="post-h">
    <div class="wrap grid">
      <div class="post-title">
        <h1 id="post-h" class="rise">${esc(p.title)}</h1>
        <p class="post-meta rise" style="--i:1"><time datetime="${p.date}">${fmt(p)}</time><span>First posted on LinkedIn</span></p>
      </div>
      <figure class="post-figure rise" style="--i:2"><img src="${webp(p.image).src}" srcset="${webp(p.image).srcset}" sizes="(max-width: 900px) 100vw, 42vw" alt="${esc(p.alt)}" width="${p.w || 1024}" height="${p.h || 1024}" fetchpriority="high" decoding="async"></figure>
    </div>
  </section>
  <article class="chapter c-white post-body-wrap">
    <div class="wrap post-grid">
      <div class="post-body">
        ${p.body.map(block).join("\n        ")}
      </div>
      <aside class="post-rail" aria-label="About this post">
        <p class="post-actions">
          <a class="btn" href="${p.url}" target="_blank" rel="noopener noreferrer">Read on LinkedIn ${ext}</a>
          <a class="btn btn-quiet" href="./">All writing</a>
        </p>
      </aside>
    </div>
  </article>
  <nav class="post-nav" aria-label="More writing">
    ${prev ? `<a href="${prev.slug}.html"><img src="${webp(prev.image).src}" alt="" width="112" height="112" loading="lazy" decoding="async"><span>Newer</span><strong>${esc(prev.title)}</strong></a>` : `<a href="./"><span>Writing</span><strong>All posts</strong></a>`}
    ${next ? `<a class="next" href="${next.slug}.html"><img src="${webp(next.image).src}" alt="" width="112" height="112" loading="lazy" decoding="async"><span>Older</span><strong>${esc(next.title)}</strong></a>` : `<a class="next" href="../"><span>Back</span><strong>The portfolio</strong></a>`}
  </nav>
</main>
` + foot;
  writeFileSync(join(out, `${p.slug}.html`), html);
});

const index = head("Writing · Sakib Hasan Jeebon", "Notes on energy, climate, ESG and AI by Sakib Hasan Jeebon.", "writing/", null, "website") + `
<main id="main">
  <section class="chapter c-orange post-top" aria-labelledby="w-h">
    <div class="wrap">
      <h1 id="w-h" class="rise">Writing</h1>
      <p class="lead rise" style="--i:1; margin-top:1.25rem; max-width:30ch">Notes on energy, climate, ESG and AI, first posted on LinkedIn.</p>
    </div>
  </section>
  <section class="chapter c-white post-body-wrap">
    <div class="wrap">
      <ul class="archive-list">
        ${posts.map((p, n) => `<li class="rise" style="--i:${n % 3}"><a class="r-title" href="${p.slug}.html">${esc(p.title)}</a><span class="r-val"><time datetime="${p.date}">${fmt(p)}</time></span><span class="r-sub">${esc(p.excerpt)}</span></li>`).join("\n        ")}
      </ul>
    </div>
  </section>
</main>
` + foot;
writeFileSync(join(out, "index.html"), index);
console.log(`wrote ${posts.length} posts + index`);
