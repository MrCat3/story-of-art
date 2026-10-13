import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import path from "node:path";

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
  const filename = `${item.id}.${ext}`;
  await download(src, path.join(outDir, filename));
  const meta = chosen.image.extmetadata ?? {};
  credits[item.id] = {
    file: filename,
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
