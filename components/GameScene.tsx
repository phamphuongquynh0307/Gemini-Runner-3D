import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Sparkles } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import { Vector3, MathUtils, LoopOnce, Group, AnimationAction } from 'three';
import { useGameStore } from '../store';
import { GameStatus, ObstacleData } from '../types';
import { audioService } from '../services/audioService';

// --- Constants ---
const PLAYER_SPEED = 5;
const LANE_WIDTH = 2;
const SPAWN_INTERVAL = 1.5;
const SPAWN_DISTANCE = 30;

// --- Assets ---
const MODEL_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

export const GameScene: React.FC = () => {
  const { status, setStatus, incrementScore } = useGameStore();
  
  // Game Refs
  const playerGroupRef = useRef<Group>(null);
  const obstaclesRef = useRef<ObstacleData[]>([]); // For physics logic
  
  // React State for rendering obstacles
  const [renderedObstacles, setRenderedObstacles] = useState<ObstacleData[]>([]);

  const gameStateRef = useRef({
    distance: 0,
    laneIndex: 0, // -1, 0, 1
    lastSpawnTime: 0,
    timeSinceLastScore: 0,
    isDead: false
  });

  // Load Model
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, playerGroupRef);

  // Spring for smooth lane switching
  const [springs, api] = useSpring(() => ({
    position: [0, 0, 0],
    rotation: [0, Math.PI, 0],
    config: { mass: 1, tension: 170, friction: 26 }
  }));

  // Camera Shake State
  const [shake, setShake] = useState(0);

  // --- Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      const game = gameStateRef.current;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        if (game.laneIndex > -1) {
          game.laneIndex--;
          updatePlayerPosition();
        }
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        if (game.laneIndex < 1) {
          game.laneIndex++;
          updatePlayerPosition();
        }
      }
    };

    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX; };
    const handleTouchEnd = (e: TouchEvent) => {
      if (status !== GameStatus.PLAYING) return;
      const diff = touchStartX - e.changedTouches[0].clientX;
      const game = gameStateRef.current;
      
      if (Math.abs(diff) > 30) {
        if (diff > 0 && game.laneIndex > -1) {
           game.laneIndex--;
           updatePlayerPosition();
        } else if (diff < 0 && game.laneIndex < 1) {
           game.laneIndex++;
           updatePlayerPosition();
        }
      }
    };

    const updatePlayerPosition = () => {
      const x = gameStateRef.current.laneIndex * LANE_WIDTH;
      // Tilt logic
      const tilt = -gameStateRef.current.laneIndex * 0.1;
      
      api.start({
        position: [x, 0, 0],
        rotation: [0, Math.PI, tilt]
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, api]);

  // --- Animation State Machine ---
  useEffect(() => {
    const playAnim = (name: string, timeScale = 1) => {
      if (!actions) return;
      
      // Fade out all actions
      Object.values(actions).forEach(a => (a as AnimationAction | null)?.fadeOut(0.2));
      
      const action = actions[name];
      if (action) {
        action.reset().fadeIn(0.2).play();
        action.timeScale = timeScale;
        if (name === 'Death') action.setLoop(LoopOnce, 1);
      }
    };

    if (status === GameStatus.IDLE) {
      playAnim('Idle');
    } else if (status === GameStatus.PLAYING) {
      playAnim('Running');
    } else if (status === GameStatus.GAME_OVER) {
      playAnim('Death');
      setShake(1);
    }
  }, [status, actions]);

  // --- Reset Logic ---
  useEffect(() => {
    if (status === GameStatus.IDLE) {
      gameStateRef.current = {
        distance: 0,
        laneIndex: 0,
        lastSpawnTime: 0,
        timeSinceLastScore: 0,
        isDead: false
      };
      obstaclesRef.current = [];
      setRenderedObstacles([]);
      
      // Reset Spring
      api.start({ position: [0, 0, 0], rotation: [0, Math.PI, 0] });
      setShake(0);
      if (playerGroupRef.current) playerGroupRef.current.position.set(0, 0, 0);
    }
  }, [status, api]);

  // --- Game Loop ---
  useFrame((state, delta) => {
    const game = gameStateRef.current;
    
    // Camera Shake Decay
    if (shake > 0) setShake(s => MathUtils.lerp(s, 0, 0.1));

    if (status === GameStatus.PLAYING) {
      // 1. Move Forward
      game.distance += PLAYER_SPEED * delta;
      
      if (playerGroupRef.current) {
        playerGroupRef.current.position.z = -game.distance;
      }

      // 2. Spawn Obstacles
      if (state.clock.elapsedTime > game.lastSpawnTime + SPAWN_INTERVAL) {
        game.lastSpawnTime = state.clock.elapsedTime;
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const height = 1 + Math.random() * 2;
        
        const newObs: ObstacleData = {
          id: Math.random().toString(),
          x: lane * LANE_WIDTH,
          z: -game.distance - SPAWN_DISTANCE,
          height: height,
          width: 0.8,
          depth: 0.8
        };
        
        obstaclesRef.current.push(newObs);
        setRenderedObstacles([...obstaclesRef.current]); // Sync to state for rendering
      }

      // 3. Score
      game.timeSinceLastScore += delta;
      if (game.timeSinceLastScore > 0.1) {
        incrementScore(1);
        game.timeSinceLastScore = 0;
      }
    }

    // 4. Camera Follow & Shake
    const camZ = -game.distance + 6;
    const camY = 3;
    const shakeOffset = new Vector3(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    );
    
    state.camera.position.lerp(new Vector3(0, camY, camZ).add(shakeOffset), 0.1);
    state.camera.lookAt(0, 1, -game.distance - 10);

    // 5. Collision & Cleanup
    const playerZ = -game.distance;
    const playerX = springs.position.get()[0];
    
    let needsUpdate = false;

    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      
      // Remove passed obstacles
      if (obs.z > playerZ + 5) {
        obstaclesRef.current.splice(i, 1);
        needsUpdate = true;
        continue;
      }

      // Check Collision (AABB)
      if (!game.isDead && status === GameStatus.PLAYING) {
        const dx = Math.abs(playerX - obs.x);
        const dz = Math.abs(playerZ - obs.z);
        
        if (dx < 0.7 && dz < 0.7) {
          game.isDead = true;
          setStatus(GameStatus.GAME_OVER);
          audioService.playCrash();
        }
      }
    }
    
    if (needsUpdate) {
      setRenderedObstacles([...obstaclesRef.current]);
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[20, 20, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      
      {/* Infinite Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (playerGroupRef.current?.position.z || 0) - 20]} receiveShadow>
        <planeGeometry args={[100, 200]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      
      <gridHelper 
        position={[0, 0.01, (playerGroupRef.current?.position.z || 0) - 20]} 
        args={[100, 200, 0x444444, 0x222222]} 
      />

      {/* Player Character */}
      {/* Cast springs to any to resolve type mismatch between SpringValue<number[]> and Vector3 expected by a.group */}
      <a.group ref={playerGroupRef} {...(springs as any)} dispose={null}>
         <primitive object={scene} scale={0.5} castShadow />
         {status === GameStatus.GAME_OVER && (
            <Sparkles count={50} scale={3} size={4} speed={0.4} opacity={1} color="#FF5555" />
         )}
      </a.group>

      {/* Obstacles */}
      {renderedObstacles.map(obs => (
        <group key={obs.id} position={[obs.x, 0, obs.z]}>
          <mesh position={[0, obs.height / 2, 0]} castShadow>
             <boxGeometry args={[obs.width, obs.height, obs.depth]} />
             <meshStandardMaterial color="#ff0055" emissive="#550000" />
          </mesh>
        </group>
      ))}

      <fog attach="fog" args={['#111', 10, 60]} />
    </>
  );
};