'use client'

/**
 * Cinematic 3D account showcase.
 *
 * Not a carousel of UI panels — a product stage. The active account is
 * presented like a flagship card launch: it dominates the frame, side
 * cards recede deep into the scene as teasers, and a holographic
 * platform, floating particles, atmospheric haze and a three-point
 * lighting rig keep the whole environment alive.
 *
 * Business logic (drag, momentum, snapping, deep links) is preserved.
 */

import { AccountObject } from '@/src/shared/three/account-objects'
import { RoundedBox, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { memo, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Group, MeshPhysicalMaterial, MeshStandardMaterial, PointLight } from 'three'

export interface CarouselCardData {
  id: string
  institution: string
  name: string
  balanceLabel: string
  balanceCaption: string
  maskedNumber?: string
  isPrimary?: boolean
  /** Account type — drives the glossy 3D emblem on the card face. */
  iconType: 'bank' | 'credit-card' | 'debit-card' | 'wallet' | 'cash' | 'investment'
  theme: { base: string; glow: string; accent: string }
}

/* Composition constants — depth-first staging. */
const SIDE_X = 1.98 // lateral spacing for neighbours (center card overlaps them)
const SIDE_Z = 2.3 // how fast cards recede into depth
const SIDE_TILT = 0.42 // natural rotation toward the viewer (~24°)

interface CarouselState {
  offset: number
  target: number
  dragging: boolean
  velocity: number
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

const AccountCard = memo(function AccountCard({
  card,
  index,
  state,
}: {
  card: CarouselCardData
  index: number
  state: React.MutableRefObject<CarouselState>
}) {
  const group = useRef<Group>(null)
  const bodyMat = useRef<MeshPhysicalMaterial>(null)
  const rimMat = useRef<MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = clock.elapsedTime
    const rel = index - state.current.offset
    const abs = Math.abs(rel)
    const clamped = THREE.MathUtils.clamp(rel, -1.6, 1.6)
    // 1 centered → 0 one step away — drives hero-only breathing.
    const centeredness = Math.max(0, 1 - abs)

    /* Deep staging: X + Z + scale + perspective. Sides hide ~50%. */
    g.position.x = clamped * SIDE_X * (1 - abs * 0.06)
    g.position.z = -abs * SIDE_Z
    g.position.y =
      -abs * 0.16 +
      Math.sin(t * 1.05 + index * 0.8) * 0.05 * centeredness + // hero breathes
      Math.sin(t * 0.55 + index * 1.7) * 0.02 * (1 - centeredness) // sides sway
    g.rotation.y = -clamped * SIDE_TILT
    g.rotation.z = Math.sin(t * 0.6 + index) * 0.012
    g.scale.setScalar(Math.max(0.66, 1 - abs * 0.32))

    if (bodyMat.current) {
      bodyMat.current.opacity = Math.max(0.12, 1 - abs * 0.66)
      bodyMat.current.emissiveIntensity =
        Math.max(0.05, 0.3 - abs * 0.22) + Math.sin(t * 1.5) * 0.045 * centeredness
    }
    if (rimMat.current) {
      rimMat.current.opacity = Math.max(0.04, 0.2 - abs * 0.14)
    }
  })

  return (
    <group ref={group}>
      {/* Edge-light rim — catches light around the whole silhouette */}
      <RoundedBox args={[2.36, 3.26, 0.13]} radius={0.17} smoothness={4}>
        <meshStandardMaterial
          ref={rimMat}
          color={card.theme.glow}
          emissive={card.theme.glow}
          emissiveIntensity={0.85}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </RoundedBox>

      {/* Card body — thick, physical, clearcoat glass-like response */}
      <RoundedBox args={[2.3, 3.2, 0.16]} radius={0.16} smoothness={5}>
        <meshPhysicalMaterial
          ref={bodyMat}
          color="#2b2b32"
          emissive={card.theme.base}
          emissiveIntensity={0.3}
          metalness={0.62}
          roughness={0.26}
          clearcoat={1}
          clearcoatRoughness={0.18}
          transparent
        />
      </RoundedBox>

      {/* Diagonal glass sheen */}
      <mesh position={[-0.42, 0.95, 0.085]} rotation={[0, 0, 0.52]}>
        <planeGeometry args={[3.1, 1.05]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          metalness={0.1}
          roughness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Edge light strips */}
      <mesh position={[0, 1.56, 0.09]}>
        <boxGeometry args={[2.02, 0.02, 0.02]} />
        <meshStandardMaterial color={card.theme.glow} emissive={card.theme.glow} emissiveIntensity={1.7} />
      </mesh>
      <mesh position={[0, -1.56, 0.09]}>
        <boxGeometry args={[1.8, 0.014, 0.014]} />
        <meshStandardMaterial
          color={card.theme.glow}
          emissive={card.theme.glow}
          emissiveIntensity={0.75}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Embossed emblem tile with the glossy 3D account object */}
      <RoundedBox args={[0.52, 0.52, 0.07]} radius={0.13} smoothness={4} position={[-0.76, 1.1, 0.1]}>
        <meshPhysicalMaterial
          color={card.theme.base}
          emissive={card.theme.glow}
          emissiveIntensity={0.55}
          metalness={0.55}
          roughness={0.25}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </RoundedBox>
      <group position={[-0.76, 1.1, 0.2]} scale={0.19}>
        <AccountObject type={card.iconType} scale={1} />
      </group>

      {/* Metallic chip */}
      <RoundedBox args={[0.37, 0.28, 0.05]} radius={0.055} smoothness={3} position={[0.8, 1.1, 0.1]}>
        <meshPhysicalMaterial
          color="#d8b26a"
          emissive="#8a6a2f"
          emissiveIntensity={0.25}
          metalness={0.95}
          roughness={0.22}
          clearcoat={0.5}
        />
      </RoundedBox>
      <mesh position={[0.8, 1.1, 0.13]}>
        <boxGeometry args={[0.37, 0.02, 0.012]} />
        <meshStandardMaterial color="#8a6a2f" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Face typography — integrated into the material stack */}
      <Text
        position={[-0.4, 1.19, 0.1]}
        fontSize={0.17}
        color="#f5f3ff"
        anchorX="left"
        anchorY="middle"
        maxWidth={1.15}
      >
        {card.institution}
      </Text>
      <Text position={[-0.4, 0.98, 0.1]} fontSize={0.105} color="#9d97b5" anchorX="left" anchorY="middle">
        {card.name}
      </Text>

      {card.maskedNumber && (
        <Text position={[0, 0.44, 0.1]} fontSize={0.14} letterSpacing={0.12} color="#8b85a3" anchorX="center" anchorY="middle">
          {card.maskedNumber}
        </Text>
      )}

      <Text position={[0, -0.1, 0.1]} fontSize={0.34} color="#ffffff" anchorX="center" anchorY="middle">
        {card.balanceLabel}
      </Text>
      <Text position={[0, -0.44, 0.1]} fontSize={0.105} color="#9d97b5" anchorX="center" anchorY="middle">
        {card.balanceCaption}
      </Text>

      {/* Embedded primary badge */}
      {card.isPrimary && (
        <group position={[0, -1.06, 0.09]}>
          <RoundedBox args={[1.2, 0.32, 0.05]} radius={0.14} smoothness={4}>
            <meshPhysicalMaterial
              color={card.theme.base}
              emissive={card.theme.glow}
              emissiveIntensity={0.6}
              metalness={0.4}
              roughness={0.3}
              clearcoat={0.7}
              transparent
              opacity={0.95}
            />
          </RoundedBox>
          <Text position={[0, 0, 0.05]} fontSize={0.105} color="#ffffff" anchorX="center" anchorY="middle">
            Primary Account
          </Text>
        </group>
      )}
    </group>
  )
})

