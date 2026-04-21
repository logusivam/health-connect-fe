import { useEffect } from 'react';
import favIcon from '../assets/logo-v1.png';

export default function HomePage() {
  // We use standard hard navigation to sandbox the heavy 3D/GSAP scripts.
  // This clears the memory and ensures the Dashboards boot up perfectly clean.
  const routeToApp = (path: string) => {
    window.location.href = path;
  };

  useEffect(() => {
    // 1. Dynamically inject the CSS so it doesn't leak into the global React app
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/assets/css/style.css';
    document.head.appendChild(styleLink);

    // 2. Dynamically inject the heavy Vanilla JS
    const script = document.createElement('script');
    script.src = '/assets/js/script.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on the rare chance of a hot-reload during development
      if (document.head.contains(styleLink)) document.head.removeChild(styleLink);
      if (document.body.contains(script)) document.body.removeChild(script);
      document.body.style.overflow = '';
      document.body.classList.remove('hov');
    };
  }, []);

  return (
    <>
      {/* LOADER */}
      <div id="loader">
        <div className="ld-ring ld-r1"></div>
        <div className="ld-ring ld-r2"></div>
        <div className="ld-ring ld-r3"></div>
        <div className="ld-inner">
          <div className="ld-logo"><img src={favIcon} alt="HealthConnect Logo" className='w-12 h-12 ' /></div>
          <div className="ld-bar-wrap">
            <div className="ld-bar" id="ldb"></div>
            <div className="ld-bar-glow" id="ldg"></div>
          </div>
          <div className="ld-pct" id="ldp">0%</div>
        </div>
      </div>

      {/* CURSOR */}
      <div id="c-dot"></div>
      <div id="c-ring"></div>
      <div id="c-trail"></div>

      {/* THREE.JS CANVAS */}
      <canvas id="bg"></canvas>
      <div className="grid"></div>
      <div className="vignette"></div>

      {/* SCROLL PROGRESS */}
      <div id="spb"></div>

      {/* NAV */}
      <nav id="nav">
        <a href="/" className="nav-brand flex items-center gap-2">
          <img src={favIcon} alt="HealthConnect Logo" className="w-10 h-10" />
          <span>Health<b>Connect</b></span>
        </a>
        <ul className="nav-links" id="nav-links">
          <li><a href="#patient-role">Patient</a></li>
          <li><a href="#doctor-role">Doctor</a></li>
          <li><a href="#admin-role">Admin</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#stats">Stats</a></li>
        </ul>
        <div className="mw" id="nav-pill-wrap">
          <button onClick={() => routeToApp('/register')} className="nav-pill" style={{ cursor: 'none', border: 'none' }}>Get Started</button>
        </div>
        <button className="nav-ham" id="nav-ham" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </nav>

      {/* MOBILE MENU DRAWER */}
      <div id="mob-menu">
        <a href="#patient-role">Patient</a>
        <a href="#doctor-role">Doctor</a>
        <a href="#admin-role">Admin</a>
        <a href="#features">Features</a>
        <a href="#stats">Stats</a>
        <button onClick={() => routeToApp('/register')} className="mob-pill" style={{ cursor: 'none', border: 'none'  }}>Get Started</button>
      </div>

      <main>
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section id="hero">
          <div className="hero-aurora">
            <div className="aurora-orb ao1"></div>
            <div className="aurora-orb ao2"></div>
            <div className="aurora-orb ao3"></div>
          </div>

          <div className="h-eyebrow" id="eyebrow">
            <span className="eye-dot"></span>
            Unified Healthcare Platform · 2026
          </div>

          <h1 className="h-title" id="htitle">
            <div className="line-break">
              <span className="word" data-word="One">One</span>
              <span className="word" data-word="Platform,">Platform,</span>
            </div>
            <div className="line-break">
              <span className="word grad-b" data-word="Every">Every</span>
              <span className="word" data-word="Role.">Role.</span>
            </div>
            <div className="line-break">
              <span className="word grad-t" data-word="Every">Every</span>
              <span className="word" data-word="Need.">Need.</span>
            </div>
          </h1>

          <p className="h-sub" id="hsub">HealthConnect bridges patients, doctors, and administrators into one seamless ecosystem — streamlining appointments, records, and care from a single intelligent dashboard.</p>

          <div className="h-ctas" id="hctas">
            <div className="mw">
              <button onClick={() => routeToApp('/login')} className="btn-solid" style={{ cursor: 'none', border: 'none', display: 'flex', alignItems: 'center' }}>
                Explore Portals <span className="cta-arr">→</span>
              </button>
            </div>
            <div className="mw"><a href="#features" className="btn-out">See Features</a></div>
          </div>

          <div className="scroll-cue">
            <div className="sc-mouse"><div className="sc-ball"></div></div>
            <span>Scroll to explore</span>
          </div>

          {/* 3D DASHBOARD SCENE */}
          <div className="h-scene" id="hscene">
            <div className="dc dc-left">
              <div className="dp">
                <div className="side-label">Patient Portal</div>
                <div className="ring-wrap">
                  <div className="rw">
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="5"/>
                      <circle cx="30" cy="30" r="22" fill="none" stroke="#2563eb" strokeWidth="5" strokeDasharray="138.2" strokeDashoffset="34" strokeLinecap="round"/>
                    </svg>
                    <div className="rl"><span className="rv" style={{ color: 'var(--b4)' }}>75%</span><span className="rs2">Health</span></div>
                  </div>
                </div>
                <div className="pill"><span className="pd pdb"></span>Book Appointment</div>
                <div className="pill"><span className="pd pdg"></span>Visit History</div>
                <div className="pill"><span className="pd pdb"></span>Medicine Log</div>
                <div className="pill"><span className="pd pdt"></span>My Profile</div>
              </div>
            </div>

            <div className="dc dc-main" id="dcmain">
              <div className="dp">
                <div className="d-dots"><s className="dr"></s><s className="dy"></s><s className="dg"></s></div>
                <div className="d-label">HealthConnect — Admin Dashboard</div>
                <div className="d-stats">
                  <div className="ds"><div className="ds-l">Patients</div><div className="ds-v vb">2,847</div><div className="ds-d up">↑ 12% this month</div></div>
                  <div className="ds"><div className="ds-l">Doctors</div><div className="ds-v vt">184</div><div className="ds-d up">↑ 3 new</div></div>
                  <div className="ds"><div className="ds-l">Appts</div><div className="ds-v vi">638</div><div className="ds-d dn">↓ 4% this week</div></div>
                </div>
                <div className="d-chart">
                  <div className="dbar" style={{ height: '37%' }}></div><div className="dbar" style={{ height: '54%' }}></div>
                  <div className="dbar" style={{ height: '45%' }}></div><div className="dbar" style={{ height: '71%' }}></div>
                  <div className="dbar t" style={{ height: '58%' }}></div><div className="dbar t" style={{ height: '84%' }}></div>
                  <div className="dbar t" style={{ height: '67%' }}></div><div className="dbar" style={{ height: '91%' }}></div>
                  <div className="dbar" style={{ height: '62%' }}></div><div className="dbar t" style={{ height: '77%' }}></div>
                  <div className="dbar" style={{ height: '50%' }}></div><div className="dbar t" style={{ height: '97%', opacity: 1 }}></div>
                </div>
                <div className="d-rows">
                  <div className="dr2"><div className="dav avb">AR</div><span className="drow-n">Arjun R. booked appointment</span><span className="dbadge bg">Done</span></div>
                  <div className="dr2"><div className="dav avt">DK</div><span className="drow-n">Dr. Kavitha added treatment</span><span className="dbadge bb">Record</span></div>
                  <div className="dr2"><div className="dav avi">SA</div><span className="drow-n">Admin altered patient data</span><span className="dbadge by">Edit</span></div>
                </div>
              </div>
            </div>

            <div className="dc dc-right">
              <div className="dp">
                <div className="side-label">Doctor Portal</div>
                <div className="pill"><span className="pd pdt"></span>Create Treatment</div>
                <div className="pill"><span className="pd pdg"></span>Patient Records</div>
                <div className="pill"><span className="pd pdt"></span>Unflag Medicine</div>
                <div className="pill"><span className="pd pdb"></span>Edit Profile</div>
                <div className="pill"><span className="pd pdi"></span>Consultations</div>
                <div className="next-appt">
                  <div className="na-l">Next Patient</div>
                  <div className="na-n">Priya S. — 2:30 PM</div>
                  <div className="na-s">Cardiology Review</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="hr" id="hr1"></div>

        {/* ═════════════════════ ROLES SECTION ══════════════════ */}
        <section id="roles" className="section">
          <p className="sec-eyebrow"><span>Role-Based Portals</span></p>
          <h2 className="sec-title"><span>Built for <span className="anim-grad">Every</span> Role</span></h2>
          <p className="sec-desc" id="roles-desc">Three dedicated portals, one connected platform. Each experience precisely tailored to what matters most.</p>

          <div className="roles-wrap">
            {/* ─── PATIENT ─── */}
            <div className="role-row" id="patient-role">
              <div className="role-particles" id="prp"></div>
              <div className="role-text">
                <div className="role-badge rb-p">
                  <svg className="rb-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
                  </svg>
                  Patient Portal
                </div>
                <h3 className="role-name"><span>Your Personal<br />Health Hub</span></h3>
                <p className="role-desc">A personal health companion that puts you in control of your entire medical journey — from booking to billing to prescriptions, all in one seamless experience.</p>
                <ul className="role-feats">
                  <li className="rfeat"><div className="rfeat-check rch-p"><svg fill="none" stroke="#60a5fa" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Book &amp; manage appointments instantly</li>
                  <li className="rfeat"><div className="rfeat-check rch-p"><svg fill="none" stroke="#60a5fa" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Complete visit history &amp; treatment timeline</li>
                  <li className="rfeat"><div className="rfeat-check rch-p"><svg fill="none" stroke="#60a5fa" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Medicine history &amp; active prescriptions</li>
                  <li className="rfeat"><div className="rfeat-check rch-p"><svg fill="none" stroke="#60a5fa" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Personal profile &amp; health records</li>
                  <li className="rfeat"><div className="rfeat-check rch-p"><svg fill="none" stroke="#60a5fa" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Real-time appointment status updates</li>
                </ul>
                <a href="#features" className="role-cta rc-p">Patient Features <span className="cta-arr">→</span></a>
              </div>
              <div className="role-vis rvis-p tilt" id="pvis">
                <div className="role-vis-inner">
                  <div className="rvis-head">
                    <span className="rvis-title">Appointments</span>
                    <div className="rvis-status"><div className="rvis-dot"></div>Live</div>
                  </div>
                  <div className="appt-list">
                    <div className="appt-item">
                      <div className="appt-info"><span className="appt-doc">Dr. Kavitha R.</span><span className="appt-type">Cardiology Check-up</span></div>
                      <span className="appt-time">Today 2:30</span>
                    </div>
                    <div className="appt-item">
                      <div className="appt-info"><span className="appt-doc">Dr. Suresh M.</span><span className="appt-type">Follow-up Visit</span></div>
                      <span className="appt-time" style={{ color: 'var(--t4)' }}>Fri 10:00</span>
                    </div>
                    <div className="appt-item">
                      <div className="appt-info"><span className="appt-doc">Dr. Priya N.</span><span className="appt-type">Routine Checkup</span></div>
                      <span className="appt-time" style={{ color: 'var(--s4)' }}>Mar 28</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '.66rem', color: 'var(--s5)', marginBottom: '.55rem', textTransform: 'uppercase', letterSpacing: '.09em' }}>Active Medicines</div>
                  <div className="med-strip">
                    <span className="med-pill">Metformin 500mg</span>
                    <span className="med-pill">Lisinopril</span>
                    <span className="med-pill">Atorvastatin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── DOCTOR ─── */}
            <div className="role-row rev" id="doctor-role">
              <div className="role-particles" id="drp"></div>
              <div className="role-text">
                <div className="role-badge rb-d">
                  <svg className="rb-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 8.414V19a2 2 0 0 1-2 2z"/>
                  </svg>
                  Doctor Portal
                </div>
                <h3 className="role-name"><span>Clinical<br />Workspace</span></h3>
                <p className="role-desc">A powerful clinical dashboard built for precision. Manage patient records, treatment histories, and medication flags with complete context at your fingertips.</p>
                <ul className="role-feats">
                  <li className="rfeat"><div className="rfeat-check rch-d"><svg fill="none" stroke="#5eead4" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Create detailed treatment histories</li>
                  <li className="rfeat"><div className="rfeat-check rch-d"><svg fill="none" stroke="#5eead4" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Generate &amp; manage patient records</li>
                  <li className="rfeat"><div className="rfeat-check rch-d"><svg fill="none" stroke="#5eead4" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Unflag medicines with approval workflow</li>
                  <li className="rfeat"><div className="rfeat-check rch-d"><svg fill="none" stroke="#5eead4" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>View &amp; edit professional profile</li>
                  <li className="rfeat"><div className="rfeat-check rch-d"><svg fill="none" stroke="#5eead4" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Rich patient consultation timeline</li>
                </ul>
                <a href="#features" className="role-cta rc-d">Doctor Features <span className="cta-arr">→</span></a>
              </div>
              <div className="role-vis rvis-d tilt" id="dvis">
                <div className="role-vis-inner">
                  <div className="rvis-head">
                    <span className="rvis-title">Patient List</span>
                    <div className="rvis-status" style={{ color: 'var(--t4)' }}><div className="rvis-dot" style={{ background: 'var(--t4)' }}></div>Active</div>
                  </div>
                  <div className="patient-row">
                    <div className="pa-av">RS</div>
                    <div><div className="pa-name">Ravi Shankar</div><div className="pa-diag">Hypertension · Type 2 DM</div></div>
                    <span className="pa-tag pt-active">Active</span>
                  </div>
                  <div className="patient-row">
                    <div className="pa-av" style={{ background: 'rgba(37,99,235,.2)', color: 'var(--b4)' }}>PM</div>
                    <div><div className="pa-name">Priya Mehta</div><div className="pa-diag">Post-op Cardiology</div></div>
                    <span className="pa-tag pt-review">Review</span>
                  </div>
                  <div className="patient-row">
                    <div className="pa-av" style={{ background: 'rgba(99,102,241,.2)', color: '#a5b4fc' }}>AK</div>
                    <div><div className="pa-name">Anand Kumar</div><div className="pa-diag">Routine Follow-up</div></div>
                    <span className="pa-tag pt-active">Active</span>
                  </div>
                  <div style={{ marginTop: '1rem', padding: '.7rem .85rem', background: 'rgba(13,148,136,.08)', borderRadius: '10px', border: '1px solid rgba(13,148,136,.15)' }}>
                    <div style={{ fontSize: '.63rem', color: 'var(--s5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.08em' }}>Flagged Medicine</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.78rem', color: 'var(--s2)' }}>Warfarin 5mg — Ravi S.</span>
                      <span style={{ fontSize: '.68rem', padding: '2px 8px', background: 'rgba(13,148,136,.2)', color: 'var(--t4)', borderRadius: '100px', cursor: 'none' }}>Unflag →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── ADMIN ─── */}
            <div className="role-row" id="admin-role">
              <div className="role-particles" id="arp"></div>
              <div className="role-text">
                <div className="role-badge rb-a">
                  <svg className="rb-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                  </svg>
                  Admin Portal
                </div>
                <h3 className="role-name"><span>Platform<br />Control Center</span></h3>
                <p className="role-desc">Total administrative authority. Read, modify, or remove any patient or doctor data across the entire platform — with full audit visibility and governance.</p>
                <ul className="role-feats">
                  <li className="rfeat"><div className="rfeat-check rch-a"><svg fill="none" stroke="#c7d2fe" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Full read access to all records</li>
                  <li className="rfeat"><div className="rfeat-check rch-a"><svg fill="none" stroke="#c7d2fe" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Modify any patient or doctor data</li>
                  <li className="rfeat"><div className="rfeat-check rch-a"><svg fill="none" stroke="#c7d2fe" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>Delete records with full audit trail</li>
                  <li className="rfeat"><div className="rfeat-check rch-a"><svg fill="none" stroke="#c7d2fe" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>System-wide analytics &amp; reporting</li>
                  <li className="rfeat"><div className="rfeat-check rch-a"><svg fill="none" stroke="#c7d2fe" strokeWidth="2.5" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg></div>User access management &amp; permissions</li>
                </ul>
                <a href="#features" className="role-cta rc-a">Admin Features <span className="cta-arr">→</span></a>
              </div>
              <div className="role-vis rvis-a tilt" id="avis">
                <div className="role-vis-inner">
                  <div className="rvis-head">
                    <span className="rvis-title">Platform Overview</span>
                    <div className="rvis-status" style={{ color: '#a5b4fc' }}><div className="rvis-dot" style={{ background: '#a5b4fc' }}></div>Admin</div>
                  </div>
                  <div className="admin-grid">
                    <div className="ag-item"><div className="ag-val agvb" data-ct="2847">0</div><div className="ag-lbl">Total Patients</div><div className="ag-bar"><div className="ag-bar-fill afb" style={{ width: 0 }} data-w="75%"></div></div></div>
                    <div className="ag-item"><div className="ag-val agvt" data-ct="184">0</div><div className="ag-lbl">Doctors</div><div className="ag-bar"><div className="ag-bar-fill aft" style={{ width: 0 }} data-w="45%"></div></div></div>
                    <div className="ag-item"><div className="ag-val agvi" data-ct="638">0</div><div className="ag-lbl">Active Appts</div><div className="ag-bar"><div className="ag-bar-fill afi" style={{ width: 0 }} data-w="60%"></div></div></div>
                    <div className="ag-item"><div className="ag-val agvg">99%</div><div className="ag-lbl">Uptime</div><div className="ag-bar"><div className="ag-bar-fill afg" style={{ width: '99%' }}></div></div></div>
                  </div>
                  <div className="action-log">
                    <div className="al-head">Audit Log</div>
                    <div className="al-row"><div className="al-dot2" style={{ background: 'var(--b4)' }}></div><span className="al-text">Patient record updated · Arjun R.</span><span className="al-time">2m ago</span></div>
                    <div className="al-row"><div className="al-dot2" style={{ background: 'var(--r6)' }}></div><span className="al-text">Doctor record deleted · Admin</span><span className="al-time">14m ago</span></div>
                    <div className="al-row"><div className="al-dot2" style={{ background: 'var(--t4)' }}></div><span className="al-text">New doctor registered · Dr. Shah</span><span className="al-time">1h ago</span></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <div className="hr" id="hr2"></div>

        {/* ═══════════════════════ FEATURES ══════════════════════ */}
        <section id="features" className="section">
          <p className="sec-eyebrow"><span>Platform Capabilities</span></p>
          <h2 className="sec-title"><span>Everything You Need</span></h2>
          <p className="sec-desc" id="feat-desc">Every feature built to eliminate friction. Click any feature to jump to the relevant role portal.</p>

          <div className="feat-tabs">
            <button className="ftab active" data-filter="all">All Features</button>
            <button className="ftab" data-filter="patient" data-goto="patient-role">For Patients</button>
            <button className="ftab" data-filter="doctor" data-goto="doctor-role">For Doctors</button>
            <button className="ftab" data-filter="admin" data-goto="admin-role">For Admins</button>
          </div>

          <div className="feats-grid" id="feats-grid">
            <div className="feat-card" data-role="patient">
              <span className="feat-role-tag frt-p">Patient</span>
              <div className="feat-icon fib">
                <svg width="22" height="22" fill="none" stroke="#60a5fa" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <h4 className="feat-name">Smart Scheduling</h4>
              <p className="feat-text">Book appointments in seconds. Doctors set availability, conflicts auto-resolve, and instant confirmations go to both parties.</p>
              <a href="#patient-role" className="feat-link fl-p">Go to Patient Portal <span>→</span></a>
            </div>

            <div className="feat-card" data-role="doctor">
              <span className="feat-role-tag frt-d">Doctor</span>
              <div className="feat-icon fit">
                <svg width="22" height="22" fill="none" stroke="#2dd4bf" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414A1 1 0 0 1 19 8.414V19a2 2 0 0 1-2 2z"/></svg>
              </div>
              <h4 className="feat-name">Medical Records</h4>
              <p className="feat-text">Structured treatment histories, diagnoses, and clinical notes — versioned and instantly retrievable by authorized practitioners.</p>
              <a href="#doctor-role" className="feat-link fl-d">Go to Doctor Portal <span>→</span></a>
            </div>

            <div className="feat-card" data-role="doctor">
              <span className="feat-role-tag frt-d">Doctor</span>
              <div className="feat-icon fii">
                <svg width="22" height="22" fill="none" stroke="#a5b4fc" strokeWidth="2" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 0 0-1.022-.547l-2.387-.477a6 6 0 0 0-3.86.517l-.318.158a6 6 0 0 1-3.86.517L6.05 15.21a2 2 0 0 0-1.806.547M8 4h8l-1 1v5.172a2 2 0 0 0 .586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 0 0 9 10.172V5L8 4z"/></svg>
              </div>
              <h4 className="feat-name">Medicine Management</h4>
              <p className="feat-text">Flag and unflag medications, track prescriptions, and maintain complete medicine history with doctor-controlled approval flows.</p>
              <a href="#doctor-role" className="feat-link fl-d">Go to Doctor Portal <span>→</span></a>
            </div>

            <div className="feat-card" data-role="admin">
              <span className="feat-role-tag frt-a">Admin</span>
              <div className="feat-icon fig">
                <svg width="22" height="22" fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/></svg>
              </div>
              <h4 className="feat-name">Platform Analytics</h4>
              <p className="feat-text">System-wide metrics — usage trends, appointment rates, patient growth, and health metrics — all unified for admin control.</p>
              <a href="#admin-role" className="feat-link fl-a">Go to Admin Portal <span>→</span></a>
            </div>

            <div className="feat-card" data-role="all">
              <span className="feat-role-tag frt-all">All Roles</span>
              <div className="feat-icon fib">
                <svg width="22" height="22" fill="none" stroke="#60a5fa" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/></svg>
              </div>
              <h4 className="feat-name">Profile Management</h4>
              <p className="feat-text">Every role manages their own profile. Patients update personal data. Doctors manage clinical info. Admins oversee all users.</p>
              <a href="#patient-role" className="feat-link fl-all">Explore All Portals <span>→</span></a>
            </div>

            <div className="feat-card" data-role="admin">
              <span className="feat-role-tag frt-a">Admin</span>
              <div className="feat-icon fii">
                <svg width="22" height="22" fill="none" stroke="#a5b4fc" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4h8z"/></svg>
              </div>
              <h4 className="feat-name">Access Control</h4>
              <p className="feat-text">Role-based permissions ensure each user sees only what they need. Granular read, write, and delete governance for admins.</p>
              <a href="#admin-role" className="feat-link fl-a">Go to Admin Portal <span>→</span></a>
            </div>

            <div className="feat-card" data-role="patient">
              <span className="feat-role-tag frt-p">Patient</span>
              <div className="feat-icon fit">
                <svg width="22" height="22" fill="none" stroke="#2dd4bf" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
              </div>
              <h4 className="feat-name">Visit History</h4>
              <p className="feat-text">A chronological log of every encounter — diagnoses, treatments, prescriptions, and doctor notes — fully searchable at any time.</p>
              <a href="#patient-role" className="feat-link fl-p">Go to Patient Portal <span>→</span></a>
            </div>

            <div className="feat-card" data-role="doctor">
              <span className="feat-role-tag frt-d">Doctor</span>
              <div className="feat-icon fig">
                <svg width="22" height="22" fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z"/></svg>
              </div>
              <h4 className="feat-name">Care Timeline</h4>
              <p className="feat-text">A rich visual timeline of every patient interaction — enabling faster, better-informed clinical decisions backed by full medical context.</p>
              <a href="#doctor-role" className="feat-link fl-d">Go to Doctor Portal <span>→</span></a>
            </div>
          </div>
        </section>

        <div className="hr" id="hr3"></div>

        {/* ═══════════════════════ STATS ═════════════════════════ */}
        <section id="stats" className="section" style={{ textAlign: 'center' }}>
          <p className="sec-eyebrow"><span>Platform Scale</span></p>
          <h2 className="sec-title"><span>Trusted by Thousands</span></h2>
          <p className="sec-desc" id="stats-desc" style={{ marginBottom: '3.5rem' }}>Growing every day — serving patients, clinicians, and administrators across the healthcare ecosystem.</p>

          <div className="stats-row">
            <div className="stat-card" data-delay="0">
              <div className="snum snb" data-t="2847" data-s="">0</div>
              <div className="slabel">Active Patients</div>
              <div className="sbar"><div className="sbfill sfb" data-w="75%"></div></div>
            </div>
            <div className="stat-card" data-delay=".1">
              <div className="snum snt" data-t="184" data-s="">0</div>
              <div className="slabel">Registered Doctors</div>
              <div className="sbar"><div className="sbfill sft" data-w="46%"></div></div>
            </div>
            <div className="stat-card" data-delay=".2">
              <div className="snum sni" data-t="12480" data-s="">0</div>
              <div className="slabel">Appointments Managed</div>
              <div className="sbar"><div className="sbfill sfi" data-w="88%"></div></div>
            </div>
            <div className="stat-card" data-delay=".3">
              <div className="snum sng" data-t="99" data-s="%">0</div>
              <div className="slabel">Platform Uptime</div>
              <div className="sbar"><div className="sbfill sfg" data-w="99%"></div></div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ CTA ═══════════════════════════ */}
        <section id="cta" className="section" style={{ paddingTop: '2rem' }}>
          <div className="cta-island" id="ctabox">
            <div className="cta-ring-el cre1"></div>
            <div className="cta-ring-el cre2"></div>
            <div className="cta-ring-el cre3"></div>
            <div className="cta-eyebrow">Ready to Get Started?</div>
            <h2 className="cta-title">Connect Your Healthcare<br />on One Platform</h2>
            <p className="cta-sub">Join thousands of patients, doctors, and administrators already using HealthConnect to streamline every aspect of healthcare management.</p>
            <div className="cta-btns">
              <div className="mw"><a href="#patient-role" className="btn-solid">Patient Portal →</a></div>
              <div className="mw"><a href="#doctor-role" className="btn-out">Doctor Portal</a></div>
              <div className="mw"><a href="#admin-role" className="btn-out">Admin Portal</a></div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="ft-brand">Health<b>Connect</b></div>
        <ul className="ft-links">
          <li><a href="#patient-role">Patient Portal</a></li>
          <li><a href="#doctor-role">Doctor Portal</a></li>
          <li><a href="#admin-role">Admin Portal</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#stats">Platform Stats</a></li>
        </ul>
        <span className="ft-copy">© 2026 HealthConnect. All rights reserved.</span>
      </footer>
    </>
  );
}