import { chapters, getChapter } from "./data/chapters";
import {
  boundaries,
  comparisons,
  glossary,
  museums,
} from "./data/derivatives";
import { parts, site } from "./data/meta";
import { getWork } from "./data/works";
import { getImageCredit, imageSrc } from "./lib/images";

type Route =
  | { name: "home" }
  | { name: "part"; id: number }
  | { name: "read"; id: string }
  | { name: "derive" };

function parseRoute(): Route {
  const hash = location.hash.replace(/^#\/?/, "");
  if (!hash || hash === "home") return { name: "home" };
  if (hash === "derive") return { name: "derive" };
  if (hash.startsWith("part/")) {
    const id = Number(hash.slice(5));
    if (id >= 1 && id <= 4) return { name: "part", id };
  }
  if (hash.startsWith("read/")) return { name: "read", id: hash.slice(5) };
  return { name: "home" };
}

function chapterAccession(id: string) {
  if (id === "intro") return "READ · 导论";
  return `READ · ${id.replace("c", "").padStart(2, "0")}`;
}

function chapterListLabel(id: string, ch: ReturnType<typeof getChapter>) {
  if (id === "intro") return "导论";
  const num = id.replace("c", "");
  return `${num}. ${ch.title}`;
}

function topbar(route: Route) {
  const home = route.name === "home";
  const derive = route.name === "derive";
  return `<header class="topbar">
    <a class="brand" href="#home">${site.title}</a>
    <nav class="topnav">
      <a class="${home ? "active" : ""}" href="#home">入门</a>
      <a class="${derive ? "active" : ""}" href="#derive">衍生</a>
    </nav>
  </header>`;
}

function oneLine(id: string) {
  const chapter = getChapter(id);
  if (chapter.teaser) return chapter.teaser;
  const sentence = chapter.paragraphs[0] ?? "";
  return sentence.length > 36 ? `${sentence.slice(0, 36)}…` : sentence;
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function withMarks(text: string, marks: string[] = []) {
  let html = escapeHtml(text);
  for (const mark of marks) {
    if (!mark) continue;
    const safe = escapeHtml(mark);
    html = html.split(safe).join(`<strong class="key">${safe}</strong>`);
  }
  return html;
}

function workCard(id: string) {
  const work = getWork(id);
  const src = imageSrc(id);
  const credit = getImageCredit(id);
  const img = src
    ? `<img src="${src}" alt="${work.title}" loading="lazy" />`
    : `<div class="work-missing">本地暂无图。可到博物馆开放收藏搜索「${work.title}」。</div>`;
  const source = credit?.commonsPage
    ? `<a href="${credit.commonsPage}" target="_blank" rel="noopener">图源</a>`
    : "";
  const prose = [work.context, work.style, work.inBook, work.look].filter(
    (part): part is string => Boolean(part),
  );
  return `<figure class="inline-work" id="work-${id}">
    ${img}
    <figcaption>
      <span class="work-title">${work.title}</span>
      <span class="work-meta">${work.artist} · ${work.year} · ${work.place}</span>
      ${prose.map((part) => `<p>${escapeHtml(part)}</p>`).join("")}
      ${source}
    </figcaption>
  </figure>`;
}

function chapterNav(currentId: string) {
  const index = chapters.findIndex((c) => c.id === currentId);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;
  return `<nav class="chapter-nav">
    ${prev ? `<a href="#read/${prev.id}">上一章：${prev.title}</a>` : "<span></span>"}
    ${next ? `<a href="#read/${next.id}">下一章：${next.title}</a>` : "<span></span>"}
  </nav>`;
}

function renderHome() {
  const thread = parts
    .map((part, index) => {
      const start =
        index === 0
          ? `<a class="thread-start" href="#read/intro">从导论开始</a>`
          : "";
      return `<li>
        <a class="thread-link" href="#part/${part.id}">
          <span class="thread-name">${part.title}</span>
          <span class="thread-range">${part.subtitle}</span>
        </a>
        ${start}
      </li>`;
    })
    .join("");

  return `<div class="page-home">
    <p class="book-kicker">贡布里希 · 范景中译</p>
    <h1>艺术的故事</h1>
    <p class="deck">按书的顺序读。先选一段，再进一章。每一章写作者在纠正什么、这个时代的图像习惯，以及三件作品怎么看。</p>
    <ol class="thread">${thread}</ol>
    <p class="colophon">${site.disclaimer}</p>
  </div>`;
}

function renderPart(partId: number) {
  const part = parts.find((p) => p.id === partId);
  if (!part) return renderHome();

  const rows = part.chapters
    .map((id) => {
      const ch = getChapter(id);
      return `<li>
        <a class="toc-row" href="#read/${id}">
          <span class="toc-name">${chapterListLabel(id, ch)}</span>
          <span class="toc-line">${oneLine(id)}</span>
        </a>
      </li>`;
    })
    .join("");

  return `<article class="sheet">
    <p class="crumb"><a href="#home">全书</a></p>
    <header class="sheet-head">
      <p class="book-kicker">第 ${partId} 段 · ${part.subtitle}</p>
      <h1>${part.title}</h1>
      <p class="deck">${part.blurb}</p>
    </header>
    <ol class="toc">${rows}</ol>
  </article>`;
}

function renderChapter(id: string) {
  const chapter = getChapter(id);
  const part = parts.find((item) => item.id === chapter.part);
  const marks = chapter.marks ?? [];
  const inserts = new Map<number, string[]>();
  for (const insert of chapter.inserts ?? []) {
    inserts.set(insert.at, insert.workIds);
  }
  const used = new Set<string>();
  const body: string[] = [];
  if (chapter.prior) body.push(`<p>${withMarks(chapter.prior, marks)}</p>`);
  chapter.paragraphs.forEach((paragraph, index) => {
    body.push(`<p>${withMarks(paragraph, marks)}</p>`);
    for (const workId of inserts.get(index) ?? []) {
      used.add(workId);
      body.push(workCard(workId));
    }
  });
  if (!chapter.inserts?.length) {
    for (const workId of chapter.workIds) body.push(workCard(workId));
  } else {
    for (const workId of chapter.workIds) {
      if (!used.has(workId)) body.push(workCard(workId));
    }
  }
  if (chapter.revision) {
    body.push(`<p class="point">${withMarks(chapter.revision, marks)}</p>`);
  }
  body.push(`<p>${withMarks(chapter.hinge, marks)}</p>`);
  body.push(`<p class="do">${withMarks(chapter.exercise, marks)}</p>`);

  return `<article class="sheet sheet-chapter">
    <p class="crumb"><a href="#home">全书</a> / <a href="#part/${chapter.part}">${part?.title ?? ""}</a></p>
    <header class="sheet-head">
      <p class="book-kicker">${chapterAccession(id)} · ${chapter.when}</p>
      <h1>${chapter.title}</h1>
    </header>
    <div class="essay">${body.join("")}</div>
    ${chapterNav(id)}
  </article>`;
}

function chapterForWork(workId: string) {
  return chapters.find((ch) => ch.workIds.includes(workId))?.id ?? "intro";
}

function renderDerive() {
  const pairs = comparisons
    .map(
      (c) => `<article class="pair-card">
      <h3>${c.title}</h3>
      <p>${c.prompt}</p>
      <div class="pair-links">
        <a href="#read/${chapterForWork(c.a)}">看 ${getWork(c.a).title}</a>
        <a href="#read/${chapterForWork(c.b)}">看 ${getWork(c.b).title}</a>
      </div>
    </article>`,
    )
    .join("");

  const terms = glossary
    .map((g) => `<dt>${g.term}</dt><dd>${g.def}</dd>`)
    .join("");

  return `<article class="sheet">
      <h1>衍生</h1>
      <p class="derive-lead">对照、词汇、书的边界与继续看图的去处。</p>
      <section class="block"><h2>对照看图</h2><div class="pair-grid">${pairs}</div></section>
      <section class="block"><h2>小词典</h2><dl class="glossary">${terms}</dl></section>
      <section class="block"><h2>书的边界</h2><ul>${boundaries.map((b) => `<li>${b}</li>`).join("")}</ul></section>
      <section class="block"><h2>继续看图</h2><ul class="museum-list">${museums.map((m) => `<li><a href="${m.url}" target="_blank" rel="noopener">${m.name}</a></li>`).join("")}</ul></section>
  </article>`;
}

export function render() {
  const route = parseRoute();
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) return;

  let body = "";
  if (route.name === "read") {
    try {
      body = renderChapter(route.id);
      document.title = `${getChapter(route.id).title} · 艺术的故事`;
    } catch {
      body = renderHome();
      document.title = site.title;
    }
  } else if (route.name === "part") {
    body = renderPart(route.id);
    document.title = `第 ${route.id} 段 · ${site.title}`;
  } else if (route.name === "derive") {
    body = renderDerive();
    document.title = `衍生学习 · ${site.title}`;
  } else {
    body = renderHome();
    document.title = site.title;
  }

  app.className = "app";
  app.innerHTML = `${topbar(route)}${body}<footer class="site-footer">学习支架 · 图像许可见各图注</footer>`;
}
