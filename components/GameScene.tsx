import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';
import { useGameStore } from '../store';
import { GameStatus, ObstacleData } from '../types';
import { audioService } from '../services/audioService';

// Constants
const PLAYER_SPEED = 5; // m/s
const LANE_WIDTH = 2; // meters between lanes
const SPAWN_INTERVAL = 1.5; // seconds
const SPAWN_DISTANCE = 20; // meters ahead
const PLAYER_SIZE = 1;
const SCORE_TICK = 0.1; // seconds per point

export const GameScene: React.FC = () => {
  const { status, setStatus, incrementScore, resetGame } = useGameStore();
  const playerRef = useRef<Mesh>(null);
  const cameraRef = useRef<Vector3>(new Vector3(0, 3, 5));
  
  // Game State Refs (avoiding re-renders for high freq logic)
  const gameStateRef = useRef({
    distance: 0,
    lastSpawnTime: 0,
    timeSinceLastScore: 0,
    targetLaneX: 0, // -2, 0, or 2
    obstacles: [] as ObstacleData[]
  });

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useGameStore.getState().status !== GameStatus.PLAYING) return;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        gameStateRef.current.targetLaneX = Math.max(gameStateRef.current.targetLaneX - LANE_WIDTH, -LANE_WIDTH);
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        gameStateRef.current.targetLaneX = Math.min(gameStateRef.current.targetLaneX + LANE_WIDTH, LANE_WIDTH);
      }
    };

    // Simple touch/swipe detection
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (useGameStore.getState().status !== GameStatus.PLAYING) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      
      if (Math.abs(diff) > 50) { // Threshold
        if (diff > 0) { // Swipe Left
           gameStateRef.current.targetLaneX = Math.max(gameStateRef.current.targetLaneX - LANE_WIDTH, -LANE_WIDTH);
        } else { // Swipe Right
           gameStateRef.current.targetLaneX = Math.min(gameStateRef.current.targetLaneX + LANE_WIDTH, LANE_WIDTH);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Reset logic when game restarts
  useEffect(() => {
    if (status === GameStatus.IDLE) {
      if (playerRef.current) {
        playerRef.current.position.set(0, 0.5, 0);
      }
      gameStateRef.current = {
        distance: 0,
        lastSpawnTime: 0,
        timeSinceLastScore: 0,
        targetLaneX: 0,
        obstacles: []
      };
      useGameStore.getState().setScore(0);
    }
  }, [status]);

  const { camera } = useThree();

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const game = gameStateRef.current;
    
    // 1. Move Player Forward
    game.distance += PLAYER_SPEED * delta;
    const currentZ = -game.distance;

    // 2. Smooth Lane Switching (Lerp)
    if (playerRef.current) {
      playerRef.current.position.z = currentZ;
      // Simple lerp for smooth x movement
      playerRef.current.position.x += (game.targetLaneX - playerRef.current.position.x) * 10 * delta;
    }

    // 3. Camera Follow
    const camTargetZ = currentZ + 5; // Camera 5m behind
    const camTargetY = 3; // Camera 3m up
    // Smooth camera follow
    camera.position.z = camTargetZ;
    camera.position.y = camTargetY;
    camera.position.x = playerRef.current?.position.x ? playerRef.current.position.x * 0.3 : 0; // Slight tilt
    camera.lookAt(0, 0, currentZ - 10); // Look ahead

    // 4. Scoring
    game.timeSinceLastScore += delta;
    if (game.timeSinceLastScore >= SCORE_TICK) {
      incrementScore(1);
      game.timeSinceLastScore = 0;
    }

    // 5. Spawning Obstacles
    const elapsedTime = state.clock.getElapsedTime();
    if (elapsedTime > game.lastSpawnTime + SPAWN_INTERVAL) {
      game.lastSpawnTime = elapsedTime;
      
      // Random lane: -2, 0, or 2
      const laneIndex = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const spawnX = laneIndex * LANE_WIDTH;
      const height = 1 + Math.random() * 2; // 1 to 3 meters high
      
      const newObstacle: ObstacleData = {
        id: Math.random().toString(36).substr(2, 9),
        x: spawnX,
        z: currentZ - SPAWN_DISTANCE,
        height: height,
        width: 1,
        depth: 1
      };
      
      game.obstacles.push(newObstacle);
    }

    // 6. Cleanup & Collision Detection
    // We filter obstacle list in place for performance, though creating new array is safer in React usually.
    // For 60fps game loop, mutating ref array is preferred.
    for (let i = game.obstacles.length - 1; i >= 0; i--) {
      const obs = game.obstacles[i];
      
      // Cleanup if behind camera
      if (obs.z > currentZ + 5) {
        game.obstacles.splice(i, 1);
        continue;
      }

      // Simple AABB Collision
      // Player is 1x1x1. Obstacle is 1 x H x 1.
      // Check X overlap
      const pX = playerRef.current?.position.x || 0;
      const xOverlap = Math.abs(pX - obs.x) < 0.9; // 0.9 allowance so we don't hit edge cases too hard
      
      // Check Z overlap
      const zOverlap = Math.abs(currentZ - obs.z) < 0.9;

      if (xOverlap && zOverlap) {
        audioService.playCrash();
        setStatus(GameStatus.GAME_OVER);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* Infinite Ground Illusion: A long plane that moves with player but snaps back? 
          Or just a really long plane that we move the texture on? 
          Simplest: Large plane moving with player on Z, with grid helper. 
      */}
      <mesh position={[0, -0.5, (playerRef.current?.position.z || 0) - 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 200]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      {/* Grid Helper to give sense of speed */}
      <gridHelper 
        position={[0, -0.49, (playerRef.current?.position.z || 0) - 20]} 
        args={[100, 200, 50, 50]} 
        rotation={[0, 0, 0]} 
      />

      {/* Player */}
      <mesh ref={playerRef} position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#00ffcc" roughness={0.1} />
      </mesh>

      {/* Obstacles Render */}
      {gameStateRef.current.obstacles.map((obs) => (
        <mesh key={obs.id} position={[obs.x, obs.height / 2, obs.z]} castShadow>
          <boxGeometry args={[obs.width, obs.height, obs.depth]} />
          <meshStandardMaterial color="#ff4444" />
        </mesh>
      ))}
    </>
  );
};
