import { StateBible } from '../types';

export function buildVerifierPrompt(
  chapterNumber: number,
  chapterContent: string,
  stateBible: StateBible
): string {
  const deadChars = stateBible.characters.filter(c => c.status === 'dead').map(c => c.name);
  const lockedAliases = stateBible.characters
    .flatMap(c => c.aliases.filter(a => a.createdInChapter > chapterNumber).map(a => ({ alias: a.name, char: c.name })));
  const inoperativeChars = stateBible.characters.filter(c => c.reactivationRequired).map(c => c.name);
  const saturatedMarkers = Object.entries(stateBible.markerUsageCount)
    .filter(([, count]) => count >= 8)
    .map(([phrase]) => phrase);

  return `Eres un editor de calidad narrativa. Analiza el capítulo con precisión quirúrgica y devuelve un JSON de verificación.

CAPÍTULO ${chapterNumber}:
"""
${chapterContent}
"""

BIBLIA DE ESTADO ACTUAL:
${JSON.stringify(stateBible, null, 2)}

══════════════════════════════════════════════════════
VERIFICACIONES — marca ERROR_CRÍTICO o ADVERTENCIA
══════════════════════════════════════════════════════

ERRORES CRÍTICOS (passed = false si hay alguno):

1. PERSONAJE_MUERTO_ACTIVO
   Personajes muertos: ${deadChars.join(', ') || 'ninguno'}
   → Verifica si alguno aparece hablando, actuando, o siendo referenciado en PRESENTE.
   → Flashback explícito o grabación PRE-HECHA es permitido.

2. ALIAS_ANTES_DE_CREACIÓN
   Aliases bloqueados (aún no existen en cap ${chapterNumber}):
   ${lockedAliases.map(a => `"${a.alias}" (de ${a.char})`).join(', ') || 'ninguno'}
   → Si el capítulo usa alguno de estos aliases, es ERROR CRÍTICO.

3. REACTIVACIÓN_SIN_ESCENA
   Personajes que necesitan escena de reactivación: ${inoperativeChars.join(', ') || 'ninguno'}
   → Si actúan o hablan sin que el capítulo muestre su recuperación = ERROR CRÍTICO.

4. MARCADOR_EXCEDIDO
   Marcadores saturados en el libro (límite 2 por capítulo):
   ${saturatedMarkers.map(m => `"${m}"`).join(', ') || 'ninguno saturado aún'}
   → Cuenta apariciones en este capítulo. Si > 2 = ERROR CRÍTICO.
   → Reporta conteo exacto para cada marcador saturado.

5. MULETILLA_EXCEDIDA
   → Verifica que ningún personaje supere su fillerWordMaxPerChapter.
   → Reporta nombre, muletilla, conteo en este capítulo vs. límite.

6. TIC_EXCEDIDO
   → Verifica que ningún tic supere ticMaxPerChapter en este capítulo.
   → Verifica que el total acumulado no supere ticMaxInBook.

7. RETCON
   → ¿Este capítulo contradice información establecida en capítulos anteriores?
   → ¿Cambia retroactivamente la intención de un evento pasado?

ADVERTENCIAS (no cambian passed, pero se reportan):

8. DEUDA_EMOCIONAL_IGNORADA
   Deudas pendientes: ${stateBible.pendingEmotionalDebts.join(' | ') || 'ninguna'}
   → ¿El capítulo hace referencia a alguna de ellas? Si no = ADVERTENCIA.

9. TIEMPO_CONGELADO
   Countdowns activos: ${stateBible.timeCountdowns.filter(t => t.active).map(t => `${t.description}: ${t.currentValue}`).join(', ') || 'ninguno'}
   → ¿El tiempo avanzó en este capítulo? Si no = ADVERTENCIA.

10. TRAMA_IGNORADA
    Tramas abiertas: ${stateBible.narrativeInventory.openPlotThreads.join(' | ') || 'ninguna'}
    → Si ninguna es mencionada o avanzada = ADVERTENCIA.

11. VOZ_INCONSISTENTE
    → ¿Algún personaje habla de una forma que contradice su perfil establecido?

══════════════════════════════════════════════════════
FORMATO DE RESPUESTA — SOLO JSON, SIN TEXTO ADICIONAL
══════════════════════════════════════════════════════

{
  "passed": true/false,
  "criticalErrors": [
    {
      "type": "DEAD_CHAR_ACTIVE | ALIAS_BEFORE_CREATION | REACTIVATION_MISSING | MARKER_OVERUSE | FILLER_OVERUSE | TIC_OVERUSE | RETCON",
      "description": "descripción clara del error",
      "evidence": "cita textual del capítulo que demuestra el error",
      "suggestedFix": "cómo corregirlo"
    }
  ],
  "warnings": [
    {
      "type": "EMOTIONAL_DEBT_IGNORED | TIME_UNCHANGED | PLOT_THREAD_IGNORED | VOICE_INCONSISTENCY",
      "description": "descripción"
    }
  ],
  "markerCountsThisChapter": {
    "frase exacta": número_de_apariciones
  },
  "qualityNotes": "análisis breve de 2-3 oraciones sobre puntos fuertes y débiles del capítulo"
}`;
}
