'use client'

/**
 * Glossy 3D account-type objects — bank temple, credit card, wallet,
 * cash stack, investment growth. Built from real geometry with physical
 * (clearcoat) materials so they read like premium 3D renders, matching
 * the product's original art direction.
 *
 * `AccountObject` is a raw <group> for use INSIDE an existing Canvas
 * (e.g. the accounts carousel). `AccountObjectCanvas` is a standalone
 * viewer used by the Overview accounts preview.
 */

import { ContactShadows, RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { AccountType } from '@/src/types/transaction'

export interface ObjectTheme {
  base: string
  mid: string
  glow: string
  accent: string
}

export const OBJECT_THEMES: Record<AccountType, ObjectTheme> = {
  bank: { base: '#1e3a8a', mid: '#3b82f6', glow: '#60a5fa', accent: '#93c5fd' },
  'credit-card': { base: '#1e40af', mid: '#3b82f6', glow: '#60a5fa', accent: '#93c5fd' },
  'debit-card': { base: '#1e3a8a', mid: '#2563eb', glow: '#3b82f6', accent: '#60a5fa' },
  wallet: { base: '#1e40af', mid: '#3b82f6', glow: '#60a5fa', accent: '#93c5fd' },
  cash: { base: '#1e3a8a', mid: '#2563eb', glow: '#3b82f6', accent: '#60a5fa' },
  investment: { base: '#1e40af', mid: '#3b82f6', glow: '#60a5fa', accent: '#93c5fd' },
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

function Gloss({
  color,
  emissive,
  emissiveIntensity = 0.12,
  metalness = 0.18,
  roughness = 0.5,
}: {
  color: string
  emissive?: string
  emissiveIntensity?: number
  metalness?: number
  roughness?: number
}) {
  return (
    <meshPhysicalMaterial
      color={color}
      emissive={emissive ?? color}
      emissiveIntensity={emissiveIntensity}
      metalness={metalness}
      roughness={roughness}
      clearcoat={0.25}
      clearcoatRoughness={0.48}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Bank temple — stepped podium, colonnade, full-depth gable pediment  */
/* ------------------------------------------------------------------ */

function BankObject({ theme }: { theme: ObjectTheme }) {
  const pediment = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.66, 0)
    shape.lineTo(0.66, 0)
    shape.lineTo(0, 0.36)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.52,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
      steps: 1,
    })
    geo.translate(0, 0, -0.26)
    return geo
  }, [])

  return (
    <group>
      {/* Three-tier stepped podium */}
      <RoundedBox args={[1.6, 0.12, 1.05]} radius={0.03} smoothness={3} position={[0, -0.72, 0]}>
        <Gloss color={theme.base} emissiveIntensity={0.12} />
      </RoundedBox>
      <RoundedBox args={[1.42, 0.12, 0.9]} radius={0.03} smoothness={3} position={[0, -0.6, 0]}>
        <Gloss color={theme.mid} emissiveIntensity={0.14} />
      </RoundedBox>
      <RoundedBox args={[1.24, 0.1, 0.76]} radius={0.03} smoothness={3} position={[0, -0.49, 0]}>
        <Gloss color={theme.mid} emissiveIntensity={0.16} />
      </RoundedBox>

      {/* Colonnade — four fluted columns with capitals */}
      {[-0.42, -0.14, 0.14, 0.42].map((x) => (
        <group key={x} position={[x, 0, 0.24]}>
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.055, 0.062, 0.68, 20]} />
            <Gloss color={theme.accent} emissive={theme.glow} emissiveIntensity={0.22} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.15, 0.05, 0.15]} />
            <Gloss color={theme.mid} emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Shadowed cella behind the columns */}
      <RoundedBox args={[1.05, 0.62, 0.3]} radius={0.02} smoothness={2} position={[0, -0.1, -0.05]}>
        <Gloss color={theme.base} emissiveIntensity={0.1} roughness={0.35} />
      </RoundedBox>
      {/* Glowing doorway */}
      <RoundedBox args={[0.22, 0.42, 0.06]} radius={0.03} smoothness={3} position={[0, -0.16, 0.12]}>
        <meshPhysicalMaterial
          color="#0a0716"
          emissive={theme.glow}
          emissiveIntensity={0.9}
          roughness={0.4}
        />
      </RoundedBox>

      {/* Entablature + gable pediment (real depth) */}
      <RoundedBox args={[1.3, 0.12, 0.72]} radius={0.02} smoothness={2} position={[0, 0.32, 0]}>
        <Gloss color={theme.mid} emissiveIntensity={0.2} />
      </RoundedBox>
      <mesh geometry={pediment} position={[0, 0.38, 0]}>
        <Gloss color={theme.mid} emissive={theme.glow} emissiveIntensity={0.24} />
      </mesh>
      {/* Oculus glow in the pediment */}
      <mesh position={[0, 0.48, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 24]} />
        <meshPhysicalMaterial color={theme.glow} emissive={theme.glow} emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Credit / debit card — glossy tilted card with chip and stripe       */
