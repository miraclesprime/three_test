import React from 'react'

export default function Header(){
  return (
    <header className="site-header">
      <div className="logo" style={{position:'fixed',top:16,left:20,zIndex:31}}>
        <div style={{color:'white',fontWeight:700,fontSize:'20px',letterSpacing:-0.5}}>AI Med</div>
      </div>
    </header>
  )
}
