import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { useGameStore } from './store';
import { GameStatus } from './types';
import { motion, AnimatePresence } from 'framer-motion';

const StartScreen = () => {
  const { setStatus } = useGameStore();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 text-white backdrop-blur-sm"
    >
      <h1 className="text-6xl font-black mb-6 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600">
        RUNNER 3D
      </h1>
      <div className="bg-black/40 p-6 rounded-lg border border-white/10 mb-8 backdrop-blur-md">
        <p className="text-gray-300 mb-2 font-mono text-sm">CONTROLS</p>
        <div className="flex gap-4 mb-2">
          <div className="bg-white/10 px-3 py-1 rounded">A / Left</div>
          <div className="bg-white/10 px-3 py-1 rounded">D / Right</div>
        </div>
        <div className="text-xs text-gray-500">Mobile: Swipe Left/Right</div>
      </div>
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setStatus(GameStatus.PLAYING)}
        className="px-10 py-4 bg-white text-black font-bold text-xl rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]"
      >
        START RUNNING
      </motion.button>
    </motion.div>
  );
};

const GameOverScreen = () => {
  const { score, highScore, resetGame } = useGameStore();
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 z-20 text-white backdrop-blur-md"
    >
      <h2 className="text-7xl font-black mb-2 text-red-500 drop-shadow-lg">CRASHED</h2>
      
      <div className="grid grid-cols-2 gap-8 my-8 text-center">
        <div>
          <p className="text-sm font-bold text-gray-400 tracking-widest uppercase">Score</p>
          <p className="text-5xl font-mono mt-2">{score}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-yellow-500 tracking-widest uppercase">Best</p>
          <p className="text-5xl font-mono mt-2 text-yellow-400">{highScore}</p>
        </div>
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => resetGame()}
        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg uppercase tracking-wider"
      >
        Restart System
      </motion.button>
    </motion.div>
  );
};

const HUD = () => {
  const { score } = useGameStore();
  return (
    <motion.div 
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      className="absolute top-6 left-6 z-10"
    >
      <div className="text-white font-mono font-black text-3xl italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
        {score.toString().padStart(5, '0')}
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const status = useGameStore((state) => state.status);

  return (
    <div className="relative w-full h-full bg-[#111]">
      <AnimatePresence>
        {status === GameStatus.IDLE && <StartScreen key="start" />}
        {status === GameStatus.PLAYING && <HUD key="hud" />}
        {status === GameStatus.GAME_OVER && <GameOverScreen key="over" />}
      </AnimatePresence>

      <Canvas shadows dpr={[1, 1.5]}>
        <Suspense fallback={null}>
           <GameScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;