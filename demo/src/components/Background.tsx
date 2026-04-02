import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from '../constants';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow breathing animation on the gradient
  const gradientShift = interpolate(frame, [0, 300, 600, 900], [0, 15, 0, 15], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at ${50 + gradientShift}% 40%, #1e0a4a 0%, #0d0620 40%, #050210 100%)`,
      }}
    >
      {/* Subtle grid overlay */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(109,40,217,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(109,40,217,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Top glow */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1200,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
