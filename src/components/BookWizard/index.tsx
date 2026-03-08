'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Book, Genre, CharacterProfile, WorldBible, ChapterOutline } from '@/lib/types';
import { WorkflowStepper, WorkflowStep } from '@/components/WorkflowStepper';
import { BookDraft } from '@/lib/bookDraft';

const GENRES: { value: Genre; label: string; emoji: string }[] = [
  { value: 'scifi', label: 'Ciencia Ficción', emoji: '🚀' },
  { value: 'fantasy', label: 'Fantasía', emoji: '🧙' },
  { value: 'thriller', label: 'Thriller', emoji: '🔪' },
  { value: 'romance', label: 'Romance', emoji: '💕' },
  { value: 'horror', label: 'Terror', emoji: '👻' },
  { value: 'literary', label: 'Literaria', emoji: '📖' },
  { value: 'mystery', label: 'Misterio', emoji: '🕵️' },
  { value: 'adventure', label: 'Aventura', emoji: '🗺️' },
];

interface Props {
  step: WorkflowStep;
  onStepChange: (step: WorkflowStep) => void;
  onCreated: (book: Book) => void;
  onCancel: () => void;
  loadDraft: () => BookDraft | null;
  saveDraft: (draft: BookDraft) => void;
}

const EMPTY_CHAR = (): CharacterProfile => ({
  name: '', concept: '', gender: 'unknown', role: 'secondary', age: '',
  physicalDescription: '', distinctiveVoice: '', centralMotivation: '',
  internalContradiction: '', lineTheyWontCross: '', fearResponse: '',
  painResponse: '', lossResponse: '',
  fillerWord: '', fillerWordMaxPerChapter: 3,
  ticDescription: '', ticMaxPerChapter: 3, ticMaxInBook: 8,
  ticEvolutionRule: '', knownFacts: [], aliases: [],
});

const WORKFLOW_ORDER: WorkflowStep[] = ['concepto', 'personajes', 'esquema', 'mundo', 'biblia'];

