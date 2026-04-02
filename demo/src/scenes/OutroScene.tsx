import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const y = spring({
    frame,
    fps,
    from: 30,
    to: 0,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 22,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 8 }}>📋</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: COLORS.white,
            letterSpacing: '-0.04em',
            marginBottom: 8,
          }}
        >
          Clippy
        </div>
        <div
          style={{
            fontSize: 26,
            color: COLORS.gray,
            fontFamily: 'Inter, system-ui, sans-serif',
            marginBottom: 28,
          }}
        >
          Free. Private. Open source.
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff',
            fontSize: 22,
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            padding: '16px 48px',
            borderRadius: 100,
            boxShadow: '0 8px 32px rgba(109,40,217,0.5)',
            letterSpacing: '0.01em',
          }}
        >
          Install from the Chrome Web Store
        </div>
      </div>
    </AbsoluteFill>
  );
};
