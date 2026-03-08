import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getBook, addChapter, updateStateBible } from '@/lib/storage';
import { callClaude, callClaudeJSON, MODEL, MODEL_FAST } from '@/lib/claude';
import { buildGhostwriterPrompt } from '@/lib/prompts/ghostwriter';
import { buildStateBibleUpdaterPrompt } from '@/lib/prompts/stateBibleUpdater';
import { buildVerifierPrompt } from '@/lib/prompts/verifier';
import { Chapter, StateBible, VerificationResult } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { chapterNumber, additionalInstructions } = await req.json();

    const book = await getBook(id);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    const outline = book.outline.find(o => o.number === chapterNumber);
    if (!outline) return NextResponse.json({ error: 'Chapter not in outline' }, { status: 400 });

    // ── STEP 1: Generate chapter ─────────────────────────────────────────────
    const ghostwriterPrompt = buildGhostwriterPrompt(
      book,
      chapterNumber,
      book.stateBible,
      additionalInstructions
    );

    const rawContent = await callClaude(ghostwriterPrompt, {
      model: MODEL,
      maxTokens: 8192,
      temperature: 0.75,
    });

    // Extract title from first line if present
    const lines = rawContent.trim().split('\n');
    const titleLine = lines[0].startsWith('#') ? lines[0].replace(/^#+\s*/, '') : outline.title;
    const content = lines[0].startsWith('#') ? lines.slice(1).join('\n').trim() : rawContent.trim();
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    const WORD_MIN = 1750;
    const WORD_MAX = 1950;
    const wordCountOutOfRange = wordCount < WORD_MIN || wordCount > WORD_MAX;

    // ── STEP 2: Verify chapter ────────────────────────────────────────────────
    let verificationResult: VerificationResult | undefined;
    try {
      verificationResult = await callClaudeJSON<VerificationResult>(
        buildVerifierPrompt(chapterNumber, content, book.stateBible),
        { model: MODEL_FAST, temperature: 0.1 }
      );
    } catch (e) {
      console.warn('Verifier failed:', e);
    }

    // Inject word count check into verification result
    if (wordCountOutOfRange) {
      const wcWarning = wordCount < WORD_MIN
        ? { type: 'WORD_COUNT_LOW' as const, description: `El capítulo tiene ${wordCount} palabras — mínimo requerido: ${WORD_MIN}.` }
        : { type: 'WORD_COUNT_HIGH' as const, description: `El capítulo tiene ${wordCount} palabras — máximo permitido: ${WORD_MAX}.` };
      if (verificationResult) {
        verificationResult.warnings = [wcWarning, ...(verificationResult.warnings ?? [])];
      } else {
        verificationResult = { passed: true, criticalErrors: [], warnings: [wcWarning], markerCountsThisChapter: {} };
      }
    }

    // ── STEP 3: Update State Bible ────────────────────────────────────────────
    let updatedBible: StateBible = book.stateBible;
    try {
      updatedBible = await callClaudeJSON<StateBible>(
        buildStateBibleUpdaterPrompt(chapterNumber, content, book.stateBible, book.characters),
        { model: MODEL_FAST, temperature: 0.1 }
      );

      // Merge marker counts from verifier if available
      if (verificationResult?.markerCountsThisChapter) {
        for (const [phrase, count] of Object.entries(verificationResult.markerCountsThisChapter)) {
          updatedBible.markerUsageCount[phrase] = (updatedBible.markerUsageCount[phrase] ?? 0) + count;
        }
      }

      await updateStateBible(id, updatedBible);
    } catch (e) {
      console.warn('State Bible update failed:', e);
    }

    // ── STEP 4: Save chapter ──────────────────────────────────────────────────
    const chapter: Chapter = {
      id: uuid(),
      bookId: id,
      number: chapterNumber,
      title: titleLine,
      content,
      wordCount,
      createdAt: new Date().toISOString(),
      verificationResult,
      stateBibleSnapshot: updatedBible,
    };

    const updatedBook = await addChapter(id, chapter);

    // Update book status
    if (updatedBook && updatedBook.status === 'planning') {
      updatedBook.status = 'writing';
      const { saveBook } = await import('@/lib/storage');
      await saveBook(updatedBook);
    }

    return NextResponse.json({
      chapter,
      verificationResult,
      stateBible: updatedBible,
    });
  } catch (err) {
    console.error('POST /api/books/[id]/chapters error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
