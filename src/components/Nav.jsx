import React, { useState, useRef } from 'react'

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

function scrambleText(target, original, setTextRef){
  let frame = 0
  const total = 24
  const raf = () => {
    frame++
    let out = ''
    for(let i=0;i<original.length;i++){
      if(i < (frame / total) * original.length){
        out += original[i]
      } else {
        out += letters[Math.floor(Math.random() * letters.length)]
      }
    }
    setTextRef(out)
    if(frame < total) requestAnimationFrame(raf)
  }
  raf()
}

export default function Nav({items = ['Solutions','Technology','About','Careers','Resources','Contact']}){
  const [texts, setTexts] = useState(items)
  const setTextAt = (idx, val)=> setTexts(s=>{ const copy=[...s]; copy[idx]=val; return copy })

  return (
    <nav className="site-nav" style={{position:'fixed',top:18,right:40,zIndex:30}}>
      <ul style={{display:'flex',gap:28,listStyle:'none',margin:0,padding:0}}>
        {items.map((it, i)=> (
          <li key={i} style={{cursor:'pointer'}}
            onMouseEnter={()=> scrambleText(null, it, (v)=> setTextAt(i,v))}
            onMouseLeave={()=> setTextAt(i,it)}
          >
            <span style={{color:'white',fontWeight:500,letterSpacing:0.3,fontSize:'14px'}}>{texts[i]}</span>
          </li>
        ))}
      </ul>
    </nav>
  )
}
