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

const glosses: [string, string][] = [
  ["抽象表现主义", "靠泼洒颜料的动作来画，不画一个认得出的东西"],
  ["飞扶壁", "墙外面撑住屋顶的石头架子"],
  ["烟熏法", "轮廓不画死，颜色慢慢化开"],
  ["消失点", "近大远小的线远远交在一起的那个点"],
  ["湿壁画", "趁墙灰还湿的时候画上去"],
  ["祭坛画", "放在教堂祭坛上、常有好几联的画"],
  ["对立平衡", "一边用力、另一边放松，身体才站得住"],
  ["至上主义", "只留最简单的形状，比如一块黑"],
  ["短缩", "近处画大、远处画小，比如脚比头大"],
  ["立体派", "把物体拆成能同时看见的几个面"],
  ["野兽派", "颜色很冲，不太管物体本来的颜色"],
  ["圣像", "给人对着祈祷的宗教像"],
  ["图式", "一套先学会、以后可以改的画法"],
  ["沙龙", "当时公开挂画、让大家来看的展览"],
  ["巴洛克", "十七世纪用光和动作把人打动的做法"],
  ["洛可可", "十八世纪宫廷里轻巧、带一点告别感的做法"],
  ["木版", "在木板上刻图，再印到纸上"],
  ["铜版", "在铜板上刻图，再印到纸上"],
  ["丝网", "用网版把颜色印上去，能重复印很多张"],
  ["波普", "把广告、明星照片这些大众图像做成画"],
];

function annotate(html: string, seen: Set<string>) {
  let next = html;
  for (const [term, note] of glosses) {
    if (seen.has(term) || !next.includes(term)) continue;
    next = next.replace(
      term,
      `${term}<span class="gloss">（${note}）</span>`,
    );
    seen.add(term);
  }
  return next;
}

function withMarks(text: string, marks: string[] = [], seen?: Set<string>) {
  let html = escapeHtml(text);
  for (const mark of marks) {
    if (!mark) continue;
    const safe = escapeHtml(mark);
    html = html.split(safe).join(`<strong class="key">${safe}</strong>`);
  }
  return seen ? annotate(html, seen) : html;
}

function workCard(id: string, seen?: Set<string>) {
  const work = getWork(id);
  const src = imageSrc(id);
  const credit = getImageCredit(id);
  const img = src
    ? `<img src="${src}" alt="${work.title}" loading="lazy" />`
    : work.linkOnly
      ? `<div class="work-missing">用章末的链接看这件作品。</div>`
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
      <span class="work-kicker">作品</span>
      <span class="work-title">${work.title}</span>
      <span class="work-meta">${work.artist} · ${work.year} · ${work.place}</span>
      ${prose.map((part) => `<p>${withMarks(part, [], seen)}</p>`).join("")}
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
    <p class="deck">每一章先是这本书的论证和它用来讲解的作品，浓缩过，不是摘抄。练习和对照放在章末，标题是衍生。</p>
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
  const seen = new Set<string>();
  const body: string[] = [];
  chapter.paragraphs.forEach((paragraph, index) => {
    body.push(`<p>${withMarks(paragraph, marks, seen)}</p>`);
    for (const workId of inserts.get(index) ?? []) {
      used.add(workId);
      body.push(workCard(workId, seen));
    }
  });
  const leftover = chapter.inserts?.length
    ? chapter.workIds.filter((workId) => !used.has(workId))
    : chapter.workIds;
  for (const workId of leftover) body.push(workCard(workId, seen));
  body.push(`<p>${withMarks(chapter.hinge, marks, seen)}</p>`);

  const aside = [
    chapter.prior && `<p>${withMarks(chapter.prior, [], seen)}</p>`,
    chapter.conflict && `<p>${withMarks(chapter.conflict, [], seen)}</p>`,
    chapter.revision && `<p class="point">${withMarks(chapter.revision, [], seen)}</p>`,
    `<p>${withMarks(chapter.exercise, [], seen)}</p>`,
  ]
    .filter(Boolean)
    .join("");

  const moreLooking = chapter.workIds
    .map((workId) => {
      const work = getWork(workId);
      const credit = getImageCredit(workId);
      const q = encodeURIComponent(work.query ?? work.title);
      const arts = `https://artsandculture.google.com/search?q=${q}`;
      const wiki = `https://www.wikiart.org/en/search/${q}`;
      const commons = credit?.commonsPage
        ? `<a href="${credit.commonsPage}" target="_blank" rel="noopener">图源</a>`
        : "";
      return `<li>
        <span>${escapeHtml(work.title)}</span>
        <a href="${arts}" target="_blank" rel="noopener">Google Arts</a>
        <a href="${wiki}" target="_blank" rel="noopener">WikiArt</a>
        ${commons}
      </li>`;
    })
    .join("");

  return `<article class="sheet sheet-chapter">
    <p class="crumb"><a href="#home">全书</a> / <a href="#part/${chapter.part}">${part?.title ?? ""}</a></p>
    <header class="sheet-head">
      <p class="book-kicker">${chapterAccession(id)} · ${chapter.when}</p>
      <h1>${chapter.title}</h1>
    </header>
    <div class="essay">${body.join("")}</div>
    <section class="afterword">
      <h2>衍生</h2>
      <p class="afterword-note">下面不是原书的叙述，是拿这一章来改你自己的看法，再到原作的高清图里核对。</p>
      ${aside}
      <h2>继续看图</h2>
      <ul class="more-looking">${moreLooking}</ul>
    </section>
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
