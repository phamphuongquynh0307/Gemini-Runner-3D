
import React from 'react';

export const Ground: React.FC<{ playerZ: number }> = ({ playerZ }) => {
  return (
    <group position={[0, -0.1, 0]}>
      
      {/* 1. Nền đất sâu bên dưới (Deep Ground / Fog Floor) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, playerZ - 50]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      {/* 2. Nền phụ bao quanh (Side Ground) - Tạo cảm giác mặt đất rộng */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, playerZ - 50]} receiveShadow>
        <planeGeometry args={[100, 200]} />
        <meshStandardMaterial color="#111111" roughness={0.9} />
      </mesh>

      {/* 3. Đường chạy chính (Main Track) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, playerZ - 50]} receiveShadow>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Grid lines trang trí kiểu Cyberpunk/Sci-fi nhẹ */}
      <gridHelper args={[100, 100, 0x333333, 0x111111]} position={[0, 0.01, playerZ - 20]} />
    </group>
  );
};
