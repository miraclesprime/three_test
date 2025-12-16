import React, {useEffect, useState} from 'react'
import { Canvas } from '@react-three/fiber'
import GalaxyBackground from './components/GalaxyBackground'
import ParticleWave from './components/ParticleWave'
import Nav from './components/Nav'
import Header from './components/Header'

export default function App(){
  const [cut, setCut] = useState(0)

  useEffect(()=>{
    const onScroll = ()=>{
      const sc = window.scrollY / (window.innerHeight || 1)
      setCut(Math.min(1, sc))
      document.documentElement.style.setProperty('--cut', `${Math.min(1, sc) * 100}%`)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return ()=> window.removeEventListener('scroll', onScroll)
  },[])

  return (
    <div className="page-root">
      <Canvas className="canvas" dpr={[1,2]} camera={{ position: [0, 2.5, 7], fov: 45 }}>
        <color attach="background" args={[0.01, 0.01, 0.015]} />
        <GalaxyBackground />
        <ParticleWave />
      </Canvas>

      <Header />
      <Nav />

      <div className="hero-section">
        <div className="hero-text">
          <button className="hero-button">Start Today</button>
          <p className="hero-subtitle">Building the future of medicine with AI</p>
        </div>
        <div className="hero-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="cutoff-text" style={{'--cut': `${cut * 100}%`}}>
        <h2 className="cut-text">Brand / Logo</h2>
      </div>

      {/* <div style={{height:'100vh'}} /> */}
    </div>
  )
}
