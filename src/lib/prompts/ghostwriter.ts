import { Book, StateBible, ChapterOutline } from '../types';

const MARKER_HARD_LIMIT = 2; // max times a saturated marker can appear in ONE chapter
const MARKER_GLOBAL_WARN = 8; // start blocking after this many uses in the full book

function buildStateContext(bible: StateBible, chapterNumber: number): string {
  const blockedMarkers = Object.entries(bible.markerUsageCount)
    .filter(([, count]) => count >= MARKER_GLOBAL_WARN)
    .map(([phrase, count]) => `• "${phrase}" → ${count} usos totales — MÁXIMO ${MARKER_HARD_LIMIT} en este capítulo`)
    .join('\n');

  const characters = bible.characters
    .map(c => {
      const aliasesAvailable = c.aliases
        .filter(a => a.createdInChapter <= chapterNumber)
        .map(a => a.name);
      const aliasesLocked = c.aliases
        .filter(a => a.createdInChapter > chapterNumber)
        .map(a => a.name);

      return `
  ▸ ${c.name} [${c.gender.toUpperCase()} | ${c.status.toUpperCase()}]
    Ubicación: ${c.location}
    Condición física: ${c.physicalCondition || 'Sin lesiones'}
    Estado emocional: ${c.emotionalState || 'Estable'}
    Último capítulo activo: Cap ${c.lastSeenChapter}
    ${c.status === 'dead' ? '⚠️ MUERTO — solo puede aparecer en flashback o grabación PRE-HECHA. NUNCA activo.' : ''}
    ${c.reactivationRequired ? '⚠️ REACTIVACIÓN OBLIGATORIA — estaba inactivo. Este capítulo DEBE mostrar cómo vuelve antes de que actúe.' : ''}
    ${aliasesAvailable.length ? `Alias disponibles: ${aliasesAvailable.join(', ')}` : ''}
    ${aliasesLocked.length ? `Alias BLOQUEADOS (aún no existen): ${aliasesLocked.join(', ')}` : ''}
    Muletilla: "${c.fillerWord}" — MÁXIMO ${c.fillerWordMaxPerChapter} veces en este capítulo
    Tic físico: "${c.ticDescription}" — MÁXIMO ${c.ticMaxPerChapter} veces en este capítulo (total en libro: ${c.ticCurrentTotal}/${c.ticMaxInBook})
    ${c.ticEvolutionRule ? `Evolución del tic: ${c.ticEvolutionRule}` : ''}`.trim();
    })
    .join('\n\n');

  const debts = bible.pendingEmotionalDebts.length
    ? bible.pendingEmotionalDebts.map(d => `  ⚠️ ${d}`).join('\n')
    : '  Ninguna pendiente.';

  const threads = bible.narrativeInventory.openPlotThreads.length
    ? bible.narrativeInventory.openPlotThreads.map(t => `  → ${t}`).join('\n')
    : '  Ninguna abierta.';

  const countdowns = bible.timeCountdowns
    .filter(t => t.active)
    .map(t => `  ⏱ ${t.description}: actualmente "${t.currentValue}" (debe REDUCIRSE en este capítulo)`)
    .join('\n');

  const prohibited = [...bible.prohibitedPatterns, ...bible.narrativeInventory.usedOpeningTypes.slice(-3)]
    .filter(Boolean)
    .map(p => `  ✗ ${p}`)
    .join('\n');

  return `
══════════════════════════════════════════════════════
BIBLIA DE ESTADO — CAP ${chapterNumber} — FUENTE DE VERDAD ABSOLUTA
══════════════════════════════════════════════════════

PERSONAJES (respetar sin excepción):
${characters || '  Sin personajes registrados.'}

FRASES BLOQUEADAS (aparecen demasiado — límite ${MARKER_HARD_LIMIT} usos en este capítulo):
${blockedMarkers || '  Ninguna bloqueada aún.'}

DEUDAS EMOCIONALES (al menos UNA debe procesarse este capítulo):
${debts}

TRAMAS ABIERTAS (no olvidar):
${threads}

CUENTAS REGRESIVAS ACTIVAS (deben decrecer):
${countdowns || '  Ninguna activa.'}

PATRONES PROHIBIDOS (ya usados 3+ veces):
${prohibited || '  Ninguno prohibido aún.'}

ESTADO DEL MUNDO: ${bible.worldState}
CONFLICTO PRINCIPAL: ${bible.mainConflictStatus}
══════════════════════════════════════════════════════`;
}

