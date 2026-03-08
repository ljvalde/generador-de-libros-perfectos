'use client';
import { useState } from 'react';
import { Book, Genre, CharacterProfile, WorldBible, ChapterOutline } from '@/lib/types';

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

interface Props { onCreated: (book: Book) => void; onCancel: () => void; }

const EMPTY_CHAR = (): CharacterProfile => ({
  name: '', gender: 'unknown', role: 'secondary', age: '',
  physicalDescription: '', distinctiveVoice: '', centralMotivation: '',
  internalContradiction: '', lineTheyWontCross: '', fearResponse: '',
  painResponse: '', lossResponse: '',
  fillerWord: '', fillerWordMaxPerChapter: 3,
  ticDescription: '', ticMaxPerChapter: 3, ticMaxInBook: 8,
  ticEvolutionRule: '', knownFacts: [], aliases: [],
});

export default function BookWizard({ onCreated, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<Genre>('scifi');
  const [subgenre, setSubgenre] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [targetChapters, setTargetChapters] = useState(20);
  const [targetWords, setTargetWords] = useState(3000);
  const [characters, setCharacters] = useState<CharacterProfile[]>([EMPTY_CHAR()]);
  const [pov, setPov] = useState<'first' | 'third-limited' | 'third-omniscient'>('third-limited');
  const [tone, setTone] = useState('');
  const [setting, setSetting] = useState('');
  const [era, setEra] = useState('');
  const [centralConflict, setCentralConflict] = useState('');
  const [themes, setThemes] = useState('');
  const [physicsRules, setPhysicsRules] = useState('');

  const addChar = () => setCharacters(p => [...p, EMPTY_CHAR()]);
  const updateChar = (i: number, field: keyof CharacterProfile, val: unknown) =>
    setCharacters(p => p.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  const removeChar = (i: number) => setCharacters(p => p.filter((_, idx) => idx !== i));

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
        characters, worldBible, outline: [],
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
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.9rem' }}>← Volver</button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Nueva Historia</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600, background: s === step ? 'var(--accent)' : s < step ? 'var(--success)' : 'var(--border)', color: 'white' }}>
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>
        {error && <div style={{ background: '#2d1515', border: '1px solid var(--danger)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', color: '#ff8080', fontSize: '0.85rem' }}>{error}</div>}

        {step === 1 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Paso 1 — Concepto</h2>
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
                  <label style={labelStyle}>Palabras por capítulo</label>
                  <input type="number" style={inputStyle} value={targetWords} onChange={e => setTargetWords(+e.target.value)} min={1000} max={8000} step={500} />
                </div>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Sinopsis (2-4 párrafos)</label>
              <textarea style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} value={synopsis} onChange={e => setSynopsis(e.target.value)} placeholder="El conflicto central, los personajes clave, las apuestas..." />
            </div>

            <button onClick={() => setStep(2)} disabled={!title || !synopsis} style={{
              background: !title || !synopsis ? 'var(--border)' : 'var(--accent)',
              color: 'white', border: 'none', padding: '0.75rem 2rem',
              borderRadius: '8px', cursor: !title || !synopsis ? 'not-allowed' : 'pointer',
              fontWeight: 600, width: '100%', fontSize: '0.95rem',
            }}>
              Siguiente: Personajes →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Paso 2 — Personajes</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Define cada personaje. Los tics y muletillas se rastrean para evitar saturación.
            </p>

            {characters.map((char, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Personaje {i + 1}</span>
                  {i > 0 && <button onClick={() => removeChar(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Nombre</label>
                    <input style={inputStyle} value={char.name} onChange={e => updateChar(i, 'name', e.target.value)} placeholder="Nombre del personaje" />
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
              <button onClick={() => setStep(1)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                ← Anterior
              </button>
              <button onClick={() => setStep(3)} disabled={!characters[0]?.name} style={{
                background: !characters[0]?.name ? 'var(--border)' : 'var(--accent)',
                color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                cursor: !characters[0]?.name ? 'not-allowed' : 'pointer', fontWeight: 600, flex: 1,
              }}>
                Siguiente: Mundo →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>Paso 3 — Mundo</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Las reglas del mundo se usan para detectar inconsistencias
            </p>

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
              <button onClick={() => setStep(2)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                ← Anterior
              </button>
              <button onClick={submit} disabled={loading} style={{
                background: loading ? 'var(--border)' : 'var(--accent)',
                color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, flex: 1, fontSize: '0.95rem',
              }}>
                {loading ? '⏳ Generando outline y Biblia de Estado...' : '🚀 Crear Historia'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
