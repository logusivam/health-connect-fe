/* ════════════════════════════════════════
   THREE.JS — Rich Particle + Geometry BG
════════════════════════════════════════ */
(function initThree(){
  const canvas = document.getElementById('bg');
  const R = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
  R.setPixelRatio(Math.min(devicePixelRatio,2));
  R.setSize(innerWidth,innerHeight);
  R.setClearColor(0,0);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,120);
  cam.position.set(0,0,8);


  /* ── Particle network ── */
  const N = 150, pts=[];
  for(let i=0;i<N;i++) pts.push(new THREE.Vector3(
    (Math.random()-.5)*28,(Math.random()-.5)*22,(Math.random()-.5)*14));

  const nBuf=new Float32Array(N*3), nCol=new Float32Array(N*3);
  pts.forEach((p,i)=>{
    nBuf.set([p.x,p.y,p.z],i*3);
    const t=Math.random();
    nCol.set([.1+t*.1,.35+t*.4,.9-t*.1],i*3);
  });
  const pg=new THREE.BufferGeometry();
  pg.setAttribute('position',new THREE.BufferAttribute(nBuf,3));
  pg.setAttribute('color',new THREE.BufferAttribute(nCol,3));
  const pm=new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:.65});
  scene.add(new THREE.Points(pg,pm));

  /* edges */
  const ep=[];
  for(let i=0;i<N;i++) for(let j=i+1;j<N;j++)
    if(pts[i].distanceTo(pts[j])<5) ep.push(pts[i].x,pts[i].y,pts[i].z,pts[j].x,pts[j].y,pts[j].z);
  const eg=new THREE.BufferGeometry();
  eg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(ep),3));
  scene.add(new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x1d4ed8,transparent:true,opacity:.09})));

  /* ── Helper: line from points ── */
  const mkLine=(points,col,op)=>{
    const g=new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op}));
  };
  const mkLines=(segments,col,op)=>{
    const flat=[];segments.forEach(([a,b])=>{flat.push(a.x,a.y,a.z,b.x,b.y,b.z);});
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(flat),3));
    return new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op}));
  };

  /* ════════════════════════
     1. DNA DOUBLE HELIX  (left side, large)
  ════════════════════════ */
  const dnaGroup = new THREE.Group();
  dnaGroup.position.set(-9, 0, -6);
  const strand1=[], strand2=[];
  const rungs=[];
  const dnaLen=80, dnaR=1.4, dnaStep=.22, dnaTwist=.26;
  for(let i=0;i<dnaLen;i++){
    const a=i*dnaTwist, y=i*dnaStep-dnaLen*dnaStep*.5;
    strand1.push(new THREE.Vector3(Math.cos(a)*dnaR, y, Math.sin(a)*dnaR));
    strand2.push(new THREE.Vector3(Math.cos(a+Math.PI)*dnaR, y, Math.sin(a+Math.PI)*dnaR));
  }
  const c1=new THREE.CatmullRomCurve3(strand1);
  const c2=new THREE.CatmullRomCurve3(strand2);
  dnaGroup.add(mkLine(c1.getPoints(300), 0x2dd4bf, .22));
  dnaGroup.add(mkLine(c2.getPoints(300), 0x60a5fa, .22));
  for(let i=0;i<dnaLen;i+=4){
    rungs.push([strand1[i], strand2[i]]);
  }
  dnaGroup.add(mkLines(rungs, 0x818cf8, .16));
  /* base pair dots */
  const bpBuf=new Float32Array(strand1.length*3+strand2.length*3);
  strand1.forEach((p,i)=>bpBuf.set([p.x,p.y,p.z],i*3));
  strand2.forEach((p,i)=>bpBuf.set([p.x,p.y,p.z],(strand1.length+i)*3));
  const bpG=new THREE.BufferGeometry(); bpG.setAttribute('position',new THREE.BufferAttribute(bpBuf,3));
  dnaGroup.add(new THREE.Points(bpG,new THREE.PointsMaterial({size:.08,color:0x2dd4bf,transparent:true,opacity:.35})));
  scene.add(dnaGroup);

  /* ════════════════════════
     2. HEART OUTLINE  (center, theme-colored, animated ECG)
  ════════════════════════ */
  const heartGroup = new THREE.Group();
  heartGroup.position.set(0, 0, -3);

  const hSteps = 180;
  const heartScale = 2.2;

  /* outer heart outline — teal (#2dd4bf) */
  const heartPts = [];
  for(let i=0;i<=hSteps;i++){
    const t2=(i/hSteps)*Math.PI*2;
    const x = heartScale*.0625*(16*Math.pow(Math.sin(t2),3));
    const y = heartScale*.0625*(13*Math.cos(t2)-5*Math.cos(2*t2)-2*Math.cos(3*t2)-Math.cos(4*t2));
    heartPts.push(new THREE.Vector3(x, y, 0));
  }
  const heartOutline = mkLine(heartPts, 0x2dd4bf, .45);
  heartGroup.add(heartOutline);

  /* inner glow ring 1 — blue */
  const heartPts2 = [];
  for(let i=0;i<=hSteps;i++){
    const t2=(i/hSteps)*Math.PI*2, s=.72;
    const x = s*heartScale*.0625*(16*Math.pow(Math.sin(t2),3));
    const y = s*heartScale*.0625*(13*Math.cos(t2)-5*Math.cos(2*t2)-2*Math.cos(3*t2)-Math.cos(4*t2));
    heartPts2.push(new THREE.Vector3(x, y, 0));
  }
  heartGroup.add(mkLine(heartPts2, 0x60a5fa, .18));

  /* inner glow ring 2 — indigo */
  const heartPts3 = [];
  for(let i=0;i<=hSteps;i++){
    const t2=(i/hSteps)*Math.PI*2, s=.44;
    const x = s*heartScale*.0625*(16*Math.pow(Math.sin(t2),3));
    const y = s*heartScale*.0625*(13*Math.cos(t2)-5*Math.cos(2*t2)-2*Math.cos(3*t2)-Math.cos(4*t2));
    heartPts3.push(new THREE.Vector3(x, y, 0));
  }
  heartGroup.add(mkLine(heartPts3, 0x818cf8, .12));

  /* ── Animated ECG pulse line ──
     We build a FULL wide ECG strip and animate a "scan window" by updating
     vertex positions each frame so only the visible window is drawn,
     giving the illusion of a travelling pulse.
  */
  const ECG_SEGS = 300;         // total vertices in the line
  const ECG_WIDTH = 8.0;        // world-units wide
  const ECG_Y = -2.5;           // sits just below the heart
  const ecgBuf = new Float32Array(ECG_SEGS * 3);

  /* ECG waveform function: one PQRST cycle over [0,1] */
  function ecgWave(u) {
    // baseline
    let y = 0;
    // P wave  (0.08–0.18)
    if(u > .08 && u < .18) y = .18 * Math.sin((u-.08)/(.18-.08)*Math.PI);
    // PR segment flat
    // Q dip   (0.22–0.25)
    else if(u > .22 && u < .25) y = -.12 * Math.sin((u-.22)/(.25-.22)*Math.PI);
    // R spike (0.25–0.32)
    else if(u > .25 && u < .32) y = 1.4  * Math.sin((u-.25)/(.32-.25)*Math.PI);
    // S dip   (0.32–0.36)
    else if(u > .32 && u < .36) y = -.25 * Math.sin((u-.32)/(.36-.32)*Math.PI);
    // ST segment
    // T wave  (0.42–0.58)
    else if(u > .42 && u < .58) y = .28  * Math.sin((u-.42)/(.58-.42)*Math.PI);
    return y;
  }

  /* Fill geometry with current frame's window */
  function updateECG(offset) {
    for(let i=0;i<ECG_SEGS;i++){
      const frac = i / (ECG_SEGS-1);              // 0→1 across strip
      const x = frac * ECG_WIDTH - ECG_WIDTH/2;
      /* shift the waveform by offset so it scrolls left */
      const u = ((frac + offset) % 1 + 1) % 1;
      const y = ecgWave(u) * .85 + ECG_Y;
      ecgBuf[i*3]   = x;
      ecgBuf[i*3+1] = y;
      ecgBuf[i*3+2] = 0;
    }
  }
  updateECG(0);
  const ecgGeom = new THREE.BufferGeometry();
  ecgGeom.setAttribute('position', new THREE.BufferAttribute(ecgBuf, 3));
  ecgGeom.attributes.position.needsUpdate = true;

  /* Gradient effect: brighter near the leading edge using two overlaid lines */
  const ecgLineFaint = new THREE.Line(ecgGeom,
    new THREE.LineBasicMaterial({color:0x2dd4bf, transparent:true, opacity:.25}));
  heartGroup.add(ecgLineFaint);

  /* bright "head" segment — separate short geometry for the glowing tip */
  const HEAD_SEGS = 40;
  const headBuf = new Float32Array(HEAD_SEGS * 3);
  const headGeom = new THREE.BufferGeometry();
  headGeom.setAttribute('position', new THREE.BufferAttribute(headBuf, 3));
  const ecgLineHead = new THREE.Line(headGeom,
    new THREE.LineBasicMaterial({color:0x5eead4, transparent:true, opacity:.9}));
  heartGroup.add(ecgLineHead);

  /* glowing dot at the current draw position */
  const dotBuf = new Float32Array(3);
  const dotGeom = new THREE.BufferGeometry();
  dotGeom.setAttribute('position', new THREE.BufferAttribute(dotBuf, 3));
  const ecgDot = new THREE.Points(dotGeom,
    new THREE.PointsMaterial({color:0xffffff, size:.18, transparent:true, opacity:.9}));
  heartGroup.add(ecgDot);

  scene.add(heartGroup);


  /* ════════════════════════
     3. BRAIN OUTLINE  (top-center-ish)
  ════════════════════════ */
  const brainGroup = new THREE.Group();
  brainGroup.position.set(1, 7, -8);

  const brainMat = new THREE.LineBasicMaterial({color:0xa78bfa,transparent:true,opacity:.2});

  // Outer skull silhouette — approximate brain shape as bezier-style path
  function brainContour(pts, col, op){
    const curve=new THREE.CatmullRomCurve3(pts, true);
    const g=new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
    return new THREE.Line(g, new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op}));
  }

  // Main outer brain shape (top hemisphere)
  const outerPts=[
    new THREE.Vector3(0, 3, 0),
    new THREE.Vector3(1.6, 2.8, 0),
    new THREE.Vector3(2.8, 1.8, 0),
    new THREE.Vector3(3.0, .4, 0),
    new THREE.Vector3(2.5, -.8, 0),
    new THREE.Vector3(1.8, -1.4, 0),
    new THREE.Vector3(.6, -1.6, 0),
    new THREE.Vector3(0, -1.5, 0),
    new THREE.Vector3(-.6, -1.6, 0),
    new THREE.Vector3(-1.8, -1.4, 0),
    new THREE.Vector3(-2.5, -.8, 0),
    new THREE.Vector3(-3.0, .4, 0),
    new THREE.Vector3(-2.8, 1.8, 0),
    new THREE.Vector3(-1.6, 2.8, 0),
  ];
  brainGroup.add(brainContour(outerPts, 0xa78bfa, .22));

  // Brain folds (gyri/sulci curves)
  const folds=[
    // top left hemisphere folds
    [new THREE.Vector3(-2.2,2,0),new THREE.Vector3(-1.5,2.4,0),new THREE.Vector3(-.6,2.5,0),new THREE.Vector3(.2,2.2,0)],
    [new THREE.Vector3(-2.6,.8,0),new THREE.Vector3(-1.8,1.4,0),new THREE.Vector3(-.8,1.6,0),new THREE.Vector3(.1,1.3,0)],
    [new THREE.Vector3(-2.8,-.2,0),new THREE.Vector3(-2,.6,0),new THREE.Vector3(-1,.8,0),new THREE.Vector3(-.1,.5,0)],
    [new THREE.Vector3(-2.4,-1,0),new THREE.Vector3(-1.5,-.4,0),new THREE.Vector3(-.6,-.2,0),new THREE.Vector3(.1,-.5,0)],
    // right hemisphere folds
    [new THREE.Vector3(2.2,2,0),new THREE.Vector3(1.5,2.4,0),new THREE.Vector3(.6,2.5,0)],
    [new THREE.Vector3(2.6,.8,0),new THREE.Vector3(1.8,1.4,0),new THREE.Vector3(.8,1.6,0)],
    [new THREE.Vector3(2.8,-.2,0),new THREE.Vector3(2,.6,0),new THREE.Vector3(1,.8,0)],
    [new THREE.Vector3(2.4,-1,0),new THREE.Vector3(1.5,-.4,0),new THREE.Vector3(.6,-.2,0)],
    // centre divide
    [new THREE.Vector3(0,3,0),new THREE.Vector3(.1,2,0),new THREE.Vector3(0,1,0),new THREE.Vector3(.1,0,0),new THREE.Vector3(0,-1,0),new THREE.Vector3(0,-1.5,0)],
  ];
  folds.forEach(fp=>{
    const fc=new THREE.CatmullRomCurve3(fp);
    brainGroup.add(mkLine(fc.getPoints(60), 0xa78bfa, .13));
  });
  // brainstem
  const stemPts=[new THREE.Vector3(-.3,-1.5,0),new THREE.Vector3(-.25,-2.1,0),new THREE.Vector3(.0,-2.5,0),new THREE.Vector3(.2,-2.1,0),new THREE.Vector3(.3,-1.5,0)];
  brainGroup.add(mkLine(stemPts, 0xa78bfa, .18));
  // cerebellum
  const cerebPts=[
    new THREE.Vector3(-.3,-1.6,0),new THREE.Vector3(-.8,-2.0,0),new THREE.Vector3(-1.2,-2.1,0),
    new THREE.Vector3(-1.3,-1.7,0),new THREE.Vector3(-.8,-1.5,0)
  ];
  brainGroup.add(brainContour(cerebPts, 0x818cf8, .14));
  for(let ci=0;ci<3;ci++){
    const cbPts=[
      new THREE.Vector3(-.4-ci*.1,-1.62-ci*.06,0),
      new THREE.Vector3(-.7-ci*.1,-1.85-ci*.06,0),
      new THREE.Vector3(-1.0-ci*.05,-1.9-ci*.06,0),
    ];
    brainGroup.add(mkLine(cbPts, 0x818cf8, .1));
  }

  scene.add(brainGroup);

  /* ── Wireframe shapes ── */
  const ws=(geo,col,op)=>new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,wireframe:true,transparent:true,opacity:op}));
  const shapeDefs=[
    [ws(new THREE.TorusKnotGeometry(2.2,.5,110,14),0x2563eb,.05), 8,1,-5],
    [ws(new THREE.IcosahedronGeometry(2.2,1),0x0d9488,.07), -9,2.5,-6],
    [ws(new THREE.OctahedronGeometry(1.5,0),0x6366f1,.1), 6,-4.5,-2],
    [ws(new THREE.IcosahedronGeometry(1.2,0),0x2dd4bf,.09), -4.5,-3.5,-2],
    [ws(new THREE.TorusGeometry(1.8,.35,12,40),0x4338ca,.07), -1,6,-7],
    [ws(new THREE.TetrahedronGeometry(1.4,0),0x60a5fa,.08), 3,5,-4],
  ];
  const shapes = shapeDefs.map(([mesh,x,y,z])=>{ mesh.position.set(x,y,z); scene.add(mesh); return mesh; });

  let mx=0,my=0;
  document.addEventListener('mousemove',e=>{mx=(e.clientX/innerWidth-.5)*2;my=-(e.clientY/innerHeight-.5)*2;});

  const clock=new THREE.Clock();
  const spds=[.12,.08,.09,.13,.07,.11];
  let ecgOffset = 0;

  function tick(){
    requestAnimationFrame(tick);
    const t=clock.getElapsedTime();
    shapes.forEach((s,i)=>{s.rotation.x+=.001*spds[i]*8;s.rotation.y+=.001*spds[(i+1)%6]*7;});

    /* DNA slow rotation */
    dnaGroup.rotation.y = t * .06;

    /* ── ECG animation ── */
    ecgOffset = (ecgOffset + .004) % 1;   // scroll speed
    updateECG(ecgOffset);
    ecgGeom.attributes.position.needsUpdate = true;

    /* Head segment: last HEAD_SEGS points of the full strip */
    const headStart = ECG_SEGS - HEAD_SEGS;
    for(let i=0;i<HEAD_SEGS;i++){
      headBuf[i*3]   = ecgBuf[(headStart+i)*3];
      headBuf[i*3+1] = ecgBuf[(headStart+i)*3+1];
      headBuf[i*3+2] = 0;
    }
    headGeom.attributes.position.needsUpdate = true;

    /* Glowing dot at tip */
    dotBuf[0] = ecgBuf[(ECG_SEGS-1)*3];
    dotBuf[1] = ecgBuf[(ECG_SEGS-1)*3+1];
    dotBuf[2] = 0;
    dotGeom.attributes.position.needsUpdate = true;

    /* Heart beat: pulse in sync with R-spike of ECG waveform.
       R-spike is at u≈0.285; detect when the leading edge crosses it. */
    const leadU = ((1 + ecgOffset) % 1 + 1) % 1;  // front of strip
    const beatPhase = ((leadU - .285 + 1) % 1);
    /* beatPhase is 0 right at the beat, rises to 1 over the cycle */
    const beatScale = 1 + Math.max(0, .12 * Math.exp(-beatPhase * 18));
    heartGroup.scale.set(beatScale, beatScale, 1);

    /* Outline opacity brightens on beat */
    heartOutline.material.opacity = .38 + Math.max(0, .55 * Math.exp(-beatPhase * 18));

    /* subtle float */
    heartGroup.position.y = Math.sin(t * .4) * .25;

    /* Brain slow sway */
    brainGroup.rotation.y = Math.sin(t * .18) * .25;
    brainGroup.rotation.z = Math.sin(t * .22) * .06;
    brainGroup.position.y = 7 + Math.sin(t * .35) * .4;

    cam.position.x+=(mx*.5-cam.position.x)*.02;
    cam.position.y+=(my*.5-cam.position.y)*.02;
    R.render(scene,cam);
  }
  tick();
  window.addEventListener('resize',()=>{
    R.setSize(innerWidth,innerHeight);
    cam.aspect=innerWidth/innerHeight;
    cam.updateProjectionMatrix();
  });
})();

