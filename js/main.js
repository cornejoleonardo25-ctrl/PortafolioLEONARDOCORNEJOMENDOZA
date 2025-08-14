/* =======================
   Partículas
======================= */
if (window.tsParticles) {
  tsParticles.load("tsparticles", {
    background: { color: { value: "#111" } },
    fpsLimit: 60,
    particles: {
      number: { value: 100, density: { enable: true, area: 800 } },
      color: { value: "#ffffffff" },
      shape: { type: "circle" },
      opacity: { value: 1, random: true },
      size: { value: { min: 1, max: 5 } },
      move: { enable: true, speed: .2, direction: "none", outModes: { default: "bounce" } }
    },
    interactivity: {
      events: { onHover: { enable: true, mode: "attract" } },
      modes: { attract: { distance: 300, duration: 2} }
    },
    detectRetina: true
  });
}

/* =======================
   Hacker Text
======================= */
function hackerEffect(el, text, { duration = 1500, step = 0.5 } = {}) {
  if (!el) return;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  let iteration = 0;
  const ticks = Math.max(1, Math.ceil(text.length / step));
  const speed = Math.max(1, Math.round(duration / ticks));
  const interval = setInterval(() => {
    el.textContent = text
      .split("")
      .map((char, i) => (i < iteration ? text[i] : letters[Math.floor(Math.random() * letters.length)]))
      .join("");
    if (iteration >= text.length) clearInterval(interval);
    iteration += step;
  }, speed);
}

/* =======================
   Lenis (smooth scroll)
======================= */
let lenis = null;
try {
  lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true
  });
} catch (_) {}

