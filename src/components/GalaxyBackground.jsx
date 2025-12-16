import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export default function GalaxyBackground(){
  const pointsRef = useRef()
  const materialRef = useRef()

  const { geometry, count } = useMemo(() => {
    const starCount = 5000
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)

    // Color palette matching the wave (brighter versions for visibility)
    const colorPalette = [
      new THREE.Color(0.6, 0.15, 0.3),   // Bright pink
      new THREE.Color(0.5, 0.2, 0.7),    // Bright purple
      new THREE.Color(0.3, 0.7, 1.0),    // Bright cyan
      new THREE.Color(0.7, 0.2, 0.4),    // Magenta
      new THREE.Color(0.4, 0.1, 0.6),    // Deep purple
      new THREE.Color(0.5, 0.3, 0.8),    // Light purple
      new THREE.Color(0.8, 0.3, 0.6),    // Pink
      new THREE.Color(0.4, 0.6, 1.0),    // Light cyan
    ]

    for (let i = 0; i < starCount; i++) {
      // Create galaxy-like spiral distribution
      const angle = Math.random() * Math.PI * 2
      const radius = Math.pow(Math.random(), 0.6) * 50 // Better distribution
      const y = (Math.random() - 0.5) * 40

      positions[i * 3 + 0] = Math.cos(angle) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * radius

      // Random color from palette with variation
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i * 3 + 0] = Math.min(1.0, color.r + (Math.random() - 0.5) * 0.3)
      colors[i * 3 + 1] = Math.min(1.0, color.g + (Math.random() - 0.5) * 0.3)
      colors[i * 3 + 2] = Math.min(1.0, color.b + (Math.random() - 0.5) * 0.3)

      // Larger size variation
      sizes[i] = Math.random() * 2.0 + 0.5
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return { geometry: geom, count: starCount }
  }, [])

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.transparent = true
    materialRef.current.sizeAttenuation = true
    materialRef.current.depthWrite = false
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    // Slow rotation for galaxy effect
    pointsRef.current.rotation.z += 0.00005
    pointsRef.current.rotation.y += 0.00003
    
    // Gentle pulsing
    const pulse = Math.sin(clock.elapsedTime * 0.3) * 0.5 + 0.7
    pointsRef.current.scale.set(pulse, pulse, pulse)
  })

  const vertexShader = `
    attribute float size;
    attribute float scale;
    varying vec3 vColor;

    void main() {
      vColor = color;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
    }
  `

  const fragmentShader = `
    varying vec3 vColor;

    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      if (dist > 0.5) discard;
      
      // Bright glow effect
      float alpha = (1.0 - dist * dist) * 0.8;
      
      gl_FragColor = vec4(vColor, alpha);
    }
  `

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, 0, -10]}>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        sizeAttenuation={true}
        depthWrite={false}
        vertexColors={true}
        fog={false}
      />
    </points>
  )
}
