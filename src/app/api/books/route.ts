import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { listBooks, saveBook, buildInitialStateBible } from '@/lib/storage';
import { callClaudeJSON, MODEL_FAST } from '@/lib/claude';
import { buildInitialBiblePrompt, buildOutlineGeneratorPrompt } from '@/lib/prompts/bible';
import { Book, CreateBookPayload, StateBible, ChapterOutline } from '@/lib/types';

export async function GET() {
  try {
    const books = await listBooks();
    return NextResponse.json(books);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CreateBookPayload;

    // 1. Generate outline if not provided
    let outline: ChapterOutline[] = payload.outline ?? [];
    if (!outline.length) {
      outline = await callClaudeJSON<ChapterOutline[]>(
        buildOutlineGeneratorPrompt(
          payload.title,
          payload.genre,
          payload.subgenre,
          payload.synopsis,
          payload.characters.map(c => c.name),
          payload.targetChapters
        ),
        { model: MODEL_FAST }
      );
    }

    // 2. Generate initial State Bible
    let stateBible: StateBible;
    try {
      stateBible = await callClaudeJSON<StateBible>(
        buildInitialBiblePrompt({ ...payload, outline }),
        { model: MODEL_FAST }
      );
      // Ensure required fields exist
      stateBible.markerUsageCount = stateBible.markerUsageCount ?? {};
      stateBible.pendingEmotionalDebts = stateBible.pendingEmotionalDebts ?? [];
      stateBible.prohibitedPatterns = stateBible.prohibitedPatterns ?? [];
      stateBible.patternUsageCount = stateBible.patternUsageCount ?? {};
    } catch {
      stateBible = buildInitialStateBible();
    }

    const book: Book = {
      id: uuid(),
      title: payload.title,
      genre: payload.genre,
      subgenre: payload.subgenre,
      synopsis: payload.synopsis,
      targetChapters: payload.targetChapters,
      targetWordsPerChapter: payload.targetWordsPerChapter,
      characters: payload.characters,
      worldBible: payload.worldBible,
      outline,
      stateBible,
      chapters: [],
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveBook(book);
    return NextResponse.json(book, { status: 201 });
  } catch (err) {
    console.error('POST /api/books error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
