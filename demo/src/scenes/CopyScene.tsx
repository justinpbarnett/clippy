import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';

const ARTICLE_TEXT = [
  'Researchers at MIT have developed a new approach to',
  'distributed computing that reduces latency by 40%.',
  '',
  'The database migration completed successfully',
  'with zero downtime across all production servers.',
  '',
  'Early benchmarks show promising results for',
  'large-scale deployments in cloud environments.',
];

// The sentence being "selected" spans lines 3-4
const HIGHLIGHT_LINE_START = 3;
const HIGHLIGHT_LINE_END = 4;

export const CopyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Window entrance
  const winScale = spring({ frame, fps, from: 0.92, to: 1, durationInFrames: 18, config: { damping: 18, stiffness: 140 } });
  const winOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 14 });

  // Highlight sweeps in at frame 18
  const highlightProgress = spring({
    frame: Math.max(0, frame - 18),
    fps,
    from: 0,
    to: 1,
    config: { damping: 20, stiffness: 100 },
    durationInFrames: 22,
  });

  // Ctrl+C badge appears at frame 48
  const badgeOpacity = spring({ frame: Math.max(0, frame - 48), fps, from: 0, to: 1, durationInFrames: 12 });
  const badgeScale = spring({
    frame: Math.max(0, frame - 48),
    fps,
    from: 0.7,
    to: 1,
    config: { mass: 0.8, stiffness: 200, damping: 12 },
    durationInFrames: 14,
  });

  // Clipboard icon flies up
  const iconY = spring({
    frame: Math.max(0, frame - 52),
    fps,
    from: 0,
    to: -28,
    config: { damping: 14, stiffness: 100 },
    durationInFrames: 18,
  });
  const iconOpacity = interpolate(frame, [52, 58, 70, 78], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Fake browser window */}
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
            techcrunch.com/article
          </div>
        </div>

        {/* Article content */}
        <div style={{ padding: '32px 40px 36px', fontFamily: 'Georgia, serif' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 16, lineHeight: 1.3 }}>
            New Distributed Computing Breakthrough
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.6)', position: 'relative' }}>
            {ARTICLE_TEXT.map((line, i) => {
              const isHighlighted = i >= HIGHLIGHT_LINE_START && i <= HIGHLIGHT_LINE_END;
              return (
                <div key={i} style={{ position: 'relative', minHeight: line ? undefined : 12 }}>
                  {isHighlighted && line && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: -4,
                        right: interpolate(highlightProgress, [0, 1], [i === HIGHLIGHT_LINE_START ? 100 : 200, -4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                        bottom: 2,
                        background: 'rgba(109,40,217,0.45)',
                        borderRadius: 3,
                        transition: 'right 0.1s',
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', color: isHighlighted ? 'rgba(255,255,255,0.95)' : undefined }}>
                    {line}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ctrl+C badge */}
      <div
        style={{
          position: 'absolute',
          bottom: 130,
          right: 'calc(50% - 360px)',
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          background: 'rgba(10,8,30,0.92)',
          border: '1px solid rgba(109,40,217,0.5)',
          borderRadius: 12,
          padding: '12px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        {['Ctrl', 'C'].map((k, i) => (
          <React.Fragment key={k}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>+</span>}
            <kbd style={{
              background: '#2a2a3e',
              border: '1px solid rgba(255,255,255,0.15)',
              borderBottom: '3px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 16,
              fontFamily: 'system-ui',
              color: '#fff',
              fontWeight: 600,
            }}>{k}</kbd>
          </React.Fragment>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginLeft: 4 }}>copied</span>
      </div>

      {/* Floating clipboard icon */}
      <div
        style={{
          position: 'absolute',
          bottom: 130,
          right: 'calc(50% - 440px)',
          opacity: iconOpacity,
          transform: `translateY(${iconY}px)`,
          fontSize: 40,
          filter: 'drop-shadow(0 0 16px rgba(109,40,217,0.9))',
        }}
      >
        📋
      </div>
    </AbsoluteFill>
  );
};
