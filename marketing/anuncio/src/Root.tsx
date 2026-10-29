import React from 'react';
import { Composition } from 'remotion';
import { Anuncio, DURACION } from './Anuncio';
import { AnuncioReal, DURACION_REAL } from './AnuncioReal';
import { FPS } from './tema';

export const Root: React.FC = () => (
  <>
    {/* Reels, TikTok, historias */}
    <Composition id="AnuncioVertical" component={Anuncio} durationInFrames={DURACION} fps={FPS} width={1080} height={1920} />
    {/* YouTube, landing, presentaciones */}
    <Composition id="AnuncioHorizontal" component={Anuncio} durationInFrames={DURACION} fps={FPS} width={1920} height={1080} />
    {/* Versión con las grabaciones reales de la app */}
    <Composition id="RealVertical" component={AnuncioReal} durationInFrames={DURACION_REAL} fps={FPS} width={1080} height={1920} />
    <Composition id="RealHorizontal" component={AnuncioReal} durationInFrames={DURACION_REAL} fps={FPS} width={1920} height={1080} />
  </>
);
