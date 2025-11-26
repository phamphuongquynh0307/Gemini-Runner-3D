
import React from 'react';
import { Sparkles } from '@react-three/drei';

export const HitEffect: React.FC = () => {
  return (
    <Sparkles count={80} scale={4} size={6} speed={0.4} opacity={1} color="#ff3333" />
  );
};
