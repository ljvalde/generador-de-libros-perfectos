'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/lib/types';
import BookList from '@/components/BookList';

export default function Home() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
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

  const openBook = (book: Book) => {
    router.push(`/libro/${book.id}`);
  };

  const deleteBook = async (id: string) => {
    await fetch(`/api/books/${id}`, { method: 'DELETE' });
    fetchBooks();
  };

  return (
    <BookList
      books={books}
      loading={loading}
      onNew={() => router.push('/nueva-historia/concepto')}
      onOpen={openBook}
      onDelete={deleteBook}
    />
  );
}
