
import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import { LoopOnce, MathUtils, Group } from 'three';
import { useGameStore } from '../store';
import { GameStatus, PlayerAction } from '../types';

const MODEL_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

// Physics Constants
const GRAVITY = -30;
const JUMP_FORCE = 12;
const LANE_WIDTH = 2;
const SLIDE_DURATION = 0.7;
const ROLL_DURATION = 0.6;
const INPUT_BUFFER = 0.15; // seconds

export const Player = React.forwardRef<Group, { onUpdateBox: (box: any) => void }>(({ onUpdateBox }, ref) => {
  const { status } = useGameStore();
  
  // Refs for logic
  const groupRef = useRef<Group>(null);
  const internalRef = (ref as React.MutableRefObject<Group | null>);
  const lastX = useRef(0); // Track previous X for velocity calculation
  
  // State
  const [action, setAction] = useState<PlayerAction>(PlayerAction.IDLE);
  const [lane, setLane] = useState(0); // -1, 0, 1
  
  // Physics State
  const physics = useRef({
    vy: 0,
    y: 0,
    isGrounded: true,
    actionTimer: 0,
    bufferJump: 0
  });

  // Load Model
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, groupRef);

  // Lane Spring
  const { positionX } = useSpring({
    positionX: lane * LANE_WIDTH,
    config: { mass: 1, tension: 180, friction: 24 } // Slightly looser for smoother banking
  });

  // --- Animation Manager ---
  useEffect(() => {
    const fadeDuration = 0.2;
    
    // Map states to animation names in GLTF
    let animName = 'Idle';
    if (status === GameStatus.PLAYING) {
      switch (action) {
        case PlayerAction.RUN: animName = 'Running'; break;
        case PlayerAction.JUMP: animName = 'Jump'; break;
        case PlayerAction.HIT: animName = 'Death'; break;
        case PlayerAction.IDLE: animName = 'Idle'; break;
        default: animName = 'Running'; // Fallback for slide/roll if no clip
      }
    } else if (status === GameStatus.GAME_OVER) {
      animName = 'Death';
    }

    // Play Animation
    const currentAction = actions[animName];
    if (currentAction) {
      currentAction.reset().fadeIn(fadeDuration).play();
      if (animName === 'Death' || animName === 'Jump') {
        currentAction.setLoop(LoopOnce, 1);
        currentAction.clampWhenFinished = true;
      }
    }

    return () => {
      currentAction?.fadeOut(fadeDuration);
    };
  }, [action, status, actions]);

  // --- Input Handling ---
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyA': case 'ArrowLeft': 
          setLane(l => Math.max(l - 1, -1)); break;
        case 'KeyD': case 'ArrowRight': 
          setLane(l => Math.min(l + 1, 1)); break;
        case 'Space': case 'ArrowUp': case 'KeyW':
          handleJump(); break;
        case 'KeyS': case 'ArrowDown':
          handleSlide(); break;
        case 'ShiftLeft': case 'ShiftRight':
          handleRoll(); break;
      }
    };
    
    // Mobile Touch
    let startX = 0;
    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diffX = startX - e.changedTouches[0].clientX;
      const diffY = startY - e.changedTouches[0].clientY;
      
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal
        if (Math.abs(diffX) > 30) {
          if (diffX > 0) setLane(l => Math.max(l - 1, -1));
          else setLane(l => Math.min(l + 1, 1));
        }
      } else {
        // Vertical
        if (Math.abs(diffY) > 30) {
          if (diffY > 0) handleJump(); // Swipe Up
          else {
             handleSlide();
          }
        }
      }
    };

    const handleJump = () => {
      if (physics.current.isGrounded) {
        physics.current.vy = JUMP_FORCE;
        physics.current.isGrounded = false;
        setAction(PlayerAction.JUMP);
      } else {
        physics.current.bufferJump = INPUT_BUFFER; // Input buffering
      }
    };

    const handleSlide = () => {
      if (physics.current.isGrounded) {
        setAction(PlayerAction.SLIDE);
        physics.current.actionTimer = SLIDE_DURATION;
      }
    };

    const handleRoll = () => {
      if (physics.current.isGrounded) {
        setAction(PlayerAction.ROLL);
        physics.current.actionTimer = ROLL_DURATION;
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
  }, [status]);

  // --- Physics Loop ---
  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;
    
    const p = physics.current;
    
    // 1. Gravity & Jump
    p.vy += GRAVITY * delta;
    p.y += p.vy * delta;
    
    // Ground collision
    if (p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      if (!p.isGrounded) {
        p.isGrounded = true;
        // Landed
        if (p.bufferJump > 0) {
           p.vy = JUMP_FORCE;
           p.isGrounded = false;
           p.bufferJump = 0;
           setAction(PlayerAction.JUMP);
        } else if (action === PlayerAction.JUMP) {
           setAction(PlayerAction.RUN);
        }
      }
    } else {
       p.isGrounded = false;
    }
    
    // Buffer decay
    if (p.bufferJump > 0) p.bufferJump -= delta;

    // 2. Action Timers (Slide/Roll)
    if (action === PlayerAction.SLIDE || action === PlayerAction.ROLL) {
      p.actionTimer -= delta;
      if (p.actionTimer <= 0) {
        setAction(PlayerAction.RUN); // Return to run
      }
    }

    // 3. Update Ref Visuals
    if (groupRef.current) {
      // Horizontal (Spring)
      const currentX = positionX.get();
      groupRef.current.position.x = currentX;
      
      // Calculate Banking (Tilt) & Turning
      // Calculate velocity on X axis
      const velocityX = (currentX - lastX.current) / delta;
      lastX.current = currentX;

      // Base Rotation (Facing Forward: Math.PI)
      let targetRotY = Math.PI;
      let targetRotZ = 0;
      let targetRotX = 0;

      // Apply Banking (Lean into the turn)
      // If moving RIGHT (positive X), lean RIGHT (negative Z)
      // Clamp to avoid extreme spins during glitches
      const tiltFactor = 0.15;
      targetRotZ = -MathUtils.clamp(velocityX * tiltFactor, -0.5, 0.5);
      
      // Apply Turn (Face slightly towards direction)
      const turnFactor = 0.1;
      targetRotY = Math.PI - MathUtils.clamp(velocityX * turnFactor, -0.5, 0.5);

      // Roll Rotation Effect override
      if (action === PlayerAction.ROLL) {
        // Spin forward (negative X)
        groupRef.current.rotation.x -= 15 * delta; 
        // Reset others to avoid gimbal lock mess
        groupRef.current.rotation.y = Math.PI;
        groupRef.current.rotation.z = 0;
      } else {
        // Normal Running / Jumping / Sliding
        // Smoothly interpolate current rotations
        groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, 0, 0.2);
        groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.1);
        groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.1);
      }

      // Vertical (Physics)
      groupRef.current.position.y = p.y;
      
      // Slide Scale Effect
      if (action === PlayerAction.SLIDE) {
        groupRef.current.scale.y = MathUtils.lerp(groupRef.current.scale.y, 0.5, 0.2);
      } else {
        groupRef.current.scale.y = MathUtils.lerp(groupRef.current.scale.y, 1, 0.2);
      }
    }
    
    // 4. Report Hitbox
    if (onUpdateBox && groupRef.current) {
      const isSliding = action === PlayerAction.SLIDE;
      const isRolling = action === PlayerAction.ROLL;
      
      onUpdateBox({
        x: positionX.get(),
        y: p.y,
        z: groupRef.current.position.z,
        w: 0.8,
        h: isSliding || isRolling ? 0.8 : 1.8,
        d: 0.8
      });
    }
    
    if (internalRef) internalRef.current = groupRef.current;
  });

  return (
    <a.group ref={groupRef}>
      {/* 
         Primitive wrapper.
         Logic handles rotation on the Group, so Primitive stays 0,0,0 relative to group.
      */}
      <primitive 
        object={scene} 
        scale={0.5} 
        castShadow 
      />
    </a.group>
  );
});