/* ════════════════════════════════════════
   GSAP + ScrollTrigger
════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

/* ════════════════════════════════════════
   LENIS SMOOTH SCROLL
════════════════════════════════════════ */
const lenis=new Lenis({duration:1.2,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
lenis.on('scroll',ScrollTrigger.update);
(function raf(t){lenis.raf(t);requestAnimationFrame(raf);})();

/* Scroll progress bar */
lenis.on('scroll',({scroll,limit})=>{
  document.getElementById('spb').style.width=(scroll/limit*100)+'%';
});

/* Smooth anchors */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const t=document.querySelector(a.getAttribute('href'));
    if(t) lenis.scrollTo(t,{offset:-90,duration:1.4,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
  });
});

/* ════════════════════════════════════════
   CURSOR
════════════════════════════════════════ */
const cdot=document.getElementById('c-dot');
const cring=document.getElementById('c-ring');
const ctrail=document.getElementById('c-trail');
let cx=0,cy=0;
document.addEventListener('mousemove',e=>{
  cx=e.clientX; cy=e.clientY;
  gsap.to(cdot,{x:cx,y:cy,duration:.07});
  gsap.to(cring,{x:cx,y:cy,duration:.25,ease:'power2.out'});
  gsap.to(ctrail,{x:cx,y:cy,duration:.6,ease:'power3.out'});
});
document.querySelectorAll('a,button,.role-vis,.feat-card,.dc,.stat-card').forEach(el=>{
  el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));
  el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));
});

