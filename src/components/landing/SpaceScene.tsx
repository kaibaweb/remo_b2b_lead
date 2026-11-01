/** Procedural artwork: no external images, canvas loop or third-party downloads. */
export function SpaceScene() {
  return <div className="space-scene" aria-hidden="true">
    <svg viewBox="0 0 1440 1080" preserveAspectRatio="xMidYMid slice" className="space-scene-art">
      <defs>
        <radialGradient id="remo-nebula"><stop stopColor="#6b36c8" stopOpacity=".4"/><stop offset="1" stopColor="#07080d" stopOpacity="0"/></radialGradient>
        <radialGradient id="remo-planet" cx="34%" cy="18%" r="80%"><stop stopColor="#9993ff"/><stop offset=".25" stopColor="#514291"/><stop offset=".62" stopColor="#181830"/><stop offset="1" stopColor="#07080d"/></radialGradient>
        <linearGradient id="remo-orbit"><stop stopColor="#b7f778" stopOpacity="0"/><stop offset=".45" stopColor="#b7f778" stopOpacity=".8"/><stop offset="1" stopColor="#a799ff" stopOpacity="0"/></linearGradient>
        <clipPath id="remo-sphere"><circle cx="720" cy="690" r="310"/></clipPath>
      </defs>
      <ellipse cx="730" cy="520" rx="720" ry="540" fill="url(#remo-nebula)"/>
      <g className="space-stars">{Array.from({length:140},(_,i)=><circle key={i} cx={(i*137+53)%1440} cy={(i*i*29+17)%1060} r={i%9===0?1.8:.7} fill={i%4===0?'#b7f778':'#eef0ff'} opacity={.2+(i%6)*.12}/>)}</g>
      <circle cx="720" cy="690" r="319" fill="none" stroke="#a79aff" strokeOpacity=".12" strokeWidth="13"/>
      <circle cx="720" cy="690" r="310" fill="url(#remo-planet)" stroke="#c6c0ff" strokeOpacity=".38"/>
      <g clipPath="url(#remo-sphere)" fill="none" stroke="#d0c7ff" strokeOpacity=".12">
        {[-240,-160,-80,0,80,160,240].map(y=><ellipse key={y} cx="720" cy={690+y} rx="310" ry="45"/>)}
        {[65,140,220,295].map(rx=><ellipse key={rx} cx="720" cy="690" rx={rx} ry="310"/>)}
      </g>
      <ellipse cx="720" cy="690" rx="535" ry="116" transform="rotate(-23 720 690)" fill="none" stroke="url(#remo-orbit)" strokeWidth="1.2"/>
      <ellipse cx="720" cy="690" rx="585" ry="150" transform="rotate(-23 720 690)" fill="none" stroke="#aaa2dd" strokeOpacity=".12"/>
      <circle cx="1180" cy="494" r="5" fill="#c9f590"/>
      <path d="M229 355v22m-11-11h22M1190 249v14m-7-7h14" stroke="#d5d0eb" strokeOpacity=".55"/>
    </svg>
    <div className="space-scene-shade"/>
  </div>;
}
