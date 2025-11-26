
import { LevelConfig } from '../types';

export const levelConfig: LevelConfig = {
  "lanes": [-2, 0, 2],
  "spawnInterval": 1.2,
  "speed": 8,
  "waves": [
    {"time": 5, "pattern": [{"type":"low","lane":0}]},
    {"time": 10, "pattern": [{"type":"high","lane":-1}, {"type":"low","lane":1}]},
    {"time": 20, "pattern": [{"type":"wide","lane":0}]},
    {"time": 30, "pattern": [{"type":"pit","lane":0}, {"type":"wall","lane":1}]}
  ],
  "obstacleWeights": {
    "low": 0.35,
    "high": 0.25,
    "wide": 0.15,
    "pit": 0.15,
    "wall": 0.1
  }
};
