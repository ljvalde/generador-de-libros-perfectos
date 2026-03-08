import { NextRequest, NextResponse } from 'next/server';
import { getBook, deleteBook } from '@/lib/storage';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(book);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteBook(id);
  return NextResponse.json({ ok: true });
}
