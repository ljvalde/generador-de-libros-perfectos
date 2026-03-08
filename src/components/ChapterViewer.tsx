'use client';
import { useState } from 'react';
import { Chapter } from '@/lib/types';

export default function ChapterViewer({ chapter }: { chapter: Chapter }) {
  const [tab, setTab] = useState<'text' | 'verification'>('text');
  const vr = chapter.verificationResult;
  const hasCritical = (vr?.criticalErrors?.length ?? 0) > 0;
  const hasWarnings = (vr?.warnings?.length ?? 0) > 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Cap {chapter.number} — {chapter.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          <span>{(chapter.wordCount ?? 0).toLocaleString()} palabras</span>
          {hasCritical && <span style={{ color: 'var(--danger)' }}>● {vr!.criticalErrors.length} errores críticos</span>}
          {hasWarnings && <span style={{ color: 'var(--warning)' }}>● {vr!.warnings.length} advertencias</span>}
          {vr && !hasCritical && !hasWarnings && <span style={{ color: 'var(--success)' }}>● Verificación limpia</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {(['text', 'verification'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', padding: '0.4rem 0.75rem',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--accent)' : 'var(--text-dim)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {t === 'text' ? '📄 Texto' : '🔍 Verificación'}
            {t === 'verification' && hasCritical && <span style={{ marginLeft: '0.4rem', background: 'var(--danger)', color: 'white', borderRadius: '10px', padding: '0 5px', fontSize: '0.7rem' }}>{vr!.criticalErrors.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'text' && (
        <div className="prose fade-in">{chapter.content}</div>
      )}

      {tab === 'verification' && (
        <div className="fade-in">
          {!vr ? (
            <p style={{ color: 'var(--text-dim)' }}>No hay datos de verificación para este capítulo.</p>
          ) : (
            <>
              {hasCritical && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                    ❌ Errores Críticos
                  </h3>
                  {vr.criticalErrors.map((e, i) => (
                    <div key={i} style={{ background: '#1a0f0f', border: '1px solid var(--danger)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{e.type}</div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{e.description}</p>
                      {e.evidence && <blockquote style={{ borderLeft: '3px solid var(--danger)', paddingLeft: '0.75rem', color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '0.5rem' }}>"{e.evidence}"</blockquote>}
                      {e.suggestedFix && <p style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✦ {e.suggestedFix}</p>}
                    </div>
                  ))}
                </div>
              )}

              {hasWarnings && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--warning)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: 700 }}>
                    ⚠️ Advertencias
                  </h3>
                  {vr.warnings.map((w, i) => (
                    <div key={i} style={{ background: '#1a1400', border: '1px solid var(--warning)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--warning)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{w.type}</div>
                      <p style={{ fontSize: '0.83rem', color: 'var(--text)' }}>{w.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {!hasCritical && !hasWarnings && (
                <div style={{ background: '#0f1a13', border: '1px solid var(--success)', borderRadius: '8px', padding: '1rem', color: 'var(--success)', textAlign: 'center' }}>
                  ✅ Capítulo verificado sin errores ni advertencias
                </div>
              )}

              {vr.qualityNotes && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-dim)' }}>NOTAS DE CALIDAD</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{vr.qualityNotes}</p>
                </div>
              )}

              {Object.keys(vr.markerCountsThisChapter ?? {}).length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-dim)' }}>MARCADORES EN ESTE CAPÍTULO</h3>
                  {Object.entries(vr.markerCountsThisChapter).map(([phrase, count]) => (
                    <div key={phrase} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-dim)' }}>"{phrase}"</span>
                      <span style={{ color: count > 2 ? 'var(--danger)' : count > 1 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{count}×</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
