import React from 'react';
import { AnimatedLogo } from './components/common/AnimatedLogo';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatedLogo isStatic={false} className="w-full h-auto" />
      </div>
      <h1 className="text-2xl font-bold mt-6 text-center text-lochmara-600 dark:text-lochmara-400">
        UniWheels
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 text-center">
        Viaja a la U con tu comunidad
      </p>
    </div>
  );
}
