// ─── CHARACTER ───────────────────────────────────────────────────────────────

export interface CharacterAlias {
  name: string;
  createdInChapter: number; // alias CANNOT appear before this chapter
}

export interface CharacterState {
  name: string;
  gender: 'male' | 'female' | 'neutral' | 'unknown';
  role: 'protagonist' | 'deuteragonist' | 'antagonist' | 'secondary' | 'minor';
  status: 'alive' | 'dead' | 'inoperative' | 'missing';
  location: string;
  physicalCondition: string;   // e.g. "herida en brazo derecho, costillas fracturadas"
  emotionalState: string;      // e.g. "furiosa con Marco, en negación sobre la pérdida"
  lastSeenChapter: number;
  reactivationRequired: boolean; // true = was inoperative, next chapter MUST show how it wakes up
  fillerWord: string;            // e.g. "Evidentemente", "Mira,"
  fillerWordMaxPerChapter: number;
  aliases: CharacterAlias[];
  knownFacts: string[];          // immutable facts about this character
  openArcs: string[];
  ticDescription: string;        // physical tic e.g. "frota pulgar contra índice"
  ticMaxPerChapter: number;      // hard limit per chapter
  ticMaxInBook: number;          // hard limit for entire book
  ticCurrentTotal: number;       // running count across all chapters
  ticEvolutionRule: string;      // how the tic should change as character evolves
}

export interface CharacterProfile {
  name: string;
  /** Pista opcional para IA cuando se genera desde cero (ej: "detective", "María") */
  concept?: string;
  gender: 'male' | 'female' | 'neutral' | 'unknown';
  role: 'protagonist' | 'deuteragonist' | 'antagonist' | 'secondary' | 'minor';
  age: string;
  physicalDescription: string;
  distinctiveVoice: string;      // how they speak, what they'd NEVER say
  centralMotivation: string;     // ONE motivation that never changes
  internalContradiction: string; // the conflict that makes them human
  lineTheyWontCross: string;     // defines them
  fearResponse: string;
  painResponse: string;
  lossResponse: string;
  fillerWord: string;
  fillerWordMaxPerChapter: number;
  ticDescription: string;
  ticMaxPerChapter: number;
  ticMaxInBook: number;
  ticEvolutionRule: string;
  knownFacts: string[];
  aliases: CharacterAlias[];
}

// ─── WORLD & RULES ───────────────────────────────────────────────────────────

export interface WorldRule {
  rule: string;
  establishedInChapter: number;
  description: string;
  exceptions: string[];
}

export interface TimeCountdown {
  active: boolean;
  description: string;         // e.g. "falla renal total"
  initialValue: string;        // e.g. "48 horas"
  currentValue: string;        // must DECREASE each chapter
  lastUpdatedChapter: number;
  mustReachZeroByChapter: number;
}

// ─── NARRATIVE INVENTORY ─────────────────────────────────────────────────────

export interface NarrativeInventory {
  usedOpeningTypes: string[];   // "acción directa", "introspección", "diálogo", etc.
  usedDynamics: string[];       // "primer beso", "traición revelada", "muerte aliado", etc.
  openPlotThreads: string[];    // promises that MUST be resolved
  resolvedPlotThreads: string[];
  plannedTwists: PlannedTwist[];
}

export interface PlannedTwist {
  description: string;
  targetChapter: number;
  seed1: string;
  seed1PlantedChapter: number;
  seed2: string;
  seed2PlantedChapter: number;
  bothSeedsPlanted: boolean;
}

// ─── STATE BIBLE (the core of the anti-error system) ─────────────────────────

export interface StateBible {
  lastUpdatedChapter: number;
  characters: CharacterState[];
  markerUsageCount: Record<string, number>; // "polvo irisado" -> 47
  pendingEmotionalDebts: string[];          // events not yet processed
  narrativeInventory: NarrativeInventory;
  worldState: string;
  mainConflictStatus: string;
  timeCountdowns: TimeCountdown[];
  worldRules: WorldRule[];
  prohibitedPatterns: string[];             // patterns used 3+ times, now blocked
  patternUsageCount: Record<string, number>;
}

// ─── CHAPTER ─────────────────────────────────────────────────────────────────

export interface ChapterOutline {
  number: number;
  title: string;
  summary: string;          // 2-3 sentence plot summary
  function: 'action' | 'revelation' | 'emotional-pause' | 'twist' | 'transition' | 'climax' | 'resolution';
  keyEvents: string[];
  characterFocus: string[];
  emotionalTarget: string;  // what the reader should feel
}

export interface VerificationResult {
  passed: boolean;
  criticalErrors: VerificationError[];
  warnings: VerificationWarning[];
  markerCountsThisChapter: Record<string, number>;
  qualityNotes?: string;
  stateBibleUpdates?: Partial<StateBible>;
}

export interface VerificationError {
  type: 'DEAD_CHAR_ACTIVE' | 'ALIAS_BEFORE_CREATION' | 'MARKER_OVERUSE' | 'FILLER_OVERUSE' | 'REACTIVATION_MISSING' | 'RETCON' | 'PATTERN_REPEAT';
  description: string;
  evidence: string;
  suggestedFix: string;
}

export interface VerificationWarning {
  type: 'EMOTIONAL_DEBT_IGNORED' | 'TIME_UNCHANGED' | 'PLOT_THREAD_IGNORED' | 'VOICE_INCONSISTENCY' | 'WORD_COUNT_LOW' | 'WORD_COUNT_HIGH';
  description: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  number: number;
  title: string;
  content: string;
  wordCount: number;
  createdAt: string;
  verificationResult?: VerificationResult;
  stateBibleSnapshot?: StateBible; // snapshot of bible AFTER this chapter
}

// ─── BOOK ─────────────────────────────────────────────────────────────────────

export type Genre = 'scifi' | 'fantasy' | 'thriller' | 'romance' | 'horror' | 'literary' | 'mystery' | 'adventure';

export interface WorldBible {
  setting: string;
  era: string;
  keyLocations: string[];
  physicsRules: string[];   // what kills, what heals, what limits characters
  technologyLevel: string;
  socialStructure: string;
  centralConflict: string;
  themes: string[];
  tone: string;
  pov: 'first' | 'third-limited' | 'third-omniscient';
  targetAudience: string;
}

export interface Book {
  id: string;
  title: string;
  genre: Genre;
  subgenre: string;
  synopsis: string;
  targetChapters: number;
  targetWordsPerChapter: number;
  characters: CharacterProfile[];
  worldBible: WorldBible;
  outline: ChapterOutline[];
  stateBible: StateBible;
  chapters: Chapter[];
  status: 'planning' | 'writing' | 'completed';
  createdAt: string;
  updatedAt: string;
  qualityScore?: number;   // avg score from verifier
}

// ─── API PAYLOADS ─────────────────────────────────────────────────────────────

export interface CreateBookPayload {
  title: string;
  genre: Genre;
  subgenre: string;
  synopsis: string;
  targetChapters: number;
  targetWordsPerChapter: number;
  characters: CharacterProfile[];
  worldBible: WorldBible;
  outline: ChapterOutline[];
}

export interface GenerateChapterPayload {
  bookId: string;
  chapterNumber: number;
  additionalInstructions?: string;
}
