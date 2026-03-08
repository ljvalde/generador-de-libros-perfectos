import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON, MODEL_FAST } from '@/lib/claude';
import { buildCharacterProfilePrompt, buildCharacterFromConceptPrompt } from '@/lib/prompts/bible';
import { CharacterProfile } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { name, role, description, concept, bookTitle, genre, synopsis } = await req.json();
    const roleVal = role || 'secondary';

    let profile: CharacterProfile;

    if (name?.trim()) {
      // Modo con nombre: genera perfil completo para personaje nombrado
      profile = await callClaudeJSON<CharacterProfile>(
        buildCharacterProfilePrompt(bookTitle || 'Sin título', genre || 'literaria', synopsis || '', {
          name: name.trim(),
          role: roleVal,
          description: description || name.trim(),
        }),
        { model: MODEL_FAST, temperature: 0.8 }
      );
      profile = { ...profile, name: name.trim() };
    } else {
      // Modo sin nombre: genera TODO (incl. nombre) desde rol + concepto
      profile = await callClaudeJSON<CharacterProfile>(
        buildCharacterFromConceptPrompt(
          bookTitle || 'Sin título',
          genre || 'literaria',
          synopsis || '',
          roleVal,
          concept || description
        ),
        { model: MODEL_FAST, temperature: 0.8 }
      );
    }

    // Ensure required fields have defaults
    return NextResponse.json({
      ...profile,
      name: profile.name ?? 'Sin nombre',
      role: profile.role ?? roleVal,
      gender: profile.gender ?? 'unknown',
      fillerWordMaxPerChapter: profile.fillerWordMaxPerChapter ?? 3,
      ticMaxPerChapter: profile.ticMaxPerChapter ?? 3,
      ticMaxInBook: profile.ticMaxInBook ?? 8,
      knownFacts: profile.knownFacts ?? [],
      aliases: profile.aliases ?? [],
    });
  } catch (err) {
    console.error('Character generate error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
