
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
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white backdrop-blur-sm"
    >
      <h1 className="text-6xl font-black mb-6 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600">
        BLOCK RUNNER X
      </h1>
      <div className="bg-white/5 p-8 rounded-xl border border-white/10 mb-8 backdrop-blur-md max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-cyan-400">CONTROLS</h3>
        <div className="grid grid-cols-2 gap-4 text-sm font-mono text-gray-300">
          <div>
            <p className="text-white mb-1">MOVE</p>
            <span className="bg-white/20 px-2 py-1 rounded">A/D</span> or <span className="bg-white/20 px-2 py-1 rounded">Arrows</span>
          </div>
          <div>
            <p className="text-white mb-1">JUMP</p>
            <span className="bg-white/20 px-2 py-1 rounded">Space</span> or <span className="bg-white/20 px-2 py-1 rounded">W</span>
          </div>
          <div>
            <p className="text-white mb-1">SLIDE</p>
            <span className="bg-white/20 px-2 py-1 rounded">S</span> or <span className="bg-white/20 px-2 py-1 rounded">Down</span>
          </div>
          <div>
            <p className="text-white mb-1">ROLL</p>
            <span className="bg-white/20 px-2 py-1 rounded">Shift</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500 text-center">
          Mobile: Swipe Left/Right (Move) • Up (Jump) • Down (Slide) • Dbl Tap (Roll)
        </div>
      </div>
      <motion.button 
        whileHover={{ scale: 1.1, backgroundColor: "#fff" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setStatus(GameStatus.PLAYING)}
        className="px-12 py-4 bg-cyan-500 text-black font-black text-xl rounded-full shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-colors"
      >
        START MISSION
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
      className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 z-20 text-white backdrop-blur-md"
    >
      <h2 className="text-8xl font-black mb-2 text-red-500 drop-shadow-lg glitch-text">WASTED</h2>
      
      <div className="flex gap-12 my-8 text-center bg-black/40 p-6 rounded-2xl border border-red-500/30">
        <div>
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">Score</p>
          <p className="text-6xl font-mono text-white">{score}</p>
        </div>
        <div className="w-px bg-white/20"></div>
        <div>
          <p className="text-xs font-bold text-yellow-500 tracking-widest uppercase mb-1">Best</p>
          <p className="text-6xl font-mono text-yellow-400">{highScore}</p>
        </div>
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => resetGame()}
        className="px-10 py-4 bg-white hover:bg-gray-200 text-red-900 font-black rounded-lg shadow-xl uppercase tracking-wider text-xl"
      >
        Retry
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
      <div className="flex items-end gap-2">
        <span className="text-cyan-400 font-bold text-sm tracking-widest mb-1">SCORE</span>
        <div className="text-white font-mono font-black text-4xl italic drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
          {score.toString().padStart(6, '0')}
        </div>
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const status = useGameStore((state) => state.status);

  return (
    <div className="relative w-full h-full bg-[#111] overflow-hidden">
      <AnimatePresence>
        {status === GameStatus.IDLE && <StartScreen key="start" />}
        {status === GameStatus.PLAYING && <HUD key="hud" />}
        {status === GameStatus.GAME_OVER && <GameOverScreen key="over" />}
      </AnimatePresence>

      <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 45, near: 0.1, far: 200 }}>
        <Suspense fallback={null}>
           <GameScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;
