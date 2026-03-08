import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON, MODEL_FAST } from '@/lib/claude';
import { buildOutlineGeneratorPrompt } from '@/lib/prompts/bible';
import { ChapterOutline } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, genre, subgenre, synopsis, targetChapters, characterNames } = body;
    if (!title || !synopsis || !targetChapters) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: title, synopsis, targetChapters' },
        { status: 400 }
      );
    }

    const names = Array.isArray(characterNames) ? characterNames : [];
    const prompt = buildOutlineGeneratorPrompt(
      title,
      genre || '',
      subgenre || '',
      synopsis,
      names,
      Math.min(Math.max(Number(targetChapters) || 20, 5), 50)
    );

    const outline = await callClaudeJSON<ChapterOutline[]>(prompt, { model: MODEL_FAST });
    return NextResponse.json(outline);
  } catch (err) {
    console.error('POST /api/outline/generate error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