/* ------------------------------------------------------------------ */

function CardObject({ theme }: { theme: ObjectTheme }) {
  return (
    <group rotation={[0.06, -0.28, -0.14]}>
      <RoundedBox args={[1.5, 0.95, 0.07]} radius={0.1} smoothness={4}>
        <Gloss color={theme.mid} emissive={theme.glow} emissiveIntensity={0.22} />
      </RoundedBox>
      {/* Mag stripe */}
      <mesh position={[0, 0.26, 0.042]}>
        <boxGeometry args={[1.5, 0.14, 0.012]} />
        <Gloss color={theme.base} emissiveIntensity={0.1} roughness={0.35} />
      </mesh>
      {/* Chip */}
      <RoundedBox args={[0.22, 0.17, 0.03]} radius={0.03} smoothness={3} position={[-0.44, 0.02, 0.045]}>
        <meshPhysicalMaterial
          color={theme.accent}
          emissive={theme.accent}
          emissiveIntensity={0.35}
          metalness={0.9}
          roughness={0.2}
          clearcoat={0.6}
        />
      </RoundedBox>
      {/* Number bars */}
      <mesh position={[-0.1, -0.2, 0.042]}>
        <boxGeometry args={[0.85, 0.045, 0.008]} />
        <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} transparent opacity={0.75} />
      </mesh>
      <mesh position={[-0.28, -0.32, 0.042]}>
        <boxGeometry args={[0.5, 0.045, 0.008]} />
        <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} transparent opacity={0.45} />
      </mesh>
      {/* Network dot pair */}
      <mesh position={[0.52, -0.3, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.015, 24]} />
        <meshPhysicalMaterial color={theme.glow} emissive={theme.glow} emissiveIntensity={0.7} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0.62, -0.3, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.015, 24]} />
        <meshPhysicalMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.5} transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Wallet — glossy bifold with open flap and clasp                     */
/* ------------------------------------------------------------------ */

function WalletObject({ theme }: { theme: ObjectTheme }) {
  return (
    <group rotation={[0.04, -0.3, 0]}>
      {/* Body */}
      <RoundedBox args={[1.3, 0.9, 0.3]} radius={0.14} smoothness={4}>
        <Gloss color={theme.mid} emissive={theme.glow} emissiveIntensity={0.2} />
      </RoundedBox>
      {/* Cards peeking out of the top */}
      <RoundedBox args={[0.9, 0.3, 0.05]} radius={0.04} smoothness={3} position={[-0.05, 0.52, -0.05]} rotation={[0, 0, 0.05]}>
        <Gloss color={theme.accent} emissiveIntensity={0.25} />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.3, 0.05]} radius={0.04} smoothness={3} position={[0.08, 0.46, 0.02]} rotation={[0, 0, -0.04]}>
        <Gloss color={theme.glow} emissive={theme.glow} emissiveIntensity={0.35} />
      </RoundedBox>
      {/* Front flap */}
      <RoundedBox args={[1.34, 0.34, 0.34]} radius={0.1} smoothness={4} position={[0, 0.26, 0.02]}>
        <Gloss color={theme.base} emissiveIntensity={0.14} roughness={0.3} />
      </RoundedBox>
      {/* Clasp */}
      <mesh position={[0.38, 0.08, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.04, 24]} />
        <meshPhysicalMaterial
          color={theme.accent}
          emissive={theme.accent}
          emissiveIntensity={0.5}
          metalness={0.85}
          roughness={0.2}
          clearcoat={0.6}
        />
      </mesh>
      <mesh position={[0.38, 0.08, 0.215]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.02, 16]} />
        <meshPhysicalMaterial color="#0a0716" emissive={theme.glow} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Cash stack — fanned glossy bills with a band                        */
/* ------------------------------------------------------------------ */

