'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Book } from '@/lib/types';
import BookEditor from '@/components/BookEditor';

export default function LibroPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBook = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/books/${id}`);
      if (!res.ok) throw new Error('No encontrado');
      const data = await res.json();
      setBook(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const onUpdate = useCallback((updated: Book) => {
    setBook(updated);
  }, []);

  const onBack = useCallback(() => {
    router.push('/');
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p style={{ color: 'var(--danger)' }}>Libro no encontrado</p>
        <button onClick={() => router.push('/')} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
          Volver a la lista
        </button>
      </div>
    );
  }

  return <BookEditor book={book} onUpdate={onUpdate} onBack={onBack} />;
}
