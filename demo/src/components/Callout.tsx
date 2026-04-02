import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';

interface CalloutProps {
  text: string;
  sub?: string;
  position?: 'bottom' | 'top';
  delay?: number;
}

export const Callout: React.FC<CalloutProps> = ({
  text,
  sub,
  position = 'bottom',
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const inFrame = Math.max(0, frame - delay);
  const opacity = spring({ frame: inFrame, fps, from: 0, to: 1, durationInFrames: 18 });
  const translateY = spring({
    frame: inFrame,
    fps,
    from: position === 'bottom' ? 24 : -24,
    to: 0,
    config: { damping: 14, stiffness: 120 },
    durationInFrames: 18,
  });

  // Fade out near end of sequence
  const fadeOut = spring({
    frame: Math.max(0, frame - (durationInFrames - 20)),
    fps,
    from: 0,
    to: 1,
    durationInFrames: 14,
  });
  const finalOpacity = opacity * (1 - fadeOut);

  const isBottom = position === 'bottom';

  return (
    <AbsoluteFill
      style={{
        justifyContent: isBottom ? 'flex-end' : 'flex-start',
        alignItems: 'center',
        paddingBottom: isBottom ? 60 : 0,
        paddingTop: isBottom ? 0 : 60,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          opacity: finalOpacity,
          transform: `translateY(${translateY}px)`,
          background: 'rgba(6,3,20,0.88)',
          border: '1px solid rgba(109,40,217,0.4)',
          color: COLORS.white,
          fontSize: 32,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 600,
          padding: '18px 40px',
          borderRadius: 16,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(109,40,217,0.2)',
          textAlign: 'center',
          maxWidth: 900,
          letterSpacing: '-0.01em',
        }}
      >
        {text}
        {sub && (
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: COLORS.accentLight,
              marginTop: 6,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
