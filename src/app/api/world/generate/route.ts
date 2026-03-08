import { NextRequest, NextResponse } from 'next/server';
import { callClaudeJSON, MODEL_FAST } from '@/lib/claude';
import { WorldBible } from '@/lib/types';

interface WorldGenerateResult {
  setting: string;
  era: string;
  centralConflict: string;
  physicsRules: string[];
  themes: string | string[];
  tone: string;
}

function buildWorldGeneratorPrompt(
  title: string,
  genre: string,
  subgenre: string,
  synopsis: string,
  characterNames: string[]
): string {
  return `Eres un editor literario de nivel editorial. Genera la definición del MUNDO para esta novela.
Las reglas del mundo se usan para detectar inconsistencias narrativas.

TÍTULO: ${title}
GÉNERO: ${genre} ${subgenre ? `/ ${subgenre}` : ''}
SINOPSIS: ${synopsis}
PERSONAJES PRINCIPALES: ${characterNames.join(', ') || '(inferir de la sinopsis)'}

Genera un mundo coherente con la historia. Incluye:
1. Ambientación (dónde ocurre)
2. Era/Época (cuándo ocurre)
3. Conflicto central (el motor de la historia)
4. Reglas físicas/tecnológicas (3-6 reglas, una por línea, que limiten o definan el mundo)
5. Temas (3-5 separados por coma)
6. Tono narrativo

Devuelve SOLO JSON con esta estructura:
{
  "setting": "descripción de la ambientación",
  "era": "época o año",
  "centralConflict": "el conflicto central",
  "physicsRules": ["regla 1", "regla 2", "regla 3"],
  "themes": "tema1, tema2, tema3",
  "tone": "descripción del tono"
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, genre, subgenre, synopsis, characterNames } = body;
    if (!title || !synopsis) {
      return NextResponse.json({ error: 'Faltan title o synopsis' }, { status: 400 });
    }

    const names = Array.isArray(characterNames) ? characterNames : [];
    const result = await callClaudeJSON<WorldGenerateResult>(
      buildWorldGeneratorPrompt(title || '', genre || '', subgenre || '', synopsis, names),
      { model: MODEL_FAST }
    );

    const worldBible: Partial<WorldBible> = {
      setting: result.setting ?? '',
      era: result.era ?? '',
      keyLocations: [],
      physicsRules: Array.isArray(result.physicsRules) ? result.physicsRules : [],
      technologyLevel: '',
      socialStructure: '',
      centralConflict: result.centralConflict ?? '',
      themes: Array.isArray(result.themes)
        ? result.themes
        : (typeof result.themes === 'string' ? result.themes.split(',').map(t => t.trim()).filter(Boolean) : []),
      tone: result.tone ?? '',
      pov: 'third-limited',
      targetAudience: 'Adultos',
    };

    return NextResponse.json(worldBible);
  } catch (err) {
    console.error('POST /api/world/generate error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
