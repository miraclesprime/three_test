import React, { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

export default function ParticleWave(){
  const pointsRef = useRef()
  const materialRef = useRef()
  const { size } = useThree()

  const { geometry, randomsCount } = useMemo(()=>{
    const width = 14
    const depth = 1.2
    const cols = 600
    const rows = 6
    const count = cols * rows

    const positions = new Float32Array(count * 3)
    const aRandom = new Float32Array(count)

    let i = 0
    for(let r=0;r<rows;r++){
      const z = (r / (rows-1) - 0.5) * depth
      for(let c=0;c<cols;c++){
        const x = (c / (cols-1) - 0.5) * width
        positions[i*3+0] = x
        positions[i*3+1] = 0
        positions[i*3+2] = z
        aRandom[i] = Math.random()
        i++
      }
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('aRandom', new THREE.BufferAttribute(aRandom, 1))

    return { geometry: geom, randomsCount: count }
  }, [])

  useEffect(()=>{
    if(!materialRef.current) return
    materialRef.current.transparent = true
    materialRef.current.depthWrite = false
    materialRef.current.blending = THREE.AdditiveBlending
  }, [])

  useFrame(({clock, mouse})=>{
    if(!materialRef.current) return
    materialRef.current.uniforms.uTime.value = clock.elapsedTime
    materialRef.current.uniforms.uMouse.value.set((mouse.x+1)/2, (mouse.y+1)/2)
  })

  const vertexShader = `
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;
    uniform vec2 uMouse;
    attribute float aRandom;
    varying float vX;
    varying float vStrength;
    void main(){
      vec3 pos = position;
      float w1 = sin((pos.x * uFrequency) + uTime * uSpeed);
      float w2 = 0.5 * sin((pos.z * (uFrequency * 0.6)) + uTime * uSpeed * 1.25);
      float wave = (w1 + w2) * 0.5;
      float strength = wave * uAmplitude * (0.6 + aRandom * 0.8);
      // mouse influence mapped to world coords
      float mX = (uMouse.x - 0.5) * 14.0;
      float mZ = (uMouse.y - 0.5) * 1.2;
      float d = distance(vec2(pos.x, pos.z), vec2(mX, mZ));
      float influence = exp(-d * 2.2) * 1.8;
      pos.y += strength + influence * (0.5 + aRandom * 0.8);
      vX = (pos.x / 14.0) + 0.5;
      vStrength = strength + influence;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = 2.6;
    }
  `

  const fragmentShader = `
    varying float vX;
    varying float vStrength;
    void main(){
      vec2 c = gl_PointCoord - vec2(0.5);
      float dist = length(c);
      if(dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist);
      vec3 left = vec3(1.0, 0.35, 0.7);
      vec3 right = vec3(0.6, 0.0, 1.0);
      vec3 color = mix(left, right, clamp(vX, 0.0, 1.0));
      float glow = 0.6 + clamp(vStrength * 1.6, 0.0, 2.0);
      gl_FragColor = vec4(color * glow, alpha * 0.92);
    }
  `

  const uniforms = useMemo(()=>({
    uTime: { value: 0 },
    uAmplitude: { value: 0.6 },
    uFrequency: { value: 1.2 },
    uSpeed: { value: 1.0 },
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
