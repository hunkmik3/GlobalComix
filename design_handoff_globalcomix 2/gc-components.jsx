// gc-components.jsx — Design tokens, primitives, Nav, Sidebar

const T = {
  bg:       '#090909',
  surf:     '#0f0f0f',
  card:     '#161616',
  cardHi:   '#1d1d1d',
  border:   '#1e1e1e',
  borderHi: '#2c2c2c',
  text:     '#e2e2e2',
  muted:    '#6a6a6a',
  dim:      '#3a3a3a',
  accent:   '#4d8ee8',
  accentLo: '#0f2040',
  accentMid:'#1a3a70',
  font:     "'JetBrains Mono', monospace",
};

const SC = {
  'Approved':    { bg:'#041c0e', bd:'#1a5228', tx:'#22c55e' },
  'Review':      { bg:'#1e1400', bd:'#4a3600', tx:'#fbbf24' },
  'In Progress': { bg:'#040f22', bd:'#153060', tx:'#60a5fa' },
  'Rejected':    { bg:'#1a0404', bd:'#4a1010', tx:'#f87171' },
  'Done':        { bg:'#111',    bd:'#262626', tx:'#525252' },
};

const AV_COLORS = [
  { bg:'#0f2040', tx:'#60a5fa' },
  { bg:'#042210', tx:'#22c55e' },
  { bg:'#200f38', tx:'#c084fc' },
  { bg:'#201000', tx:'#fbbf24' },
  { bg:'#041820', tx:'#22d3ee' },
];

// ── Primitives ────────────────────────────────────────────────────────

const Badge = ({ status }) => {
  const sc = SC[status] || SC['Done'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 9px', borderRadius:99,
      background:sc.bg, border:`1px solid ${sc.bd}`,
      color:sc.tx, fontSize:10, fontFamily:T.font, fontWeight:500,
      whiteSpace:'nowrap', letterSpacing:.3,
    }}>
      <span style={{width:5,height:5,borderRadius:'50%',background:sc.tx,flexShrink:0}}></span>
      {status}
    </span>
  );
};

const Av = ({ name='?', size=28 }) => {
  const idx = (String(name).charCodeAt(0) || 0) % AV_COLORS.length;
  const c = AV_COLORS[idx];
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:c.bg, border:`1px solid ${T.borderHi}`,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <span style={{color:c.tx, fontSize:size*.38, fontFamily:T.font, fontWeight:700}}>
        {String(name)[0].toUpperCase()}
      </span>
    </div>
  );
};

const Btn = ({ label, primary=false, small=false, icon=null, onClick, style:sx={} }) => (
  <button
    className={`gc-btn${primary?' gc-btn-primary':''}`}
    onClick={onClick}
    style={{
      padding: small ? '4px 10px' : '6px 14px',
      borderRadius:5,
      background: primary ? T.accent : T.card,
      border: `1px solid ${primary ? T.accent : T.borderHi}`,
      color: primary ? '#fff' : T.text,
      fontFamily:T.font, fontSize: small ? 11 : 12, fontWeight:500,
      whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:6,
      cursor:'pointer', letterSpacing:.2, ...sx,
    }}>
    {icon && <span style={{fontSize:12,lineHeight:1}}>{icon}</span>}
    {label}
  </button>
);

const ImgThumb = ({ hasImage=false, w=54, h=36 }) => (
  <div style={{
    width:w, height:h, flexShrink:0, borderRadius:3, overflow:'hidden',
    background: hasImage
      ? 'repeating-linear-gradient(135deg,#1e1e1e 0,#1e1e1e 4px,#131313 4px,#131313 12px)'
      : T.bg,
    border:`1px solid ${hasImage ? T.borderHi : T.border}`,
    display:'flex', alignItems:'center', justifyContent:'center',
    position:'relative',
  }}>
    {hasImage && (
      <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,transparent 40%,rgba(77,142,232,.06))'}}></div>
    )}
    {!hasImage && (
      <span style={{color:T.dim,fontSize:14,lineHeight:1}}>+</span>
    )}
  </div>
);

// ── Top Nav ───────────────────────────────────────────────────────────

const TopNav = ({ chapters=[], activeChapter=0, onChapter, onBack, right=null }) => (
  <div style={{
    height:48, background:T.surf, borderBottom:`1px solid ${T.border}`,
    display:'flex', alignItems:'center', padding:'0 20px', gap:0, flexShrink:0,
  }}>
    <span style={{color:T.text, fontFamily:T.font, fontSize:13, fontWeight:700, letterSpacing:3, textTransform:'uppercase', marginRight:20}}>
      GLOBALCOMIX
    </span>
    <div style={{width:1,height:24,background:T.border,marginRight:16}}></div>
    {chapters.map((ch,i) => (
      <div key={i} className="gc-nav-tab" onClick={() => onChapter && onChapter(i)} style={{
        padding:'0 14px', height:48, display:'flex', alignItems:'center',
        color: i===activeChapter ? T.text : T.muted,
        fontFamily:T.font, fontSize:12,
        borderBottom: i===activeChapter ? `2px solid ${T.accent}` : '2px solid transparent',
        fontWeight: i===activeChapter ? 500 : 400,
      }}>{ch}</div>
    ))}
    {chapters.length > 0 && (
      <div style={{padding:'0 10px',height:48,display:'flex',alignItems:'center',color:T.accent,fontSize:12,fontFamily:T.font,cursor:'pointer'}}>+ Add</div>
    )}
    <div style={{flex:1}}/>
    {right}
    {onBack && (
      <button className="gc-btn" onClick={onBack} style={{marginRight:8,background:'none',border:`1px solid ${T.border}`,color:T.muted,fontFamily:T.font,fontSize:11,padding:'4px 10px',borderRadius:4,cursor:'pointer'}}>
        ← Dashboard
      </button>
    )}
  </div>
);

