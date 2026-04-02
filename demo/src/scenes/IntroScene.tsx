import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const titleY = spring({
    frame,
    fps,
    from: 40,
    to: 0,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 22,
  });

  const subOpacity = spring({ frame: Math.max(0, frame - 12), fps, from: 0, to: 1, durationInFrames: 20 });
  const subY = spring({
    frame: Math.max(0, frame - 12),
    fps,
    from: 24,
    to: 0,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 20,
  });

  const iconScale = spring({
    frame: Math.max(0, frame - 4),
    fps,
    from: 0,
    to: 1,
    config: { mass: 1.2, stiffness: 100, damping: 10 },
    durationInFrames: 20,
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
      {/* Icon */}
      <div
        style={{
          fontSize: 80,
          transform: `scale(${iconScale})`,
          marginBottom: 20,
          filter: 'drop-shadow(0 0 30px rgba(109,40,217,0.8))',
        }}
      >
        📋
      </div>

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          fontSize: 100,
          fontWeight: 800,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: COLORS.white,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          marginBottom: 20,
        }}
      >
        Clippy
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          fontSize: 30,
          fontWeight: 400,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: COLORS.accentLight,
          letterSpacing: '0.02em',
        }}
      >
        The clipboard manager your browser deserves
      </div>

      {/* Tag pills */}
      <div
        style={{
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          display: 'flex',
          gap: 12,
          marginTop: 32,
        }}
      >
        {['Free', 'Private', 'Keyboard-first'].map((tag) => (
          <div
            key={tag}
            style={{
              background: 'rgba(109,40,217,0.18)',
              border: '1px solid rgba(109,40,217,0.4)',
              color: COLORS.accentLight,
              padding: '8px 22px',
              borderRadius: 100,
              fontSize: 18,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}
          >
            {tag}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