export function buildGhostwriterPrompt(
  book: Book,
  chapterNumber: number,
  stateBible: StateBible,
  additionalInstructions?: string
): string {
  const outline = book.outline.find(o => o.number === chapterNumber);
  const prevChapters = book.chapters
    .filter(c => c.number < chapterNumber)
    .sort((a, b) => a.number - b.number)
    .slice(-5)
    .map(c => `Cap ${c.number} — "${c.title}"\n${c.content.slice(-800)}`)
    .join('\n\n---\n\n');

  const targetWords = book.targetWordsPerChapter;

  return `${buildStateContext(stateBible, chapterNumber)}

LIBRO: ${book.title}
GÉNERO: ${book.genre} / ${book.subgenre}
SINOPSIS: ${book.synopsis}
POV: ${book.worldBible.pov}
TONO: ${book.worldBible.tone}
AUDIENCIA: ${book.worldBible.targetAudience}

CAPÍTULO A ESCRIBIR: ${chapterNumber} — "${outline?.title ?? 'Sin título'}"
FUNCIÓN: ${outline?.function ?? 'N/A'}
RESUMEN DEL OUTLINE: ${outline?.summary ?? 'Sin resumen'}
EVENTOS CLAVE: ${outline?.keyEvents.join(' / ') ?? 'N/A'}
OBJETIVO EMOCIONAL: ${outline?.emotionalTarget ?? 'Sin objetivo'}
PERSONAJES EN FOCO: ${outline?.characterFocus.join(', ') ?? 'N/A'}
PALABRAS OBJETIVO: ${targetWords}

CIERRE DE LOS ÚLTIMOS CAPÍTULOS (texto real — NO outline):
${prevChapters || 'Primer capítulo del libro.'}

${additionalInstructions ? `INSTRUCCIONES ADICIONALES:\n${additionalInstructions}\n` : ''}
══════════════════════════════════════════════════════
PRE-VERIFICACIÓN OBLIGATORIA (responde internamente antes de escribir)
══════════════════════════════════════════════════════
1. ¿Algún personaje que aparecerá está marcado como MUERTO en la Biblia de Estado?
   → Si SÍ: solo aparece en flashback explícitamente marcado o grabación PRE-HECHA.

2. ¿Algún personaje tiene reactivationRequired=true?
   → Si SÍ: OBLIGATORIO mostrar cómo vuelve antes de que actúe.

3. ¿Voy a usar un alias de personaje?
   → Verificar que createdInChapter ≤ ${chapterNumber}. Si NO: NO usar ese alias.

4. ¿Hay deudas emocionales pendientes?
   → Al menos UNA debe tener rastro visible en este capítulo.

5. ¿La dinámica principal de este capítulo fue explorada 3+ veces ya?
   → Si SÍ: buscar ángulo nuevo.

6. ¿El tipo de apertura que planeo usar ya está en usedOpeningTypes de los últimos 3 caps?
   → Si SÍ: elegir otro.

7. ¿Las cuentas regresivas activas decrece en este capítulo?
   → OBLIGATORIO: el tiempo avanza, nunca se congela.

Solo después de confirmar las 7 preguntas, escribe el capítulo.

══════════════════════════════════════════════════════
REGLAS DE ESCRITURA
══════════════════════════════════════════════════════

PERSONAJES:
• Cada personaje habla con su voz única. Se puede identificar sin leer el nombre.
• Un personaje muerto NO puede actuar, hablar en presente, ni aparecer en metadatos activos.
• Después de un evento traumático (muerte, traición, revelación), el protagonista DEBE tener
  al menos una reacción interna antes de pasar a la siguiente acción.
• El protagonista tiene mínimo UNA vulnerabilidad que no puede resolver tácticamente.
• Si el protagonista está limitado físicamente, la narración respeta esa limitación.

MUNDO Y CONSISTENCIA:
• Todas las reglas del mundo son consistentes con lo establecido. CERO retcons.
• Recursos y tácticas no repiten lo ya usado sin justificación explícita.
• Saltos temporales se marcan con claridad.

RITMO Y PROSA:
• Máximo UN adjetivo donde la tentación es usar tres. El más preciso, no el más intenso.
• Los personajes bajo estrés extremo usan frases cortas, interrumpidas, con subtexto.
• Ningún monólogo de exposición supera 5 líneas continuas de un personaje.
• Dos personajes NO confirman la misma información con distintas palabras (diálogo espejo).

ARCO EMOCIONAL:
• Este capítulo termina en un lugar diferente (emocional o físicamente) al que empezó.
• El capítulo avanza el arco del protagonista, no solo la trama.
• Un sacrificio prometido se cobra. Un precio prometido se paga.

ESTRUCTURA DEL CAPÍTULO:
• Apertura que engancha en las primeras 3 líneas.
• Desarrollo con tensión creciente.
• Cierre que genera necesidad de leer el siguiente.

══════════════════════════════════════════════════════
INSTRUCCIÓN FINAL
══════════════════════════════════════════════════════
Escribe el capítulo completo en español, en prosa narrativa fluida, sin encabezados
de sección, sin meta-comentarios, sin "[continúa...]". Solo el capítulo, del inicio al cierre.
Objetivo: ~${targetWords} palabras. Título del capítulo al inicio en formato: # Título`;
}
