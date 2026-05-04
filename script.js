let theme = 'pink';
let shotCount = 2;
let activeFilter = 'none';
let activeFrame = 'none';
let taken = 0;
let stream = null;
const gallery = [];

const mascotMsgs = {
  pink:     'Sakura vibes~<br>so pretty! ♡',
  classic:  'Elegant &<br>timeless! ✨',
  noir:     'Dark &<br>mysterious 🖤',
  sky:      'Blue sky<br>dreamin~ ☁️',
  lavender: 'Dreamy lilac<br>magic! 💜',
  matcha:   'Soft &<br>earthy~ 🍵'
};

const themeColors = {
  pink:     {bg:'#fff0f5', strip:'linear-gradient(160deg,#ffd6e8,#ffaacf)', frame:'rgba(255,180,200,0.25)'},
  classic:  {bg:'#f5f0ec', strip:'#f5f0ec', frame:'rgba(0,0,0,0.06)'},
  noir:     {bg:'#1a1a1a', strip:'#141414', frame:'rgba(255,255,255,0.07)'},
  sky:      {bg:'#e8f5ff', strip:'linear-gradient(160deg,#d0eeff,#b8d8ff)', frame:'rgba(160,210,255,0.3)'},
  lavender: {bg:'#f5ecff', strip:'linear-gradient(160deg,#ead0ff,#d0b0f8)', frame:'rgba(180,140,240,0.25)'},
  matcha:   {bg:'#ecfaf0', strip:'linear-gradient(160deg,#d0f8e0,#a8e8c0)', frame:'rgba(130,220,170,0.25)'}
};

// ── NAVIGATION ──
function go(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('s'+n).classList.add('active');
  if (n === 3) { buildStrip(); startCam(); buildS3StripPreview(); }
  if (n !== 3) stopCam();
}

function buildS3StripPreview() {
  const wrap = document.getElementById('s3-strip-preview');
  if (!wrap) return;
  const activeCard = document.querySelector('.frame-card.active');
  if (!activeCard) return;
  const thumb = activeCard.querySelector('.frame-strip-thumb');
  if (!thumb) return;
  const clone = thumb.cloneNode(true);
  clone.style.cssText = `width:58px;aspect-ratio:5/12;border-radius:8px;overflow:hidden;box-shadow:0 3px 14px rgba(0,0,0,0.18);flex-shrink:0;display:flex;flex-direction:column;pointer-events:none;border:2px solid var(--pink-pale);`;
  wrap.innerHTML = '';
  wrap.appendChild(clone);
}

// ── THEME ──
function pickTheme(el) {
  document.querySelectorAll('.theme-item,.theme-card').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  theme = el.dataset.theme;
  document.getElementById('mascot-msg').innerHTML = mascotMsgs[theme] || 'Looking cute! ♡';
  buildFilmPreview();
}

// ── COUNT (bubble UI) ──
function pickCountBubble(el) {
  document.querySelectorAll('.count-bubble').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  shotCount = parseInt(el.dataset.n);
  // sync hidden pills
  document.querySelectorAll('.count-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.n === el.dataset.n);
  });
  buildFilmPreview();
}

// ── COUNT (legacy pill) ──
function pickCount(el) {
  document.querySelectorAll('.count-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  shotCount = parseInt(el.dataset.n);
  buildFilmPreview();
}

// ── FRAME ──
function pickFrame(el) {
  document.querySelectorAll('.frame-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeFrame = el.dataset.frame;
}

// ── NEW FRAME CARD PICKER ──
function pickFrameNew(el) {
  // el might be the inner thumb or the card itself
  const card = el.closest('.frame-card') || el;
  document.querySelectorAll('.frame-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  activeFrame = card.dataset.frame;
  // sync old hidden list
  document.querySelectorAll('.frame-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.frame === activeFrame);
  });
  buildFilmPreview();
}

// ── FRAME CATEGORY FILTER ──
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.frame-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.frame-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      document.querySelectorAll('.frame-card').forEach(card => {
        const cardCats = (card.dataset.cat || '').split(' ');
        card.style.display = (cat === 'all' || cardCats.includes(cat)) ? 'flex' : 'none';
      });
    });
  });
  // make frame strip thumbs clickable (for cases where onclick is on the card)
  document.querySelectorAll('.frame-strip-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => pickFrameNew(thumb));
  });
  buildFilmPreview();
});

// ── FILTER CSS MAP (applied to live video preview) ──
const filterCSS = {
  none:   'none',
  dusk:   'saturate(0.75) hue-rotate(200deg) brightness(0.88) contrast(1.1)',
  grain:  'saturate(0.6) contrast(1.15) brightness(0.95) sepia(0.18)',
  lofi:   'saturate(1.2) sepia(0.45) brightness(0.82) contrast(1.18)',
  double: 'saturate(0.5) brightness(1.12) contrast(0.88) hue-rotate(120deg)',
  y2k:    'saturate(2.0) brightness(1.08) contrast(1.1) hue-rotate(-15deg)',
  mist:   'saturate(0.45) brightness(1.22) contrast(0.82)',
  velvet: 'saturate(0.8) brightness(0.7) contrast(1.25) hue-rotate(320deg)',
  flower: 'saturate(1.4) brightness(1.05) contrast(0.92) hue-rotate(-8deg)',
  lily:   'saturate(0.55) brightness(1.15) contrast(0.9) hue-rotate(100deg)',
  stars:  'saturate(0.6) brightness(0.68) contrast(1.3)',
  lace:   'saturate(0.5) sepia(0.35) brightness(1.18) contrast(0.85)',
  rain:   'saturate(0.5) brightness(0.95) contrast(1.08) hue-rotate(185deg)',
};

