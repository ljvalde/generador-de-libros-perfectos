import { StateBible, CharacterProfile } from '../types';

export function buildStateBibleUpdaterPrompt(
  chapterNumber: number,
  chapterContent: string,
  previousBible: StateBible,
  characters: CharacterProfile[]
): string {
  return `Eres un editor de continuidad narrativa de nivel editorial. Tu trabajo es leer un capítulo recién escrito y actualizar la Biblia de Estado del libro con PRECISIÓN ABSOLUTA.

CAPÍTULO ${chapterNumber} RECIÉN ESCRITO:
"""
${chapterContent}
"""

BIBLIA DE ESTADO ANTERIOR:
${JSON.stringify(previousBible, null, 2)}

PERSONAJES REGISTRADOS EN EL LIBRO:
${characters.map(c => `- ${c.name} (${c.role}, ${c.gender})`).join('\n')}

══════════════════════════════════════════════════════
TU TAREA
══════════════════════════════════════════════════════

Analiza el capítulo línea por línea y devuelve ÚNICAMENTE un JSON válido con la Biblia de Estado actualizada.

REGLAS DE ACTUALIZACIÓN — OBLIGATORIAS:

1. MUERTES: Si un personaje muere en este capítulo, setea status: "dead".
   Las muertes son PERMANENTES. Nunca cambies "dead" a otro status.

2. INOPERATIVO: Si un personaje queda incapacitado (desmayado, apagado, inconsciente),
   setea status: "inoperative" y reactivationRequired: true.
   Cuando el capítulo muestre su recuperación, setea reactivationRequired: false.

3. ALIASES: Si en este capítulo se CREA narrativamente un alias (el texto lo establece),
   agrégalo a aliases con createdInChapter: ${chapterNumber}.
   Si el capítulo usa un alias que ya existía, NO lo vuelvas a crear.

4. MARCADORES — CONTEO OBLIGATORIO: Cuenta cuántas veces aparecen estas frases
   en el capítulo y SUMA al markerUsageCount acumulado:
   - Toda frase sensorial repetida 3+ veces en el capítulo (identifícalas tú)
   - Las muletillas de cada personaje
   - Los tics físicos de cada personaje
   El markerUsageCount es ACUMULATIVO — nunca se resetea.

5. DEUDAS EMOCIONALES:
   - Si un personaje muere o vive un trauma mayor Y el capítulo no da espacio
     para procesarlo, agrega a pendingEmotionalDebts:
     "[Nombre] [evento] en cap ${chapterNumber}. [Personaje afectado] aún no lo procesó."
   - Si una deuda existente FUE procesada en este capítulo, ELIMÍNALA de la lista.

6. TRAMAS:
   - Si se hace una promesa narrativa o se abre una trama, agrégala a openPlotThreads.
   - Si una trama se RESUELVE en este capítulo, muévela a resolvedPlotThreads.

7. CUENTAS REGRESIVAS: Si hay un countdown activo, actualiza currentValue
   con el tiempo que queda DESPUÉS de los eventos de este capítulo.
   El tiempo SIEMPRE avanza. Nunca congeles el valor.

8. PATRONES REPETIDOS: Si identificas un patrón narrativo que ya ocurrió 3 veces
   (ej: "personaje advierte → protagonista ignora → consecuencia negativa"),
   agrégalo a prohibitedPatterns.

9. REGLAS DEL MUNDO: Si este capítulo ESTABLECE una regla nueva del mundo
   (física, tecnológica, social), agrégala a worldRules.

10. ESTADO GENERAL: Actualiza worldState y mainConflictStatus con la situación
    al FINAL de este capítulo.

DEVUELVE SOLO EL JSON. Sin texto adicional. Sin markdown. Sin explicaciones.
El JSON debe seguir EXACTAMENTE esta estructura de StateBible:

{
  "lastUpdatedChapter": ${chapterNumber},
  "characters": [...],
  "markerUsageCount": {...},
  "pendingEmotionalDebts": [...],
  "narrativeInventory": {
    "usedOpeningTypes": [...],
    "usedDynamics": [...],
    "openPlotThreads": [...],
    "resolvedPlotThreads": [...],
    "plannedTwists": [...]
  },
  "worldState": "...",
  "mainConflictStatus": "...",
  "timeCountdowns": [...],
  "worldRules": [...],
  "prohibitedPatterns": [...],
  "patternUsageCount": {...}
}`;
}
