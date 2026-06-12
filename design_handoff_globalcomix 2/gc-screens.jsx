// gc-screens.jsx — Login, Dashboard, Admin screens

const { useState } = React;

// ── Login Screen ──────────────────────────────────────────────────────

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = () => {
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ name: username, role: username === 'admin' ? 'ADMIN' : 'ARTIST' });
    }, 600);
  };

  return (
    <div style={{
      width:'100%', height:'100%', background:T.bg,
      display:'flex', alignItems:'center', justifyContent:'center',
      backgroundImage:'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(77,142,232,.07) 0%, transparent 70%)',
    }}>
      <div style={{
        width:380, background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:12,
        padding:'44px 40px', boxShadow:'0 32px 80px rgba(0,0,0,.7)',
      }}>
        <div style={{textAlign:'center', marginBottom:36}}>
          <div style={{
            color:T.text, fontFamily:T.font, fontSize:16, fontWeight:700,
            letterSpacing:4, textTransform:'uppercase',
          }}>GLOBALCOMIX</div>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:10, marginTop:6, letterSpacing:1.5, textTransform:'uppercase'}}>
            Panel Tracker · Production Tool
          </div>
          <div style={{width:40, height:1, background:T.borderHi, margin:'16px auto 0'}}></div>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1.2, marginBottom:6}}>Username</div>
            <input className="gc-input" type="text" placeholder="Enter username…"
              value={username} onChange={e => { setUsername(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{width:'100%'}} />
          </div>
          <div>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1.2, marginBottom:6}}>Password</div>
            <input className="gc-input" type="password" placeholder="••••••••"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={{width:'100%'}} />
          </div>
          {error && (
            <div style={{color:'#f87171', fontFamily:T.font, fontSize:11, padding:'6px 10px',
              background:'rgba(248,113,113,.08)', borderRadius:4, border:'1px solid rgba(248,113,113,.2)'}}>
              {error}
            </div>
          )}
          <button className="gc-btn gc-btn-primary" onClick={submit}
            style={{
              width:'100%', padding:'10px', marginTop:4,
              background: loading ? T.accentMid : T.accent,
              border:`1px solid ${T.accent}`, color:'#fff',
              fontFamily:T.font, fontSize:13, fontWeight:600,
              borderRadius:5, cursor: loading ? 'default' : 'pointer', letterSpacing:.5,
            }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </div>

        <div style={{textAlign:'center', marginTop:24, color:T.dim, fontFamily:T.font, fontSize:9, letterSpacing:.5}}>
          Internal use only · GlobalComix Studio
        </div>
      </div>
    </div>
  );
};

// ── Dashboard Screen ──────────────────────────────────────────────────

