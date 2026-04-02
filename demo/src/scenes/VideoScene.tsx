import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { Background } from '../components/Background';
import { PopupWindow } from '../components/PopupWindow';
import { Callout } from '../components/Callout';

interface VideoSceneProps {
  clip: string;
  trimBefore?: number;
  trimAfter?: number;
  callout: string;
  calloutSub?: string;
  calloutDelay?: number;
  /** Zoom into this [x, y] fraction at this frame offset within the scene */
  zoomTarget?: [number, number];
  zoomScale?: number;
  zoomAt?: number;
}

export const VideoScene: React.FC<VideoSceneProps> = ({
  clip,
  trimBefore = 0,
  trimAfter,
  callout,
  calloutSub,
  calloutDelay = 20,
  zoomTarget,
  zoomScale = 1,
  zoomAt = 0,
}) => {
  return (
    <AbsoluteFill>
      <Background />
      <PopupWindow
        clip={clip}
        trimBefore={trimBefore}
        trimAfter={trimAfter}
        zoomTarget={zoomTarget}
        zoomScale={zoomScale}
        zoomAt={zoomAt}
        enterDelay={0}
      />
      <Sequence from={calloutDelay}>
        <Callout text={callout} sub={calloutSub} />
      </Sequence>
    </AbsoluteFill>
  );
};