function pickFilter(el) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeFilter = el.dataset.filter;
  const vid = document.getElementById('vid');
  if (vid) vid.style.filter = filterCSS[activeFilter] || 'none';

  // Live overlay canvas on viewfinder
  const oc = document.getElementById('flower-overlay');
  if (oc) {
    const overlayFilters = ['flower','lily','stars','lace','rain'];
    if (overlayFilters.includes(activeFilter)) {
      const rect = oc.parentElement.getBoundingClientRect();
      oc.width  = rect.width  * devicePixelRatio;
      oc.height = rect.height * devicePixelRatio;
      oc.style.width  = rect.width  + 'px';
      oc.style.height = rect.height + 'px';
      const octx = oc.getContext('2d');
      octx.scale(devicePixelRatio, devicePixelRatio);
      drawLiveOverlay(octx, rect.width, rect.height, activeFilter);
      oc.style.opacity = '1';
    } else {
      oc.style.opacity = '0';
    }
  }
}

// ── FILM PREVIEW ──
function buildFilmPreview() {
  const wrap = document.getElementById('strip-preview-wrap');
  if (!wrap) return;

  // Find the currently active frame card and clone its strip thumb
  const activeCard = document.querySelector('.frame-card.active');
  if (!activeCard) return;

  const thumb = activeCard.querySelector('.frame-strip-thumb');
  if (!thumb) return;

  // Clone the thumb and scale it to fit the preview panel
  const clone = thumb.cloneNode(true);
  clone.style.cssText = `
    width: 70px;
    aspect-ratio: 5/12;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(0,0,0,0.18);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    pointer-events: none;
    border: 2.5px solid var(--pink-pale);
  `;
  wrap.innerHTML = '';
  wrap.appendChild(clone);
}

// ── BUILD RESULT STRIP ──
function buildStrip() {
  taken = 0;
  gallery.length = 0;
  document.getElementById('gallery-grid').innerHTML = '<div class="gal-empty">no shots yet ♡</div>';

  const card = document.getElementById('result-card');
  const saveRow = card.querySelector('.save-row') || (() => {
    const r = document.createElement('div'); r.className = 'save-row';
    r.innerHTML = '<button class="btn btn-primary" style="width:100%;font-size:6px;" onclick="saveStrip()">↓ save strip ♡</button>';
    return r;
  })();
  card.innerHTML = '';
  card.classList.remove('done');

  const col = themeColors[theme] || themeColors.pink;

  // Strip wrapper with theme bg
  const stripWrap = document.createElement('div');
  stripWrap.id = 'strip-wrap';
  stripWrap.style.cssText = `width:100%;display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:10px;background:${col.strip};`;

  for (let i = 0; i < shotCount; i++) {
    const f = document.createElement('div');
    f.className = 'result-frame empty';
    f.id = 'rf-' + i;
    stripWrap.appendChild(f);
  }

  card.appendChild(stripWrap);
  card.appendChild(saveRow);

  document.getElementById('s-cur').textContent = 1;
  document.getElementById('s-tot').textContent = shotCount;
  document.getElementById('shutter').disabled = true;
  document.getElementById('hud-pill').textContent = '♡ ready';
  document.getElementById('cam-badge').textContent = 'shoot time ♡';
}

// ── CAMERA ──
async function startCam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false
    });
    const v = document.getElementById('vid');
    v.srcObject = stream;
    v.onloadedmetadata = () => {
      document.getElementById('no-cam').classList.add('gone');
      document.getElementById('shutter').disabled = false;
    };
  } catch (e) { console.warn(e); }
}

function stopCam() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  const nc = document.getElementById('no-cam');
  if (nc) nc.classList.remove('gone');
  const sh = document.getElementById('shutter');
  if (sh) sh.disabled = true;
  // reset filter on video element
  const vid = document.getElementById('vid');
  if (vid) vid.style.filter = 'none';
  // reset filter chips
  activeFilter = 'none';
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  const none = document.querySelector('.filter-chip[data-filter="none"]');
  if (none) none.classList.add('active');
  // hide flower overlay
  const oc = document.getElementById('flower-overlay');
  if (oc) oc.style.opacity = '0';
}

// ── SHOOT ──
async function shoot() {
  if (taken >= shotCount) return;
  document.getElementById('shutter').disabled = true;
  document.getElementById('hud-pill').textContent = '... get ready ...';

  await countdown();
  capture();
  flash();

  taken++;
  document.getElementById('s-cur').textContent = Math.min(taken + 1, shotCount);

  if (taken >= shotCount) {
    document.getElementById('result-card').classList.add('done');
    document.getElementById('hud-pill').textContent = '✦ all done! ✦';
    document.getElementById('cam-badge').textContent = 'finished ✦';
  } else {
    document.getElementById('hud-pill').textContent = `shot ${taken + 1} of ${shotCount}`;
    setTimeout(() => { document.getElementById('shutter').disabled = false; }, 700);
  }
}

function countdown() {
  return new Promise(res => {
    const el = document.getElementById('cd-num');
    let n = 3;
    function tick() {
      el.textContent = n;
      el.classList.add('show');
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => { n--; n < 0 ? res() : tick(); }, 130);
      }, 720);
    }
    tick();
  });
}

