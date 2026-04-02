import React from 'react';
import { Video, staticFile, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS } from '../constants';

interface PopupWindowProps {
  clip: string;
  trimBefore?: number;
  trimAfter?: number;
  /** 0-1 region to zoom into: [x, y] as fraction of video dimensions */
  zoomTarget?: [number, number];
  /** Scale factor for zoom (default 1 = no zoom) */
  zoomScale?: number;
  /** Frame at which zoom starts */
  zoomAt?: number;
  /** Entrance animation delay in frames */
  enterDelay?: number;
}

export const PopupWindow: React.FC<PopupWindowProps> = ({
  clip,
  trimBefore = 0,
  trimAfter,
  zoomTarget = [0.5, 0.5],
  zoomScale = 1,
  zoomAt = 0,
  enterDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const inFrame = Math.max(0, frame - enterDelay);
  const enterScale = spring({
    frame: inFrame,
    fps,
    from: 0.88,
    to: 1,
    config: { damping: 18, stiffness: 140 },
    durationInFrames: 24,
  });
  const enterOpacity = spring({
    frame: inFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 18,
  });
  const enterY = spring({
    frame: inFrame,
    fps,
    from: 30,
    to: 0,
    config: { damping: 16, stiffness: 130 },
    durationInFrames: 24,
  });

  // Zoom spring
  const zoomFrame = Math.max(0, frame - zoomAt);
  const currentZoom = spring({
    frame: zoomFrame,
    fps,
    from: 1,
    to: zoomScale,
    config: { damping: 20, stiffness: 100 },
    durationInFrames: 30,
  });

  const [zx, zy] = zoomTarget;

  return (
    <div
      style={{
        position: 'absolute',
        // Center in frame at 1.7x scale (380 -> 646, 500 -> 850, fits in 1080p)
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -52%) scale(${enterScale * 1.7}) translateY(${enterY}px)`,
        transformOrigin: 'center center',
        opacity: enterOpacity,
        width: 380,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow:
          '0 0 0 1px rgba(109,40,217,0.3), 0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(109,40,217,0.15)',
      }}
    >
      {/* Browser chrome bar */}
      <div
        style={{
          background: '#1c1c2e',
          borderBottom: '1px solid rgba(109,40,217,0.25)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div
              key={c}
              style={{ width: 12, height: 12, borderRadius: '50%', background: c }}
            />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 6,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            color: 'rgba(255,255,255,0.35)',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          chrome-extension://clippy
        </div>
        {/* Clippy icon */}
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
          }}
        >
          📋
        </div>
      </div>

      {/* Video content with zoom */}
      <div
        style={{
          width: 380,
          height: 500,
          overflow: 'hidden',
          position: 'relative',
          background: '#111',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${currentZoom})`,
            transformOrigin: `${zx * 100}% ${zy * 100}%`,
          }}
        >
          <Video
            src={staticFile(clip)}
            trimBefore={trimBefore}
            {...(trimAfter !== undefined ? { trimAfter } : {})}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </div>
  );
};
