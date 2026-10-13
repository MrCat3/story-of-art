import type { ImageCredit } from "../data/types";
import credits from "../data/images.json";

const map = credits as Record<string, ImageCredit | null>;

export function getImageCredit(id: string): ImageCredit | null {
  return map[id] ?? null;
}

export function imageSrc(id: string): string | null {
  const credit = getImageCredit(id);
  if (!credit?.file) return null;
  return `/images/${credit.file}`;
}
