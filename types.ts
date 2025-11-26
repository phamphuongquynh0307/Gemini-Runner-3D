
export const GameStatus = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
} as const;
export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export const PlayerAction = {
  IDLE: 'IDLE',
  RUN: 'RUN',
  JUMP: 'JUMP',
  SLIDE: 'SLIDE',
  ROLL: 'ROLL',
  HIT: 'HIT'
} as const;
export type PlayerAction = typeof PlayerAction[keyof typeof PlayerAction];

export type ObstacleType = 'low' | 'high' | 'wide' | 'pit' | 'wall';

export interface ObstacleConfig {
  type: ObstacleType;
  lane: number; // -1, 0, 1
}

export interface ObstacleData extends ObstacleConfig {
  id: string;
  z: number;
  width: number;
  height: number;
  depth: number;
  y: number; // Vertical position (e.g., high obstacles)
}

export interface LevelWave {
  time: number;
  pattern: ObstacleConfig[];
}

export interface LevelConfig {
  lanes: number[];
  spawnInterval: number;
  speed: number;
  waves: LevelWave[];
  obstacleWeights: Record<ObstacleType, number>;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  speed: number;
  setStatus: (status: GameStatus) => void;
  setScore: (score: number) => void;
  incrementScore: (amount: number) => void;
  resetGame: () => void;
  setSpeed: (speed: number) => void;
}
