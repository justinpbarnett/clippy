import React from 'react';
import { Composition } from 'remotion';
import { ClippyDemo } from './ClippyDemo';

// Series with offset=-8 per scene: actual total = sum(durations) - 7*8 = 1020 - 56 = 964 + 60 outro = 1024
const TOTAL_FRAMES = 1024;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ClippyDemo"
        component={ClippyDemo}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