function capture() {
  const v = document.getElementById('vid');
  const c = document.getElementById('cap');
  const W = v.videoWidth || 640, H = v.videoHeight || 480;
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1);
  ctx.drawImage(v, 0, 0, W, H);
  ctx.restore();
  applyFilter(ctx, W, H);
  applyCanvasOverlay(ctx, W, H, activeFilter);

  const slot = document.getElementById('rf-' + taken);
  if (slot) {
    slot.classList.remove('empty');
    const copy = document.createElement('canvas');
    copy.width = W; copy.height = H;
    copy.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    copy.getContext('2d').drawImage(c, 0, 0);
    slot.appendChild(copy);
    addToGallery(copy);
  }
}

function applyFilter(ctx, W, H) {
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;

  if (activeFilter !== 'none') {
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i+1], b = d[i+2];

      if (activeFilter === 'dusk') {
        // Dreamy beach dusk — Image 1: blue-purple haze, desaturated, lifted shadows
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.45 + r*.55 + 20);
        g = Math.min(255, luma*.5  + g*.5  + 8);
        b = Math.min(255, luma*.35 + b*.65 + 48);
        // soft contrast
        r = Math.min(255, (r-128)*.92+128);
        g = Math.min(255, (g-128)*.92+128);
        b = Math.min(255, (b-128)*.95+128);

      } else if (activeFilter === 'grain') {
        // Film school girl — Image 2: desaturated, slightly green-tinted, high contrast
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.35 + r*.65);
        g = Math.min(255, luma*.3  + g*.7  + 6);
        b = Math.min(255, luma*.4  + b*.6  - 4);
        // boost contrast
        r = Math.min(255, Math.max(0,(r-128)*1.18+128));
        g = Math.min(255, Math.max(0,(g-128)*1.18+128));
        b = Math.min(255, Math.max(0,(b-128)*1.18+128));
        // film grain noise
        const noise = (Math.random()-0.5)*22;
        r = Math.min(255, Math.max(0, r+noise));
        g = Math.min(255, Math.max(0, g+noise));
        b = Math.min(255, Math.max(0, b+noise));

      } else if (activeFilter === 'lofi') {
        // Lo-fi warm party — Image 3: warm amber/orange, crushed shadows, gritty
        r = Math.min(255, r*1.22 + 28);
        g = Math.min(255, g*.88  + 10);
        b = Math.min(255, b*.52);
        // crush shadows
        r = Math.min(255, Math.max(0,(r-128)*1.22+128));
        g = Math.min(255, Math.max(0,(g-128)*1.15+128));
        b = Math.min(255, Math.max(0,(b-128)*1.1+128));

      } else if (activeFilter === 'double') {
        // Double exposure floral — Image 4: ethereal, desaturated cool, lifted
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.5 + r*.5 + 12);
        g = Math.min(255, luma*.4 + g*.6 + 18);
        b = Math.min(255, luma*.4 + b*.6 + 22);
        // soften contrast
        r = Math.min(255, (r-128)*.82+148);
        g = Math.min(255, (g-128)*.82+148);
        b = Math.min(255, (b-128)*.82+148);

      } else if (activeFilter === 'y2k') {
        // Y2K hyper saturated
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.1 + r*.9*1.5 - 10);
        g = Math.min(255, luma*.1 + g*.9*1.3);
        b = Math.min(255, luma*.1 + b*.9*1.6 + 10);

      } else if (activeFilter === 'mist') {
        // Airy white mist: bleach bypass + heavy lift
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.3 + r*.7 + 35);
        g = Math.min(255, luma*.3 + g*.7 + 30);
        b = Math.min(255, luma*.3 + b*.7 + 40);
        // low contrast
        r = Math.min(255, (r-128)*.78+138);
        g = Math.min(255, (g-128)*.78+138);
        b = Math.min(255, (b-128)*.78+140);

      } else if (activeFilter === 'velvet') {
        // Velvet night: deep shadows, magenta midtones
        r = Math.min(255, r*.88 + 18);
        g = Math.min(255, g*.6);
        b = Math.min(255, b*.72 + 8);
        // crush darks hard
        r = Math.min(255, Math.max(0,(r-128)*1.35+118));
        g = Math.min(255, Math.max(0,(g-128)*1.3+108));
        b = Math.min(255, Math.max(0,(b-128)*1.2+115));

      } else if (activeFilter === 'flower') {
        // Bloom floral: rosy pink lift, soft warm glow
        r = Math.min(255, r*1.08 + 18);
        g = Math.min(255, g*.88 + 6);
        b = Math.min(255, b*.90 + 10);
        // soften contrast like a dreamy bloom
        r = Math.min(255, (r-128)*.88+138);
        g = Math.min(255, (g-128)*.88+132);
        b = Math.min(255, (b-128)*.9+130);

      } else if (activeFilter === 'lily') {
        // White lily double exposure: very desaturated, cool green-white lift
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.55 + r*.45 + 18);
        g = Math.min(255, luma*.45 + g*.55 + 26);
        b = Math.min(255, luma*.5  + b*.5  + 20);
        r = Math.min(255, (r-128)*.8+148);
        g = Math.min(255, (g-128)*.8+150);
        b = Math.min(255, (b-128)*.8+148);

      } else if (activeFilter === 'stars') {
        // Deep night starfield: crush to dark, lift blues/purples
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.3 + r*.7*.7 + 8);
        g = Math.min(255, luma*.25+ g*.75*.65);
        b = Math.min(255, luma*.35+ b*.65*.9 + 20);
        r = Math.min(255, Math.max(0,(r-128)*1.4+108));
        g = Math.min(255, Math.max(0,(g-128)*1.35+100));
        b = Math.min(255, Math.max(0,(b-128)*1.3+118));

      } else if (activeFilter === 'lace') {
        // Antique lace: warm sepia-cream, very soft
        const sr = r*.42 + g*.78 + b*.2;
        const sg = r*.37 + g*.70 + b*.17;
        const sb = r*.28 + g*.54 + b*.13;
        r = Math.min(255, sr*.82 + 38);
        g = Math.min(255, sg*.82 + 28);
        b = Math.min(255, sb*.82 + 18);
        r = Math.min(255, (r-128)*.78+142);
        g = Math.min(255, (g-128)*.78+136);
        b = Math.min(255, (b-128)*.78+130);

      } else if (activeFilter === 'rain') {
        // Rainy window: blue-grey desaturation, cool shadows
        const luma = r*.299 + g*.587 + b*.114;
        r = Math.min(255, luma*.4 + r*.6 + 5);
        g = Math.min(255, luma*.38+ g*.62 + 8);
        b = Math.min(255, luma*.32+ b*.68 + 22);
        r = Math.min(255, (r-128)*.9+125);
        g = Math.min(255, (g-128)*.9+126);
        b = Math.min(255, (b-128)*.92+130);
      }

      d[i] = r; d[i+1] = g; d[i+2] = b;
    }
  }

  ctx.putImageData(img, 0, 0);

  // ── Canvas overlay effects ──
  applyCanvasOverlay(ctx, W, H, activeFilter);
}

