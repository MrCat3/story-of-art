import { execFile } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const root = path.resolve(import.meta.dirname, "..");
const catalog = JSON.parse(
  await readFile(path.join(root, "scripts/catalog.json"), "utf8"),
);
const outDir = path.join(root, "public/images");
await mkdir(outDir, { recursive: true });

const headers = {
  "User-Agent": "StoryOfArtLearning/0.1 (local educational static site)",
  "Api-User-Agent": "StoryOfArtLearning/0.1",
};

function strip(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function licenseOk(short) {
  const value = short.toLowerCase();
  if (/non-?free|all rights reserved|fair use|copyrighted/.test(value)) {
    return false;
  }
  return /public domain|cc0|cc by|cc-by|no restrictions/.test(value);
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(params, attempt = 0) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({ format: "json", origin: "*", ...params });
  const response = await fetch(url, { headers });
  if (response.status === 429 && attempt < 8) {
    await sleep(2000 * 2 ** attempt);
    return api(params, attempt + 1);
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  await sleep(1200);
  return response.json();
}

async function search(query) {
  const data = await api({
    action: "query",
    list: "search",
    srsearch: query,
    srnamespace: "6",
    srlimit: "8",
  });
  return (data.query?.search ?? []).map((hit) => hit.title);
}

async function info(title) {
  const data = await api({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    iiurlwidth: "1400",
  });
  const page = Object.values(data.query.pages)[0];
  if (!page || page.missing !== undefined) return null;
  return page.imageinfo?.[0] ?? null;
}

async function download(url, file) {
  const response = await fetch(url, { headers });
  if (!response.ok || !response.body) {
    throw new Error(`download ${response.status} ${url}`);
  }
  await pipeline(response.body, createWriteStream(file));
}

/** Match the served set: max width 1200, WebP quality 80. */
async function toWebp(srcPath, destPath) {
  const py = `
from PIL import Image
im = Image.open(${JSON.stringify(srcPath)})
im.load()
if im.mode not in ("RGB", "RGBA"):
    im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
w, h = im.size
if w > 1200:
    h = max(1, round(h * 1200 / w))
    im = im.resize((1200, h), Image.Resampling.LANCZOS)
    w, h = im.size
im.save(${JSON.stringify(destPath)}, "WEBP", quality=80, method=6)
print(w, h)
`;
  const { stdout } = await execFileAsync("python3", ["-c", py]);
  const [width, height] = stdout.trim().split(/\s+/).map(Number);
  return { width, height };
}

let credits = {};
const creditsPath = path.join(root, "src/data/images.json");
try {
  credits = JSON.parse(await readFile(creditsPath, "utf8"));
} catch {
  credits = {};
}

for (const item of catalog) {
  if (credits[item.id]?.file) {
    console.log(`skip ${item.id}: already have file`);
    continue;
  }
  const titles = await search(item.query);
  let chosen = null;
  for (const title of titles) {
    const lower = title.toLowerCase();
    if (item.must?.some((token) => !lower.includes(token.toLowerCase()))) continue;
    if (item.not?.some((token) => lower.includes(token.toLowerCase()))) continue;
    const image = await info(title);
    if (!image) continue;
    const meta = image.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? "";
    if (!licenseOk(license)) {
      console.log(`skip ${item.id}: ${license} :: ${title}`);
      continue;
    }
    if ((image.thumbwidth ?? image.width) < 600) continue;
    chosen = { title, image, license };
    break;
  }
  if (!chosen) {
    console.log(`MISS ${item.id}`);
    credits[item.id] = null;
    continue;
  }
  const src = chosen.image.thumburl || chosen.image.url;
  const ext = chosen.image.mime === "image/png" ? "png" : "jpg";
  const rawName = `${item.id}.${ext}`;
  const rawPath = path.join(outDir, rawName);
  await download(src, rawPath);
  const webpName = `${item.id}.webp`;
  const webpPath = path.join(outDir, webpName);
  const { width, height } = await toWebp(rawPath, webpPath);
  await unlink(rawPath);
  const meta = chosen.image.extmetadata ?? {};
  credits[item.id] = {
    file: webpName,
    width,
    height,
    commonsTitle: chosen.title,
    commonsPage: chosen.image.descriptionurl,
    license: strip(chosen.license),
    licenseUrl: meta.LicenseUrl?.value ?? "",
    artist: strip(meta.Artist?.value ?? "未注明"),
    credit: strip(meta.Credit?.value ?? ""),
  };
  console.log(`ok ${item.id}: ${chosen.title}`);
  await writeFile(creditsPath, JSON.stringify(credits, null, 2));
}

await writeFile(creditsPath, JSON.stringify(credits, null, 2));
console.log("wrote credits", Object.values(credits).filter(Boolean).length);
