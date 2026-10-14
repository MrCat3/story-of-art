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

function partSwitch() {
  return `<nav class="part-switch" aria-label="切换段落">
    ${parts
      .map(
        (p) =>
          `<a href="#part/${p.id}" title="${p.subtitle}">${p.id}</a>`,
      )
      .join("")}
  </nav>`;
}

/** 只显示当前段的章节，避免 28 章侧栏堆在一起 */
function partChapterNav(partId: number, activeId?: string) {
  const part = parts.find((p) => p.id === partId);
  if (!part) return "";
  const items = part.chapters
    .map((id) => {
      const ch = getChapter(id);
      const active = id === activeId ? " is-active" : "";
      const short = id === "intro" ? "导论" : ch.title;
      return `<li><a class="local-link${active}" href="#read/${id}">${short}</a></li>`;
    })
    .join("");
  return `<nav class="local-nav">
    <p class="local-nav-heading"><a href="#part/${partId}">${part.title}</a></p>
    <ul>${items}</ul>
    ${partSwitch()}
  </nav>`;
}

function workCard(id: string) {
  const work = getWork(id);
  const src = imageSrc(id);
  const credit = getImageCredit(id);
  const img = src
    ? `<figure class="work-figure">
        <img src="${src}" alt="${work.title}" loading="lazy" />
        <figcaption>
          <span>${credit?.license ?? ""}</span>
          ${credit?.commonsPage ? `<a href="${credit.commonsPage}" target="_blank" rel="noopener">图源</a>` : ""}
        </figcaption>
      </figure>`
    : `<div class="work-missing">本地暂无图。可在 Google Arts & Culture 或博物馆开放收藏搜索「${work.title}」。</div>`;

  const extra = [
    work.context && `<p><span class="work-label">背景</span>${work.context}</p>`,
    work.inBook && `<p><span class="work-label">书中位置</span>${work.inBook}</p>`,
    work.style && `<p><span class="work-label">形式与风格</span>${work.style}</p>`,
    `<p><span class="work-label">看哪里</span>${work.look}</p>`,
  ]
    .filter(Boolean)
    .join("");

  return `<article class="work-card" id="work-${id}">
    ${img}
    <div class="work-body">
      <h3>${work.title}</h3>
      <p class="work-meta">${work.artist} · ${work.year}</p>
      <p class="work-place">${work.place}</p>
      <div class="work-notes">${extra}</div>
    </div>
  </article>`;
}

function noteSection(title: string, items?: string[]) {
  if (!items?.length) return "";
  return `<section class="block block-note">
    <h2>${title}</h2>
    ${items.map((p) => `<p>${p}</p>`).join("")}
  </section>`;
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
  const partCards = parts
    .map(
      (part) => `
      <a class="part-door" href="#part/${part.id}">
        <span class="part-door-num">${part.id}</span>
        <span class="part-door-body">
          <strong>${part.title}</strong>
          <span>${part.subtitle}</span>
          <span class="part-door-meta">${part.chapters.length} 章</span>
        </span>
      </a>`,
    )
    .join("");

  return `<div class="page-home">
    <section class="hero-panel">
      <p class="accession">GOMBRICH · STORY OF ART</p>
      <h1>按章读《艺术的故事》</h1>
      <p class="hero-lead">每章分开写：贡布里希在这一章里做什么、时代风格是什么、三件作品怎么读。文字是浓缩导读，不是原书摘抄。</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#read/intro">从导论开始</a>
      </div>
      <p class="hero-hint">全书拆成四段。点下面卡片进入<strong>该段章节列表</strong>（只看这一段，不是二十八章一页摊开）。</p>
    </section>
    <section class="part-doors" aria-label="全书四段">
      <h2 class="section-title">选一段开始</h2>
      <div class="part-door-grid">${partCards}</div>
    </section>
    <details class="fold-help">
      <summary>阅读建议</summary>
      <ul>
        <li>先选一段，再进单章；不必在首页展开全部二十八章。</li>
        <li>章内先看作品图与「看哪里」，再读文字。</li>
        <li>导论与前几章内容最厚，其余章将逐步补全同样结构。</li>
      </ul>
    </details>
    <p class="fine-print">${site.disclaimer}</p>
  </div>`;
}

function renderPart(partId: number) {
  const part = parts.find((p) => p.id === partId);
  if (!part) return renderHome();

  const rows = part.chapters
    .map((id) => {
      const ch = getChapter(id);
      return `<li>
        <a class="catalog-row" href="#read/${id}">
          <span class="catalog-title">${chapterListLabel(id, ch)}</span>
          <span class="catalog-when">${ch.when}</span>
        </a>
      </li>`;
    })
    .join("");

  return `<div class="layout-single">
    <div class="main">
      <p class="breadcrumb"><a href="#home">入门</a> / 第 ${partId} 段</p>
      <header class="chapter-head">
        <h1>${part.title}</h1>
        <p class="chapter-when">${part.subtitle}</p>
        <p class="part-blurb">${part.blurb}</p>
      </header>
      ${partSwitch()}
      <ol class="part-catalog">${rows}</ol>
      <p class="part-back"><a href="#home">返回四段总览</a></p>
    </div>
  </div>`;
}

function renderChapter(id: string) {
  const chapter = getChapter(id);
  const works = chapter.workIds.map(workCard).join("");

  return `<div class="layout-read">
    ${partChapterNav(chapter.part, id)}
    <div class="main">
      <p class="breadcrumb"><a href="#home">入门</a> / <a href="#part/${chapter.part}">第 ${chapter.part} 段</a></p>
      <header class="chapter-head">
        <p class="accession">${chapterAccession(id)}</p>
        <h1>${chapter.title}</h1>
        <p class="chapter-when">${chapter.when}</p>
      </header>
      ${noteSection("贡布里希在这一章", chapter.authorNote)}
      ${noteSection("风格与时代问题", chapter.styleNote)}
      <section class="block block-prose">
        <h2>本章叙述</h2>
        ${chapter.paragraphs.map((p) => `<p>${p}</p>`).join("")}
      </section>
      <section class="block block-works">
        <h2>作品</h2>
        <div class="work-stack">${works}</div>
      </section>
      <section class="block block-hinge">
        <h2>承上启下</h2>
        <p>${chapter.hinge}</p>
      </section>
      <section class="block block-exercise">
        <h2>练习</h2>
        <p>${chapter.exercise}</p>
      </section>
      ${chapterNav(id)}
    </div>
  </div>`;
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

  return `<div class="layout-single">
    <div class="main derive">
      <h1>衍生学习</h1>
      <p class="derive-lead">对照、词汇、书的边界与继续看图的去处。</p>
      <section class="block"><h2>对照看图</h2><div class="pair-grid">${pairs}</div></section>
      <section class="block"><h2>小词典</h2><dl class="glossary">${terms}</dl></section>
      <section class="block"><h2>书的边界</h2><ul>${boundaries.map((b) => `<li>${b}</li>`).join("")}</ul></section>
      <section class="block"><h2>继续看图</h2><ul class="museum-list">${museums.map((m) => `<li><a href="${m.url}" target="_blank" rel="noopener">${m.name}</a></li>`).join("")}</ul></section>
    </div>
  </div>`;
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
