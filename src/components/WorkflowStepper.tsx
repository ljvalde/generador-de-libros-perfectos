'use client';

import Link from 'next/link';

const STEPS = [
  { key: 'concepto', label: 'CONCEPTO', icon: LightbulbIcon },
  { key: 'personajes', label: 'PERSONAJES', icon: CharactersIcon },
  { key: 'esquema', label: 'ESQUEMA', icon: DocumentIcon },
  { key: 'mundo', label: 'MUNDO', icon: GlobeIcon },
  { key: 'biblia', label: 'BIBLIA', icon: BibleIcon },
] as const;

export type WorkflowStep = (typeof STEPS)[number]['key'];

interface Props {
  currentStep: WorkflowStep;
  useLinks?: boolean;
}

function LightbulbIcon({ active }: { active: boolean }) {
  const color = active ? '#a78bfa' : '#64748b';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4.95 11.95A5 5 0 0 1 8 14a1 1 0 0 1 2 0 3 3 0 0 0 4 2.9 7 7 0 0 0 6.95-9.86A7 7 0 0 0 12 2z" />
    </svg>
  );
}

function DocumentIcon({ active }: { active: boolean }) {
  const color = active ? '#a78bfa' : '#64748b';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

function CharactersIcon({ active }: { active: boolean }) {
  const color = active ? '#a78bfa' : '#64748b';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="17" cy="11" r="3" />
      <path d="M21 21v-2a3 3 0 0 0-3-3" />
    </svg>
  );
}

function GlobeIcon({ active }: { active: boolean }) {
  const color = active ? '#a78bfa' : '#64748b';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

function BibleIcon({ active }: { active: boolean }) {
  const color = active ? '#a78bfa' : '#64748b';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function WorkflowStepper({ currentStep, useLinks }: Props) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      {/* Horizontal connecting line */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          right: '10%',
          top: 36,
          height: 1,
          background: 'var(--border)',
          zIndex: 0,
        }}
      />

      {STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isPast = index < currentIndex;
        const IconComponent = step.icon;

        const content = (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                border: `2px solid ${isActive ? '#a78bfa' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'rgba(167, 139, 250, 0.15)' : 'var(--surface)',
                boxShadow: isActive ? '0 0 20px rgba(167, 139, 250, 0.4)' : 'none',
              }}
            >
              <IconComponent active={isActive || isPast} />
            </div>
            <span
              style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: isActive ? 'white' : 'var(--text-dim)',
                background: isActive ? '#7c3aed' : 'transparent',
                padding: isActive ? '0.25rem 0.6rem' : 0,
                borderRadius: isActive ? 6 : 0,
              }}
            >
              {step.label}
            </span>
          </>
        );

        return (
          <div
            key={step.key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: '1 1 0',
              minWidth: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            {useLinks ? (
              <Link href={`/nueva-historia/${step.key}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </div>
  );
}

export { STEPS };
