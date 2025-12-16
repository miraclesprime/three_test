import React from 'react'

export default function Header(){
  return (
    <header className="site-header">
      <div className="logo" style={{position:'fixed',top:70,left:80,zIndex:31}}>
        <img src='/assets/logo.png' width={129} height={18} alt="logo"></img>
        {/* <div style={{color:'white',fontWeight:700,fontSize:'20px',letterSpacing:-0.5}}>AI Med</div> */}
      </div>
    </header>
  )
}
