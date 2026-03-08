import { NextRequest, NextResponse } from 'next/server';
import { getBook, updateStateBible } from '@/lib/storage';
import { StateBible } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(book.stateBible);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bible = (await req.json()) as StateBible;
  await updateStateBible(id, bible);
  return NextResponse.json({ ok: true });
}
