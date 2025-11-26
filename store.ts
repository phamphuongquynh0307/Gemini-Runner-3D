import { create } from 'zustand';
import { GameStatus, GameState } from './types';

const getHighScore = () => {
  const stored = localStorage.getItem('blockRunnerHighScore');
  return stored ? parseInt(stored, 10) : 0;
};

export const useGameStore = create<GameState>((set) => ({
  status: GameStatus.IDLE,
  score: 0,
  highScore: getHighScore(),
  
  setStatus: (status) => set({ status }),
  
  setScore: (score) => set({ score }),
  
  incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
  
  resetGame: () => set((state) => {
    // Update high score if needed
    const newHighScore = Math.max(state.score, state.highScore);
    localStorage.setItem('blockRunnerHighScore', newHighScore.toString());
    
    return {
      status: GameStatus.IDLE,
      score: 0,
      highScore: newHighScore
    };
  }),
}));
