import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

export default function ParticleWave(){
  const pointsRef = useRef()
  const materialRef = useRef()
  const smoothMouseRef = useRef(new THREE.Vector2(0.5, 0.5))
  const targetMouseRef = useRef(new THREE.Vector2(0.5, 0.5))
  const { size } = useThree()

  const { geometry, randomsCount } = useMemo(()=>{
    const width = 14
    const depth = 2.8
    const cols = 1400
    const maxRows = 18
    const yOffset = -0.2
    
    // Density function: varies particle count based on X position
    const getDensity = (normalizedX) => {
      // Create wave-like density: more particles in center and edges
      const x = normalizedX * Math.PI * 2
      const wave1 = Math.sin(x * 1.2) * 0.3
      const wave2 = Math.sin(x * 0.6 + 1) * 0.2
      const centerPeak = Math.exp(-Math.pow((normalizedX - 0.5) * 3, 2)) * 0.4
      return 0.4 + wave1 + wave2 + centerPeak // Range: ~0.2 to ~1.0
    }

    // Pre-calculate particle count
    let totalCount = 0
    const rowsPerCol = []
    for(let c = 0; c < cols; c++){
      const nx = c / (cols - 1)
      const density = getDensity(nx)
      const rows = Math.max(4, Math.floor(maxRows * density))
      rowsPerCol.push(rows)
      totalCount += rows
    }

    const positions = new Float32Array(totalCount * 3)
    const aRandom = new Float32Array(totalCount)
    const aDepthFactor = new Float32Array(totalCount)

    let i = 0
    for(let c = 0; c < cols; c++){
      const x = (c / (cols - 1) - 0.5) * width
      const rows = rowsPerCol[c]
      
      for(let r = 0; r < rows; r++){
        const zNorm = r / (rows - 1)
        const z = (zNorm - 0.5) * depth
        
        positions[i*3+0] = x
        positions[i*3+1] = yOffset
        positions[i*3+2] = z
        aRandom[i] = Math.random()
        aDepthFactor[i] = zNorm // 0 at front, 1 at back
        i++
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('aRandom', new THREE.BufferAttribute(aRandom, 1))
    geom.setAttribute('aDepthFactor', new THREE.BufferAttribute(aDepthFactor, 1))

    return { geometry: geom, randomsCount: totalCount }
  }, [])

  useEffect(()=>{
    if(!materialRef.current) return
    materialRef.current.transparent = true
    materialRef.current.depthWrite = false
    materialRef.current.blending = THREE.AdditiveBlending
    // Initialize smooth mouse position
    materialRef.current.uniforms.uMouse.value.copy(smoothMouseRef.current)
  }, [])

  useFrame(({clock, mouse})=>{
    if(!materialRef.current) return
    materialRef.current.uniforms.uTime.value = clock.elapsedTime
    
    // Set target mouse position
    const targetX = (mouse.x + 1) / 2
    const targetY = (mouse.y + 1) / 2
    targetMouseRef.current.set(targetX, targetY)
    
    // Smoothly interpolate from current to target (lerp with factor 0.1 for smooth transition)
    smoothMouseRef.current.lerp(targetMouseRef.current, 0.1)
    materialRef.current.uniforms.uMouse.value.copy(smoothMouseRef.current)
  })

  const vertexShader = `
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;
    uniform vec2 uMouse;
    attribute float aRandom;
    attribute float aDepthFactor;
    varying float vX;
    varying float vStrength;
    varying float vDepth;
    
    // Perlin-inspired noise function
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    // Fractal noise (multiple octaves)
    float fractalNoise(vec2 p, int octaves) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      
      for(int i = 0; i < 4; i++) {
        if(i >= octaves) break;
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    // Polynomial wave interpolation
    float polynomialWave(float x, float t) {
      float phase = x + t;
      float s = sin(phase);
      return s + 0.3 * s * s * s + 0.15 * s * s * s * s * s;
    }
    
    // Creative Y-axis animation - Heartbeat effect
    float heartbeatAnimation(float t, float randomSeed) {
      float beat = mod(t, 1.0);
      // Two quick pulses followed by longer rest
      float pulse1 = exp(-pow(beat, 2.0) * 20.0) * 0.5;
      float pulse2 = exp(-pow(beat - 0.3, 2.0) * 15.0) * 0.4;
      return (pulse1 + pulse2) * (0.5 + randomSeed * 0.5);
    }
    
    // Toss-up oscillation - parabolic arc motion
    float tossUpAnimation(float t, float randomSeed) {
      float cycle = mod(t * 0.7, 1.0);
      // Parabolic arc (like throwing something up)
      float arc = cycle * (1.0 - cycle) * 4.0;
      // Add damping over time
      float damp = 1.0 - mod(t * 0.15, 1.0) * 0.3;
      return arc * damp * (0.6 + randomSeed * 0.4);
    }
    
    // Procedural oscillation - complex wave
    float proceduralOscillation(float t, float x, float randomSeed) {
      float osc1 = sin(t * 1.2 + randomSeed * 6.28) * 0.4;
      float osc2 = sin(t * 0.5 + x * 2.0) * 0.3;
      float osc3 = cos(t * 0.8 - randomSeed * 3.14) * 0.2;
      return (osc1 + osc2 + osc3) * 0.6;
    }
    
    void main(){
      vec3 pos = position;
      float t = uTime * uSpeed;
      
      // Multi-layered wave composition
      float w1 = polynomialWave(pos.x * uFrequency * 0.8, t) * 0.9;
      float w2 = sin((pos.x * uFrequency * 1.5) + t * 1.2) * 0.5;
      float w3 = cos((pos.z * uFrequency * 1.2) - t * 0.8) * 0.4;
      
      // Fractal noise for organic variation
      vec2 noiseCoord = vec2(pos.x * 0.4 + t * 0.3, pos.z * 0.8 + t * 0.2);
      float fractal = fractalNoise(noiseCoord, 3) * 2.0 - 1.0;
      
      // Perlin noise layer
      vec2 perlinCoord = vec2(pos.x * 0.6 - t * 0.4, pos.z * 0.5);
      float perlin = (noise(perlinCoord) - 0.5) * 1.8;
      
      // Depth-based wave variation
      float depthWave = sin(pos.z * 2.0 + t * 1.5) * (1.0 - aDepthFactor * 0.6);
      
      // Combine all wave components
      float wave = w1 + w2 + w3 + fractal * 0.6 + perlin * 0.5 + depthWave;
      float strength = wave * uAmplitude * (0.5 + aRandom * 0.8);
      
      // Enhanced mouse influence
      float mX = (uMouse.x - 0.5) * 14.0;
      float mZ = (uMouse.y - 0.5) * 2.8;
      float d = distance(vec2(pos.x, pos.z), vec2(mX, mZ));
      float influence = exp(-d * 1.5) * 2.2 * (1.0 + fractalNoise(vec2(d, t), 2));
      
      pos.y += (strength + influence * (0.5 + aRandom * 0.8)) * 0.45;
      
      vX = (pos.x / 14.0) + 0.5;
      vStrength = abs(strength) + influence * 0.5;
      vDepth = aDepthFactor;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Dynamic particle size based on depth and strength
      float baseSize = 3.8;
      float depthScale = 1.0 - aDepthFactor * 0.3;
      float energyScale = 1.0 + clamp(vStrength * 0.3, 0.0, 0.8);
      gl_PointSize = baseSize * depthScale * energyScale;
    }
  `

  const fragmentShader = `
    varying float vX;
    varying float vStrength;
    varying float vDepth;
    
    void main(){
      vec2 c = gl_PointCoord - vec2(0.5);
      float dist = length(c);
      if(dist > 0.5) discard;
      
      // Softer, more luminous edges
      float alpha = smoothstep(0.5, 0.1, dist);
      
      // Enhanced color gradient with depth variation
      vec3 darkWeakPink = vec3(0.35, 0.05, 0.12);
      vec3 darkWeakPurple = vec3(0.25, 0.08, 0.45);
      vec3 darkCyan = vec3(0.15, 0.4, 0.6);
      
      // Mix colors based on position and depth
      vec3 baseColor = mix(darkWeakPink, darkWeakPurple, clamp(vX, 0.0, 1.0));
      vec3 color = mix(baseColor, darkCyan, vDepth * 0.2);
      
      // Dynamic glow with higher intensity
      float glow = 0.5 + clamp(vStrength * 1.5, 0.0, 2.0);
      
      // Add bright core for energy peaks
      float core = smoothstep(0.3, 0.0, dist) * clamp(vStrength * 1.5, 0.0, 1.0);
      
      gl_FragColor = vec4(color * glow + vec3(core * 0.5), alpha * 0.88);
    }
  `

  const uniforms = useMemo(()=>({
    uTime: { value: 0 },
    uAmplitude: { value: 1.5 },
    uFrequency: { value: 1.6 },
    uSpeed: { value: 0.8 },
    uMouse: { value: new THREE.Vector2(0.5,0.5) }
  }), [])

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        attach="material"
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
