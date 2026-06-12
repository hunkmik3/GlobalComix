// gc-main.jsx — App routing + root render

const { useState } = React;

const App = () => {
  const [screen,        setScreen]        = useState('login');
  const [user,          setUser]          = useState(null);
  const [activeChapter, setActiveChapter] = useState(0);

  const chapters = ['Chapter 1', 'Chapter 2', 'Chapter 3'];

  if (screen === 'login') {
    return (
      <div style={{width:'100vw', height:'100vh'}}>
        <LoginScreen onLogin={u => { setUser(u); setScreen('dashboard'); }} />
      </div>
    );
  }

  const isTracker = screen === 'tracker';

  return (
    <div style={{width:'100vw', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', background:T.bg}}>
      {isTracker ? (
        /* ── Tracker layout: full-width top nav ── */
        <>
          <TopNav
            chapters={chapters}
            activeChapter={activeChapter}
            onChapter={i => setActiveChapter(i)}
            onBack={() => setScreen('dashboard')}
            right={
              <div style={{display:'flex', alignItems:'center', gap:8, marginRight:8}}>
                <span style={{color:T.muted, fontFamily:T.font, fontSize:11}}>{user?.name}</span>
                <div onClick={() => setScreen('admin')} style={{cursor:'pointer'}}>
                  <Av name={user?.name || 'A'} size={30}/>
                </div>
              </div>
            }
          />
          <TrackerScreen chapter={activeChapter} />
        </>
      ) : (
        /* ── Sidebar layout: Dashboard + Admin ── */
        <div style={{flex:1, display:'flex', overflow:'hidden'}}>
          <Sidebar
            activeChapter={activeChapter}
            onChapter={i => { setActiveChapter(i); setScreen('dashboard'); }}
            onNavigate={setScreen}
            screen={screen}
            user={user}
          />
          <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
            {/* Breadcrumb nav bar */}
            <div style={{
              height:44, background:T.surf, borderBottom:`1px solid ${T.border}`,
              display:'flex', alignItems:'center', padding:'0 20px', gap:0, flexShrink:0,
            }}>
              {[{l:'Dashboard',s:'dashboard'},{l:'Tracker',s:'tracker'},{l:'Admin',s:'admin'}].map(({l,s}) => (
                <div key={s} className="gc-nav-tab" onClick={() => setScreen(s)} style={{
                  padding:'0 14px', height:44, display:'flex', alignItems:'center',
                  color: screen===s ? T.text : T.muted,
                  fontFamily:T.font, fontSize:12,
                  borderBottom: screen===s ? `2px solid ${T.accent}` : '2px solid transparent',
                  fontWeight: screen===s ? 500 : 400, cursor:'pointer',
                }}>{l}</div>
              ))}
              <div style={{flex:1}}/>
              <span style={{color:T.dim, fontFamily:T.font, fontSize:10, letterSpacing:.3, marginRight:10}}>
                {user?.role}
              </span>
              <div onClick={() => setScreen('login')} style={{cursor:'pointer'}}>
                <Av name={user?.name || 'A'} size={28}/>
              </div>
            </div>

            {/* Screen content */}
            {screen === 'admin'
              ? <AdminScreen />
              : <DashboardScreen
                  onNavigate={setScreen}
                  activeChapter={activeChapter}
                  onChapter={setActiveChapter}
                />
            }
          </div>
        </div>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
