'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import BookWizard from '@/components/BookWizard';
import { Book } from '@/lib/types';
import { loadDraft, saveDraft, clearDraft } from '@/lib/bookDraft';

const VALID_STEPS = ['concepto', 'personajes', 'esquema', 'mundo', 'biblia'];

export default function NuevaHistoriaStepPage() {
  const params = useParams();
  const router = useRouter();
  const step = (params.step as string) || 'concepto';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onCreated = useCallback(
    (book: Book) => {
      clearDraft();
      router.push(`/libro/${book.id}`);
    },
    [router]
  );

  const onCancel = useCallback(() => {
    router.push('/');
  }, [router]);

  if (!mounted || !VALID_STEPS.includes(step)) {
    if (!VALID_STEPS.includes(step) && mounted) {
      router.replace('/nueva-historia/concepto');
      return null;
    }
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <BookWizard
      step={step as 'concepto' | 'personajes' | 'esquema' | 'mundo' | 'biblia'}
      onStepChange={newStep => router.push(`/nueva-historia/${newStep}`)}
      onCreated={onCreated}
      onCancel={onCancel}
      loadDraft={loadDraft}
      saveDraft={saveDraft}
    />
  );
}