/* ════════════════════════════════════════
   NAV: show after loader + scroll solid
════════════════════════════════════════ */
lenis.on('scroll',({scroll})=>{
  document.getElementById('nav').classList.toggle('solid',scroll>50);
});

/* ════════════════════════════════════════
   LOADER → HERO ENTRANCE
════════════════════════════════════════ */
let progress=0;
const ldb=document.getElementById('ldb');
const ldp=document.getElementById('ldp');
const ldgEl=document.getElementById('ldg');
const counter=setInterval(()=>{
  progress=Math.min(100,progress+Math.random()*14);
  ldb.style.width=progress+'%';
  ldgEl.style.right=0;
  ldp.textContent=Math.floor(progress)+'%';
  if(progress>=100)clearInterval(counter);
},90);

/* split words into chars */
function splitChars(el){
  el.querySelectorAll('.word').forEach(w=>{
    const txt=w.textContent;
    w.innerHTML='';
    txt.split('').forEach(ch=>{
      const s=document.createElement('span');
      s.className='char';
      s.textContent=ch==' '?'\u00a0':ch;
      if(w.classList.contains('grad-b')||w.classList.contains('grad-t')){
        s.style.background='inherit';
        s.style.webkitBackgroundClip='text';
        s.style.webkitTextFillColor='transparent';
        s.style.backgroundClip='text';
      }
      w.appendChild(s);
    });
  });
}
splitChars(document.getElementById('htitle'));

