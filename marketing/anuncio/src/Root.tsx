import React from 'react';
import { Composition } from 'remotion';
import { Anuncio, DURACION } from './Anuncio';
import { FPS } from './tema';

export const Root: React.FC = () => (
  <>
    {/* Reels, TikTok, historias */}
    <Composition id="AnuncioVertical" component={Anuncio} durationInFrames={DURACION} fps={FPS} width={1080} height={1920} />
    {/* YouTube, landing, presentaciones */}
    <Composition id="AnuncioHorizontal" component={Anuncio} durationInFrames={DURACION} fps={FPS} width={1920} height={1080} />
  </>
);