// ── Sidebar ───────────────────────────────────────────────────────────

const Sidebar = ({ activeChapter=0, onChapter, onNavigate, screen, user }) => {
  const chapters = [
    { name:'Chapter 1', count:42, pct:43 },
    { name:'Chapter 2', count:38, pct:13 },
    { name:'Chapter 3', count:24, pct:0 },
  ];
  return (
    <div style={{
      width:220, background:T.surf, borderRight:`1px solid ${T.border}`,
      display:'flex', flexDirection:'column', flexShrink:0,
    }}>
      <div style={{padding:'16px 18px 14px', borderBottom:`1px solid ${T.border}`}}>
        <div style={{color:T.text, fontFamily:T.font, fontSize:13, fontWeight:700, letterSpacing:3, textTransform:'uppercase'}}>GLOBALCOMIX</div>
        <div style={{color:T.muted, fontFamily:T.font, fontSize:9, marginTop:4, letterSpacing:1.5, textTransform:'uppercase'}}>Global Comix Project</div>
      </div>

      <div style={{padding:'12px 10px 6px', flex:1}}>
        <div style={{color:T.dim, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1.5, padding:'0 8px', marginBottom:6}}>Chapters</div>
        {chapters.map((ch,i) => (
          <div key={i}
            className={`gc-sidebar-item${i===activeChapter?' gc-sidebar-active':''}`}
            onClick={() => { onChapter && onChapter(i); onNavigate && onNavigate('dashboard'); }}
            style={{padding:'8px 10px', borderRadius:5, marginBottom:3, cursor:'pointer',
              background: i===activeChapter ? T.accentLo : 'transparent',
              border: `1px solid ${i===activeChapter ? T.accentMid : 'transparent'}`,
            }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
              <span style={{color: i===activeChapter ? T.text : T.muted, fontFamily:T.font, fontSize:12, fontWeight: i===activeChapter ? 500 : 400}}>{ch.name}</span>
              <span style={{color:T.dim, fontFamily:T.font, fontSize:10}}>{ch.count}</span>
            </div>
            <div style={{height:2, background:T.border, borderRadius:1, overflow:'hidden'}}>
              <div style={{width:`${ch.pct}%`, height:'100%', background: i===activeChapter ? T.accent : T.dim, borderRadius:1}}></div>
            </div>
          </div>
        ))}
        <div style={{padding:'7px 10px', color:T.accent, fontFamily:T.font, fontSize:11, cursor:'pointer'}}>+ Add Chapter</div>

        <div style={{height:1, background:T.border, margin:'10px 0'}}></div>

        <div style={{color:T.dim, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1.5, padding:'0 8px', marginBottom:6}}>Navigate</div>
        {[{l:'Dashboard', s:'dashboard', ic:'⊟'}, {l:'Tracker', s:'tracker', ic:'⊞'}].map(({l,s,ic}) => (
          <div key={s}
            className={`gc-sidebar-item${screen===s?' gc-sidebar-active':''}`}
            onClick={() => onNavigate && onNavigate(s)}
            style={{padding:'7px 10px', borderRadius:5, marginBottom:2, cursor:'pointer',
              display:'flex', alignItems:'center', gap:8,
              background: screen===s ? T.accentLo : 'transparent',
              border:`1px solid ${screen===s ? T.accentMid : 'transparent'}`,
            }}>
            <span style={{color:T.muted, fontSize:13}}>{ic}</span>
            <span style={{color: screen===s ? T.text : T.muted, fontFamily:T.font, fontSize:12, fontWeight: screen===s ? 500 : 400}}>{l}</span>
          </div>
        ))}
      </div>

      <div style={{padding:'10px 12px', borderTop:`1px solid ${T.border}`}}>
        <div style={{display:'flex', alignItems:'center', gap:10, padding:'6px 8px', borderRadius:5, marginBottom:4}}>
          <Av name={user?.name || 'A'} size={28}/>
          <div>
            <div style={{color:T.text, fontFamily:T.font, fontSize:11, fontWeight:500}}>{user?.name || 'Admin'}</div>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:.5}}>{user?.role || 'ADMIN'}</div>
          </div>
        </div>
        <div className="gc-sidebar-item"
          onClick={() => onNavigate && onNavigate('admin')}
          style={{padding:'6px 8px', borderRadius:4, cursor:'pointer', display:'flex', alignItems:'center', gap:8}}>
          <span style={{color:T.muted, fontSize:12}}>⚙</span>
          <span style={{color:T.muted, fontFamily:T.font, fontSize:11}}>User Management</span>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { T, SC, Badge, Av, Btn, ImgThumb, TopNav, Sidebar });
