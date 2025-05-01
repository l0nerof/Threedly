"use client"

import { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import { useTheme } from "next-themes"

function ParticleField({ count = 5000 }) {
  const { theme, systemTheme } = useTheme()
  const [effectiveTheme, setEffectiveTheme] = useState("light")

  useEffect(() => {
    // Determine the effective theme (system theme needs to be resolved)
    if (theme === "system" && systemTheme) {
      setEffectiveTheme(systemTheme)
    } else {
      setEffectiveTheme(theme || "light")
    }
  }, [theme, systemTheme])

  const isDark = effectiveTheme === "dark"

  // Generate random particles
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50
      const y = (Math.random() - 0.5) * 50
      const z = (Math.random() - 0.5) * 50
      temp.push({ x, y, z })
    }
    return temp
  }, [count])

  // Create geometry with particles
  const particlesRef = useRef<any>(null)
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = particles[i].x
      positions[i * 3 + 1] = particles[i].y
      positions[i * 3 + 2] = particles[i].z
    }
    return positions
  }, [count, particles])

  // Animation
  useFrame((state) => {
    const time = state.clock.getElapsedTime() * 0.1
    if (particlesRef.current) {
      particlesRef.current.rotation.x = time * 0.05
      particlesRef.current.rotation.y = time * 0.075
    }
  })

  return (
    <Points ref={particlesRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={isDark ? "#ffffff" : "#000000"}
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  )
}

function FloatingModel() {
  const meshRef = useRef<any>(null)
  const { theme, systemTheme } = useTheme()
  const [effectiveTheme, setEffectiveTheme] = useState("light")

  useEffect(() => {
    // Determine the effective theme (system theme needs to be resolved)
    if (theme === "system" && systemTheme) {
      setEffectiveTheme(systemTheme)
    } else {
      setEffectiveTheme(theme || "light")
    }
  }, [theme, systemTheme])

  const isDark = effectiveTheme === "dark"

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.3
      meshRef.current.position.y = Math.sin(time * 0.5) * 0.2
    }
  })

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.3, 128, 32, 2, 3]} />
      <meshStandardMaterial
        color="#ffffff"
        metalness={0.8}
        roughness={0.2}
        emissive={isDark ? "#6d28d9" : "#ff9500"}
        emissiveIntensity={0.5}
      />
    </mesh>
  )
}

function Scene() {
  const { theme, systemTheme } = useTheme()
  const [effectiveTheme, setEffectiveTheme] = useState("light")

  useEffect(() => {
    // Determine the effective theme (system theme needs to be resolved)
    if (theme === "system" && systemTheme) {
      setEffectiveTheme(systemTheme)
    } else {
      setEffectiveTheme(theme || "light")
    }
  }, [theme, systemTheme])

  const isDark = effectiveTheme === "dark"

  return (
    <>
      <ParticleField />
      <group position={[0, 0, 0]}>
        <FloatingModel />
      </group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color={isDark ? "#6d28d9" : "#ff9500"} />
    </>
  )
}

function ThreeDPreview() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <Scene />
      </Canvas>
    </div>
  )
}

export default ThreeDPreview;