/* ------------------------------------------------------------------ */
/* Holographic platform — concentric energy rings + radial under-light */
/* ------------------------------------------------------------------ */

function Platform({ cards, state }: { cards: CarouselCardData[]; state: React.MutableRefObject<CarouselState> }) {
  const ring1 = useRef<MeshStandardMaterial>(null)
  const ring2 = useRef<MeshStandardMaterial>(null)
  const ring3 = useRef<MeshStandardMaterial>(null)
  const glowDisc = useRef<MeshStandardMaterial>(null)
  const spin1 = useRef<Group>(null)
  const spin2 = useRef<Group>(null)
  const light = useRef<PointLight>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const active = Math.round(state.current.offset)
    const theme = cards[Math.max(0, Math.min(cards.length - 1, active))]?.theme
    const pulse = 0.75 + Math.sin(t * 1.6) * 0.25

    if (theme) {
      for (const mat of [ring1.current, ring2.current, ring3.current, glowDisc.current]) {
        if (mat) {
          mat.emissive.set(theme.glow)
          mat.color.set(theme.glow)
        }
      }
      if (light.current) light.current.color.set(theme.glow)
    }
    if (ring1.current) ring1.current.opacity = 0.4 + pulse * 0.25
    if (ring2.current) ring2.current.opacity = 0.2 + pulse * 0.15
    if (ring3.current) ring3.current.opacity = 0.1 + pulse * 0.08
    if (glowDisc.current) glowDisc.current.opacity = 0.1 + pulse * 0.07
    if (light.current) light.current.intensity = 5 + pulse * 2.5
    if (spin1.current) spin1.current.rotation.z = t * 0.14
    if (spin2.current) spin2.current.rotation.z = -t * 0.1
  })

  return (
    <group position={[0, -2.02, 0]}>
      {/* Soft under-light — in front of the stage so it never bleeds through cards */}
      <pointLight ref={light} position={[0, 0.3, 1.2]} intensity={6} distance={4} />

      {/* Solid stage disc — clearcoat glass feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshPhysicalMaterial
          color="#26262c"
          metalness={0.55}
          roughness={0.4}
          clearcoat={0.7}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* Radial energy glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[1.65, 48]} />
        <meshStandardMaterial
          ref={glowDisc}
          transparent
          opacity={0.14}
          emissiveIntensity={1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Rotating energy rings */}
      <group ref={spin1}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.22, 1.34, 64]} />
          <meshStandardMaterial
            ref={ring1}
            transparent
            opacity={0.6}
            emissiveIntensity={1.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group ref={spin2}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.92, 0.99, 56]} />
          <meshStandardMaterial
            ref={ring2}
            transparent
            opacity={0.32}
            emissiveIntensity={1.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.52, 1.57, 64]} />
        <meshStandardMaterial
          ref={ring3}
          transparent
          opacity={0.14}
          emissiveIntensity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Atmosphere — drifting particles + depth haze that follows the theme */