function CashObject({ theme }: { theme: ObjectTheme }) {
  const bills = [
    { y: -0.16, rot: 0.1, x: -0.04, color: theme.base },
    { y: -0.06, rot: -0.06, x: 0.03, color: theme.mid },
    { y: 0.04, rot: 0.05, x: -0.02, color: theme.mid },
    { y: 0.14, rot: -0.09, x: 0.02, color: theme.glow },
  ]
  return (
    <group rotation={[0.05, -0.24, 0]}>
      {bills.map((bill, i) => (
        <RoundedBox
          key={i}
          args={[1.35, 0.1, 0.62]}
          radius={0.03}
          smoothness={3}
          position={[bill.x, bill.y, 0]}
          rotation={[0, bill.rot, 0]}
        >
          <Gloss color={bill.color} emissive={bill.color} emissiveIntensity={0.2 + i * 0.04} />
        </RoundedBox>
      ))}
      {/* Paper band */}
      <RoundedBox args={[0.3, 0.42, 0.68]} radius={0.03} smoothness={3} position={[0.18, -0.01, 0]}>
        <meshPhysicalMaterial
          color={theme.accent}
          emissive={theme.accent}
          emissiveIntensity={0.35}
          metalness={0.6}
          roughness={0.3}
          clearcoat={0.5}
        />
      </RoundedBox>
      {/* Seal on the top bill */}
      <mesh position={[-0.32, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
        <meshPhysicalMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Investment — ascending glossy bars with an arrow                    */
/* ------------------------------------------------------------------ */

function InvestmentObject({ theme }: { theme: ObjectTheme }) {
  const bars = [
    { x: -0.42, h: 0.4 },
    { x: 0, h: 0.68 },
    { x: 0.42, h: 0.98 },
  ]
  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.1, 40]} />
        <Gloss color={theme.base} emissiveIntensity={0.14} />
      </mesh>
      {bars.map((bar, i) => (
        <RoundedBox
          key={bar.x}
          args={[0.3, bar.h, 0.3]}
          radius={0.06}
          smoothness={3}
          position={[bar.x, -0.57 + bar.h / 2, 0]}
        >
          <Gloss
            color={i === bars.length - 1 ? theme.glow : theme.mid}
            emissive={i === bars.length - 1 ? theme.glow : theme.mid}
            emissiveIntensity={0.24 + i * 0.08}
          />
        </RoundedBox>
      ))}
      {/* Arrow riding the trend */}
      <group position={[0.35, 0.62, 0]} rotation={[0, 0, -0.6]}>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
          <Gloss color={theme.accent} emissive={theme.accent} emissiveIntensity={0.55} />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <coneGeometry args={[0.11, 0.2, 16]} />
          <Gloss color={theme.accent} emissive={theme.accent} emissiveIntensity={0.7} />
        </mesh>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Shared float rig                                                    */
/* ------------------------------------------------------------------ */

function FloatRig({ children, enabled }: { children: React.ReactNode; enabled: boolean }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = group.current
    if (!g || !enabled) return
    const t = clock.elapsedTime
    g.position.y = Math.sin(t * 1.2) * 0.055
    g.rotation.y = Math.sin(t * 0.45) * 0.22
  })
  return <group ref={group}>{children}</group>
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Raw object for use INSIDE an existing R3F Canvas. */
export function AccountObject({
  type,
  float = true,
  scale = 1,
}: {
  type: AccountType
  float?: boolean
  scale?: number
}) {
  const theme = OBJECT_THEMES[type]
  return (
    <FloatRig enabled={float}>
      <group scale={scale}>
        {type === 'bank' && <BankObject theme={theme} />}
        {(type === 'credit-card' || type === 'debit-card') && <CardObject theme={theme} />}
        {type === 'wallet' && <WalletObject theme={theme} />}
        {type === 'cash' && <CashObject theme={theme} />}
        {type === 'investment' && <InvestmentObject theme={theme} />}
      </group>
    </FloatRig>
  )
}

/** Standalone glossy viewer — used by the Overview accounts preview. */
export function AccountObjectCanvas({
  type,
  className,
}: {
  type: AccountType
  className?: string
}) {
  const theme = OBJECT_THEMES[type]
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.55, 3.1], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.55} />
        <pointLight position={[3, 4, 4]} intensity={7} color="#ffffff" />
        <pointLight position={[-3.5, 1, 2.5]} intensity={3.5} color={theme.glow} />
        <pointLight position={[0, -2, 3]} intensity={1.5} color={theme.accent} />
        <AccountObject type={type} scale={0.78} />
        <ContactShadows position={[0, -0.95, 0]} opacity={0.35} scale={4.5} blur={2.6} far={2.2} color="#050310" />
      </Canvas>
    </div>
  )
}
