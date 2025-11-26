
import { ObstacleData, PlayerAction } from '../types';

export const checkCollision = (
  playerBox: { x: number; y: number; z: number; w: number; h: number; d: number },
  obstacle: ObstacleData,
  action: PlayerAction
): boolean => {
  // 1. Simple AABB Check
  const pMinX = playerBox.x - playerBox.w / 2;
  const pMaxX = playerBox.x + playerBox.w / 2;
  const pMinY = playerBox.y;
  const pMaxY = playerBox.y + playerBox.h;
  const pMinZ = playerBox.z - playerBox.d / 2;
  const pMaxZ = playerBox.z + playerBox.d / 2;

  const oMinX = obstacle.lane * 2 - obstacle.width / 2; // Approximate lane X
  const oMaxX = obstacle.lane * 2 + obstacle.width / 2;
  const oMinY = obstacle.y;
  const oMaxY = obstacle.y + obstacle.height;
  const oMinZ = obstacle.z - obstacle.depth / 2;
  const oMaxZ = obstacle.z + obstacle.depth / 2;

  const overlapX = pMinX < oMaxX && pMaxX > oMinX;
  const overlapY = pMinY < oMaxY && pMaxY > oMinY;
  const overlapZ = pMinZ < oMaxZ && pMaxZ > oMinZ;

  if (!overlapX || !overlapZ) return false;

  // 2. Action-specific Logic
  if (obstacle.type === 'pit') {
    // For pits, collision means "falling in", so we check if player is ON GROUND
    // If player is JUMPING (y > 0), they are safe.
    // However, AABB Y check above might fail if player is high up.
    // Logic: If player matches X and Z of pit, AND y is low, they die.
    if (playerBox.y < 0.5) return true; 
    return false;
  }
  
  if (obstacle.type === 'high') {
    // If sliding, height is reduced (handled by playerBox.h passed in)
    // But if we simply overlap Y, we crash.
    // If we are sliding, playerBox.h is ~0.5. obstacle.y is ~1.5. 
    // pMaxY = 0.5. oMinY = 1.5. No overlapY -> Safe.
    if (!overlapY) return false;
  }
  
  if (obstacle.type === 'wide') {
    // Requires Roll. If Rolling, we assume invulnerability to "wide" specific hitboxes 
    // or we check if player is "rolling" state to bypass.
    // For this simple implementation, let's say "Wide" is a low wall you must Roll through (or jump over high).
    // Prompt says: "wide -> roll required".
    if (action === PlayerAction.ROLL) return false;
  }

  // General collision
  if (overlapY) return true;

  return false;
};
