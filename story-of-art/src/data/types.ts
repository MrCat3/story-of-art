export type Work = {
  id: string;
  title: string;
  artist: string;
  year: string;
  place: string;
  look: string;
};

export type Chapter = {
  id: string;
  part: 1 | 2 | 3 | 4;
  title: string;
  when: string;
  paragraphs: string[];
  hinge: string;
  exercise: string;
  workIds: string[];
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