const masterTL=gsap.timeline({delay:.15});
masterTL
  /* loader logo reveal */
  .to('.ld-logo-inner',{y:'0%',duration:.7,ease:'power4.out'})
  /* loader bar fills to 100 */
  .to(ldb,{width:'100%',duration:.6,ease:'power1.inOut',onUpdate(){ldp.textContent=Math.round(parseFloat(ldb.style.width)||0)+'%';}})
  /* loader slide up */
  .to('#loader',{yPercent:-100,duration:.9,ease:'power4.inOut',
    onComplete(){document.getElementById('loader').style.display='none';clearInterval(counter);}})
  /* nav in */
  .to('#nav',{opacity:1,y:0,duration:.6,ease:'power3.out'},'-=.3')
  /* eyebrow */
  .to('#eyebrow',{opacity:1,y:0,scale:1,duration:.7,ease:'back.out(2)'},'-=.2')
  /* chars stagger in */
  .to('.h-title .char',{y:'0%',opacity:1,stagger:{amount:.55,ease:'power2.out'},duration:.7,ease:'power4.out'},'-=.4')
  /* subtitle */
  .to('#hsub',{opacity:1,y:0,duration:.65,ease:'power3.out'},'-=.25')
  /* ctas */
  .to('#hctas',{opacity:1,y:0,duration:.6,ease:'power3.out'},'-=.45')
  /* 3D scene reveal with clip-path */
  .fromTo('#hscene',
    {opacity:0,y:50,scale:.95,clipPath:'inset(0 0 100% 0)'},
    {opacity:1,y:0,scale:1,clipPath:'inset(0 0 0% 0)',duration:1.1,ease:'power4.out'},
  '-=.5');

