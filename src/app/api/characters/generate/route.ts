import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON, MODEL_FAST } from '@/lib/claude';
import { buildCharacterProfilePrompt } from '@/lib/prompts/bible';
import { CharacterProfile } from '@/lib/types';

function buildCharacterFromConceptPrompt(
  bookTitle: string,
  genre: string,
  synopsis: string,
  role: string,
  concept?: string
): string {
  const conceptLine = concept?.trim()
    ? `- Concepto o pista: ${concept}`
    : '- Concepto: inventa un personaje coherente con la historia';
  return `Eres un editor literario. CREA UN PERSONAJE COMPLETO desde cero para esta novela. Debes inventar TODO: nombre, edad, descripción física, voz, motivación, tics, muletilla, etc.

NOVELA: ${bookTitle}
GÉNERO: ${genre}
SINOPSIS: ${synopsis}

INFORMACIÓN DEL PERSONAJE A CREAR:
- Rol: ${role}
${conceptLine}

Debes generar un nombre apropiado para el género, época y tono de la historia. El personaje debe encajar en la sinopsis.

El tic físico DEBE:
- Ser específico y único (no "aprieta mandíbula" — genérico)
- Tener límite 2-4 por capítulo
- Tener regla de evolución con el arco

La muletilla DEBE ser palabra/frase 1-4 palabras, límite 3 por capítulo.

Devuelve SOLO JSON con esta estructura:
{
  "name": "Nombre que inventes",
  "gender": "male | female | neutral | unknown",
  "role": "${role}",
  "age": "...",
  "physicalDescription": "...",
  "distinctiveVoice": "Cómo habla, qué NUNCA diría",
  "centralMotivation": "UNA motivación que nunca cambia",
  "internalContradiction": "El conflicto que lo hace humano",
  "lineTheyWontCross": "Lo que lo define",
  "fearResponse": "Cómo reacciona al miedo",
  "painResponse": "Cómo reacciona al dolor",
  "lossResponse": "Cómo reacciona a la pérdida",
  "fillerWord": "su muletilla",
  "fillerWordMaxPerChapter": 3,
  "ticDescription": "tic físico específico y único",
  "ticMaxPerChapter": 3,
  "ticMaxInBook": 8,
  "ticEvolutionRule": "cómo evoluciona o desaparece con su arco",
  "knownFacts": ["hecho inmutable 1", "hecho inmutable 2"],
  "aliases": []
}`;
}

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