function applyCanvasOverlay(ctx, W, H, activeFilter) {
  // ── Canvas overlay effects ──
  if (activeFilter === 'dusk') {
    // Horizontal gradient like a sunset horizon low on frame
    const dg = ctx.createLinearGradient(0, H*0.55, 0, H);
    dg.addColorStop(0, 'rgba(180,140,200,0)');
    dg.addColorStop(1, 'rgba(80,60,140,0.3)');
    ctx.fillStyle = dg; ctx.fillRect(0,0,W,H);
    // soft top highlight like sky
    const dt = ctx.createLinearGradient(0,0,0,H*0.4);
    dt.addColorStop(0,'rgba(200,210,255,0.22)');
    dt.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = dt; ctx.fillRect(0,0,W,H);
    // vignette edges
    const dv = ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);
    dv.addColorStop(0,'rgba(0,0,0,0)');
    dv.addColorStop(1,'rgba(20,10,60,0.28)');
    ctx.fillStyle = dv; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'grain') {
    // Heavy film grain overlay
    ctx.save();
    for (let gx=0;gx<W;gx+=2) for (let gy=0;gy<H;gy+=2) {
      if (Math.random()>.52) {
        ctx.globalAlpha = Math.random()*.09;
        ctx.fillStyle = Math.random()>.5?'#fff':'#000';
        ctx.fillRect(gx,gy,1,1);
      }
    }
    ctx.restore();
    // vignette — like a scanned photo
    const gv = ctx.createRadialGradient(W/2,H/2,H*.28,W/2,H/2,H*.82);
    gv.addColorStop(0,'rgba(0,0,0,0)');
    gv.addColorStop(1,'rgba(0,0,0,0.38)');
    ctx.fillStyle=gv; ctx.fillRect(0,0,W,H);
    // light leak top-left
    const ll=ctx.createRadialGradient(0,0,0,0,0,W*.5);
    ll.addColorStop(0,'rgba(200,220,180,0.18)');
    ll.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ll; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'lofi') {
    // Warm glow center like a candle/party light
    const lg = ctx.createRadialGradient(W*.5,H*.45,0,W*.5,H*.45,W*.6);
    lg.addColorStop(0,'rgba(255,160,40,0.14)');
    lg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=lg; ctx.fillRect(0,0,W,H);
    // hard vignette
    const lv = ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.8);
    lv.addColorStop(0,'rgba(0,0,0,0)');
    lv.addColorStop(1,'rgba(20,5,0,0.5)');
    ctx.fillStyle=lv; ctx.fillRect(0,0,W,H);
    // scan lines subtle
    ctx.save(); ctx.globalAlpha=0.05;
    for(let y=0;y<H;y+=3){ctx.fillStyle='#000';ctx.fillRect(0,y,W,1);}
    ctx.restore();

  } else if (activeFilter === 'double') {
    // Ethereal double exposure: soft white center bloom
    const de = ctx.createRadialGradient(W*.5,H*.42,0,W*.5,H*.42,W*.55);
    de.addColorStop(0,'rgba(255,255,255,0.22)');
    de.addColorStop(0.6,'rgba(200,230,210,0.08)');
    de.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=de; ctx.fillRect(0,0,W,H);
    // cool edge tint
    const dv=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.9);
    dv.addColorStop(0,'rgba(0,0,0,0)');
    dv.addColorStop(1,'rgba(60,100,80,0.25)');
    ctx.fillStyle=dv; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'y2k') {
    // chromatic aberration hint + scanlines
    ctx.save();
    ctx.globalAlpha=0.06;
    ctx.globalCompositeOperation='screen';
    ctx.fillStyle='rgba(255,0,120,1)';
    ctx.fillRect(1,0,W,H);
    ctx.restore();
    const yg=ctx.createLinearGradient(0,0,W,H);
    yg.addColorStop(0,'rgba(120,0,255,0.1)');
    yg.addColorStop(1,'rgba(0,200,255,0.1)');
    ctx.fillStyle=yg; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'mist') {
    // heavy white center glow
    const mg=ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.4,W*.7);
    mg.addColorStop(0,'rgba(255,255,255,0.28)');
    mg.addColorStop(1,'rgba(220,230,255,0)');
    ctx.fillStyle=mg; ctx.fillRect(0,0,W,H);
    // very soft vignette
    const mv=ctx.createRadialGradient(W/2,H/2,H*.4,W/2,H/2,H*.9);
    mv.addColorStop(0,'rgba(0,0,0,0)');
    mv.addColorStop(1,'rgba(180,190,220,0.18)');
    ctx.fillStyle=mv; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'velvet') {
    // Deep magenta vignette
    const vg=ctx.createRadialGradient(W/2,H/2,H*.15,W/2,H/2,H*.85);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(60,0,30,0.55)');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
    // subtle pink top glow
    const vt=ctx.createLinearGradient(0,0,0,H*.35);
    vt.addColorStop(0,'rgba(200,50,100,0.18)');
    vt.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=vt; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'flower') {
    // Soft pink vignette
    const fv=ctx.createRadialGradient(W/2,H/2,H*.22,W/2,H/2,H*.82);
    fv.addColorStop(0,'rgba(255,200,220,0)');
    fv.addColorStop(1,'rgba(255,100,160,0.2)');
    ctx.fillStyle=fv; ctx.fillRect(0,0,W,H);
    // Draw scattered flower petals over the image
    drawFlowerPetals(ctx, W, H, [{hue:340,count:8},{hue:310,count:5},{hue:355,count:4}]);
  } else if (activeFilter === 'lily') {
    // Ghostly white lily silhouettes — double-exposure style
    const lc=ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.4,W*.65);
    lc.addColorStop(0,'rgba(255,255,255,0.18)');
    lc.addColorStop(1,'rgba(200,230,210,0)');
    ctx.fillStyle=lc; ctx.fillRect(0,0,W,H);
    drawLilyOverlay(ctx, W, H);
    // cool green-white edge
    const lv=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.9);
    lv.addColorStop(0,'rgba(0,0,0,0)');
    lv.addColorStop(1,'rgba(80,130,100,0.22)');
    ctx.fillStyle=lv; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'stars') {
    // Scattered star/sparkle overlay on dark night sky
    const sg=ctx.createLinearGradient(0,0,0,H);
    sg.addColorStop(0,'rgba(30,10,70,0.45)');
    sg.addColorStop(0.5,'rgba(10,5,30,0.18)');
    sg.addColorStop(1,'rgba(50,10,80,0.3)');
    ctx.fillStyle=sg; ctx.fillRect(0,0,W,H);
    drawStarOverlay(ctx, W, H);
    // edge vignette
    const sv=ctx.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.85);
    sv.addColorStop(0,'rgba(0,0,0,0)');
    sv.addColorStop(1,'rgba(10,0,30,0.5)');
    ctx.fillStyle=sv; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'lace') {
    // Warm cream vignette + lace edge pattern
    const lc=ctx.createRadialGradient(W/2,H/2,H*.25,W/2,H/2,H*.88);
    lc.addColorStop(0,'rgba(255,240,220,0)');
    lc.addColorStop(1,'rgba(180,130,80,0.28)');
    ctx.fillStyle=lc; ctx.fillRect(0,0,W,H);
    drawLaceOverlay(ctx, W, H);
    // top light leak
    const lt=ctx.createLinearGradient(0,0,W*.3,H*.3);
    lt.addColorStop(0,'rgba(255,240,200,0.22)');
    lt.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=lt; ctx.fillRect(0,0,W,H);

  } else if (activeFilter === 'rain') {
    // Rain streak overlay + cool blue vignette
    const rv=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.9);
    rv.addColorStop(0,'rgba(0,0,0,0)');
    rv.addColorStop(1,'rgba(20,40,80,0.3)');
    ctx.fillStyle=rv; ctx.fillRect(0,0,W,H);
    drawRainOverlay(ctx, W, H);
    // window mist top
    const rt=ctx.createLinearGradient(0,0,0,H*.25);
    rt.addColorStop(0,'rgba(180,210,240,0.25)');
    rt.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rt; ctx.fillRect(0,0,W,H);
  }
}

