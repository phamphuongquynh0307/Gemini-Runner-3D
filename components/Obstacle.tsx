
import React from 'react';
import { ObstacleData } from '../types';

interface Props {
  data: ObstacleData;
}

export const Obstacle: React.FC<Props> = ({ data }) => {
  const { type, width, height, depth, y } = data;

  // Visuals based on type
  if (type === 'pit') {
    return (
      <group position={[data.lane * 2, 0.05, data.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Depth illusion */}
        <mesh position={[0, -2, 0]}>
           <boxGeometry args={[width, 4, depth]} />
           <meshBasicMaterial color="#000000" />
        </mesh>
      </group>
    );
  }

  const color = 
    type === 'high' ? '#ffaa00' : 
    type === 'wide' ? '#aa00ff' : 
    type === 'wall' ? '#ff3333' : '#00ffaa';

  return (
    <group position={[data.lane * 2, y + height / 2, data.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Label for required action (optional debug/assist) */}
    </group>
  );
};
