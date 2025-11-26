
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useGameStore } from '../store';
import { GameStatus, ObstacleData, PlayerAction } from '../types';
import { audioService } from '../services/audioService';
import { checkCollision } from '../utils/collision';
import { levelConfig } from '../data/levelConfig';

// Components
import { Player } from './Player';
import { Spawner } from './Spawner';
import { Obstacle } from './Obstacle';
import { Ground } from './Ground';
import { CameraRig } from './CameraRig';
import { HitEffect } from './Effects';

export const GameScene: React.FC = () => {
  const { status, setStatus, incrementScore, speed, setSpeed, resetGame } = useGameStore();
  
  const playerRef = useRef<Group>(null);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  
  // Game State Refs (avoid React renders for physics loop)
  const gameState = useRef({
    distance: 0,
    playerBox: { x: 0, y: 0, z: 0, w: 1, h: 1, d: 1 },
    isDead: false
  });

  // Init
  useEffect(() => {
    if (status === GameStatus.IDLE) {
      gameState.current = { distance: 0, playerBox: {x:0,y:0,z:0,w:1,h:1,d:1}, isDead: false };
      setSpeed(levelConfig.speed);
      if (playerRef.current) playerRef.current.position.set(0,0,0);
    }
  }, [status, setSpeed]);

  // Main Loop
  useFrame((state, delta) => {
    if (status === GameStatus.PLAYING && !gameState.current.isDead) {
      // Move Player Forward in World (Virtual)
      gameState.current.distance += speed * delta;
      
      // Sync ThreeJS object Z
      if (playerRef.current) {
        playerRef.current.position.z = -gameState.current.distance;
      }

      // Update Score
      incrementScore(Math.ceil(delta * 10));

      // Collision Detection
      const pBox = {
        ...gameState.current.playerBox,
        z: -gameState.current.distance // override physics Z with world Z
      };

      for (const obs of obstacles) {
        // Optimization: only check nearby
        if (Math.abs(obs.z - pBox.z) < 2) {
          // Determine current action (simplified)
          // Ideally Player passes action state up, but we can infer from box height
          // Height < 1.0 implies Sliding/Rolling
          const action = pBox.h < 1.0 ? PlayerAction.SLIDE : PlayerAction.RUN; 
          
          if (checkCollision(pBox, obs, action)) {
            handleCrash();
            break;
          }
        }
      }
    }
  });

  const handleCrash = () => {
    gameState.current.isDead = true;
    setStatus(GameStatus.GAME_OVER);
    audioService.playCrash();
  };

  const handleUpdatePlayerBox = (box: any) => {
    gameState.current.playerBox = box;
  };

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 10]} intensity={1.2} castShadow />
      <fog attach="fog" args={['#111', 10, 70]} />

      <Player 
        ref={playerRef} 
        onUpdateBox={handleUpdatePlayerBox} 
      />

      {/* Render Obstacles */}
      {obstacles.map(obs => <Obstacle key={obs.id} data={obs} />)}

      <Spawner 
        playerZ={-gameState.current.distance} 
        onUpdateObstacles={setObstacles} 
      />
      
      <Ground playerZ={-gameState.current.distance} />
      
      <CameraRig playerZ={-gameState.current.distance} />

      {status === GameStatus.GAME_OVER && (
        <group position={[0, 1, -gameState.current.distance]}>
          <HitEffect />
        </group>
      )}
    </>
  );
};