/* ════════════════════════════════════════
   HERO 3D CARD PARALLAX ON MOUSE
════════════════════════════════════════ */
document.addEventListener('mousemove',e=>{
  const xd=(e.clientX/innerWidth-.5)*.05;
  const yd=(e.clientY/innerHeight-.5)*.04;
  gsap.to('#dcmain',{rotateX:-yd*180+12,rotateY:xd*180,duration:.7,ease:'power2.out'});
});

/* ════════════════════════════════════════
   SCROLL ANIMATIONS HELPERS
════════════════════════════════════════ */
function stReveal(trigger,targets,vars){
  return ScrollTrigger.create({
    trigger,start:'top 78%',
    onEnter(){gsap.to(targets,{...{opacity:1,y:0,x:0,scale:1,duration:.8,ease:'power3.out'},...vars});}
  });
}

/* Dividers */
document.querySelectorAll('.hr').forEach(hr=>{
  gsap.to(hr,{scrollTrigger:{trigger:hr,start:'top 92%'},scaleX:1,duration:1.4,ease:'power3.out'});
});

/* Eyebrows + sec titles + descs */
document.querySelectorAll('.sec-eyebrow span').forEach(el=>{
  gsap.to(el,{scrollTrigger:{trigger:el,start:'top 84%'},opacity:1,y:0,duration:.7,ease:'power3.out'});
});
document.querySelectorAll('.sec-title span:first-child').forEach(el=>{
  gsap.to(el,{scrollTrigger:{trigger:el,start:'top 84%'},opacity:1,y:0,duration:.9,ease:'power4.out',delay:.08});
});
['#roles-desc','#feat-desc','#stats-desc'].forEach((id,i)=>{
  const el=document.querySelector(id);
  if(el) gsap.to(el,{scrollTrigger:{trigger:el,start:'top 86%'},opacity:1,y:0,duration:.7,delay:.15});
});

