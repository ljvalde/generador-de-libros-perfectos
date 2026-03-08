import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON, MODEL_FAST } from '@/lib/claude';
import { buildConceptGeneratorPrompt } from '@/lib/prompts/bible';

interface ConceptResult {
  title: string;
  genre: string;
  subgenre: string;
  synopsis: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const seed: string | undefined = body?.seed;

    const result = await callClaudeJSON<ConceptResult>(
      buildConceptGeneratorPrompt(seed),
      { model: MODEL_FAST, temperature: 0.9 }
    );

    return NextResponse.json({
      title: result.title ?? '',
      genre: result.genre ?? 'literary',
      subgenre: result.subgenre ?? '',
      synopsis: result.synopsis ?? '',
    });
  } catch (err) {
    console.error('POST /api/concept/generate error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