const DashboardScreen = ({ onNavigate, activeChapter }) => {
  const chapterNames = ['Chapter 1', 'Chapter 2', 'Chapter 3'];
  const name = chapterNames[activeChapter] || 'Chapter 1';

  const stats = [
    { l:'Total Panels',  v:42, c:T.text,    sub:'this chapter' },
    { l:'Approved',      v:18, c:'#22c55e', sub:'43% done' },
    { l:'In Progress',   v:12, c:'#60a5fa', sub:'active' },
    { l:'Review',        v:8,  c:'#fbbf24', sub:'awaiting' },
    { l:'Rejected',      v:4,  c:'#f87171', sub:'rework needed' },
  ];

  const recent = [
    { n:'PANEL001', s:'Approved' }, { n:'PANEL002', s:'Approved' },
    { n:'PANEL003', s:'In Progress' }, { n:'PANEL004', s:'Review' },
    { n:'PANEL005', s:'Rejected' }, { n:'PANEL006', s:'Review' },
  ];

  const allChapters = [
    { name:'Chapter 1', total:42, app:18, prog:12, rev:8, rej:4  },
    { name:'Chapter 2', total:38, app:5,  prog:20, rev:10, rej:3 },
    { name:'Chapter 3', total:24, app:0,  prog:4,  rev:18, rej:2 },
  ];

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:T.bg}}>
      {/* Page header */}
      <div style={{padding:'20px 28px 16px', borderBottom:`1px solid ${T.border}`, flexShrink:0, background:T.surf}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
          <div>
            <div style={{color:T.text, fontFamily:T.font, fontSize:20, fontWeight:700}}>
              {name}
              <span style={{color:T.muted, fontWeight:400, fontSize:13, marginLeft:10}}>42 panels</span>
            </div>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:10, marginTop:3, letterSpacing:.3}}>
              Global Comix · Updated 2 hours ago
            </div>
          </div>
          <Btn label="Open Tracker →" primary onClick={() => onNavigate('tracker')} />
        </div>
      </div>

      <div style={{flex:1, overflow:'auto', padding:'20px 28px', display:'flex', flexDirection:'column', gap:20}}>
        {/* Stats row */}
        <div style={{display:'flex', gap:12}}>
          {stats.map(s => (
            <div key={s.l} style={{
              flex:1, background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:7, padding:'14px 16px',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{position:'absolute', top:0, left:0, width:2, height:'100%', background:s.c, opacity:.6}}></div>
              <div style={{color:s.c, fontFamily:T.font, fontSize:32, fontWeight:700, lineHeight:1}}>{s.v}</div>
              <div style={{color:T.text, fontFamily:T.font, fontSize:11, marginTop:7, fontWeight:500}}>{s.l}</div>
              <div style={{color:T.muted, fontFamily:T.font, fontSize:9, marginTop:2, textTransform:'uppercase', letterSpacing:.5}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:7, padding:'16px 18px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1.2}}>Chapter Progress</div>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:10}}>43% complete</div>
          </div>
          <div style={{height:6, background:T.border, borderRadius:3, overflow:'hidden', display:'flex', gap:1}}>
            <div style={{width:'43%', background:'#22c55e', borderRadius:'3px 0 0 3px'}}/>
            <div style={{width:'29%', background:'#3b82f6'}}/>
            <div style={{width:'19%', background:'#f59e0b'}}/>
            <div style={{width:'9%',  background:'#ef4444', borderRadius:'0 3px 3px 0'}}/>
          </div>
          <div style={{display:'flex', gap:18, marginTop:8}}>
            {[['#22c55e','Approved 43%'],['#3b82f6','In Progress 29%'],['#f59e0b','Review 19%'],['#ef4444','Rejected 9%']].map(([c,l]) => (
              <div key={l} style={{display:'flex', alignItems:'center', gap:5}}>
                <div style={{width:6, height:6, borderRadius:1, background:c, flexShrink:0}}></div>
                <span style={{color:T.muted, fontFamily:T.font, fontSize:10}}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All chapters overview */}
        <div>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1.2, marginBottom:10}}>All Chapters</div>
          <div style={{display:'flex', gap:12}}>
            {allChapters.map((ch,i) => (
              <div key={ch.name} style={{
                flex:1, background:T.card, border:`1px solid ${i===activeChapter ? T.accentMid : T.borderHi}`,
                borderRadius:7, padding:'14px', cursor:'pointer',
              }} className="gc-sidebar-item">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
                  <div>
                    <div style={{color: i===activeChapter ? T.accent : T.text, fontFamily:T.font, fontSize:13, fontWeight:600}}>{ch.name}</div>
                    <div style={{color:T.muted, fontFamily:T.font, fontSize:10, marginTop:2}}>{ch.total} panels</div>
                  </div>
                  <Btn label="Open" small onClick={() => onNavigate('tracker')} />
                </div>
                <div style={{height:4, background:T.border, borderRadius:2, overflow:'hidden', display:'flex', marginBottom:10}}>
                  <div style={{width:`${(ch.app/ch.total)*100}%`, background:'#22c55e'}}/>
                  <div style={{width:`${(ch.prog/ch.total)*100}%`, background:'#3b82f6'}}/>
                  <div style={{width:`${(ch.rev/ch.total)*100}%`, background:'#f59e0b'}}/>
                  <div style={{width:`${(ch.rej/ch.total)*100}%`, background:'#ef4444'}}/>
                </div>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  <Badge status="Approved"/><span style={{color:T.muted,fontFamily:T.font,fontSize:10,marginRight:4}}>{ch.app}</span>
                  <Badge status="In Progress"/><span style={{color:T.muted,fontFamily:T.font,fontSize:10,marginRight:4}}>{ch.prog}</span>
                  <Badge status="Review"/><span style={{color:T.muted,fontFamily:T.font,fontSize:10}}>{ch.rev}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent panels */}
        <div>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1.2, marginBottom:10}}>Recent Activity</div>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            {recent.map(p => (
              <div key={p.n} onClick={() => onNavigate('tracker')}
                className="gc-sidebar-item"
                style={{background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:7, padding:10, width:136, cursor:'pointer'}}>
                <div style={{
                  width:'100%', height:80, borderRadius:4, marginBottom:8,
                  background:'repeating-linear-gradient(135deg,#1e1e1e 0,#1e1e1e 4px,#131313 4px,#131313 12px)',
                  border:`1px solid ${T.border}`,
                }}></div>
                <div style={{color:T.accent, fontFamily:T.font, fontSize:11, fontWeight:500, marginBottom:5}}>{p.n}</div>
                <Badge status={p.s}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Admin Screen ──────────────────────────────────────────────────────

const AdminScreen = () => {
  const [users, setUsers] = useState([
    { id:1, name:'Admin User', user:'admin',  role:'ADMIN',    active:true  },
    { id:2, name:'Park Sora',  user:'sora.p', role:'ARTIST',   active:true  },
    { id:3, name:'Dae Jun',    user:'dae.j',  role:'ARTIST',   active:true  },
    { id:4, name:'Ji Won',     user:'ji.w',   role:'REVIEWER', active:true  },
    { id:5, name:'Min Ho',     user:'min.h',  role:'ARTIST',   active:true  },
    { id:6, name:'Yu Na',      user:'yu.n',   role:'REVIEWER', active:false },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', user:'', pass:'', role:'ARTIST' });
  const [formErr, setFormErr] = useState('');

  const RC = { ADMIN:'#4d8ee8', ARTIST:'#22c55e', REVIEWER:'#fbbf24' };

  const th = {
    color:T.muted, fontFamily:T.font, fontSize:9, fontWeight:500,
    padding:'9px 14px', textAlign:'left',
    borderBottom:`1px solid ${T.borderHi}`, background:T.surf,
    textTransform:'uppercase', letterSpacing:.8, whiteSpace:'nowrap',
  };
  const td = {
    color:T.text, fontFamily:T.font, fontSize:12,
    padding:'9px 14px', borderBottom:`1px solid ${T.border}`,
    verticalAlign:'middle',
  };

  const createUser = () => {
    if (!form.name || !form.user || !form.pass) { setFormErr('All fields required.'); return; }
    setUsers([...users, { id:users.length+1, ...form, active:true }]);
    setForm({ name:'', user:'', pass:'', role:'ARTIST' });
    setShowForm(false); setFormErr('');
  };

  return (
    <div style={{flex:1, padding:'24px 32px', overflow:'auto', background:T.bg}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:22}}>
        <div>
          <div style={{color:T.text, fontFamily:T.font, fontSize:20, fontWeight:700}}>User Management</div>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:10, marginTop:3, letterSpacing:.3}}>
            {users.length} accounts · JWT auth · SQLite local
          </div>
        </div>
        <Btn label="+ Add User" primary onClick={() => setShowForm(f => !f)} />
      </div>

      <div style={{background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:8, overflow:'hidden', marginBottom:22}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr>{['#','Display Name','Username','Role','Status','Joined','Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map((u,i) => (
              <tr key={u.id} className="gc-row" style={{background: i%2===0 ? T.card : T.bg}}>
                <td style={{...td, color:T.dim}}>{u.id}</td>
                <td style={td}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <Av name={u.name} size={28}/>{u.name}
                  </div>
                </td>
                <td style={{...td, color:T.muted}}>{u.user}</td>
                <td style={td}>
                  <span style={{
                    padding:'2px 9px', borderRadius:99,
                    background:`${RC[u.role]}18`, border:`1px solid ${RC[u.role]}44`,
                    color:RC[u.role], fontSize:9, fontFamily:T.font, fontWeight:600, letterSpacing:.8,
                  }}>{u.role}</span>
                </td>
                <td style={td}>
                  <span style={{color: u.active ? '#22c55e' : T.dim, fontFamily:T.font, fontSize:11, display:'flex', alignItems:'center', gap:5}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background: u.active ? '#22c55e' : T.dim,flexShrink:0}}></span>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{...td, color:T.dim}}>2025-0{i+1}</td>
                <td style={td}>
                  <div style={{display:'flex', gap:6}}>
                    <Btn label="Edit" small />
                    {u.role !== 'ADMIN' && (
                      <Btn label={u.active ? 'Disable' : 'Enable'} small
                        onClick={() => setUsers(users.map(uu => uu.id===u.id ? {...uu, active:!uu.active} : uu))} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{
          background:T.card, border:`1.5px dashed ${T.accentMid}`,
          borderRadius:8, padding:20, maxWidth:420,
        }}>
          <div style={{color:T.accent, fontFamily:T.font, fontSize:12, fontWeight:600, letterSpacing:.8, marginBottom:14}}>+ New User</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[['Display Name','Full name…','name','text'],['Username','login_handle','user','text'],['Password','••••••••','pass','password']].map(([l,p,k,t]) => (
              <div key={k}>
                <div style={{color:T.muted,fontFamily:T.font,fontSize:9,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>{l}</div>
                <input className="gc-input" type={t} placeholder={p} value={form[k]}
                  onChange={e => setForm({...form, [k]:e.target.value})} style={{width:'100%'}}/>
              </div>
            ))}
            <div>
              <div style={{color:T.muted,fontFamily:T.font,fontSize:9,textTransform:'uppercase',letterSpacing:1,marginBottom:5}}>Role</div>
              <select className="gc-select" value={form.role} onChange={e => setForm({...form, role:e.target.value})} style={{width:'100%'}}>
                {['ARTIST','REVIEWER','ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {formErr && <div style={{color:'#f87171',fontFamily:T.font,fontSize:11}}>{formErr}</div>}
            <div style={{display:'flex', gap:8, marginTop:4}}>
              <Btn label="Cancel" onClick={() => { setShowForm(false); setFormErr(''); }}/>
              <Btn label="Create User" primary onClick={createUser}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { LoginScreen, DashboardScreen, AdminScreen });