/* ════════════════════════════════════════
   ROLE ROW ANIMATIONS
════════════════════════════════════════ */
document.querySelectorAll('.role-row').forEach((row,i)=>{
  const isRev=row.classList.contains('rev');
  const text=row.querySelector('.role-text');
  const vis=row.querySelector('.role-vis');

  // role badge clip-path reveal
  const badge=row.querySelector('.role-badge');
  gsap.fromTo(badge,
    {clipPath:'inset(0 100% 0 0 round 100px)',opacity:0},
    {scrollTrigger:{trigger:row,start:'top 72%'},clipPath:'inset(0 0% 0 0 round 100px)',opacity:1,duration:.7,ease:'power3.out'}
  );

  // role name chars
  const nameSpan=row.querySelector('.role-name span');
  gsap.to(nameSpan,{
    scrollTrigger:{trigger:row,start:'top 72%'},
    opacity:1,x:0,duration:.9,delay:.1,ease:'power4.out'
  });

  // desc
  const desc=row.querySelector('.role-desc');
  gsap.to(desc,{scrollTrigger:{trigger:row,start:'top 68%'},opacity:1,y:0,duration:.7,delay:.2,ease:'power3.out'});

  // features stagger
  const feats=row.querySelectorAll('.rfeat');
  gsap.to(feats,{
    scrollTrigger:{trigger:row,start:'top 65%'},
    opacity:1,x:0,duration:.5,stagger:.08,delay:.3,ease:'power3.out'
  });

  // CTA button
  const cta=row.querySelector('.role-cta');
  gsap.to(cta,{scrollTrigger:{trigger:row,start:'top 62%'},opacity:1,y:0,duration:.6,delay:.55,ease:'back.out(1.5)'});

  // vis card slide in
  gsap.to(vis,{
    scrollTrigger:{trigger:row,start:'top 70%'},
    opacity:1,x:0,scale:1,duration:1,delay:.15,ease:'power4.out'
  });
});

