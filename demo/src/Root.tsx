import React from 'react';
import { Composition } from 'remotion';
import { ClipjarDemo } from './ClipjarDemo';

// 25 + (70-5) + (120-5) + (75-5) + (35-5) = 25+65+115+70+30 = 305
const TOTAL_FRAMES = 305;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ClipjarDemo"
        component={ClipjarDemo}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
