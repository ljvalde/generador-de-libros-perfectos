import { Book, CharacterProfile, ChapterOutline, WorldBible } from './types';

export interface BookDraft {
  title: string;
  genre: string;
  subgenre: string;
  synopsis: string;
  targetChapters: number;
  targetWords: number;
  characters: CharacterProfile[];
  outline: ChapterOutline[];
  setting: string;
  era: string;
  centralConflict: string;
  themes: string;
  physicsRules: string;
  tone: string;
  pov: 'first' | 'third-limited' | 'third-omniscient';
}

const STORAGE_KEY = 'book-draft';

export function loadDraft(): BookDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookDraft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: BookDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota or privacy errors
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Export Book to JSON format for download (similar to herederos_del_vaco.json) */
export function exportBookToJson(book: Book): string {
  const slug = book.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

  const exportData = {
    id: book.id,
    concept: {
      title: book.title,
      premise: book.synopsis,
      genre: `${book.genre}${book.subgenre ? ` / ${book.subgenre}` : ''}`,
      tone: book.worldBible.tone || 'Por definir',
      chaptersCount: book.targetChapters,
      wordsPerChapter: book.targetWordsPerChapter,
      writingEngine: 'standard',
    },
    outline: book.outline.map(ch => ({
      number: ch.number,
      title: ch.title,
      summary: ch.summary,
      function: ch.function,
      keyEvents: ch.keyEvents ?? [],
      characterFocus: ch.characterFocus ?? [],
      emotionalTarget: ch.emotionalTarget ?? '',
    })),
    characters: book.characters.map(c => ({
      name: c.name,
      role: c.role,
      gender: c.gender,
      age: c.age,
      physicalDescription: c.physicalDescription,
      distinctiveVoice: c.distinctiveVoice,
      centralMotivation: c.centralMotivation,
      internalContradiction: c.internalContradiction,
      fillerWord: c.fillerWord,
      ticDescription: c.ticDescription,
      ticEvolutionRule: c.ticEvolutionRule,
      knownFacts: c.knownFacts,
    })),
    world: {
      setting: book.worldBible.setting,
      era: book.worldBible.era,
      centralConflict: book.worldBible.centralConflict,
      themes: book.worldBible.themes,
      tone: book.worldBible.tone,
      physicsRules: book.worldBible.physicsRules,
      pov: book.worldBible.pov,
    },
    stateBible: book.stateBible,
    chapters: book.chapters.map(ch => ({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      content: ch.content,
      wordCount: ch.wordCount,
      createdAt: ch.createdAt,
    })),
    metadata: {
      status: book.status,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadBookJson(book: Book): void {
  const json = exportBookToJson(book);
  const slug = book.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'libro'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
