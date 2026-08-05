'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

export interface RingSegmentDatum {
  id: string
  percent: number
  color: string
  label: string
}

interface CategoryRingSceneProps {
  segments: RingSegmentDatum[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  reducedMotion?: boolean
}

/**
 * Resolve any CSS color (var(--token), oklch(), hex...) to an sRGB string
 * that THREE.Color can parse. Runs client-side only.
 */
function resolveCssColor(input: string): string {
  if (typeof document === 'undefined') return '#9b5cff'
  const el = document.createElement('span')
  el.style.color = input
  el.style.display = 'none'
  document.body.appendChild(el)
  const resolved = getComputedStyle(el).color
  document.body.removeChild(el)
  return resolved || '#9b5cff'
}

const OUTER_R = 1.0
const INNER_R = 0.6
const DEPTH = 0.3
const GAP_RAD = 0.045

/** Build one extruded arc sector with bevel — a physical ring segment. */
function buildSegmentGeometry(startAngle: number, endAngle: number) {
  const shape = new THREE.Shape()
  const steps = Math.max(6, Math.ceil((endAngle - startAngle) / 0.12))
  shape.moveTo(Math.cos(startAngle) * OUTER_R, Math.sin(startAngle) * OUTER_R)
  for (let i = 1; i <= steps; i++) {
    const a = startAngle + ((endAngle - startAngle) * i) / steps
    shape.lineTo(Math.cos(a) * OUTER_R, Math.sin(a) * OUTER_R)
  }
  for (let i = steps; i >= 0; i--) {
    const a = startAngle + ((endAngle - startAngle) * i) / steps
    shape.lineTo(Math.cos(a) * INNER_R, Math.sin(a) * INNER_R)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: steps * 2,
  })
  geo.translate(0, 0, -DEPTH / 2)
  return geo
}

interface SegmentSpec {
  id: string
  color: string
  label: string
  geometry: THREE.ExtrudeGeometry
  midAngle: number
  index: number
}

function RingSegment({
  spec,
  active,
  onSelect,
  reducedMotion,
  totalSegments,
}: {
  spec: SegmentSpec
  active: boolean
  onSelect?: (id: string) => void
  reducedMotion?: boolean
  totalSegments: number
}) {
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshPhysicalMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const progress = useRef(reducedMotion ? 1 : 0)
  const lift = useRef(0)

  const color = useMemo(() => new THREE.Color(resolveCssColor(spec.color)), [spec.color])
  const delay = spec.index * 0.05 // ~50ms stagger
  const emphasized = hovered || active

  useFrame((state, delta) => {
    if (!group.current || !mat.current) return
    // Entrance: rise from depth offset with easing
    const t = state.clock.elapsedTime
    if (progress.current < 1) {
      const local = Math.min(1, Math.max(0, (t - delay - 0.1) / 0.6))
      // spring-like easeOutBack finish
      const eased = 1 + 2.2 * Math.pow(local - 1, 3) + 1.2 * Math.pow(local - 1, 2)
      progress.current = Math.min(1, Math.max(progress.current, eased))
    }
    // Hover/selection lift outward along the segment's mid-angle
    const targetLift = emphasized ? 0.085 : 0
    lift.current = THREE.MathUtils.damp(lift.current, targetLift, 8, delta)

    const enterZ = (1 - progress.current) * -0.55
    group.current.position.set(
      Math.cos(spec.midAngle) * lift.current,
      Math.sin(spec.midAngle) * lift.current,
      enterZ,
    )
    const s = 0.6 + 0.4 * progress.current + (emphasized ? 0.03 : 0)
    group.current.scale.setScalar(s)

    const targetEmissive = (emphasized ? 0.85 : 0.32) * progress.current
    mat.current.emissiveIntensity = THREE.MathUtils.damp(
      mat.current.emissiveIntensity,
      targetEmissive,
      6,
      delta,
    )
    mat.current.opacity = Math.min(1, progress.current * 1.4)
  })

  return (
    <group ref={group}>
      <mesh
        geometry={spec.geometry}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(spec.id)
        }}
      >
        <meshPhysicalMaterial
          ref={mat}
          color={color}
          emissive={color}
          emissiveIntensity={0}
          metalness={0.25}
          roughness={0.32}
          clearcoat={0.8}
          clearcoatRoughness={0.25}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  )
}

function RingComposition({
  segments,
  selectedId,
  onSelect,
  reducedMotion,
}: CategoryRingSceneProps) {
  const rig = useRef<THREE.Group>(null)

  const specs = useMemo<SegmentSpec[]>(() => {
    const total = segments.reduce((s, seg) => s + seg.percent, 0) || 1
    let angle = Math.PI / 2 // start at top
    return segments.map((seg, index) => {
      const sweep = (seg.percent / total) * Math.PI * 2
      const start = angle - sweep + GAP_RAD / 2
      const end = angle - GAP_RAD / 2
      angle -= sweep
      const midAngle = (start + end) / 2
      return {
        id: seg.id,
        color: seg.color,
        label: seg.label,
        geometry: buildSegmentGeometry(start, end),
        midAngle,
        index,
      }
    })
  }, [segments])

  useFrame((state, delta) => {
    if (!rig.current || reducedMotion) return
    // Gentle breathing tilt only — the ring never spins
    const t = state.clock.elapsedTime
    rig.current.rotation.x = THREE.MathUtils.damp(
      rig.current.rotation.x,
      -0.95 + Math.sin(t * 0.4) * 0.03,
      4,
      delta,
    )
    rig.current.rotation.z = Math.sin(t * 0.25) * 0.02
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 4, 3]} intensity={1.6} color="#e6f0ff" />
      <pointLight position={[-3, -1, 2]} intensity={0.6} color="#3b82f6" />
      <pointLight position={[0, -2.5, 1.5]} intensity={0.7} color="#60a5fa" />
      <group ref={rig} rotation={[-0.95, 0, 0]}>
        {specs.map((spec) => (
          <RingSegment
            key={spec.id}
            spec={spec}
            active={selectedId === spec.id}
            onSelect={onSelect}
            reducedMotion={reducedMotion}
            totalSegments={specs.length}
          />
        ))}
        {/* Inner rim — dark cavity edge */}
        <mesh rotation={[0, 0, 0]} position={[0, 0, -DEPTH / 2 - 0.01]}>
          <ringGeometry args={[INNER_R - 0.06, INNER_R - 0.015, 64]} />
          <meshBasicMaterial color="#1a1638" transparent opacity={0.9} />
        </mesh>
      </group>
    </>
  )
}

function SceneSizer() {
  const { camera, size } = useThree()
  const persp = camera as THREE.PerspectiveCamera
  persp.position.set(0, 0, 3.1)
  persp.fov = 42
  persp.updateProjectionMatrix()
  return null
}

export default function CategoryRingScene(props: CategoryRingSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      style={{ background: 'transparent', touchAction: 'pan-y' }}
      aria-hidden="true"
    >
      <SceneSizer />
      <RingComposition {...props} />
    </Canvas>
  )
}
