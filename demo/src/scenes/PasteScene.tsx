import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const PASTED_TEXT = 'The database migration completed successfully with zero downtime';

export const PasteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Window entrance
  const winOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 14 });
  const winScale = spring({ frame, fps, from: 0.94, to: 1, config: { damping: 18, stiffness: 140 }, durationInFrames: 18 });

  // Text appears at frame 16: instant paste (highlight then settle)
  const textOpacity = spring({ frame: Math.max(0, frame - 16), fps, from: 0, to: 1, durationInFrames: 10 });

  // Highlight sweeps across the pasted text
  const highlightWidth = interpolate(
    frame,
    [16, 28, 48, 56],
    [0, 100, 100, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Cursor blink after paste settles
  const cursorOpacity = frame > 56 ? (Math.floor((frame - 56) / 15) % 2 === 0 ? 1 : 0) : 1;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Same fake browser window */}
      <div
        style={{
          opacity: winOpacity,
          transform: `scale(${winScale})`,
          width: 860,
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.7)',
          background: '#1a1a2e',
        }}
      >
        {/* Browser chrome */}
        <div style={{ background: '#111120', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 24, display: 'flex', alignItems: 'center', paddingLeft: 10, color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'monospace' }}>
            docs.notion.so/meeting-notes
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: '32px 40px 40px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 24 }}>
            Sprint retrospective notes
          </div>

          {/* Static text lines */}
          {['Action items from today:', 'Owner: Platform team'].map((line) => (
            <div key={line} style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{line}</div>
          ))}

          {/* Input field */}
          <div
            style={{
              marginTop: 20,
              background: 'rgba(255,255,255,0.05)',
              border: '1.5px solid rgba(109,40,217,0.7)',
              borderRadius: 8,
              padding: '14px 16px',
              fontSize: 15,
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Inter, system-ui, sans-serif',
              minHeight: 52,
              position: 'relative',
              boxShadow: '0 0 0 3px rgba(109,40,217,0.15)',
            }}
          >
            {/* Pasted text with highlight */}
            <span style={{ position: 'relative', opacity: textOpacity }}>
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  left: 0,
                  width: `${highlightWidth}%`,
                  bottom: -2,
                  background: 'rgba(109,40,217,0.4)',
                  borderRadius: 2,
                  pointerEvents: 'none',
                }}
              />
              <span style={{ position: 'relative' }}>{PASTED_TEXT}</span>
            </span>
            {/* Blinking cursor */}
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1.1em',
                background: PASTED_TEXT ? 'rgba(109,40,217,0.9)' : 'rgba(255,255,255,0.7)',
                marginLeft: 1,
                verticalAlign: 'text-bottom',
                opacity: cursorOpacity,
              }}
            />
          </div>

          {/* Subtle "pasted" label */}
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: 'rgba(109,40,217,0.7)',
              opacity: spring({ frame: Math.max(0, frame - 20), fps, from: 0, to: 1, durationInFrames: 12 }),
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            ⌘V, pasted from Clippy
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
