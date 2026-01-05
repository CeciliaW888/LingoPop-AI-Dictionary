
export enum AppView {
  HOME = 'HOME',
  NOTEBOOK = 'NOTEBOOK',
  STORY = 'STORY',
  STUDY = 'STUDY',
  LIVE = 'LIVE',
}

export interface Language {
  code: string;
  name: string;
  flag: string; // Emoji
}

export interface ExampleSentence {
  target: string;
  native: string;
}

export interface DictionaryEntry {
  id: string; // Unique ID (e.g., term + timestamp)
  term: string; // Input term
  targetTerm: string; // The word in the target language
  definition: string;
  targetLang: string;
  nativeLang: string;
  pronunciation?: string; // Phonetic or simple description
  imageUrl?: string; // Base64 data URI
  examples: ExampleSentence[];
  usageNote: string;
}

export interface SavedEntry extends DictionaryEntry {
  savedAt: number;
}
