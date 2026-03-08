'use client';
import { useState } from 'react';
import { Book, Chapter } from '@/lib/types';
import ChapterList from './ChapterList';
import ChapterViewer from './ChapterViewer';
import StateBibleView from './StateBibleView';

interface Props { book: Book; onUpdate: (b: Book) => void; onBack: () => void; }

export default function BookEditor({ book, onUpdate, onBack }: Props) {
  const [view, setView] = useState<'chapters' | 'bible'>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const nextChapterNum = book.chapters.length > 0
    ? Math.max(...book.chapters.map(c => c.number)) + 1
    : 1;
  const canGenerate = nextChapterNum <= book.targetChapters;

  const generateChapter = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch(`/api/books/${book.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumber: nextChapterNum, additionalInstructions }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Refresh the full book
      const bookRes = await fetch(`/api/books/${book.id}`);
      const updatedBook = await bookRes.json();
      onUpdate(updatedBook);
      setSelectedChapter(data.chapter);
      setAdditionalInstructions('');
    } catch (e) {
      setGenError(String(e));
    } finally {
      setGenerating(false);
    }
  };

  const progress = (book.chapters.length / book.targetChapters) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.9rem' }}>← Libros</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
            <div style={{ flex: 1, maxWidth: 200, height: '3px', background: 'var(--border)', borderRadius: '2px' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {book.chapters.length}/{book.targetChapters} capítulos
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setView('chapters')} style={{ background: view === 'chapters' ? 'var(--accent-dim)' : 'var(--surface2)', border: `1px solid ${view === 'chapters' ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--text)', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Capítulos
          </button>
          <button onClick={() => setView('bible')} style={{ background: view === 'bible' ? 'var(--accent-dim)' : 'var(--surface2)', border: `1px solid ${view === 'bible' ? 'var(--accent)' : 'var(--border)'}`, color: 'var(--text)', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
            📊 State Bible
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {view === 'bible' ? (
          <StateBibleView bible={book.stateBible} />
        ) : (
          <>
            {/* Sidebar */}
            <div style={{ width: '280px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              {/* Generate button */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                {genError && <div style={{ background: '#2d1515', border: '1px solid var(--danger)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem', color: '#ff8080', fontSize: '0.75rem' }}>{genError}</div>}
                <textarea
                  value={additionalInstructions}
                  onChange={e => setAdditionalInstructions(e.target.value)}
                  placeholder="Instrucciones adicionales para este capítulo (opcional)..."
                  style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem', color: 'var(--text)', fontSize: '0.8rem', resize: 'vertical', minHeight: '60px', marginBottom: '0.5rem', outline: 'none' }}
                />
                <button
                  onClick={generateChapter}
                  disabled={generating || !canGenerate}
                  style={{
                    width: '100%',
                    background: !canGenerate ? 'var(--border)' : generating ? 'var(--accent-dim)' : 'var(--accent)',
                    color: 'white', border: 'none', padding: '0.65rem 0.75rem',
                    borderRadius: '8px', cursor: generating || !canGenerate ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.85rem',
                  }}
                >
                  {generating
                    ? '⏳ Generando...'
                    : canGenerate
                    ? `✨ Generar Cap ${nextChapterNum}`
                    : '✅ Libro completo'}
                </button>
                {generating && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.4rem' }}>
                    Escribiendo → Verificando → Actualizando State Bible
                  </p>
                )}
              </div>

              {/* Chapter list */}
              <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
                <ChapterList
                  outline={book.outline}
                  chapters={book.chapters}
                  selected={selectedChapter}
                  onSelect={setSelectedChapter}
                />
              </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {selectedChapter ? (
                <ChapterViewer chapter={selectedChapter} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', gap: '1rem' }}>
                  <div style={{ fontSize: '3rem' }}>📝</div>
                  <p>{book.chapters.length === 0 ? 'Genera el primer capítulo' : 'Selecciona un capítulo'}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
