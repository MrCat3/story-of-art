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
  | { name: "read"; id: string }
  | { name: "derive" };

function parseRoute(): Route {
  const hash = location.hash.replace(/^#\/?/, "");
  if (!hash || hash === "home") return { name: "home" };
  if (hash === "derive") return { name: "derive" };
  if (hash.startsWith("read/")) return { name: "read", id: hash.slice(5) };
  return { name: "home" };
}

function navLink(label: string, hash: string, active: boolean) {
  return `<a class="nav-link${active ? " is-active" : ""}" href="#${hash}">${label}</a>`;
}

function workCard(id: string) {
  const work = getWork(id);
  const src = imageSrc(id);
  const credit = getImageCredit(id);
  const img = src
    ? `<figure class="work-figure">
        <img src="${src}" alt="${work.title}" loading="lazy" />
        <figcaption>
          <span class="license">${credit?.license ?? ""}</span>
          ${credit?.commonsPage ? `<a href="${credit.commonsPage}" target="_blank" rel="noopener">图源</a>` : ""}
        </figcaption>
      </figure>`
    : `<div class="work-missing">暂无本地高清图。请到博物馆开放收藏或 Google Arts & Culture 搜索「${work.title}」。</div>`;
  return `<article class="work-card" id="work-${id}">
    ${img}
    <div class="work-body">
      <h3>${work.title}</h3>
      <p class="work-meta">${work.artist} · ${work.year}</p>
      <p class="work-place">${work.place}</p>
      <p class="work-look"><strong>看这里：</strong>${work.look}</p>
    </div>
  </article>`;
}

function chapterNav(currentId: string) {
  const index = chapters.findIndex((c) => c.id === currentId);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;
  return `<nav class="chapter-nav">
    ${prev ? `<a href="#read/${prev.id}">← ${prev.title}</a>` : "<span></span>"}
    ${next ? `<a href="#read/${next.id}">${next.title} →</a>` : "<span></span>"}
  </nav>`;
}

function renderHome() {
  const partCards = parts
    .map(
      (part) => `
      <section class="part-card">
        <header>
          <p class="part-kicker">第 ${part.id} 段</p>
          <h2>${part.title}</h2>
          <p>${part.subtitle}</p>
        </header>
        <ol class="chapter-list">
          ${part.chapters
            .map((id) => {
              const ch = getChapter(id);
              const label = id === "intro" ? "导论" : ch.title;
              return `<li><a href="#read/${id}">${label}</a><span>${ch.when}</span></li>`;
            })
            .join("")}
        </ol>
      </section>`,
    )
    .join("");

  return `<div class="page">
    <header class="hero">
      <p class="eyebrow">${site.subtitle}</p>
      <h1>${site.title}</h1>
      <p class="lede">按书章拆解，每章有浓缩说明、衔接句、练习与作品图。适合第一次读贡布里希的人，也适合想快速复习全书结构的人。</p>
      <div class="hero-actions">
        <a class="button primary" href="#read/intro">从导论开始</a>
        <a class="button" href="#derive">衍生学习</a>
      </div>
      <p class="disclaimer">${site.disclaimer}</p>
    </header>
    <section class="how">
      <h2>怎么用</h2>
      <ul>
        <li>先读一段（四个大段），再进单章，不要一次跳二十八章。</li>
        <li>每章先看三件作品里的「看这里」，再读文字。</li>
        <li>做完练习再点下一章，比连续刷完更有效。</li>
      </ul>
    </section>
    ${partCards}
  </div>`;
}

function renderChapter(id: string) {
  const chapter = getChapter(id);
  const part = parts.find((p) => p.id === chapter.part);
  const works = chapter.workIds.map(workCard).join("");
  const heading = id === "intro" ? "导论" : `第 ${id.replace("c", "")} 章`;
  return `<div class="page read">
    <p class="breadcrumb"><a href="#home">目录</a> · ${part?.title ?? ""}</p>
    <header class="chapter-head">
      <p class="chapter-kicker">${heading}</p>
      <h1>${chapter.title}</h1>
      <p class="chapter-when">${chapter.when}</p>
    </header>
    <section class="prose">
      ${chapter.paragraphs.map((p) => `<p>${p}</p>`).join("")}
    </section>
    <aside class="hinge">
      <h2>承上启下</h2>
      <p>${chapter.hinge}</p>
    </aside>
    <section class="works">
      <h2>本章作品</h2>
      <div class="work-grid">${works}</div>
    </section>
    <aside class="exercise">
      <h2>练习</h2>
      <p>${chapter.exercise}</p>
    </aside>
    ${chapterNav(id)}
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
  const bounds = boundaries.map((b) => `<li>${b}</li>`).join("");
  const links = museums
    .map((m) => `<li><a href="${m.url}" target="_blank" rel="noopener">${m.name}</a></li>`)
    .join("");

  return `<div class="page derive">
    <header>
      <h1>衍生学习</h1>
      <p>对照、词汇、书的边界，以及继续看图的去处。</p>
    </header>
    <section>
      <h2>对照看图</h2>
      <div class="pair-grid">${pairs}</div>
    </section>
    <section>
      <h2>小词典</h2>
      <dl class="glossary">${terms}</dl>
    </section>
    <section>
      <h2>读这本书时要记住的缺口</h2>
      <ul class="bounds">${bounds}</ul>
    </section>
    <section>
      <h2>继续看图</h2>
      <ul class="museum-list">${links}</ul>
      <p class="note">Google Arts 与 WikiArt 适合浏览；本站本地图来自 Wikimedia Commons 开放许可文件，不批量抓取 WikiArt 图库。</p>
    </section>
  </div>`;
}

function shell(body: string, route: Route) {
  return `${navLink("目录", "home", route.name === "home")}
    ${navLink("衍生", "derive", route.name === "derive")}
    ${body}
    <footer class="site-footer">
      <p>学习支架 · 非商业导读 · 图像许可见各图注</p>
    </footer>`;
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
  } else if (route.name === "derive") {
    body = renderDerive();
    document.title = `衍生学习 · ${site.title}`;
  } else {
    body = renderHome();
    document.title = site.title;
  }
  app.innerHTML = shell(body, route);
  app.className = "shell";
}
