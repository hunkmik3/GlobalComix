// gc-tracker.jsx — Panel Tracker Table + Panel Detail Modal

const { useState } = React;

const PANELS = [
  { id:1, stt:'001', name:'MAGMEL_CHAP1_PANEL001', sf_a:'Sora P',  sf_s:'Approved',     sf_old:true,  sf_new:true,  vid_a:'Min H',  vid_s:'In Progress', vid_old:false, vid_new:false },
  { id:2, stt:'002', name:'MAGMEL_CHAP1_PANEL002', sf_a:'Sora P',  sf_s:'Approved',     sf_old:true,  sf_new:true,  vid_a:'Min H',  vid_s:'Review',      vid_old:false, vid_new:false },
  { id:3, stt:'003', name:'MAGMEL_CHAP1_PANEL003', sf_a:'Dae J',   sf_s:'In Progress',  sf_old:true,  sf_new:false, vid_a:'Min H',  vid_s:'Review',      vid_old:false, vid_new:false },
  { id:4, stt:'004', name:'MAGMEL_CHAP1_PANEL004', sf_a:'Dae J',   sf_s:'Review',       sf_old:true,  sf_new:false, vid_a:null,     vid_s:'Review',      vid_old:false, vid_new:false },
  { id:5, stt:'005', name:'MAGMEL_CHAP1_PANEL005', sf_a:'Ji W',    sf_s:'Rejected',     sf_old:true,  sf_new:false, vid_a:null,     vid_s:'Review',      vid_old:false, vid_new:false },
  { id:6, stt:'006', name:'MAGMEL_CHAP1_PANEL006', sf_a:'Ji W',    sf_s:'Review',       sf_old:false, sf_new:false, vid_a:null,     vid_s:'Review',      vid_old:false, vid_new:false },
  { id:7, stt:'007', name:'MAGMEL_CHAP1_PANEL007', sf_a:'Sora P',  sf_s:'Done',         sf_old:true,  sf_new:true,  vid_a:'Dae J',  vid_s:'Done',        vid_old:true,  vid_new:true  },
  { id:8, stt:'008', name:'MAGMEL_CHAP1_PANEL008', sf_a:'Min H',   sf_s:'In Progress',  sf_old:false, sf_new:false, vid_a:'Ji W',   vid_s:'Review',      vid_old:false, vid_new:false },
  { id:9, stt:'009', name:'MAGMEL_CHAP1_PANEL009', sf_a:'Dae J',   sf_s:'Review',       sf_old:true,  sf_new:false, vid_a:'Ji W',   vid_s:'Review',      vid_old:false, vid_new:false },
  { id:10,stt:'010', name:'MAGMEL_CHAP1_PANEL010', sf_a:'Sora P',  sf_s:'Approved',     sf_old:true,  sf_new:true,  vid_a:'Min H',  vid_s:'Approved',    vid_old:true,  vid_new:true  },
];

const STATUS_OPTS = ['Review', 'In Progress', 'Approved', 'Rejected', 'Done'];
const ARTISTS = ['Sora P', 'Dae J', 'Ji W', 'Min H'];

// ── Panel Detail Modal ────────────────────────────────────────────────