export default function BookWizard({ step, onStepChange, onCreated, onCancel, loadDraft, saveDraft }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingChar, setGeneratingChar] = useState<number | null>(null);
  const [generatingWorld, setGeneratingWorld] = useState(false);
  const worldGeneratedRef = useRef(false);

  const generateCharWithAI = async (i: number) => {
    const char = characters[i];
    setError('');
    setGeneratingChar(i);
    try {
      const res = await fetch('/api/characters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: char.name?.trim() || undefined,
          role: char.role,
          description: char.physicalDescription || char.concept || undefined,
          concept: char.concept?.trim() || undefined,
          bookTitle: title,
          genre,
          synopsis,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const profile = await res.json();
      setCharacters(p => p.map((c, idx) => idx === i ? { ...c, ...profile } : c));
    } catch (e) {
      setError(`Error generando personaje: ${String(e)}`);
    } finally {
      setGeneratingChar(null);
    }
  };

  // Form state
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<Genre>('scifi');
  const [subgenre, setSubgenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [targetChapters, setTargetChapters] = useState(20);
  const [targetWords, setTargetWords] = useState(1850);
  const [characters, setCharacters] = useState<CharacterProfile[]>([EMPTY_CHAR()]);
  const [pov, setPov] = useState<'first' | 'third-limited' | 'third-omniscient'>('third-limited');
  const [tone, setTone] = useState('');
  const [setting, setSetting] = useState('');
  const [era, setEra] = useState('');
  const [centralConflict, setCentralConflict] = useState('');
  const [themes, setThemes] = useState('');
  const [physicsRules, setPhysicsRules] = useState('');
  const [outline, setOutline] = useState<ChapterOutline[]>([]);
  const [generatingOutline, setGeneratingOutline] = useState(false);

  const addChar = () => setCharacters(p => [...p, EMPTY_CHAR()]);
  const updateChar = (i: number, field: keyof CharacterProfile, val: unknown) =>
    setCharacters(p => p.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  const removeChar = (i: number) => setCharacters(p => p.filter((_, idx) => idx !== i));

  const goNext = () => {
    const i = WORKFLOW_ORDER.indexOf(step);
    if (i < WORKFLOW_ORDER.length - 1) onStepChange(WORKFLOW_ORDER[i + 1]);
  };
  const goPrev = () => {
    const i = WORKFLOW_ORDER.indexOf(step);
    if (i > 0) onStepChange(WORKFLOW_ORDER[i - 1]);
  };

  // Load draft from localStorage on mount
  const [readyToSave, setReadyToSave] = useState(false);
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title);
      setGenre(draft.genre as Genre);
      setSubgenre(draft.subgenre);
      setSynopsis(draft.synopsis);
      setTargetChapters(draft.targetChapters);
      setTargetWords(draft.targetWords);
      setCharacters(draft.characters?.length ? draft.characters : [EMPTY_CHAR()]);
      setPov(draft.pov);
      setSetting(draft.setting);
      setEra(draft.era);
      setCentralConflict(draft.centralConflict);
      setThemes(draft.themes);
      setPhysicsRules(draft.physicsRules);
      setTone(draft.tone);
      setOutline(draft.outline ?? []);
    }
    setReadyToSave(true);
  }, [loadDraft]);

  // Persist draft to localStorage when state changes (after initial load)
  useEffect(() => {
    if (!readyToSave) return;
    const draft: BookDraft = {
      title, genre, subgenre, synopsis, targetChapters, targetWords,
      characters, outline, setting, era, centralConflict, themes, physicsRules, tone, pov,
    };
    saveDraft(draft);
  }, [readyToSave, title, genre, subgenre, synopsis, targetChapters, targetWords, characters, outline, setting, era, centralConflict, themes, physicsRules, tone, pov, saveDraft]);

  // Auto-generate Mundo with IA when entering step and fields are empty
  useEffect(() => {
    if (step !== 'mundo' || generatingWorld || worldGeneratedRef.current) return;
    if (!title || !synopsis) return;
    const isEmpty = !setting.trim() && !era.trim() && !centralConflict.trim() && !physicsRules.trim();
    if (!isEmpty) return;

    worldGeneratedRef.current = true;
    setGeneratingWorld(true);
    setError('');
    fetch('/api/world/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, genre, subgenre, synopsis,
        characterNames: characters.filter(c => c.name).map(c => c.name),
      }),
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)))
      .then(data => {
        setSetting(data.setting ?? '');
        setEra(data.era ?? '');
        setCentralConflict(data.centralConflict ?? '');
        setThemes(Array.isArray(data.themes) ? data.themes.join(', ') : (data.themes ?? ''));
        setPhysicsRules(Array.isArray(data.physicsRules) ? data.physicsRules.join('\n') : (data.physicsRules ?? ''));
        setTone(data.tone ?? '');
      })
      .catch(e => setError(`Error generando mundo: ${String(e)}`))
      .finally(() => setGeneratingWorld(false));
  }, [step, title, genre, subgenre, synopsis, characters, generatingWorld]);

  const generateOutlineWithAI = async () => {
    setGeneratingOutline(true);
    setError('');
    try {
      const res = await fetch('/api/outline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          genre,
          subgenre,
          synopsis,
          targetChapters,
          characterNames: characters.filter(c => c.name).map(c => c.name),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOutline(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(`Error generando esquema: ${String(e)}`);
    } finally {
      setGeneratingOutline(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const worldBible: WorldBible = {
        setting, era, keyLocations: [],
        physicsRules: physicsRules.split('\n').filter(Boolean),
        technologyLevel: '', socialStructure: '', centralConflict,
        themes: themes.split(',').map(t => t.trim()).filter(Boolean),
        tone, pov, targetAudience: 'Adultos',
      };
      const payload = {
        title, genre, subgenre, synopsis,
        targetChapters, targetWordsPerChapter: targetWords,
        characters, worldBible, outline,
      };
      const res = await fetch('/api/books', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      const book = await res.json();
      onCreated(book);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '0.65rem 0.9rem', color: 'var(--text)',
    fontSize: '0.9rem', outline: 'none',
  };
  const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem', fontWeight: 500 };
  const fieldStyle = { marginBottom: '1rem' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/" style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textDecoration: 'none' }}>← Volver</Link>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nueva Historia</h1>
      </header>
      <WorkflowStepper currentStep={step} useLinks />

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        {error && <div style={{ background: '#2d1515', border: '1px solid var(--danger)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#ff8080', fontSize: '0.85rem' }}>{error}</div>}

        {step === 'concepto' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Concepto</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>La base de tu historia</p>

            <div style={fieldStyle}>
              <label style={labelStyle}>Título</label>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="El título de tu novela" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Género</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {GENRES.map(g => (
                    <button key={g.value} onClick={() => setGenre(g.value)} style={{
                      background: genre === g.value ? 'var(--accent-dim)' : 'var(--surface2)',
                      border: `1px solid ${genre === g.value ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '6px', padding: '0.5rem', cursor: 'pointer',
                      color: genre === g.value ? 'var(--text)' : 'var(--text-dim)',
                      fontSize: '0.8rem', textAlign: 'left',
                    }}>
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Subgénero</label>
                  <input style={inputStyle} value={subgenre} onChange={e => setSubgenre(e.target.value)} placeholder="ej: distópico, post-apocalíptico" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Capítulos objetivo</label>
                  <input type="number" style={inputStyle} value={targetChapters} onChange={e => setTargetChapters(+e.target.value)} min={5} max={50} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Palabras por capítulo (1,750–1,950)</label>
                  <input type="number" style={inputStyle} value={targetWords} onChange={e => setTargetWords(Math.min(1950, Math.max(1750, +e.target.value)))} min={1750} max={1950} step={50} />
                </div>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Sinopsis (2-4 párrafos)</label>
              <textarea style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} value={synopsis} onChange={e => setSynopsis(e.target.value)} placeholder="El conflicto central, los personajes clave, las apuestas..." />
            </div>

            <button onClick={goNext} disabled={!title || !synopsis} style={{
              background: !title || !synopsis ? 'var(--border)' : 'var(--accent)',
              color: 'white', border: 'none', padding: '0.75rem 2rem',
              borderRadius: '8px', cursor: !title || !synopsis ? 'not-allowed' : 'pointer',
              fontWeight: 600, width: '100%', fontSize: '0.95rem',
            }}>
              Siguiente: Personajes →
            </button>
          </div>
        )}

        {step === 'esquema' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Esquema</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Genera la estructura de capítulos a partir del concepto y los personajes que definiste. La IA usará sus nombres y roles para un esquema más preciso.
            </p>

            {!outline.length ? (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  Pulsa el botón para que la IA genere un esquema de {targetChapters} capítulos basado en tu sinopsis y personajes.
                </p>
                <button
                  onClick={generateOutlineWithAI}
                  disabled={generatingOutline || !title || !synopsis}
                  style={{
                    background: generatingOutline || !title || !synopsis ? 'var(--border)' : 'var(--accent)',
                    color: 'white', border: 'none', padding: '0.75rem 1.5rem',
                    borderRadius: '8px', cursor: generatingOutline || !title || !synopsis ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.95rem',
                  }}
                >
                  {generatingOutline ? '⏳ Generando esquema...' : '✨ Generar esquema con IA'}
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem', maxHeight: 400, overflowY: 'auto' }}>
                {outline.map((ch, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <strong style={{ color: 'var(--accent)' }}>Cap. {ch.number}</strong> — {ch.title}
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{ch.summary}</p>
                  </div>
                ))}
                <button onClick={generateOutlineWithAI} disabled={generatingOutline} style={{
                  background: 'none', border: '1px dashed var(--border)', borderRadius: '6px', padding: '0.5rem 1rem',
                  color: 'var(--text-dim)', cursor: generatingOutline ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
                }}>
                  {generatingOutline ? 'Regenerando...' : '🔄 Regenerar esquema'}
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={goPrev} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                ← Anterior
              </button>
              <button onClick={goNext} style={{
                background: 'var(--accent)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 600, flex: 1,
              }}>
                Siguiente: Mundo →
              </button>
            </div>
          </div>
        )}

        {step === 'personajes' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Personajes</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Selecciona el <strong>rol</strong>, opcionalmente un concepto (ej: "detective", "María"), y pulsa <strong style={{ color: 'var(--accent)' }}>✨ Generar con IA</strong>. La IA creará todo: nombre, edad, voz, motivación, tics, muletilla y evolución.
            </p>
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              💡 Si dejas concepto vacío, la IA inventa todo. También puedes editar cualquier campo después de generar.
            </div>

            {characters.map((char, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Personaje {i + 1}</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => generateCharWithAI(i)}
                      disabled={generatingChar === i}
                      title="Generar perfil completo con IA"
                      style={{
                        background: generatingChar === i ? 'var(--accent-dim)' : 'var(--accent)',
                        border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem',
                        color: 'white', cursor: generatingChar === i ? 'wait' : 'pointer',
                        fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem',
                        transition: 'background 0.2s',
                      }}
                    >
                      {generatingChar === i ? (
                        <><span className="spinner" style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> Generando...</>
                      ) : '✨ Generar con IA'}
                    </button>
                    {i > 0 && <button onClick={() => removeChar(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>}
                  </div>
                </div>
                {generatingChar === i && (
                  <div style={{ background: 'var(--surface2)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Claude está generando el personaje completo (nombre, voz, motivación, tics...)
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Concepto (opcional)</label>
                    <input style={inputStyle} value={char.concept ?? ''} onChange={e => updateChar(i, 'concept', e.target.value)} placeholder="Ej: detective, María, antagonista misterioso. Vacío = IA inventa todo" />
                  </div>
                  <div>
                    <label style={labelStyle}>Rol</label>
                    <select style={inputStyle} value={char.role} onChange={e => updateChar(i, 'role', e.target.value)}>
                      <option value="protagonist">Protagonista</option>
                      <option value="deuteragonist">Deuteragonista</option>
                      <option value="antagonist">Antagonista</option>
                      <option value="secondary">Secundario</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Nombre</label>
                    <input style={inputStyle} value={char.name} onChange={e => updateChar(i, 'name', e.target.value)} placeholder="Generado por IA o escribe manualmente" />
                  </div>
                  <div>
                    <label style={labelStyle}>Género</label>
                    <select style={inputStyle} value={char.gender} onChange={e => updateChar(i, 'gender', e.target.value)}>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="neutral">Neutro</option>
                      <option value="unknown">No especificado</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Edad</label>
                    <input style={inputStyle} value={char.age} onChange={e => updateChar(i, 'age', e.target.value)} placeholder="ej: 28 años" />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={labelStyle}>Motivación central (UNA sola)</label>
                  <input style={inputStyle} value={char.centralMotivation} onChange={e => updateChar(i, 'centralMotivation', e.target.value)} placeholder="Lo que mueve a este personaje sobre todas las cosas" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Muletilla (máx 3/capítulo)</label>
                    <input style={inputStyle} value={char.fillerWord} onChange={e => updateChar(i, 'fillerWord', e.target.value)} placeholder='ej: "Evidentemente"' />
                  </div>
                  <div>
                    <label style={labelStyle}>Tic físico único (máx 3/capítulo)</label>
                    <input style={inputStyle} value={char.ticDescription} onChange={e => updateChar(i, 'ticDescription', e.target.value)} placeholder='ej: "frota pulgar contra índice"' />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={labelStyle}>Evolución del tic (cómo cambia con el arco)</label>
                  <input style={inputStyle} value={char.ticEvolutionRule} onChange={e => updateChar(i, 'ticEvolutionRule', e.target.value)} placeholder='ej: "Desaparece en cap 15 cuando acepta la pérdida"' />
                </div>
              </div>
            ))}

            <button onClick={addChar} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: '8px', padding: '0.6rem 1rem', color: 'var(--text-dim)', cursor: 'pointer', width: '100%', marginBottom: '1rem' }}>
              + Añadir personaje
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={goPrev} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                ← Anterior
              </button>
              <button onClick={goNext} disabled={!characters[0]?.name} style={{
                background: !characters[0]?.name ? 'var(--border)' : 'var(--accent)',
                color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                cursor: !characters[0]?.name ? 'not-allowed' : 'pointer', fontWeight: 600, flex: 1,
              }}>
                Siguiente: Esquema →
              </button>
            </div>
          </div>
        )}

        {step === 'mundo' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Mundo</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Las reglas del mundo se usan para detectar inconsistencias. Se genera automáticamente con IA al entrar.
            </p>
            {generatingWorld && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                ⏳ Generando mundo con IA...
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Ambientación</label>
                <input style={inputStyle} value={setting} onChange={e => setSetting(e.target.value)} placeholder="ej: Estación orbital, ciudad subterránea" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Era / Época</label>
                <input style={inputStyle} value={era} onChange={e => setEra(e.target.value)} placeholder="ej: 2387 d.C., Edad Media alternativa" />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Conflicto central</label>
              <input style={inputStyle} value={centralConflict} onChange={e => setCentralConflict(e.target.value)} placeholder="El motor de toda la historia" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Reglas físicas / tecnológicas (una por línea)</label>
              <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={physicsRules} onChange={e => setPhysicsRules(e.target.value)} placeholder={"ej:\nEl polvo azul mata a quien no está adaptado\nLa máquina necesita 385 minutos para sintetizar"} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Temas (separados por coma)</label>
                <input style={inputStyle} value={themes} onChange={e => setThemes(e.target.value)} placeholder="identidad, redención, poder" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Tono</label>
                <input style={inputStyle} value={tone} onChange={e => setTone(e.target.value)} placeholder="ej: oscuro y visceral, lírico e introspectivo" />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Punto de vista narrativo</label>
              <select style={inputStyle} value={pov} onChange={e => setPov(e.target.value as typeof pov)}>
                <option value="third-limited">Tercera persona limitada</option>
                <option value="first">Primera persona</option>
                <option value="third-omniscient">Tercera persona omnisciente</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={goPrev} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                ← Anterior
              </button>
              <button onClick={goNext} style={{
                background: 'var(--accent)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 600, flex: 1,
              }}>
                Siguiente: Biblia →
              </button>
            </div>
          </div>
        )}

        {step === 'biblia' && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Biblia</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Revisa el resumen antes de crear tu historia. La Biblia de Estado se generará automáticamente al crear.
            </p>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--accent)' }}>{title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>{genre} {subgenre && `· ${subgenre}`}</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{synopsis}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {outline.length} capítulos · {characters.filter(c => c.name).length} personajes · {targetWords} palabras/cap
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={goPrev} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                ← Anterior
              </button>
              <button onClick={submit} disabled={loading} style={{
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, flex: 1, fontSize: '0.95rem',
              }}>
                {loading ? '⏳ Generando Biblia de Estado...' : '🚀 Crear Historia'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
