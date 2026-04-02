import React from 'react';
import { AbsoluteFill, Series, Sequence } from 'remotion';
import { Background } from './components/Background';
import { Callout } from './components/Callout';
import { IntroScene } from './scenes/IntroScene';
import { CopyScene } from './scenes/CopyScene';
import { PopupClickScene } from './scenes/PopupClickScene';
import { PasteScene } from './scenes/PasteScene';
import { OutroScene } from './scenes/OutroScene';

// Intro:  25f (0.8s)
// Copy:   70f (2.3s)
// Popup: 120f (4.0s)
// Paste:  75f (2.5s)
// Outro:  35f (1.2s)
// Total: 25+65+115+70+30 = 305 frames (~10s)

export const ClippyDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Background />
      <Series>
        <Series.Sequence durationInFrames={25}>
          <IntroScene />
        </Series.Sequence>

        <Series.Sequence durationInFrames={70} offset={-5}>
          <AbsoluteFill>
            <CopyScene />
            <Sequence from={50}>
              <Callout text="You copy. Clippy saves it." position="bottom" />
            </Sequence>
          </AbsoluteFill>
        </Series.Sequence>

        <Series.Sequence durationInFrames={120} offset={-5}>
          <AbsoluteFill>
            <PopupClickScene />
            <Sequence from={20}>
              <Callout text="Open Clippy. Navigate to any clip." position="bottom" />
            </Sequence>
          </AbsoluteFill>
        </Series.Sequence>

        <Series.Sequence durationInFrames={75} offset={-5}>
          <AbsoluteFill>
            <PasteScene />
            <Sequence from={30}>
              <Callout text="Paste it anywhere." position="bottom" />
            </Sequence>
          </AbsoluteFill>
        </Series.Sequence>

        <Series.Sequence durationInFrames={35} offset={-5}>
          <OutroScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