/* =======================
   Parallax header con “pin”
======================= */
(function headerParallax(){
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const img = document.querySelector('.img-esquina-derecha');
  const header = document.querySelector('.parallax-header');
  if (!img || !header) return;

  let lockActive=false, lockReleased=false, lockArmed=false;
  let parallaxProgress=0, anchorY=null, finalPoseSticky=false, lastIntent=null;
  const REQUIRED_WHEEL = 1200;

  function getHeaderVisibleProgress(){
    const rect = header.getBoundingClientRect();
    const h = rect.height || header.offsetHeight || window.innerHeight;
    return clamp(-rect.top / h, 0, 1);
  }

  function updateParallaxByProgress(p){
    const windowWidth = window.innerWidth;
    const imgWidth = img.offsetWidth;
    const initialRight = 40;
    const initialLeft = windowWidth - initialRight - imgWidth;
    const centerX = (windowWidth/2) - (imgWidth/2);
    const maxTranslateX = initialLeft - centerX;
    const translateX = -maxTranslateX * p;
    const maxTranslateY = 500;
    const translateY = maxTranslateY * p;
    const minScale = 1, maxScale = 2.5;
    const scale = minScale + (maxScale - minScale) * p;
    img.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`;
  }

  function engage(){ if (lockActive && !lockReleased) return;
    lockActive=true; lockReleased=false; finalPoseSticky=false;
    const visibleNow = getHeaderVisibleProgress();
    parallaxProgress = Math.max(visibleNow, parallaxProgress);
    anchorY = window.scrollY || document.documentElement.scrollTop || 0;
    if (lenis) lenis.stop();
    updateParallaxByProgress(parallaxProgress);
  }
  function cancel(){ lockActive=false; lockReleased=false; anchorY=null; if (lenis) lenis.start(); }
  function tryRelease(){
    if (parallaxProgress >= 1 && !lockReleased){
      lockReleased = true; parallaxProgress = 1;
      updateParallaxByProgress(1); finalPoseSticky = true;
      lockActive = false; anchorY = null; if (lenis) lenis.start(); lockArmed=false;
    }
  }

  function onWheel(e){
    if (e.deltaY > 0) lastIntent='down';
    if (e.deltaY < 0) lastIntent='up';
    if (!lockActive && lockArmed && e.deltaY > 0) engage();
    if (!lockActive) return;
    if (e.deltaY < 0){ cancel(); return; }
    e.preventDefault();
    parallaxProgress = clamp(parallaxProgress + (e.deltaY / REQUIRED_WHEEL), 0, 1);
    updateParallaxByProgress(parallaxProgress);
    tryRelease();
  }
  window.addEventListener('wheel', onWheel, { passive:false });

  // Touch
  let touchStartY = 0;
  window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive:false });
  window.addEventListener('touchmove', e => {
    const dy = touchStartY - e.touches[0].clientY; // >0 bajar
    if (dy > 0) lastIntent='down'; if (dy < 0) lastIntent='up';
    if (!lockActive && lockArmed && dy > 0) engage();
    if (!lockActive) return;
    if (dy <= 0){ cancel(); return; }
    e.preventDefault();
    parallaxProgress = clamp(parallaxProgress + dy / 800, 0, 1);
    updateParallaxByProgress(parallaxProgress);
    tryRelease();
  }, { passive:false });

  // Teclado
  window.addEventListener('keydown', e=>{
    const down = ['ArrowDown','PageDown',' '], up = ['ArrowUp','PageUp'];
    if (down.includes(e.key)) lastIntent='down'; if (up.includes(e.key)) lastIntent='up';
    if (!lockActive && lockArmed && down.includes(e.key)) engage();
    if (!lockActive) return;
    if (up.includes(e.key)){ cancel(); return; }
    if (!down.includes(e.key)) return;
    e.preventDefault();
    const delta = 140;
    parallaxProgress = clamp(parallaxProgress + delta / REQUIRED_WHEEL, 0, 1);
    updateParallaxByProgress(parallaxProgress);
    tryRelease();
  });

  // IO para armar/disarmar el pin
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting && entry.intersectionRatio >= 0.8) lockArmed = true;
      if (!entry.isIntersecting || entry.intersectionRatio <= 0.2){
        lockArmed = false;
        if (lockActive && !lockReleased) cancel();
      }
    });
  }, { threshold: [0,0.2,0.5,0.8,1] });
  io.observe(header);

  // RAF loop
  function raf(t){
    if (lenis) lenis.raf(t);
    if (lockActive && anchorY !== null){
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (y !== anchorY) window.scrollTo(0, anchorY);
    }
    if (lockActive){
      updateParallaxByProgress(parallaxProgress);
    } else {
      const rect = header.getBoundingClientRect();
      const h = rect.height || header.offsetHeight || window.innerHeight;
      const headerOutOfViewTop = rect.bottom <= 0;
      if (finalPoseSticky){
        if (lastIntent === 'up' || headerOutOfViewTop) finalPoseSticky = false;
      }
      if (finalPoseSticky){
        updateParallaxByProgress(1);
      } else {
        const visible = Math.max(0, Math.min(1, -rect.top / h));
        updateParallaxByProgress(visible);
        if (rect.top <= -h) updateParallaxByProgress(1);
      }
    }
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
})();

/* =======================
   ¿Qué es? → crossfade
======================= */
(function setupQueEsFade(){
  const section = document.getElementById('que-es');
  if (!section) return;
  const img1 = section.querySelector('.background-image.image1');
  const img2 = section.querySelector('.background-image.image2');
  if (!img1 || !img2) return;
  img1.classList.add('visible');
  img2.classList.remove('visible');

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){ img1.classList.remove('visible'); img2.classList.add('visible'); }
      else { img1.classList.add('visible'); img2.classList.remove('visible'); }
    });
  }, { threshold: 0.25 });
  io.observe(section);
})();

/* =======================
   Galería / Carrusel
======================= */
(function setupProjectGallery(){
  const FITS = {
    "caza-tie": "cover",
    "nave-stopmotion": "cover",
    "dmnt-toy": "contain"
  };

  const GALLERY = {
    "caza-tie": [
      "../img/starwars/Leonardo_CM_render_01.jpg",
      "../img/starwars/LEONARDO_CM_Blocking_CP3.png",
      "../img/starwars/Leonardo_CM_render_02.jpg",
      "../img/starwars/LEONARDO_CM_Blocking_CP2.png",
      "../img/starwars/Leonardo_CM_render_03.jpg"
    ],
    "nave-stopmotion": [
      "../img/Nave/escena_1 (61).png",
      "../img/Nave/escena1.mp4"
    ],
    "dmnt-toy": [
      "../img/DMNTTOY/06a6f96e-6ab2-4d6f-9684-b0b29e99c879.png",
      "../img/DMNTTOY/da6dbc5e-ee05-458a-9226-af009db68aec.jpg",
      "../img/DMNTTOY/e162b2d7-fdc1-4e29-9bae-5dcc1af4daef.jpg"
    ]
  };

  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const slidesRoot = modal.querySelector('#pm-slides');
  const dotsRoot   = modal.querySelector('#pm-dots');
  const thumbsRoot = modal.querySelector('#pm-thumbs');
  const btnPrev    = modal.querySelector('[data-pm-prev]');
  const btnNext    = modal.querySelector('[data-pm-next]');
  const btnClose   = modal.querySelectorAll('[data-pm-close]');
  const backdrop   = modal.querySelector('.pm__backdrop');

  let current = 0, slides=[], dots=[], thumbs=[], items=[], lastFocused=null;

  function render(arr){
    items = arr || [];
    slidesRoot.innerHTML = ''; dotsRoot.innerHTML = ''; thumbsRoot.innerHTML = '';
    slides = []; dots = []; thumbs = [];

    items.forEach((src, i)=>{
      const s = document.createElement('div');
      s.className = 'pm__slide' + (i===0 ? ' is-active' : '');
      const isVideo = /\.(mp4|webm|ogg)$/i.test(src);
      if (isVideo){
        const v = document.createElement('video');
        v.src = src; v.preload='metadata'; v.playsInline = true; v.muted = true; v.controls=false;
        s.appendChild(v);
        s.addEventListener('click', ()=>{ if (!v.controls) return; v.paused ? v.play().catch(()=>{}) : v.pause(); });
      } else {
        s.style.backgroundImage = `url("${src}")`;
        s.style.backgroundSize = 'cover';
        s.style.backgroundPosition = 'center';
      }
      slidesRoot.appendChild(s); slides.push(s);
    });

    items.forEach((_,i)=>{
      const d = document.createElement('button');
      d.className = 'pm__dot' + (i===0?' is-active':''); d.type='button';
      d.setAttribute('aria-label', `Ir a elemento ${i+1}`);
      d.addEventListener('click', ()=>show(i));
      dotsRoot.appendChild(d); dots.push(d);
    });

    items.forEach((src,i)=>{
      const t = document.createElement('button');
      t.className = 'pm__thumb' + (i===0?' is-active':''); t.type='button';
      const isVideo = /\.(mp4|webm|ogg)$/i.test(src);
      t.innerHTML = isVideo ? `<div class="thumb-video">🎥</div>` : `<img src="${src}" alt="">`;
      t.addEventListener('click', ()=>show(i));
      thumbsRoot.appendChild(t); thumbs.push(t);
    });

    current = 0; updateUI(); setActiveMedia(0);
  }

  function updateUI(){
    slides.forEach((el,i)=> el.classList.toggle('is-active', i===current));
    dots.forEach((el,i)=> el.classList.toggle('is-active', i===current));
    thumbs.forEach((el,i)=> el.classList.toggle('is-active', i===current));
  }

  function setActiveMedia(i){
    slides.forEach(sl=>{
      const v = sl.querySelector('video');
      if (v){ v.pause(); v.controls=false; v.muted=false; }
    });
    const v = slides[i]?.querySelector('video');
    if (v){ v.controls = true; /* v.muted = true; v.play().catch(()=>{}); */ }
  }

  function show(i){
    if (!slides.length) return;
    current = (i + slides.length) % slides.length;
    updateUI();
    slides.forEach(sl=>{ const v=sl.querySelector('video'); if (v){ v.pause(); v.controls=false; } });
    const active = slides[current]?.querySelector('video');
    if (active){ active.controls = true; active.play().catch(()=>{}); }
  }

  function open(key){
    const arr = GALLERY[key];
    if (!arr || !arr.length) return;

    const fit = (FITS[key] || 'cover').toLowerCase();
    modal.classList.toggle('pm--contain', fit === 'contain');
    modal.classList.toggle('pm--cover',   fit !== 'contain');

    render(arr);

    (function setAspect(){
      const firstSlide = slides[0]; if (!firstSlide) return;
      const firstUrl = arr[0];
      const v = firstSlide.querySelector('video');
      if (v){
        const handler = ()=>{ modal.classList.toggle('pm--portrait', v.videoHeight > v.videoWidth); v.removeEventListener('loadedmetadata', handler); };
        v.readyState >= 1 ? handler() : v.addEventListener('loadedmetadata', handler);
        return;
      }
      const img = new Image();
      img.onload = ()=>{ modal.classList.toggle('pm--portrait', img.naturalHeight > img.naturalWidth); };
      img.src = firstUrl;
    })();

    try { if (lenis) lenis.stop(); } catch(_) {}
    document.body.classList.add('pm-open');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');

    lastFocused = document.activeElement;
    modal.querySelector('.pm__close')?.focus();

    document.addEventListener('keydown', onKey);
    attachSwipe(slidesRoot);
  }

  function close(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('pm-open');
    document.removeEventListener('keydown', onKey);
    detachSwipe(slidesRoot);
    try { if (lenis) lenis.start(); } catch(_) {}
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function onKey(e){
    if (e.key === 'Escape') return close();
    if (e.key === 'ArrowRight') return show(current+1);
    if (e.key === 'ArrowLeft')  return show(current-1);
  }

  document.querySelectorAll('.card-link[data-project]').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      open(a.getAttribute('data-project'));
    });
  });
  btnPrev?.addEventListener('click', ()=>show(current-1));
  btnNext?.addEventListener('click', ()=>show(current+1));
  btnClose.forEach(b=> b.addEventListener('click', close));
  backdrop?.addEventListener('click', close);

  // Swipe móvil
  let sx=0, sy=0, swiping=false;
  function onTouchStart(e){ if (!e.touches || e.touches.length!==1) return; sx=e.touches[0].clientX; sy=e.touches[0].clientY; swiping=true; }
  function onTouchMove(e){
    if (!swiping) return;
    const dx=e.touches[0].clientX - sx;
    const dy=e.touches[0].clientY - sy;
    if (Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>50){ swiping=false; dx<0?show(current+1):show(current-1); }
  }
  function onTouchEnd(){ swiping=false; }
  function attachSwipe(n){ n.addEventListener('touchstart', onTouchStart, {passive:true}); n.addEventListener('touchmove', onTouchMove, {passive:true}); n.addEventListener('touchend', onTouchEnd, {passive:true}); }
  function detachSwipe(n){ n.removeEventListener('touchstart', onTouchStart); n.removeEventListener('touchmove', onTouchMove); n.removeEventListener('touchend', onTouchEnd); }
})();

/* =======================
   Fisheye (Dock) + flechas
======================= */
(function initDock(){
  const section = document.querySelector('section.proyectos.dock');
  const track   = section?.querySelector('.grid-proyectos');
  if (!section || !track) return;

  const cards = Array.from(track.querySelectorAll('.card-proyecto'));
  if (!cards.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_SCALE=1.18, MIN_SCALE=0.92, RADIUS=180, LIFT=14, POWER=1.5;
  let mouseX = null, ticking=false;

  const scaleFor = d => {
    const t = Math.max(0, 1 - (d / RADIUS));
    const f = Math.pow(t, POWER);
    return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * f;
  };
  function render(){ ticking=false;
    cards.forEach(card=>{
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const d  = (mouseX==null) ? Infinity : Math.abs(cx - mouseX);
      const s  = prefersReduced ? 1 : scaleFor(d);
      const lift = (s - 1) / (MAX_SCALE - 1) * LIFT;
      card.style.transform = `translateY(${-lift}px) scale(${s})`;
    });
  }
  function request(x){ mouseX=x; if (!ticking){ ticking=true; requestAnimationFrame(render); } }

  track.addEventListener('mousemove', e=>{ if (prefersReduced) return; request(e.clientX); }, {passive:true});
  track.addEventListener('mouseleave', ()=>{ mouseX=null; cards.forEach(c=>c.style.transform=''); });

  // Flechas
  if (!section.querySelector('.dock-arrows')){
    const wrap = document.createElement('div'); wrap.className='dock-arrows';
    const mkBtn = dir => {
      const b=document.createElement('button');
      b.className='dock-arrow dock-arrow--'+dir;
      b.innerHTML = dir==='left'
        ? '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
      b.type='button'; b.setAttribute('aria-label', dir==='left'?'Desplazar a la izquierda':'Desplazar a la derecha');
      return b;
    };
    const left = mkBtn('left'), right=mkBtn('right');
    wrap.append(left,right); section.appendChild(wrap);

    const STEP = 360;
    function updateDisabled(){
      const max = track.scrollWidth - track.clientWidth - 1;
      left.disabled = track.scrollLeft <= 1;
      right.disabled = track.scrollLeft >= max;
    }
    function scrollByDir(d){ track.scrollBy({ left: d*STEP, behavior:'smooth' }); setTimeout(updateDisabled, 250); }
    left.addEventListener('click', ()=>scrollByDir(-1));
    right.addEventListener('click',()=>scrollByDir(+1));
    track.addEventListener('scroll', updateDisabled, {passive:true});
    window.addEventListener('resize', updateDisabled);
    updateDisabled();

    // Mantener presionado = scroll continuo
    let rafId=null, dir=0, v=0; const MAX_V=22, ACC=1.2;
    function loop(){ track.scrollLeft += dir*v; if (v<MAX_V) v+=ACC; rafId=requestAnimationFrame(loop); }
    function press(d){ if (rafId) return; dir=d; v=6; rafId=requestAnimationFrame(loop); }
    function release(){ if (rafId){ cancelAnimationFrame(rafId); rafId=null; } v=0; dir=0; updateDisabled(); }
    left.addEventListener('mousedown', ()=>press(-1));
    right.addEventListener('mousedown',()=>press(+1));
    ['mouseup','mouseleave','blur'].forEach(ev=>{ left.addEventListener(ev,release); right.addEventListener(ev,release); });

    // Rueda vertical → scroll horizontal
    track.addEventListener('wheel', e=>{
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)){ track.scrollLeft += e.deltaY; e.preventDefault(); }
    }, {passive:false});
  }
})();

/* =======================
   Parallax + blur “Sobre mí”
   (ACTÍVALO agregando data-parallax-bg y --about-bg)
======================= */
(function aboutParallax(){
  const section = document.querySelector('#sobre-mi[data-parallax-bg]');
  if (!section) return;

  let layer = section.querySelector('.about-parallax-layer');
  if (!layer){
    layer = document.createElement('div');
    layer.className = 'about-parallax-layer';
    section.prepend(layer);
  }
  const bg = getComputedStyle(section).getPropertyValue('--about-bg').trim();
  if (bg) layer.style.setProperty('--about-bg', bg);

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  function onScroll(){
    const r = section.getBoundingClientRect();
    const vh = Math.max(1, window.innerHeight);

    // parallax
    const translate = (r.top / vh) * -30;
    layer.style.transform = `translateY(${translate}vh) scale(1.08)`;

    // blur/opacity dinámicos
    const center = r.top + r.height/2;
    const p = clamp(1 - Math.abs(center - vh/2) / (vh*0.9), 0, 1);
    const blur = 10 + (1 - p) * 14;
    const op   = 0.30 + p * 0.55;

    layer.style.filter = `blur(${blur.toFixed(1)}px)`;
    layer.style.opacity = op.toFixed(2);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll, {passive:true});
  if (lenis && typeof lenis.on === 'function') lenis.on('scroll', onScroll);
})();

/* =======================
   Inicio (hacker) — sin autoscroll
======================= */
window.addEventListener("load", () => {
  hackerEffect(document.getElementById("cyber-title"), document.getElementById("cyber-title")?.textContent || "", { duration: 3500, step: 0.5 });
  hackerEffect(document.getElementById("cyber-sub"),   document.getElementById("cyber-sub")?.textContent   || "", { duration: 2000, step: 0.5 });
});

/* =======================
   ¿Qué es? — Parallax + blur sobre el radial (dinámico)
======================= */
(function queEsParallax(){
  const sec = document.querySelector('#que-es[data-parallax-bg]');
  if (!sec) return;

  let layer = sec.querySelector('.que-parallax');
  if (!layer){
    layer = document.createElement('div');
    layer.className = 'que-parallax';
    sec.prepend(layer);
  }

  const bg = getComputedStyle(sec).getPropertyValue('--que-bg').trim();
  if (bg) layer.style.setProperty('--que-bg', bg);

  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));

  function onScroll(){
    const r  = sec.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Parallax vertical suave
    const translate = (r.top / vh) * -20; 
    layer.style.transform = `translateY(${translate}vh) scale(1.08)`;

    // Blur/opacidad DINÁMICOS (0 fuera de foco, 1 centrado)
    const center = r.top + r.height / 2;
    const p = clamp(1 - Math.abs(center - vh/2) / (vh * 0.9), 0, 1);

    const blurPx = 5 + (1 - p) * 50;   // 10px → 24px
    const op     = 0.30 + p * 0.40;     // 0.30 → 0.70

    layer.style.filter  = `blur(${blurPx.toFixed(1)}px)`;
    layer.style.opacity = op.toFixed(2);
  }

  onScroll();
  addEventListener('scroll', onScroll, { passive:true });
  addEventListener('resize', onScroll, { passive:true });
  if (lenis && typeof lenis.on === 'function') lenis.on('scroll', onScroll);
})();

/* =======================
   Sobre mí → reveal on view
======================= */
(function revealSobreMi(){
  const sec = document.getElementById('sobre-mi');
  if (!sec) return;

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6){
        sec.classList.add('is-inview');
      } else {
        sec.classList.remove('is-inview');
      }
    });
  }, { threshold: [0, 0.6, 1] });

  io.observe(sec);
})();
// === Forzar animación del ticker "Acerca de mí" ===
document.addEventListener('DOMContentLoaded', () => {
  const ticker = document.querySelector('.about-track');
  if (ticker) {
    // Forzar la clase que ignora prefers-reduced-motion
    ticker.classList.add('force-ticker');
  }
});


// Pausar o reanudar animaciones cuando la pestaña cambia de visibilidad
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Aquí podrías pausar requestAnimationFrame o animaciones activas
    console.log('Página oculta - pausar animaciones si aplica');
  } else {
    // Reanudar si es necesario
    console.log('Página visible - reanudar animaciones si aplica');
  }
});