/* ════════════════════════════════════════
   ROLE VIS 3D TILT
════════════════════════════════════════ */
document.querySelectorAll('.tilt').forEach(el=>{
  el.addEventListener('mousemove',e=>{
    const r=el.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    gsap.to(el,{rotateX:-y*14,rotateY:x*14,transformPerspective:900,duration:.4,ease:'power2.out'});
  });
  el.addEventListener('mouseleave',()=>{
    gsap.to(el,{rotateX:0,rotateY:0,duration:.9,ease:'elastic.out(1,.55)'});
  });
});

/* ════════════════════════════════════════
   FEATURE CARDS WAVE STAGGER
════════════════════════════════════════ */
gsap.to('.feat-card',{
  scrollTrigger:{trigger:'#feats-grid',start:'top 76%'},
  opacity:1,y:0,stagger:{amount:.65,from:'start'},duration:.75,ease:'power3.out'
});
document.querySelectorAll('.feat-card').forEach(fc=>{
  fc.addEventListener('mousemove',e=>{
    const r=fc.getBoundingClientRect();
    fc.style.setProperty('--fx',(e.clientX-r.left)/r.width*100+'%');
    fc.style.setProperty('--fy',(e.clientY-r.top)/r.height*100+'%');
  });
});

/* ════════════════════════════════════════
   FEATURE FILTER TABS
════════════════════════════════════════ */
document.querySelectorAll('.ftab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.ftab').forEach(t=>{
      t.className='ftab';
    });
    const f=tab.dataset.filter;
    if(f==='all') tab.classList.add('active');
    else if(f==='patient') tab.classList.add('active-p');
    else if(f==='doctor') tab.classList.add('active-d');
    else if(f==='admin') tab.classList.add('active-a');

    document.querySelectorAll('.feat-card').forEach(fc=>{
      const r=fc.dataset.role;
      const show=f==='all'||r===f||r==='all';
      gsap.to(fc,{
        opacity:show?1:0.15,
        scale:show?1:.97,
        y:show?0:8,
        duration:.4,ease:'power2.out'
      });
    });

    // If specific role tab has goto, smooth scroll to it
    if(tab.dataset.goto){
      const target=document.getElementById(tab.dataset.goto);
      if(target) setTimeout(()=>lenis.scrollTo(target,{offset:-90,duration:1.3}),50);
    }
  });
});

/* ════════════════════════════════════════
   STATS COUNT-UP
════════════════════════════════════════ */
/* Stat cards stagger */
document.querySelectorAll('.stat-card').forEach((el,i)=>{
  gsap.to(el,{
    scrollTrigger:{trigger:'#stats',start:'top 76%'},
    opacity:1,y:0,scale:1,duration:.8,delay:i*.12,ease:'power3.out'
  });
});
let counted=false;
ScrollTrigger.create({trigger:'#stats',start:'top 75%',onEnter(){
  if(counted)return;counted=true;
  document.querySelectorAll('[data-t]').forEach(el=>{
    const target=+el.dataset.t,sfx=el.dataset.s||'';
    const obj={v:0};
    gsap.to(obj,{v:target,duration:2.4,ease:'power2.out',
      onUpdate(){el.textContent=Math.floor(obj.v).toLocaleString()+sfx;},
      onComplete(){el.textContent=target.toLocaleString()+sfx;}
    });
  });
  document.querySelectorAll('[data-w]').forEach(b=>{
    gsap.to(b,{width:b.dataset.w,duration:2.1,ease:'power3.out',delay:.5});
  });
  /* also animate admin vis mini counters when admin section was passed */
  document.querySelectorAll('[data-ct]').forEach(el=>{
    const t=+el.dataset.ct;
    const obj={v:0};
    gsap.to(obj,{v:t,duration:2,ease:'power2.out',
      onUpdate(){el.textContent=Math.floor(obj.v).toLocaleString();},
      onComplete(){el.textContent=t.toLocaleString();}
    });
  });
}});

/* animate admin vis bars+counters on scroll into view */
ScrollTrigger.create({trigger:'#admin-role',start:'top 75%',onEnter(){
  document.querySelectorAll('[data-ct]').forEach(el=>{
    const t=+el.dataset.ct;
    const obj={v:0};
    gsap.to(obj,{v:t,duration:1.8,ease:'power2.out',
      onUpdate(){el.textContent=Math.floor(obj.v).toLocaleString();},
      onComplete(){el.textContent=t.toLocaleString();}
    });
  });
  document.querySelectorAll('.ag-bar-fill[data-w]').forEach(b=>{
    gsap.to(b,{width:b.dataset.w,duration:1.5,ease:'power3.out',delay:.2});
  });
}});

