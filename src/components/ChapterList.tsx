'use client';
import { Chapter, ChapterOutline } from '@/lib/types';

interface Props {
  outline: ChapterOutline[];
  chapters: Chapter[];
  selected: Chapter | null;
  onSelect: (c: Chapter) => void;
}

export default function ChapterList({ outline, chapters, selected, onSelect }: Props) {
  const chapterMap = new Map(chapters.map(c => [c.number, c]));

  return (
    <div>
      {outline.map(o => {
        const chapter = chapterMap.get(o.number);
        const isSelected = selected?.number === o.number;
        const hasErrors = (chapter?.verificationResult?.criticalErrors?.length ?? 0) > 0;
        const hasWarnings = (chapter?.verificationResult?.warnings?.length ?? 0) > 0;

        return (
          <div
            key={o.number}
            onClick={() => chapter && onSelect(chapter)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '6px',
              marginBottom: '2px',
              cursor: chapter ? 'pointer' : 'default',
              background: isSelected ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!isSelected && chapter) e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: chapter ? (hasErrors ? 'var(--danger)' : 'var(--success)') : 'var(--border)',
              color: 'white', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
            }}>
              {chapter ? (hasErrors ? '!' : '✓') : o.number}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: chapter ? 600 : 400, color: chapter ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.title}
              </div>
              {chapter && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  {(chapter.wordCount ?? 0).toLocaleString()} palabras
                  {hasWarnings && !hasErrors && <span style={{ color: 'var(--warning)', marginLeft: '0.4rem' }}>⚠</span>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
