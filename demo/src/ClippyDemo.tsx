import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { Background } from './components/Background';
import { IntroScene } from './scenes/IntroScene';
import { OutroScene } from './scenes/OutroScene';
import { VideoScene } from './scenes/VideoScene';
import { SCENE_DURATION } from './constants';

export const ClippyDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Background />
      <Series>
        {/* Intro: title card */}
        <Series.Sequence durationInFrames={SCENE_DURATION.INTRO}>
          <IntroScene />
        </Series.Sequence>

        {/* Copy capture: copy text on a page, popup appears with the clip */}
        <Series.Sequence durationInFrames={SCENE_DURATION.COPY} offset={-8}>
          <VideoScene
            clip="copy.webm"
            callout="Every copy is automatically saved"
            calloutSub="No hotkeys needed. Just copy as usual."
            calloutDelay={30}
            zoomTarget={[0.5, 0.35]}
            zoomScale={1.4}
            zoomAt={80}
          />
        </Series.Sequence>

        {/* Browse history */}
        <Series.Sequence durationInFrames={SCENE_DURATION.HISTORY} offset={-8}>
          <VideoScene
            clip="history.webm"
            callout="Your full clipboard history, always there"
            calloutSub="Click any clip to copy it back instantly."
            calloutDelay={20}
          />
        </Series.Sequence>

        {/* Search */}
        <Series.Sequence durationInFrames={SCENE_DURATION.SEARCH} offset={-8}>
          <VideoScene
            clip="search.webm"
            callout="Fuzzy search across everything you've copied"
            calloutDelay={20}
            zoomTarget={[0.5, 0.42]}
            zoomScale={1.25}
            zoomAt={15}
          />
        </Series.Sequence>

        {/* Favorites */}
        <Series.Sequence durationInFrames={SCENE_DURATION.FAVORITES} offset={-8}>
          <VideoScene
            clip="favorites.webm"
            callout="Pin the ones you reach for every day"
            calloutDelay={20}
          />
        </Series.Sequence>

        {/* Snippets */}
        <Series.Sequence durationInFrames={SCENE_DURATION.SNIPPETS} offset={-8}>
          <VideoScene
            clip="snippets.webm"
            callout="Snippets: type a shortcut, expand to any text"
            calloutSub="Create templates, signatures, boilerplate."
            calloutDelay={20}
            zoomTarget={[0.5, 0.75]}
            zoomScale={1.35}
            zoomAt={100}
          />
        </Series.Sequence>

        {/* Keyboard shortcut */}
        <Series.Sequence durationInFrames={SCENE_DURATION.SHORTCUT} offset={-8}>
          <VideoScene
            clip="shortcut.webm"
            callout="Open anywhere with Ctrl+Shift+V"
            calloutSub="Your history is one shortcut away."
            calloutDelay={15}
          />
        </Series.Sequence>

        {/* Outro: end card */}
        <Series.Sequence durationInFrames={SCENE_DURATION.OUTRO} offset={-8}>
          <OutroScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
