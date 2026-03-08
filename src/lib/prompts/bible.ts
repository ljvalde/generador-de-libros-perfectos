import { CreateBookPayload, StateBible } from '../types';

export function buildInitialBiblePrompt(payload: CreateBookPayload): string {
  return `Eres un editor literario de nivel editorial. Analiza la propuesta de libro y genera la Biblia de Estado inicial.

LIBRO: ${payload.title}
GÉNERO: ${payload.genre} / ${payload.subgenre}
SINOPSIS: ${payload.synopsis}

PERSONAJES:
${payload.characters.map(c => `
- ${c.name} (${c.role}, ${c.gender})
  Tic: "${c.ticDescription}" — límite ${c.ticMaxPerChapter}/cap, ${c.ticMaxInBook}/libro total
  Evolución del tic: ${c.ticEvolutionRule}
  Muletilla: "${c.fillerWord}" — límite ${c.fillerWordMaxPerChapter}/cap
  Aliases: ${c.aliases.map(a => `"${a.name}" (creado en cap ${a.createdInChapter})`).join(', ') || 'ninguno'}
  Hechos inmutables: ${c.knownFacts.join(', ')}
`).join('')}

MUNDO:
- Ambientación: ${payload.worldBible.setting}
- Era: ${payload.worldBible.era}
- Reglas físicas: ${payload.worldBible.physicsRules.join('; ')}
- Conflicto central: ${payload.worldBible.centralConflict}
- Temas: ${payload.worldBible.themes.join(', ')}

OUTLINE:
${payload.outline.map(c => `Cap ${c.number}: "${c.title}" — ${c.summary}`).join('\n')}

Genera la Biblia de Estado inicial (antes del capítulo 1) como JSON puro. Incluye:
- El estado inicial de cada personaje (todos vivos, ubicación inicial, condición física de inicio)
- markerUsageCount vacío
- pendingEmotionalDebts vacío
- Cualquier regla de mundo CLARA que ya conozcas de la sinopsis
- Si hay cuentas regresivas mencionadas en el outline, inicializarlas

DEVUELVE SOLO JSON VÁLIDO con la estructura StateBible completa.`;
}

export function buildOutlineGeneratorPrompt(
  title: string,
  genre: string,
  subgenre: string,
  synopsis: string,
  characterNames: string[],
  targetChapters: number
): string {
  return `Eres un editor literario de nivel editorial. Genera un outline completo de ${targetChapters} capítulos para esta novela.

TÍTULO: ${title}
GÉNERO: ${genre} / ${subgenre}
SINOPSIS: ${synopsis}
PERSONAJES PRINCIPALES: ${characterNames.join(', ')}

REGLAS PARA EL OUTLINE:
1. Estructura en 3 actos: Acto 1 (20%), Acto 2 (60%), Acto 3 (20%)
2. Cada giro narrativo importante debe tener 2+ semillas plantadas antes de ocurrir
3. El clímax ocurre en el penúltimo capítulo, la resolución en el último
4. Cada capítulo tiene UNA función principal (acción / revelación / pausa-emocional / giro / transición / clímax / resolución)
5. Distribuir pausas emocionales después de eventos de alto impacto
6. El protagonista paga un precio real — no puede haber salida gratuita del conflicto central
7. Los personajes secundarios importantes deben introducirse con tiempo suficiente antes de sus momentos clave
8. La pregunta central de la novela debe responderse con consecuencias visibles en el final

Devuelve SOLO un JSON array con ${targetChapters} objetos ChapterOutline:
[
  {
    "number": 1,
    "title": "Título del capítulo",
    "summary": "Resumen de 2-3 frases de qué ocurre",
    "function": "action | revelation | emotional-pause | twist | transition | climax | resolution",
    "keyEvents": ["evento 1", "evento 2"],
    "characterFocus": ["Personaje A"],
    "emotionalTarget": "Qué debe sentir el lector al terminar este capítulo"
  },
  ...
]`;
}

export function buildCharacterProfilePrompt(
  bookTitle: string,
  genre: string,
  synopsis: string,
  basicInfo: {
    name: string;
    role: string;
    description: string;
  }
): string {
  return `Eres un editor literario. Crea el perfil completo de un personaje para esta novela.

NOVELA: ${bookTitle}
GÉNERO: ${genre}
SINOPSIS: ${synopsis}

INFORMACIÓN BÁSICA DEL PERSONAJE:
- Nombre: ${basicInfo.name}
- Rol: ${basicInfo.role}
- Descripción inicial: ${basicInfo.description}

Genera el perfil completo. El tic físico DEBE:
- Ser específico y único para este personaje (no "aprieta mandíbula" — eso es genérico)
- Tener un límite realista por capítulo (2-4 máximo)
- Tener una regla de evolución: cómo cambia o desaparece con el arco del personaje

La muletilla DEBE:
- Ser una palabra o frase de 1-4 palabras que este personaje usaría
- Límite máximo de 3 por capítulo

Devuelve SOLO JSON con esta estructura:
{
  "name": "${basicInfo.name}",
  "gender": "male | female | neutral | unknown",
  "role": "${basicInfo.role}",
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