// ── OVERLAY DRAW FUNCTIONS ──

function drawFlowerPetals(ctx, W, H, palettes) {
  // Scattered semi-transparent 5-petal flowers around edges
  const positions = [
    {x:.04,y:.04,r:28},{x:.90,y:.03,r:22},{x:.06,y:.86,r:24},{x:.86,y:.88,r:20},
    {x:.48,y:.02,r:18},{x:.16,y:.05,r:15},{x:.76,y:.90,r:16},{x:.92,y:.45,r:14},
    {x:.02,y:.45,r:13},{x:.30,y:.96,r:12},{x:.65,y:.01,r:11},{x:.80,y:.08,r:10},
  ];
  ctx.save();
  positions.forEach(({x,y,r}, idx) => {
    const pal = palettes[idx % palettes.length];
    const hue = pal.hue + (idx*7);
    const cx=W*x, cy=H*y;
    for(let p=0;p<5;p++){
      const angle=(p/5)*Math.PI*2;
      const px=cx+Math.cos(angle)*r*.52;
      const py=cy+Math.sin(angle)*r*.52;
      ctx.beginPath();
      ctx.ellipse(px,py,r*.56,r*.33,angle,0,Math.PI*2);
      ctx.fillStyle=`hsla(${hue},88%,78%,0.62)`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(cx,cy,r*.22,0,Math.PI*2);
    ctx.fillStyle=`hsla(${hue+20},80%,94%,0.9)`;
    ctx.fill();
  });
  ctx.restore();
}

function drawLilyOverlay(ctx, W, H) {
  // Semi-transparent white lily silhouettes — 3 blooms placed around frame
  ctx.save();
  const lilies = [
    {x:.08,y:.08,scale:.18,rot:-0.3},
    {x:.88,y:.06,scale:.14,rot:0.5},
    {x:.82,y:.88,scale:.16,rot:-0.8},
    {x:.06,y:.80,scale:.13,rot:0.2},
  ];
  lilies.forEach(({x,y,scale,rot}) => {
    const cx=W*x, cy=H*y, r=Math.min(W,H)*scale;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(rot);
    // 6 elongated petals
    for(let p=0;p<6;p++){
      const a=(p/6)*Math.PI*2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0,-r*.55,r*.14,r*.58,0,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.28)';
      ctx.fill();
      ctx.strokeStyle='rgba(200,230,210,0.35)';
      ctx.lineWidth=1;
      ctx.stroke();
      ctx.restore();
    }
    // stamen dots
    for(let s=0;s<6;s++){
      const a=(s/6)*Math.PI*2;
      ctx.beginPath();
      ctx.arc(Math.cos(a)*r*.22,Math.sin(a)*r*.22,r*.04,0,Math.PI*2);
      ctx.fillStyle='rgba(255,240,180,0.55)';
      ctx.fill();
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawStarOverlay(ctx, W, H) {
  // Scattered glowing stars and sparkles across the image
  ctx.save();
  const rng = (n) => Math.random()*n;
  // Big sparkle crosses
  const sparkles = Array.from({length:18},()=>({x:rng(W),y:rng(H),r:rng(4)+1.5}));
  sparkles.forEach(({x,y,r})=>{
    // glow
    const g=ctx.createRadialGradient(x,y,0,x,y,r*4);
    g.addColorStop(0,'rgba(200,180,255,0.7)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(x-r*4,y-r*4,r*8,r*8);
    // cross sparkle
    ctx.strokeStyle='rgba(255,255,255,0.9)';
    ctx.lineWidth=r*.5;
    ctx.beginPath(); ctx.moveTo(x-r*3,y); ctx.lineTo(x+r*3,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y-r*3); ctx.lineTo(x,y+r*3); ctx.stroke();
    // diagonal fainter
    ctx.strokeStyle='rgba(255,255,255,0.4)';
    ctx.lineWidth=r*.3;
    ctx.beginPath(); ctx.moveTo(x-r*1.8,y-r*1.8); ctx.lineTo(x+r*1.8,y+r*1.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+r*1.8,y-r*1.8); ctx.lineTo(x-r*1.8,y+r*1.8); ctx.stroke();
  });
  // tiny dot stars
  for(let i=0;i<40;i++){
    const x=rng(W), y=rng(H), r=rng(1.2)+.3;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${(.3+Math.random()*.6).toFixed(2)})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawLaceOverlay(ctx, W, H) {
  // Delicate lace-like dot border around all four edges
  ctx.save();
  const dotR = 2.5, spacing = 12;
  ctx.fillStyle = 'rgba(255,240,220,0.45)';
  // top & bottom rows (3 rows deep)
  for(let row=0;row<3;row++){
    const yOff = dotR*2 + row*spacing;
    for(let x=dotR;x<W;x+=spacing){
      // alternate offset per row
      const xOff = x + (row%2 ? spacing/2 : 0);
      if(xOff > W) continue;
      ctx.beginPath(); ctx.arc(xOff, yOff, dotR*(1-row*.15), 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(xOff, H-yOff, dotR*(1-row*.15), 0, Math.PI*2); ctx.fill();
    }
    // sides
    for(let y=dotR*2+spacing;y<H-dotR*2-spacing;y+=spacing){
      const yOff2 = y + (row%2 ? spacing/2 : 0);
      if(yOff2 > H) continue;
      ctx.beginPath(); ctx.arc(dotR*2+row*spacing, yOff2, dotR*(1-row*.15), 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(W-dotR*2-row*spacing, yOff2, dotR*(1-row*.15), 0, Math.PI*2); ctx.fill();
    }
  }
  // small connecting arcs between dots
  ctx.strokeStyle='rgba(220,190,150,0.25)';
  ctx.lineWidth=0.8;
  for(let x=dotR;x<W-spacing;x+=spacing){
    ctx.beginPath(); ctx.arc(x+spacing/2, dotR*2+spacing*.5, spacing*.45, Math.PI, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x+spacing/2, H-dotR*2-spacing*.5, spacing*.45, 0, Math.PI); ctx.stroke();
  }
  ctx.restore();
}

function drawRainOverlay(ctx, W, H) {
  // Semi-transparent rain streaks at a slight angle
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = 'rgba(180,210,240,1)';
  const streakCount = 80;
  for(let i=0;i<streakCount;i++){
    const x = Math.random()*W*1.3 - W*.15;
    const y = Math.random()*H;
    const len = Math.random()*22 + 8;
    const angle = Math.PI/2 + 0.18; // slight diagonal
    ctx.lineWidth = Math.random()*.8 + .3;
    ctx.globalAlpha = Math.random()*.18 + .06;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle)*len, y + Math.sin(angle)*len);
    ctx.stroke();
  }
  // a few blurred drops (larger faded circles)
  ctx.globalAlpha=0.07;
  for(let i=0;i<12;i++){
    const x=Math.random()*W, y=Math.random()*H, r=Math.random()*3+1;
    const g=ctx.createRadialGradient(x,y,0,x,y,r*3);
    g.addColorStop(0,'rgba(200,220,255,0.6)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(x-r*3,y-r*3,r*6,r*6);
  }
  ctx.restore();
}

// Unified live-preview overlay dispatcher (draws onto the viewfinder canvas overlay)
function drawLiveOverlay(ctx, W, H, filter) {
  ctx.clearRect(0,0,W,H);
  if(filter==='flower') drawFlowerPetals(ctx,W,H,[{hue:340},{hue:310},{hue:355}]);
  else if(filter==='lily')  drawLilyOverlay(ctx,W,H);
  else if(filter==='stars') drawStarOverlay(ctx,W,H);
  else if(filter==='lace')  drawLaceOverlay(ctx,W,H);
  else if(filter==='rain')  drawRainOverlay(ctx,W,H);
}

function flash() {
  const f = document.getElementById('flash-el');
  f.classList.add('on');
  setTimeout(() => f.classList.remove('on'), 80);
}

function addToGallery(canvas) {
  const grid = document.getElementById('gallery-grid');
  const empty = grid.querySelector('.gal-empty');
  if (empty) empty.remove();

  const thumb = document.createElement('div');
  thumb.className = 'gal-thumb';
  const c = canvas.cloneNode(true);
  c.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
  thumb.appendChild(c);
  grid.appendChild(thumb);
  gallery.push(canvas);
}

// ── SAVE ──
function saveStrip() {
  const slots = document.querySelectorAll('#strip-wrap .result-frame canvas');
  if (!slots.length) return;

  // Frame layout params per style
  const frameParams = {
    none:      {padH:14, padV:20, gap:8,  borderW:0,  bottomPad:0,  bgFn:'gradient', decorFn:null},
    film:      {padH:18, padV:14, gap:6,  borderW:0,  bottomPad:0,  bgFn:'film',     decorFn:'drawFilmSprockets'},
    polaroid:  {padH:12, padV:14, gap:18, borderW:0,  bottomPad:30, bgFn:'white',    decorFn:null},
    bow:       {padH:12, padV:14, gap:22, borderW:0,  bottomPad:30, bgFn:'white',    decorFn:'drawBows'},
    'gingham-r':{padH:14,padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'gingham-r',decorFn:null},
    'gingham-b':{padH:14,padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'gingham-b',decorFn:null},
    'gingham-p':{padH:14,padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'gingham-p',decorFn:null},
    'bows-pat': {padH:14,padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'bows-pat', decorFn:'drawBowsPattern'},
    cherry:    {padH:14, padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'cherry',   decorFn:'drawCherryBorder'},
    daisy:     {padH:14, padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'daisy',    decorFn:'drawDaisyBorder'},
    leopard:   {padH:14, padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'leopard',  decorFn:'drawLeopardBorder'},
    lips:      {padH:14, padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'lips',     decorFn:'drawLipsBorder'},
    citrus:    {padH:14, padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'citrus',   decorFn:'drawCitrusBorder'},
    hearts:    {padH:14, padV:14, gap:8,  borderW:14, bottomPad:0,  bgFn:'hearts',   decorFn:'drawHeartsBorder'},
    clip:      {padH:14, padV:40, gap:8,  borderW:0,  bottomPad:0,  bgFn:'clip',     decorFn:'drawClip'},
  };

  const fp = frameParams[activeFrame] || frameParams.none;
  const {padH, padV, gap, bottomPad} = fp;

  const fw = 240, fh = Math.round(fw * 3/4);
  const W = fw + padH*2;
  const H = padV*2 + (fh + bottomPad)*slots.length + gap*(slots.length-1);

  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d');

  // ── Draw background ──
  drawStripBackground(ctx, W, H, fp.bgFn);

  // ── Draw photos ──
  slots.forEach((s, i) => {
    const y = padV + i*(fh + bottomPad + gap);
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.drawImage(s, padH, y, fw, fh);
    ctx.shadowColor = 'transparent';

    // White bottom bar for polaroid styles
    if (bottomPad > 0) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(padH, y + fh, fw, bottomPad);
      if (activeFrame === 'bow') {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎀', padH + fw/2, y + fh + bottomPad - 5);
      }
    }
  });

  // ── Draw overlay decorations ──
  if (fp.decorFn) stripDecorFns[fp.decorFn](ctx, W, H, padH, padV, fw, fh, bottomPad, gap, slots.length);

  const a = document.createElement('a');
  a.href = out.toDataURL('image/png');
  a.download = `yume-strip-${theme}-${activeFrame}.png`;
  a.click();
}

function drawStripBackground(ctx, W, H, bgFn) {
  const stripBgs = {
    pink:['#ffd6e8','#ffaacf'], classic:['#f5f0ec','#ede8e2'],
    noir:['#141414','#1a1a1a'], sky:['#d0eeff','#b8d8ff'],
    lavender:['#ead0ff','#d0b0f8'], matcha:['#d0f8e0','#a8e8c0']
  };

  if (bgFn === 'gradient') {
    const [c1,c2] = stripBgs[theme] || stripBgs.pink;
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,c1); g.addColorStop(1,c2);
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'film') {
    ctx.fillStyle = '#141414'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'white') {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'clip') {
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0,0,W,36);
  } else if (bgFn === 'gingham-r') {
    drawGinghamBg(ctx, W, H, 'rgba(180,30,30,0.22)', '#fff');
  } else if (bgFn === 'gingham-b') {
    drawGinghamBg(ctx, W, H, 'rgba(70,120,210,0.24)', '#eef4ff');
  } else if (bgFn === 'gingham-p') {
    drawGinghamBg(ctx, W, H, 'rgba(140,80,200,0.24)', '#f4eeff');
  } else if (bgFn === 'bows-pat') {
    ctx.fillStyle = '#b83060'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'cherry') {
    ctx.fillStyle = '#fff0f0'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'daisy') {
    ctx.fillStyle = '#f0f0ff'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'leopard') {
    ctx.fillStyle = '#c8a060'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'lips') {
    ctx.fillStyle = '#cc2850'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'citrus') {
    ctx.fillStyle = '#ffcc70'; ctx.fillRect(0,0,W,H);
  } else if (bgFn === 'hearts') {
    ctx.fillStyle = '#fff0f5'; ctx.fillRect(0,0,W,H);
  }
}

function drawGinghamBg(ctx, W, H, color, base) {
  ctx.fillStyle = base; ctx.fillRect(0,0,W,H);
  const sz = 10;
  ctx.fillStyle = color;
  for (let x = 0; x < W; x += sz*2) for (let y = 0; y < H; y += sz*2) {
    ctx.fillRect(x, y, sz, sz);
    ctx.fillRect(x+sz, y+sz, sz, sz);
  }
  ctx.globalAlpha = 0.5;
  for (let x = sz; x < W; x += sz*2) for (let y = 0; y < H; y += sz*2) {
    ctx.fillRect(x, y, sz, sz);
    ctx.fillRect(x-sz, y+sz, sz, sz);
  }
  ctx.globalAlpha = 1;
}

// Strip decoration functions
const stripDecorFns = {
  drawFilmSprockets(ctx, W, H) {
    const holeW = 8, holeH = 6, holeR = 2;
    ctx.fillStyle = '#fff';
    for (let y = 12; y < H-12; y += 14) {
      // left holes
      roundRect(ctx, 3, y, holeW, holeH, holeR); ctx.fill();
      // right holes
      roundRect(ctx, W-11, y, holeW, holeH, holeR); ctx.fill();
    }
  },
  drawBows(ctx, W, H, padH, padV, fw, fh, bp, gap, count) {
    ctx.font = '22px serif'; ctx.textAlign = 'center';
    for (let i = 0; i < count; i++) {
      const y = padV + i*(fh+bp+gap) + fh + bp/2 + 4;
      ctx.fillText('🎀', W/2, y);
    }
  },
  drawBowsPattern(ctx, W, H, padH, padV, fw, fh) {
    ctx.font = '14px serif';
    // scatter bows in the border areas
    const bows = ['🎀','🎀','🎀','🎀','🎀','🎀','🎀','🎀','🎀','🎀','🎀','🎀'];
    let idx = 0;
    // top + bottom rows
    for (let x = 8; x < W-8; x += 20) {
      ctx.fillText(bows[idx%bows.length], x, 14); idx++;
      ctx.fillText(bows[idx%bows.length], x, H-4); idx++;
    }
    // sides
    for (let y = 20; y < H-14; y += 20) {
      ctx.fillText(bows[idx%bows.length], 8, y); idx++;
      ctx.fillText(bows[idx%bows.length], W-8, y); idx++;
    }
  },
  drawCherryBorder(ctx, W, H) { drawEmojiBorder(ctx, W, H, '🍒'); },
  drawDaisyBorder(ctx, W, H)  { drawEmojiBorder(ctx, W, H, '🌼'); },
  drawLeopardBorder(ctx, W, H){ drawEmojiBorder(ctx, W, H, '🐆'); },
  drawLipsBorder(ctx, W, H)   { drawEmojiBorder(ctx, W, H, '💋'); },
  drawCitrusBorder(ctx, W, H) { drawEmojiBorder(ctx, W, H, '🍊'); },
  drawHeartsBorder(ctx, W, H) { drawEmojiBorder(ctx, W, H, '💕'); },
  drawClip(ctx, W, H) {
    // clip icon at top
    ctx.fillStyle = '#888'; ctx.fillRect(W/2-18, 2, 36, 8);
    ctx.fillStyle = '#666'; ctx.fillRect(W/2-12, 0, 24, 5);
    ctx.font = '24px serif'; ctx.textAlign='center';
    ctx.fillText('📎', W/2, 28);
  },
};

function drawEmojiBorder(ctx, W, H, emoji) {
  ctx.font = '13px serif'; ctx.textAlign = 'left';
  const sz = 15;
  // top
  for (let x = 2; x < W; x += sz) ctx.fillText(emoji, x, 13);
  // bottom
  for (let x = 2; x < W; x += sz) ctx.fillText(emoji, x, H-2);
  // sides
  for (let y = sz; y < H-sz; y += sz) {
    ctx.fillText(emoji, 1, y);
    ctx.fillText(emoji, W-sz+1, y);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

// ── INIT ──
buildFilmPreview();