/* ════════════════════════════════════════
   CTA ANIMATION
════════════════════════════════════════ */
gsap.to('#ctabox',{
  scrollTrigger:{trigger:'#cta',start:'top 80%'},
  opacity:1,y:0,scale:1,duration:1.1,ease:'power4.out'
});

/* ════════════════════════════════════════
   HERO SCENE SCROLL PARALLAX
════════════════════════════════════════ */
gsap.to('#hscene',{
  scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:1.4},
  y:-80,opacity:.65,scale:.97
});
gsap.to('.scroll-cue',{
  scrollTrigger:{trigger:'#hero',start:'250px top',toggleActions:'play none none reverse'},
  opacity:0,duration:.4
});

/* ════════════════════════════════════════
   MAGNETIC BUTTONS
════════════════════════════════════════ */
document.querySelectorAll('.mw').forEach(mw=>{
  const btn=mw.querySelector('a,button');
  if(!btn)return;
  mw.addEventListener('mousemove',e=>{
    const r=mw.getBoundingClientRect();
    const x=e.clientX-r.left-r.width/2, y=e.clientY-r.top-r.height/2;
    gsap.to(btn,{x:x*.4,y:y*.4,duration:.4,ease:'power2.out'});
  });
  mw.addEventListener('mouseleave',()=>{
    gsap.to(btn,{x:0,y:0,duration:.7,ease:'elastic.out(1,.5)'});
  });
});

/* ════════════════════════════════════════
   FLOATING PARTICLES PER ROLE SECTION
════════════════════════════════════════ */
function spawnParticles(container,color){
  const wrap=document.getElementById(container);
  if(!wrap)return;
  function spawn(){
    if(!document.getElementById(container))return;
    const d=document.createElement('div');
    d.className='rp-dot';
    const sz=Math.random()*4+2;
    d.style.cssText=`width:${sz}px;height:${sz}px;background:${color};
      left:${Math.random()*100}%;bottom:0;
      opacity:${Math.random()*.5+.2};
      animation-duration:${Math.random()*4+3}s;
      animation-delay:${Math.random()*2}s`;
    wrap.appendChild(d);
    setTimeout(()=>{d.remove();spawn();},6000);
  }
  for(let i=0;i<8;i++) setTimeout(()=>spawn(),i*500);
}
spawnParticles('prp','rgba(96,165,250,.5)');
spawnParticles('drp','rgba(45,212,191,.5)');
spawnParticles('arp','rgba(165,180,252,.5)');

/* ════════════════════════════════════════
   NAV ACTIVE SECTION INDICATOR
════════════════════════════════════════ */
const sections=[
  {id:'patient-role',nav:'Patient'},
  {id:'doctor-role',nav:'Doctor'},
  {id:'admin-role',nav:'Admin'},
  {id:'features',nav:'Features'},
  {id:'stats',nav:'Stats'},
];
sections.forEach(({id,nav})=>{
  ScrollTrigger.create({
    trigger:'#'+id,start:'top 50%',end:'bottom 50%',
    onToggle(self){
      document.querySelectorAll('.nav-links a').forEach(a=>{
        if(a.textContent.trim()===nav){
          if(self.isActive){a.style.color='#fff';a.style.setProperty('--aw','100%');}
          else{a.style.color='';a.style.setProperty('--aw','0%');}
        }
      });
    }
  });
});

/* ════════════════════════════════════════
   HAMBURGER / MOBILE MENU
════════════════════════════════════════ */
const ham = document.getElementById('nav-ham');
const mobMenu = document.getElementById('mob-menu');
let menuOpen = false;

function toggleMenu(force){
  menuOpen = force !== undefined ? force : !menuOpen;
  ham.classList.toggle('open', menuOpen);
  mobMenu.classList.toggle('open', menuOpen);
  document.body.style.overflow = menuOpen ? 'hidden' : '';
  lenis[menuOpen ? 'stop' : 'start']();
}

ham.addEventListener('click', ()=> toggleMenu());

/* Close on any mobile menu link click */
mobMenu.querySelectorAll('a').forEach(a=>{
  a.addEventListener('click', ()=>{
    toggleMenu(false);
    const target = document.querySelector(a.getAttribute('href'));
    if(target) setTimeout(()=> lenis.scrollTo(target,{offset:-90,duration:1.3}), 50);
  });
});

/* Hide nav-pill on mobile (hamburger takes over) */
function checkPill(){
  const pill = document.getElementById('nav-pill-wrap');
  if(pill) pill.style.display = window.innerWidth <= 900 ? 'none' : '';
}
checkPill();
window.addEventListener('resize', checkPill);
