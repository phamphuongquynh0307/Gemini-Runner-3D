export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface ObstacleData {
  id: string;
  x: number;
  z: number;
  height: number;
  width: number;
  depth: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  setStatus: (status: GameStatus) => void;
  setScore: (score: number) => void;
  incrementScore: (amount: number) => void;
  resetGame: () => void;
}
