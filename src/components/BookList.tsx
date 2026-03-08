'use client';
import { Book } from '@/lib/types';

const GENRE_LABELS: Record<string, string> = {
  scifi: 'Ciencia Ficción', fantasy: 'Fantasía', thriller: 'Thriller',
  romance: 'Romance', horror: 'Terror', literary: 'Literaria',
  mystery: 'Misterio', adventure: 'Aventura',
};

interface Props {
  books: Book[];
  loading: boolean;
  onNew: () => void;
  onOpen: (b: Book) => void;
  onDelete: (id: string) => void;
}

export default function BookList({ books, loading, onNew, onOpen, onDelete }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0' }}>
      {/* Header */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            📖 Generador de Libros Perfectos
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Sistema de narrativa de nivel editorial con IA
          </p>
        </div>
        <button onClick={onNew} style={{
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          padding: '0.6rem 1.25rem',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          + Nueva Historia
        </button>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 1rem' }} />
            Cargando libros...
          </div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text)', marginBottom: '0.5rem' }}>Sin historias aún</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
              Crea tu primera novela con el sistema de State Bible anti-errores
            </p>
            <button onClick={onNew} style={{
              background: 'var(--accent)', color: 'white', border: 'none',
              padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '1rem',
            }}>
              Crear primera historia
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {books.length} {books.length === 1 ? 'historia' : 'historias'}
            </p>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {books.map(book => (
                <BookCard key={book.id} book={book} onOpen={onOpen} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function BookCard({ book, onOpen, onDelete }: { book: Book; onOpen: (b: Book) => void; onDelete: (id: string) => void }) {
  const progress = book.chapters.length / book.targetChapters;
  const statusColor = book.status === 'completed' ? 'var(--success)' : book.status === 'writing' ? 'var(--accent)' : 'var(--text-dim)';

  return (
    <div className="fade-in" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
      cursor: 'pointer',
      transition: 'border-color 0.2s',
    }}
      onClick={() => onOpen(book)}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {book.title}
            </h3>
            <span style={{ fontSize: '0.7rem', color: statusColor, border: `1px solid ${statusColor}`, borderRadius: '4px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
              {book.status === 'planning' ? 'planificando' : book.status === 'writing' ? 'escribiendo' : 'completado'}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
            {GENRE_LABELS[book.genre] ?? book.genre} • {book.subgenre}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {book.synopsis}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); if (confirm('¿Eliminar esta historia?')) onDelete(book.id); }}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            Eliminar
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
            {book.chapters.length}/{book.targetChapters} caps
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ marginTop: '0.75rem', height: '3px', background: 'var(--border)', borderRadius: '2px' }}>
        <div style={{ height: '100%', width: `${Math.min(progress * 100, 100)}%`, background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
