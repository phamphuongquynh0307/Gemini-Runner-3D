
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import { useGameStore } from '../store';
import { GameStatus } from '../types';

export const CameraRig: React.FC<{ playerZ: number }> = ({ playerZ }) => {
  const status = useGameStore(s => s.status);
  const shakeRef = useRef(0);
  
  useFrame((state, delta) => {
    // Tweaked offsets:
    // Higher Y (4.5) for better perspective on obstacles
    // Z offset +7 to keep player in view but not blocking
    const targetZ = playerZ + 7; 
    const targetY = 4.5; 
    
    // Add shake if Game Over
    if (status === GameStatus.GAME_OVER && shakeRef.current < 1) {
      shakeRef.current = 1;
    }
    
    // Decay shake
    shakeRef.current = MathUtils.lerp(shakeRef.current, 0, 2 * delta);
    
    const shakeOffset = new Vector3(
      (Math.random() - 0.5) * shakeRef.current,
      (Math.random() - 0.5) * shakeRef.current,
      (Math.random() - 0.5) * shakeRef.current
    );

    const targetPos = new Vector3(0, targetY, targetZ).add(shakeOffset);
    
    // Smooth follow
    state.camera.position.lerp(targetPos, 0.1);
    
    // Look ahead of player (downward angle)
    // Looking at (0, 0, playerZ - 8) gives a good downward track
    state.camera.lookAt(0, 0, playerZ - 8);
  });

  return null;
};
