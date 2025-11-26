import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { useGameStore } from './store';
import { GameStatus } from './types';

// UI Components
const StartScreen = () => {
  const { setStatus } = useGameStore();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white">
      <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
        BLOCK RUNNER 3D
      </h1>
      <div className="mb-8 text-center text-gray-300">
        <p className="mb-2">Controls:</p>
        <p>Desktop: <span className="font-bold text-white">A</span> / <span className="font-bold text-white">D</span> to move</p>
        <p>Mobile: <span className="font-bold text-white">Swipe</span> left/right</p>
      </div>
      <button 
        onClick={() => setStatus(GameStatus.PLAYING)}
        className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg text-xl transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/50"
      >
        PLAY
      </button>
    </div>
  );
};

const GameOverScreen = () => {
  const { score, highScore, resetGame } = useGameStore();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 z-10 text-white backdrop-blur-sm">
      <h2 className="text-6xl font-black mb-4 text-red-500 tracking-widest uppercase drop-shadow-md">You Lose</h2>
      
      <div className="bg-black/50 p-6 rounded-xl border border-white/10 mb-8 min-w-[200px] text-center">
        <div className="mb-4">
          <p className="text-gray-400 text-sm uppercase tracking-wide">Score</p>
          <p className="text-4xl font-mono">{score}</p>
        </div>
        <div>
          <p className="text-yellow-500 text-sm uppercase tracking-wide">Best Score</p>
          <p className="text-2xl font-mono text-yellow-300">{highScore}</p>
        </div>
      </div>

      <button 
        onClick={() => resetGame()} // Reset state returns to IDLE
        className="px-8 py-3 bg-white text-red-600 font-bold rounded-lg text-xl hover:bg-gray-100 transition-colors shadow-xl"
      >
        Try Again
      </button>
    </div>
  );
};

const HUD = () => {
  const { score } = useGameStore();
  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="text-white font-mono font-bold text-2xl drop-shadow-md">
        SCORE: {score}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const status = useGameStore((state) => state.status);

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* 2D UI Layer */}
      {status === GameStatus.IDLE && <StartScreen />}
      {status === GameStatus.PLAYING && <HUD />}
      {status === GameStatus.GAME_OVER && <GameOverScreen />}

      {/* 3D Scene Layer */}
      <Canvas shadows dpr={[1, 2]}>
        <GameScene />
      </Canvas>
    </div>
  );
};

export default App;
