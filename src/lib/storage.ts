import fs from 'fs/promises';
import path from 'path';
import { Book, Chapter, StateBible } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'books');

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function bookPath(bookId: string) {
  return path.join(DATA_DIR, `${bookId}.json`);
}

// ─── BOOK CRUD ────────────────────────────────────────────────────────────────

export async function saveBook(book: Book): Promise<void> {
  await ensureDir(DATA_DIR);
  await fs.writeFile(bookPath(book.id), JSON.stringify(book, null, 2), 'utf-8');
}

export async function getBook(bookId: string): Promise<Book | null> {
  try {
    const raw = await fs.readFile(bookPath(bookId), 'utf-8');
    return JSON.parse(raw) as Book;
  } catch {
    return null;
  }
}

export async function listBooks(): Promise<Book[]> {
  await ensureDir(DATA_DIR);
  const files = await fs.readdir(DATA_DIR);
  const books: Book[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
      const book = JSON.parse(raw) as Book;
      // Return without full chapter content for list view
      books.push({ ...book, chapters: book.chapters.map(c => ({ ...c, content: '' })) });
    } catch {
      // skip corrupt files
    }
  }
  return books.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function deleteBook(bookId: string): Promise<void> {
  try {
    await fs.unlink(bookPath(bookId));
  } catch {
    // already gone
  }
}

// ─── CHAPTER HELPERS ─────────────────────────────────────────────────────────

export async function addChapter(bookId: string, chapter: Chapter): Promise<Book | null> {
  const book = await getBook(bookId);
  if (!book) return null;

  const existing = book.chapters.findIndex(c => c.number === chapter.number);
  if (existing >= 0) {
    book.chapters[existing] = chapter;
  } else {
    book.chapters.push(chapter);
  }
  book.updatedAt = new Date().toISOString();
  await saveBook(book);
  return book;
}

export async function updateStateBible(bookId: string, bible: StateBible): Promise<void> {
  const book = await getBook(bookId);
  if (!book) return;
  book.stateBible = bible;
  book.updatedAt = new Date().toISOString();
  await saveBook(book);
}

export function buildInitialStateBible(): StateBible {
  return {
    lastUpdatedChapter: 0,
    characters: [],
    markerUsageCount: {},
    pendingEmotionalDebts: [],
    narrativeInventory: {
      usedOpeningTypes: [],
      usedDynamics: [],
      openPlotThreads: [],
      resolvedPlotThreads: [],
      plannedTwists: [],
    },
    worldState: 'Historia no iniciada',
    mainConflictStatus: 'Sin comenzar',
    timeCountdowns: [],
    worldRules: [],
    prohibitedPatterns: [],
    patternUsageCount: {},
  };
}
