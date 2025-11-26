
import React, { useLayoutEffect, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store';
import { Color } from 'three';

const SEGMENT_LENGTH = 10;
const SEGMENT_COUNT = 20;

export const Ground: React.FC<{ playerZ: number }> = ({ playerZ }) => {
  // We render a grid of segments. 
  // Simple visual trick: Just a large repeating texture is easier, 
  // but for "Pits", we need actual geometry segments that we can hide.
  
  // Calculate which segment index the player is on
  const currentIndex = Math.floor(-playerZ / SEGMENT_LENGTH);

  return (
    <group position={[0, -0.1, 0]}>
      <gridHelper args={[100, 100, 0x444444, 0x222222]} position={[0, 0.1, playerZ - 20]} />
      {/* 
        For a true "Pit" effect, we would toggle visibility of segments.
        However, to save performance in React, we keep a large floor 
        and just place "Black Planes" for pits on top, 
        or we assume the Spawner handles the visual "Hole".
        
        Given the prompt asks for "implement ground pieces", let's stick to a simpler infinite plane
        visual for the base, and let Pits be visual objects handled in Obstacle.tsx 
        that look like holes (black cylinder/box with depth).
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, playerZ - 50]} receiveShadow>
        <planeGeometry args={[20, 200]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
    </group>
  );
};
