'use client';
import { StateBible } from '@/lib/types';

export default function StateBibleView({ bible }: { bible: StateBible }) {
  const saturatedMarkers = Object.entries(bible.markerUsageCount ?? {})
    .filter(([, c]) => c >= 8)
    .sort((a, b) => b[1] - a[1]);

  const allMarkers = Object.entries(bible.markerUsageCount ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>State Bible</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
        Actualizada hasta el capítulo {bible.lastUpdatedChapter} — Fuente de verdad del sistema anti-errores
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          {section('Personajes', (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(bible.characters ?? []).map((c, i) => (
                <div key={i} style={{ background: 'var(--surface2)', border: `1px solid ${c.status === 'dead' ? 'var(--danger)' : c.reactivationRequired ? 'var(--warning)' : 'var(--border)'}`, borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: c.status === 'dead' ? 'var(--danger)' : c.status === 'alive' ? 'var(--success)' : 'var(--warning)', color: 'white' }}>
                      {c.status}
                    </span>
                  </div>
                  {c.reactivationRequired && <p style={{ fontSize: '0.72rem', color: 'var(--warning)', marginBottom: '0.25rem' }}>⚠️ Requiere escena de reactivación</p>}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>📍 {c.location || 'Sin ubicación'}</p>
                  {c.physicalCondition && <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>🩹 {c.physicalCondition}</p>}
                  {c.emotionalState && <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>💭 {c.emotionalState}</p>}
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Último activo: cap {c.lastSeenChapter}</p>
                </div>
              ))}
              {(!bible.characters || bible.characters.length === 0) && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin personajes registrados aún</p>}
            </div>
          ))}

          {section('Deudas Emocionales Pendientes', (
            <div>
              {(bible.pendingEmotionalDebts ?? []).length === 0
                ? <p style={{ color: 'var(--success)', fontSize: '0.82rem' }}>✅ Ninguna pendiente</p>
                : (bible.pendingEmotionalDebts ?? []).map((d, i) => (
                    <div key={i} style={{ background: '#1a1400', border: '1px solid var(--warning)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
                      ⚠️ {d}
                    </div>
                  ))
              }
            </div>
          ))}

          {section('Tramas Abiertas', (
            <div>
              {(bible.narrativeInventory?.openPlotThreads ?? []).length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Ninguna registrada</p>
                : (bible.narrativeInventory?.openPlotThreads ?? []).map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--accent)' }}>→</span>
                      <span style={{ color: 'var(--text)' }}>{t}</span>
                    </div>
                  ))
              }
            </div>
          ))}
        </div>

        <div>
          {section('Marcadores Saturados (≥8 usos)', (
            <div>
              {saturatedMarkers.length === 0
                ? <p style={{ color: 'var(--success)', fontSize: '0.82rem' }}>✅ Ningún marcador saturado</p>
                : saturatedMarkers.map(([phrase, count]) => (
                    <div key={phrase} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', padding: '0.4rem 0.6rem', background: '#1a0f0f', borderRadius: '5px', border: '1px solid var(--danger)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>"{phrase}"</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}>{count}×</span>
                    </div>
                  ))
              }
            </div>
          ))}

          {allMarkers.length > saturatedMarkers.length && section('Todos los Marcadores', (
            <div>
              {allMarkers.map(([phrase, count]) => (
                <div key={phrase} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>"{phrase}"</span>
                  <span style={{ color: count >= 8 ? 'var(--danger)' : count >= 5 ? 'var(--warning)' : 'var(--text-dim)', fontWeight: count >= 5 ? 600 : 400, flexShrink: 0 }}>{count}×</span>
                </div>
              ))}
            </div>
          ))}

          {section('Cuentas Regresivas Activas', (
            <div>
              {(bible.timeCountdowns ?? []).filter(t => t.active).length === 0
                ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Ninguna activa</p>
                : (bible.timeCountdowns ?? []).filter(t => t.active).map((t, i) => (
                    <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.6rem 0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.25rem' }}>⏱ {t.description}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Inicio: {t.initialValue}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>Actual: {t.currentValue}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Act. cap {t.lastUpdatedChapter}</div>
                    </div>
                  ))
              }
            </div>
          ))}

          {section('Estado del Mundo', (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: '0.5rem' }}>{bible.worldState}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}><strong style={{ color: 'var(--text)' }}>Conflicto:</strong> {bible.mainConflictStatus}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