const PanelModal = ({ panel, onClose, onSave }) => {
  const [sfStatus,  setSfStatus]  = useState(panel.sf_s);
  const [vidStatus, setVidStatus] = useState(panel.vid_s);
  const [sfAssigned,  setSfAssigned]  = useState(panel.sf_a || '');
  const [vidAssigned, setVidAssigned] = useState(panel.vid_a || '');

  const selStyle = {
    width:'100%', background:T.card, border:`1px solid ${T.borderHi}`,
    color:T.text, fontFamily:T.font, fontSize:12, padding:'7px 10px',
    borderRadius:4, appearance:'none', cursor:'pointer',
  };

  const UpSlot = ({ hasImg, label }) => (
    <div className="gc-upslot" style={{
      width:136, height:100, borderRadius:5, cursor:'pointer',
      background: hasImg
        ? 'repeating-linear-gradient(135deg,#1e1e1e 0,#1e1e1e 4px,#131313 4px,#131313 12px)'
        : T.card,
      border:`1.5px dashed ${hasImg ? T.borderHi : T.accentMid}`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
    }}>
      {!hasImg && <span style={{color:T.accentMid, fontSize:24, lineHeight:1}}>+</span>}
      <span style={{color: hasImg ? T.muted : T.muted, fontFamily:T.font, fontSize:9, textAlign:'center', padding:'0 8px', lineHeight:1.5}}>{label}</span>
    </div>
  );

  const SectionForm = ({ title, assigned, setAssigned, hasOld, hasNew, status, setStatus }) => (
    <div style={{border:`1px solid ${T.borderHi}`, borderRadius:7, padding:14, background:T.bg}}>
      <div style={{color:T.accent, fontFamily:T.font, fontSize:11, fontWeight:600, letterSpacing:1.2, textTransform:'uppercase', marginBottom:12}}>{title}</div>
      <div style={{display:'flex', gap:10, marginBottom:12}}>
        <div style={{flex:1}}>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1, marginBottom:5}}>Assigned To</div>
          <select value={assigned} onChange={e => setAssigned(e.target.value)} style={selStyle}>
            <option value="">Unassigned</option>
            {ARTISTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{width:136}}>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1, marginBottom:5}}>Status</div>
          <select value={status} onChange={e => setStatus(e.target.value)} style={selStyle}>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:'flex', gap:10}}>
        <div>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1, marginBottom:5}}>Old Version</div>
          <UpSlot hasImg={hasOld} label={hasOld ? 'v1_original.jpg' : 'Upload image'} />
        </div>
        <div>
          <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1, marginBottom:5}}>New Version</div>
          <UpSlot hasImg={hasNew} label={hasNew ? 'v2_revised.jpg' : 'Drop or click to upload'} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="gc-modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.78)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:1000, padding:24}}>
      <div style={{
        width:900, background:T.card, border:`1px solid ${T.borderHi}`, borderRadius:10,
        display:'flex', flexDirection:'column', overflow:'hidden',
        boxShadow:'0 40px 120px rgba(0,0,0,.85)', maxHeight:'92vh',
      }}>
        {/* Header */}
        <div style={{display:'flex', alignItems:'center', gap:12, padding:'12px 20px',
          borderBottom:`1px solid ${T.border}`, background:T.surf, flexShrink:0}}>
          <div>
            <div style={{color:T.accent, fontFamily:T.font, fontSize:14, fontWeight:600, letterSpacing:.5}}>{panel.name}</div>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:10, marginTop:2, letterSpacing:.3}}>Chapter 1 · Panel #{panel.stt}</div>
          </div>
          <div style={{flex:1}}/>
          <Badge status={sfStatus} />
          <button onClick={onClose} style={{background:'none', border:`1px solid ${T.border}`,
            color:T.muted, fontSize:14, cursor:'pointer', padding:'4px 10px',
            borderRadius:4, fontFamily:T.font, lineHeight:1, marginLeft:8}}>✕ Close</button>
        </div>

        {/* Body */}
        <div style={{display:'flex', gap:20, padding:'18px 20px', overflow:'auto'}}>
          {/* Origin Comic */}
          <div style={{flexShrink:0, width:200}}>
            <div style={{color:T.muted, fontFamily:T.font, fontSize:9, textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>Origin Comic</div>
            <div style={{
              width:200, height:290, borderRadius:6, overflow:'hidden',
              background:'repeating-linear-gradient(135deg,#1e1e1e 0,#1e1e1e 4px,#131313 4px,#131313 12px)',
              border:`1px solid ${T.borderHi}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative',
            }}>
              <div style={{position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,.5))'}}></div>
              <span style={{color:T.dim, fontFamily:T.font, fontSize:10, textAlign:'center', padding:16, lineHeight:1.8, position:'relative'}}>origin<br/>comic<br/>reference</span>
            </div>
            <div style={{marginTop:10}}><Btn label="↺ Replace" small /></div>
          </div>

          {/* Style Frame + Video */}
          <div style={{flex:1, display:'flex', flexDirection:'column', gap:12, minWidth:0}}>
            <SectionForm title="Style Frame"
              assigned={sfAssigned} setAssigned={setSfAssigned}
              hasOld={panel.sf_old} hasNew={panel.sf_new}
              status={sfStatus} setStatus={setSfStatus} />
            <SectionForm title="Video"
              assigned={vidAssigned} setAssigned={setVidAssigned}
              hasOld={panel.vid_old} hasNew={panel.vid_new}
              status={vidStatus} setStatus={setVidStatus} />
          </div>
        </div>

        {/* Footer */}
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, padding:'10px 20px',
          borderTop:`1px solid ${T.border}`, background:T.surf, flexShrink:0}}>
          <Btn label="Cancel" onClick={onClose} />
          <Btn label="Save Changes" primary onClick={() => {
            onSave({ ...panel, sf_s:sfStatus, vid_s:vidStatus, sf_a:sfAssigned, vid_a:vidAssigned });
            onClose();
          }} />
        </div>
      </div>
    </div>
  );
};

// ── Tracker Table ─────────────────────────────────────────────────────

const TrackerScreen = ({ chapter=0 }) => {
  const [panels,         setPanels]         = useState(PANELS);
  const [selectedPanel,  setSelectedPanel]  = useState(null);
  const [statusFilter,   setStatusFilter]   = useState('All');
  const [artistFilter,   setArtistFilter]   = useState('All');
  const [search,         setSearch]         = useState('');

  const filtered = panels.filter(p => {
    const sfMatch  = statusFilter === 'All' || p.sf_s  === statusFilter || p.vid_s === statusFilter;
    const artMatch = artistFilter === 'All' || p.sf_a  === artistFilter || p.vid_a === artistFilter;
    const srMatch  = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return sfMatch && artMatch && srMatch;
  });

  const th = {
    color:T.muted, fontFamily:T.font, fontSize:9, fontWeight:500,
    padding:'6px 8px', textAlign:'left',
    borderBottom:`1px solid ${T.borderHi}`, background:T.surf,
    whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:.8,
    userSelect:'none', position:'sticky', top:0, zIndex:2,
  };
  const gh = {
    background:T.accentLo, color:T.accent, fontFamily:T.font,
    fontSize:9, fontWeight:600, padding:'4px 8px', textAlign:'center',
    borderBottom:`1px solid ${T.borderHi}`, letterSpacing:1.2,
    textTransform:'uppercase', position:'sticky', top:0, zIndex:2,
    borderLeft:`1px solid ${T.accentMid}`,
  };
  const td = {
    color:T.text, fontFamily:T.font, fontSize:12,
    padding:'0 8px', borderBottom:`1px solid ${T.border}`,
    verticalAlign:'middle', height:42,
  };

  return (
    <div style={{width:'100%', height:'100%', background:T.bg, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      {/* Toolbar */}
      <div style={{display:'flex', alignItems:'center', gap:8, padding:'8px 16px',
        borderBottom:`1px solid ${T.border}`, background:T.surf, flexShrink:0}}>
        <span style={{color:T.text, fontFamily:T.font, fontSize:14, fontWeight:600}}>Chapter 1</span>
        <span style={{color:T.dim, fontFamily:T.font, fontSize:11}}>— {filtered.length}/{panels.length} panels</span>
        <div style={{flex:1}}/>
        <input className="gc-input" placeholder="Search panel…" value={search}
          onChange={e => setSearch(e.target.value)} style={{width:170}} />
        <select className="gc-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{width:120}}>
          <option value="All">All Status</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="gc-select" value={artistFilter} onChange={e => setArtistFilter(e.target.value)} style={{width:110}}>
          <option value="All">All Artists</option>
          {ARTISTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <Btn label="↓ Export" />
        <Btn label="+ Panel" primary />
      </div>

      {/* Table */}
      <div style={{flex:1, overflow:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse', tableLayout:'fixed'}}>
          <colgroup>
            <col style={{width:44}}/><col style={{width:216}}/><col style={{width:68}}/>
            <col style={{width:96}}/><col style={{width:68}}/><col style={{width:68}}/><col style={{width:104}}/>
            <col style={{width:96}}/><col style={{width:68}}/><col style={{width:68}}/><col style={{width:104}}/>
            <col style={{width:44}}/>
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={th}>STT</th>
              <th rowSpan={2} style={th}>Panel Name</th>
              <th rowSpan={2} style={{...th, textAlign:'center'}}>Origin</th>
              <th colSpan={4} style={gh}>STYLE FRAME</th>
              <th colSpan={4} style={{...gh, borderLeft:`1px solid ${T.accentMid}`}}>VIDEO</th>
              <th rowSpan={2} style={th}></th>
            </tr>
            <tr>
              {['Assigned','Old','New','Status','Assigned','Old','New','Status'].map((h,i) => (
                <th key={i} style={{...th, textAlign: (h==='Old'||h==='New') ? 'center' : 'left',
                  borderLeft: i===4 ? `1px solid ${T.accentMid}` : 'none'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i) => (
              <tr key={p.id} className="gc-row" onClick={() => setSelectedPanel(p)}
                style={{background: i%2===0 ? T.bg : '#0c0c0c', cursor:'pointer'}}>
                <td style={{...td, color:T.dim, fontSize:11}}>{p.stt}</td>
                <td style={{...td, color:T.accent, fontSize:11, fontWeight:500, letterSpacing:.3}}>{p.name}</td>
                <td style={{...td, textAlign:'center'}}><ImgThumb hasImage w={52} h={34}/></td>
                {/* Style Frame */}
                <td style={td}><div style={{display:'flex', alignItems:'center', gap:6}}>
                  <Av name={p.sf_a} size={20}/>
                  <span style={{fontSize:11, color:T.muted, letterSpacing:.2}}>{p.sf_a}</span>
                </div></td>
                <td style={{...td, textAlign:'center'}}><ImgThumb hasImage={p.sf_old} w={52} h={34}/></td>
                <td style={{...td, textAlign:'center'}}><ImgThumb hasImage={p.sf_new} w={52} h={34}/></td>
                <td style={td}><Badge status={p.sf_s}/></td>
                {/* Video */}
                <td style={{...td, borderLeft:`1px solid ${T.border}`}}>
                  {p.vid_a
                    ? <div style={{display:'flex', alignItems:'center', gap:6}}><Av name={p.vid_a} size={20}/><span style={{fontSize:11, color:T.muted}}>{p.vid_a}</span></div>
                    : <span style={{color:T.dim, fontSize:11}}>—</span>}
                </td>
                <td style={{...td, textAlign:'center'}}>{p.vid_a ? <ImgThumb hasImage={p.vid_old} w={52} h={34}/> : <span style={{color:T.dim}}>—</span>}</td>
                <td style={{...td, textAlign:'center'}}>{p.vid_a ? <ImgThumb hasImage={p.vid_new} w={52} h={34}/> : <span style={{color:T.dim}}>—</span>}</td>
                <td style={td}><Badge status={p.vid_s}/></td>
                <td style={{...td, color:T.muted, textAlign:'center', fontSize:16, letterSpacing:1}}>···</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{padding:'48px 0', textAlign:'center'}}>
            <div style={{color:T.dim, fontFamily:T.font, fontSize:13}}>No panels match the current filter.</div>
          </div>
        )}

        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:8, padding:'10px 16px', borderTop:`1px solid ${T.border}`}}>
          <span style={{color:T.dim, fontFamily:T.font, fontSize:10, letterSpacing:.3}}>
            Showing {filtered.length} of {panels.length} panels
          </span>
          <div style={{display:'flex', gap:6}}>
            <Btn label="← Prev" small />
            <Btn label="Next →" small />
          </div>
        </div>
      </div>

      {selectedPanel && (
        <PanelModal
          panel={selectedPanel}
          onClose={() => setSelectedPanel(null)}
          onSave={updated => {
            setPanels(panels.map(p => p.id === updated.id ? updated : p));
            setSelectedPanel(null);
          }}
        />
      )}
    </div>
  );
};

Object.assign(window, { TrackerScreen, PanelModal, PANELS });
