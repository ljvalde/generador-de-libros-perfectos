'use client';
import { useState, useEffect, useCallback } from 'react';
import { Book } from '@/lib/types';
import BookList from '@/components/BookList';
import BookWizard from '@/components/BookWizard';
import BookEditor from '@/components/BookEditor';

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<'list' | 'wizard' | 'editor'>('list');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      setBooks(Array.isArray(data) ? data : []);
    } catch { setBooks([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const openBook = async (book: Book) => {
    const res = await fetch(`/api/books/${book.id}`);
    const full = await res.json();
    setSelectedBook(full);
    setView('editor');
  };

  const onBookCreated = async (book: Book) => {
    setSelectedBook(book);
    setView('editor');
    fetchBooks();
  };

  const deleteBook = async (id: string) => {
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    fetchBooks();
    if (selectedBook?.id === id) { setSelectedBook(null); setView('list'); }
  };

  if (view === 'wizard') {
    return <BookWizard onCreated={onBookCreated} onCancel={() => setView('list')} />;
  }

  if (view === 'editor' && selectedBook) {
    return (
      <BookEditor
        book={selectedBook}
        onUpdate={setSelectedBook}
        onBack={() => { setView('list'); fetchBooks(); }}
      />
    );
  }

  return (
    <BookList
      books={books}
      loading={loading}
      onNew={() => setView('wizard')}
      onOpen={openBook}
      onDelete={deleteBook}
    />
  );
}
