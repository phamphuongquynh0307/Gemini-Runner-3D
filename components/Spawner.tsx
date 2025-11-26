
import React, { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { ObstacleData, LevelConfig, ObstacleType } from '../types';
import { levelConfig } from '../data/levelConfig';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  playerZ: number;
  onUpdateObstacles: (obs: ObstacleData[]) => void;
}

export const Spawner: React.FC<Props> = ({ playerZ, onUpdateObstacles }) => {
  const obstacles = useRef<ObstacleData[]>([]);
  const lastSpawnZ = useRef(0);
  const nextWaveTime = useRef(0);
  const gameTime = useRef(0);

  useFrame((state, delta) => {
    gameTime.current += delta;

    // cleanup passed obstacles
    const keep = obstacles.current.filter(o => o.z < playerZ + 10);
    if (keep.length !== obstacles.current.length) {
      obstacles.current = keep;
      onUpdateObstacles(obstacles.current);
    }

    // Spawn logic
    // Distance based spawning combined with time-based patterns
    // We spawn ahead by SPAWN_DISTANCE (e.g. 40m)
    const spawnZ = playerZ - 40;
    
    if (Math.abs(spawnZ - lastSpawnZ.current) > levelConfig.spawnInterval * levelConfig.speed) {
      lastSpawnZ.current = spawnZ;
      
      // Determine Wave or Random
      // Simple random weight logic for endless:
      const type = pickRandomType();
      const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      
      createObstacle(type, lane, spawnZ);
      onUpdateObstacles(obstacles.current);
    }
  });

  const createObstacle = (type: ObstacleType, lane: number, z: number) => {
    let width = 1.5, height = 1, depth = 1, y = 0;

    switch (type) {
      case 'low': height = 0.8; break;
      case 'high': height = 0.8; y = 1.6; break;
      case 'wide': width = 3; height = 0.8; break; // Spans multiple lanes visually
      case 'wall': height = 3; break;
      case 'pit': y = -0.1; height = 0.1; depth = 4; break;
    }

    obstacles.current.push({
      id: uuidv4(),
      type,
      lane,
      z,
      width,
      height,
      depth,
      y
    });
  };

  const pickRandomType = (): ObstacleType => {
    const r = Math.random();
    let acc = 0;
    for (const [key, weight] of Object.entries(levelConfig.obstacleWeights)) {
      acc += weight;
      if (r < acc) return key as ObstacleType;
    }
    return 'low';
  };

  return null;
};
