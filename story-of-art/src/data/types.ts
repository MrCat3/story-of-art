export type Work = {
  id: string;
  title: string;
  artist: string;
  year: string;
  place: string;
  look: string;
  /** 英文检索名，用于 Google Arts / WikiArt */
  query?: string;
  context?: string;
  inBook?: string;
  style?: string;
};

export type Chapter = {
  id: string;
  part: 1 | 2 | 3 | 4;
  title: string;
  when: string;
  teaser?: string;
  prior?: string;
  conflict?: string;
  revision?: string;
  authorNote?: string[];
  styleNote?: string[];
  paragraphs: string[];
  hinge: string;
  exercise: string;
  workIds: string[];
  /** 段落序号之后插入作品，序号从 0 起 */
  inserts?: { at: number; workIds: string[] }[];
  /** 在正文里描出来的短句，便于扫读 */
  marks?: string[];
};

export type ImageCredit = {
  file: string;
  commonsTitle: string;
  commonsPage: string;
  license: string;
  licenseUrl: string;
  artist: string;
  credit: string;
};