/* ------------------------------------------------------------------ */

const Atmosphere = memo(function Atmosphere({ cards, state }: { cards: CarouselCardData[]; state: React.MutableRefObject<CarouselState> }) {
  const points = useRef<THREE.Points>(null)
  const pointsMat = useRef<THREE.PointsMaterial>(null)

  const positions = useMemo(() => {
    const count = 45
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8
      arr[i * 3 + 1] = -1.8 + Math.random() * 4.4
      arr[i * 3 + 2] = -3.2 + Math.random() * 3.6
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime

    if (points.current) {
      points.current.rotation.y = t * 0.02
      points.current.position.y = Math.sin(t * 0.3) * 0.12
    }
    if (pointsMat.current) pointsMat.current.opacity = 0.35 + Math.sin(t * 0.9) * 0.15
  })

  return (
    <group>
      {/* Floating particles */}
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={pointsMat}
          size={0.028}
          color="#b9a8ff"
          transparent
          opacity={0.45}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
})

/* ------------------------------------------------------------------ */
/* Motion rig — heavy, luxurious spring                                */
/* ------------------------------------------------------------------ */

const Rig = memo(function Rig({
  state,
  onSettled,
}: {
  state: React.MutableRefObject<CarouselState>
  onSettled: (index: number) => void
}) {
  const lastReported = useRef(-1)

  useFrame((_, delta) => {
    const s = state.current
    if (!s.dragging) {
      // Heavier glide than a snappy UI spring — cards coast into place.
      const diff = s.target - s.offset
      s.velocity += diff * 24 * delta
      s.velocity *= Math.exp(-6.4 * delta)
      s.offset += s.velocity * delta

      if (Math.abs(diff) < 0.002 && Math.abs(s.velocity) < 0.01) {
        s.offset = s.target
        s.velocity = 0
        if (lastReported.current !== s.target) {
          lastReported.current = s.target
          onSettled(s.target)
        }
      }
    }
  })

  return null
})

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export default function AccountCarouselScene({
  cards,
  onActiveChange,
  requestedIndex = 0,
}: {
  cards: CarouselCardData[]
  onActiveChange: (index: number) => void
  /** Externally requested card (deep link, dot tap) — glides to it. */
  requestedIndex?: number
}) {
  const state = useRef<CarouselState>({ offset: 0, target: 0, dragging: false, velocity: 0 })
  const drag = useRef({ startX: 0, startOffset: 0, lastX: 0, lastT: 0, pxVelocity: 0 })

  // Cap DPR on smaller screens — the biggest single lever for first-paint cost.
  const dpr = useMemo<[number, number]>(
    () => (typeof window !== 'undefined' && window.innerWidth < 640 ? [1, 1] : [1, 1.5]),
    [],
  )

  const clampIndex = (i: number) => Math.max(0, Math.min(cards.length - 1, i))

  // Reset when the card list changes (category filter).
  const ids = useMemo(() => cards.map((c) => c.id).join(','), [cards])
  const firstRender = useRef(true)
  useEffect(() => {
    const initial = clampIndex(requestedIndex)
    state.current.offset = initial
    state.current.target = initial
    state.current.velocity = 0
    onActiveChange(initial)
    firstRender.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, onActiveChange])

  // External requests (deep link / pagination dots) glide the stage.
  useEffect(() => {
    if (firstRender.current) return
    state.current.target = clampIndex(requestedIndex)
    state.current.velocity = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedIndex])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ; (e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    state.current.dragging = true
    drag.current = {
      startX: e.clientX,
      startOffset: state.current.offset,
      lastX: e.clientX,
      lastT: performance.now(),
      pxVelocity: 0,
    }
  }

  // Cleanup pointer capture on unmount
  useEffect(() => {
    const currentState = state.current
    return () => {
      if (currentState.dragging) {
        currentState.dragging = false
      }
    }
  }, [])

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!state.current.dragging) return
    const width = (e.currentTarget as HTMLElement).clientWidth || 360
    const dx = e.clientX - drag.current.startX
    const raw = drag.current.startOffset - (dx / width) * 2.0
    const min = 0
    const max = cards.length - 1
    state.current.offset =
      raw < min ? min + (raw - min) * 0.25 : raw > max ? max + (raw - max) * 0.25 : raw

    const now = performance.now()
    const dt = now - drag.current.lastT
    if (dt > 0) {
      drag.current.pxVelocity = (e.clientX - drag.current.lastX) / dt
      drag.current.lastX = e.clientX
      drag.current.lastT = now
    }
  }

  const endDrag = () => {
    if (!state.current.dragging) return
    state.current.dragging = false
    // Momentum: a deliberate flick carries to the next card.
    const flick = drag.current.pxVelocity
    let target = Math.round(state.current.offset)
    if (Math.abs(flick) > 0.3) {
      target = flick < 0 ? Math.ceil(state.current.offset) : Math.floor(state.current.offset)
    }
    state.current.target = clampIndex(target)
    state.current.velocity = 0
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      state.current.target = clampIndex(state.current.target + 1)
    } else if (e.key === 'ArrowLeft') {
      state.current.target = clampIndex(state.current.target - 1)
    }
  }

  return (
    <div
      role="listbox"
      aria-label="Account carousel — swipe or use arrow keys to change account"
      tabIndex={0}
      className="h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-ring"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0.6, 4.6], fov: 33 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        onCreated={({ camera }) => camera.lookAt(0, -0.15, 0)}
      >
        {/* Three-point lighting + ambient wash */}
        <ambientLight intensity={0.4} />
        <pointLight position={[4.5, 4, 5]} intensity={14} color="#ffffff" /> {/* key */}
        <pointLight position={[-4.5, 0.6, 3]} intensity={6} color="#8b6cff" /> {/* fill */}
        <pointLight position={[0, 2.5, -4]} intensity={9} color="#7c5cff" /> {/* rim */}

        <Rig state={state} onSettled={onActiveChange} />
        <Atmosphere cards={cards} state={state} />
        {/* Stage scaled so the hero card dominates without clipping */}
        <group scale={0.62} position={[0, 0.05, 0]}>
          <Platform cards={cards} state={state} />
          {/* Only render cards within visible range to improve performance */}
          {cards.map((card, i) => {
            const isVisible = Math.abs(i - state.current.offset) < 2.5
            return isVisible ? (
              <AccountCard key={card.id} card={card} index={i} state={state} />
            ) : null
          })}
        </group>
      </Canvas>
    </div>
  )
}