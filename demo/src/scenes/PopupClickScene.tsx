import React from 'react';
import { AbsoluteFill, Video, staticFile, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';

export const PopupClickScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Window entrance
  const enterScale = spring({ frame, fps, from: 0.88, to: 1, config: { damping: 18, stiffness: 140 }, durationInFrames: 22 });
  const enterOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 16 });
  const enterY = spring({ frame, fps, from: 28, to: 0, config: { damping: 16, stiffness: 130 }, durationInFrames: 22 });

  const zoomScale = 1;
  const zoomOriginY = 50;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          opacity: enterOpacity,
          transform: `scale(${enterScale * 1.7}) translateY(${enterY}px)`,
          transformOrigin: 'center center',
          width: 380,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(109,40,217,0.3), 0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(109,40,217,0.15)',
        }}
      >
        {/* Browser chrome */}
        <div style={{ background: '#1c1c2e', borderBottom: '1px solid rgba(109,40,217,0.25)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', paddingLeft: 10, color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'monospace' }}>
            chrome-extension://clippy
          </div>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>📋</div>
        </div>

        {/* Video with zoom */}
        <div style={{ width: 380, height: 500, overflow: 'hidden', position: 'relative', background: '#111' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: `scale(${zoomScale})`,
              transformOrigin: `50% ${zoomOriginY}%`,
            }}
          >
            <Video
              src={staticFile('popup-click.webm')}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
