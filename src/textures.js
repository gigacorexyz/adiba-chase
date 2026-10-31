// Small procedural textures (no image downloads). Every texture is <= 256 px (shop-sign strips 768x64),
// greyscale-ish where a tint colour is applied by the material, and shared across all meshes.
export function makeTextures(THREE) {
  const list = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, { repeat = false, rx = 1, ry = 1, aniso = 4 } = {}) {
    const t = new THREE.CanvasTexture(c);
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    list.push({ t, w: c.width, h: c.height });
    return t;
  }
  function speckle(x, w, h, n, lo, hi, a = 1, size = 2) {
    for (let i = 0; i < n; i++) { const v = (lo + Math.random() * (hi - lo)) | 0; x.fillStyle = `rgba(${v},${v},${v},${a})`; x.fillRect(Math.random() * w, Math.random() * h, size, size); }
  }

  // Asphalt: grain, aggregate, hairline cracks, faded tyre marks, a repair patch
  function asphalt() {
    const W = 256, c = canvas(W, W), x = c.getContext('2d');
    x.fillStyle = '#3b444c'; x.fillRect(0, 0, W, W);
    speckle(x, W, W, 3200, 30, 95, 1, 2); speckle(x, W, W, 500, 90, 140, .7, 1);
    x.fillStyle = 'rgba(10,12,14,.22)'; x.fillRect(W * .20, 0, 10, W); x.fillRect(W * .29, 0, 10, W);      // tyre tracks
    x.fillStyle = 'rgba(10,12,14,.14)'; x.fillRect(W * .66, 0, 9, W); x.fillRect(W * .74, 0, 9, W);
    x.fillStyle = 'rgba(70,76,82,.55)'; x.fillRect(W * .55, W * .62, 70, 46);                              // patch
    x.strokeStyle = 'rgba(8,8,10,.8)'; x.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) { let px = rnd(0, W), py = rnd(0, W); x.beginPath(); x.moveTo(px, py); for (let j = 0; j < 7; j++) { px += rnd(-14, 14); py += rnd(4, 18); x.lineTo(px, py); } x.stroke(); }
    return tex(c, { repeat: true, rx: 5, ry: 15 });
  }
  // Concrete paving slabs
  function concrete() {
    const W = 128, c = canvas(W, W), x = c.getContext('2d');
    x.fillStyle = '#b9bcbd'; x.fillRect(0, 0, W, W); speckle(x, W, W, 1400, 140, 210, .6, 2);
    x.strokeStyle = 'rgba(60,64,66,.85)'; x.lineWidth = 2; x.strokeRect(1, 1, W - 2, W - 2);
    x.strokeStyle = 'rgba(60,64,66,.4)'; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, W); x.moveTo(0, W / 2); x.lineTo(W, W / 2); x.stroke();
    x.fillStyle = 'rgba(40,40,36,.12)'; x.beginPath(); x.ellipse(rnd(30, 100), rnd(30, 100), 22, 12, 0, 0, 7); x.fill();
    return tex(c, { repeat: true });
  }
  // Brick wall (greyscale so the theme colour tints it)
  function brick() {
    const W = 128, c = canvas(W, W), x = c.getContext('2d');
    x.fillStyle = '#6d6d6d'; x.fillRect(0, 0, W, W);                                  // mortar
    for (let r = 0; r < 8; r++) for (let q = -1; q < 4; q++) {
      const ox = (r % 2) * 16, v = (170 + Math.random() * 70) | 0;
      x.fillStyle = `rgb(${v},${v - 8},${v - 14})`; x.fillRect(q * 32 + ox + 1, r * 16 + 1, 30, 14);
    }
    speckle(x, W, W, 700, 60, 200, .25, 2);
    return tex(c, { repeat: true });
  }
  // Painted, weathered plaster: stains, peeling, damp streaks
  function paint() {
    const W = 128, c = canvas(W, W), x = c.getContext('2d');
    x.fillStyle = '#e4e4e4'; x.fillRect(0, 0, W, W); speckle(x, W, W, 1200, 190, 245, .5, 3);
    for (let i = 0; i < 6; i++) { const g = x.createLinearGradient(0, 0, 0, W); const px = rnd(0, W); g.addColorStop(0, 'rgba(70,60,50,0)'); g.addColorStop(1, 'rgba(70,60,50,.28)'); x.fillStyle = g; x.fillRect(px, 0, rnd(4, 14), W); }
    for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(rnd(0, W), rnd(0, W), rnd(6, 16), rnd(4, 10), rnd(0, 3), 0, 7); x.fill(); }
    return tex(c, { repeat: true });
  }
  // Shop shutter: horizontal ribbed metal
  function shutter() {
    const W = 64, c = canvas(W, W), x = c.getContext('2d');
    for (let y = 0; y < W; y += 4) { x.fillStyle = y % 8 ? '#8d939a' : '#6f757c'; x.fillRect(0, y, W, 4); x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, y + 3, W, 1); }
    speckle(x, W, W, 160, 90, 160, .35, 1);
    return tex(c, { repeat: true });
  }
  // Window cell with frame, glass gradient and a balcony rail; alpha-tested so the wall shows around it
  function windows() {
    const W = 256, c = canvas(W, W), x = c.getContext('2d');
    x.clearRect(0, 0, W, W);
    const wx = 56, wy = 30, ww = 144, wh = 130;
    x.fillStyle = '#3b3f44'; x.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);                 // frame
    const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh); g.addColorStop(0, '#9fd2e0'); g.addColorStop(.5, '#4c7389'); g.addColorStop(1, '#2a4357');
    x.fillStyle = g; x.fillRect(wx, wy, ww, wh);
    x.fillStyle = 'rgba(255,255,255,.28)'; x.beginPath(); x.moveTo(wx, wy + 60); x.lineTo(wx + 70, wy); x.lineTo(wx + 110, wy); x.lineTo(wx, wy + 100); x.fill(); // reflection
    x.fillStyle = '#3b3f44'; x.fillRect(wx + ww / 2 - 3, wy, 6, wh); x.fillRect(wx, wy + wh / 2 - 3, ww, 6);
    x.fillStyle = '#9aa0a6'; x.fillRect(wx - 22, wy + wh + 10, ww + 44, 14);             // balcony slab
    x.fillStyle = '#5d6369'; for (let i = 0; i <= 12; i++) x.fillRect(wx - 20 + i * 15.5, wy + wh - 28, 3, 38); x.fillRect(wx - 22, wy + wh - 30, ww + 44, 4); // rail
    return tex(c, { repeat: true });
  }
  // Fabric weave for clothes
  function fabric() {
    const W = 64, c = canvas(W, W), x = c.getContext('2d');
    x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, W, W);
    for (let i = 0; i < W; i += 2) { x.fillStyle = 'rgba(0,0,0,.10)'; x.fillRect(i, 0, 1, W); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, i, W, 1); }
    return tex(c, { repeat: true, rx: 3, ry: 3, aniso: 1 });
  }
  function skin() { const W = 64, c = canvas(W, W), x = c.getContext('2d'); x.fillStyle = '#f0f0f0'; x.fillRect(0, 0, W, W); speckle(x, W, W, 300, 215, 250, .6, 2); return tex(c, { repeat: true, rx: 2, ry: 2, aniso: 1 }); }
  function hair() { const W = 64, c = canvas(W, W), x = c.getContext('2d'); x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, W, W); for (let i = 0; i < 64; i += 2) { x.fillStyle = `rgba(0,0,0,${.15 + Math.random() * .25})`; x.fillRect(i, 0, 1, W); } return tex(c, { repeat: true, rx: 2, ry: 2, aniso: 1 }); }
  // Car paint: faint flake + scratch, tinted by colour
  function metal() {
    const W = 64, c = canvas(W, W), x = c.getContext('2d');
    x.fillStyle = '#e8e8e8'; x.fillRect(0, 0, W, W); speckle(x, W, W, 260, 190, 255, .5, 1);
    x.strokeStyle = 'rgba(90,90,90,.35)'; x.lineWidth = 1; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(rnd(0, W), rnd(0, W)); x.lineTo(rnd(0, W), rnd(0, W)); x.stroke(); }
    return tex(c, { repeat: true, rx: 1, ry: 1, aniso: 2 });
  }
  function tread() { const W = 64, c = canvas(W, W), x = c.getContext('2d'); x.fillStyle = '#4a4a4a'; x.fillRect(0, 0, W, W); x.fillStyle = '#1b1b1b'; for (let i = 0; i < W; i += 8) x.fillRect(i, 0, 4, W); return tex(c, { repeat: true, rx: 6, ry: 1, aniso: 1 }); }
  // Shop-name strips (used on the awnings): wide 768x64
  function shopSigns(names) {
    const cols = ['#c0392b', '#d68910', '#1e8449', '#6c3483', '#1f618d'];
    return names.map((n, i) => {
      const c = canvas(768, 64), x = c.getContext('2d');
      x.fillStyle = cols[i % cols.length]; x.fillRect(0, 0, 768, 64);
      x.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 768; k += 48) x.fillRect(k, 0, 24, 64);      // awning stripes
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      let f = 40; x.font = `700 ${f}px "Hind Siliguri",sans-serif`; while (x.measureText(n).width > 640 && f > 18) { f -= 2; x.font = `700 ${f}px "Hind Siliguri",sans-serif`; }
      x.fillText(n, 384, 34); const t = tex(c); t.userData = { c, n, i }; return t;
    });
  }
  function repaintSigns(signs) { // fonts may arrive late; repaint with the real Bangla face
    for (const t of signs) { const { c, n, i } = t.userData, x = c.getContext('2d'), cols = ['#c0392b', '#d68910', '#1e8449', '#6c3483', '#1f618d']; x.fillStyle = cols[i % cols.length]; x.fillRect(0, 0, 768, 64); x.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 768; k += 48) x.fillRect(k, 0, 24, 64); x.fillStyle = '#fff'; let f = 40; x.font = `700 ${f}px "Hind Siliguri",sans-serif`; while (x.measureText(n).width > 640 && f > 18) { f -= 2; x.font = `700 ${f}px "Hind Siliguri",sans-serif`; } x.fillText(n, 384, 34); t.needsUpdate = true; }
  }
  // Round traffic sign with a Bangla speed figure
  function roadSign(txt, ring = '#c0392b') {
    const c = canvas(128, 128), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill();
    x.strokeStyle = ring; x.lineWidth = 12; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.stroke();
    x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 54px "Hind Siliguri",sans-serif'; x.fillText(txt, 64, 68);
    const t = tex(c, { aniso: 1 }); t.userData = { c, txt, ring }; return t;
  }
  function repaintRoadSign(t) { const { c, txt, ring } = t.userData, x = c.getContext('2d'); x.clearRect(0, 0, 128, 128); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.strokeStyle = ring; x.lineWidth = 12; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.stroke(); x.fillStyle = '#111'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 54px "Hind Siliguri",sans-serif'; x.fillText(txt, 64, 68); t.needsUpdate = true; }
  // Striped road barrier
  function barrier() { const c = canvas(128, 32), x = c.getContext('2d'); for (let i = -2; i < 10; i++) { x.fillStyle = i % 2 ? '#f5f5f5' : '#d63b2f'; x.beginPath(); x.moveTo(i * 20, 32); x.lineTo(i * 20 + 20, 0); x.lineTo(i * 20 + 40, 0); x.lineTo(i * 20 + 20, 32); x.fill(); } return tex(c, { aniso: 1 }); }

  const T = {
    asphalt: asphalt(), concrete: concrete(), brick: brick(), paint: paint(), shutter: shutter(), windows: windows(),
    fabric: fabric(), skin: skin(), hair: hair(), metal: metal(), tread: tread(), barrier: barrier(),
    signs: shopSigns(['মায়ের দোয়া স্টোর', 'রহমান ফার্মেসি', 'চা ও নাস্তা', 'ঢাকা মোবাইল সেন্টার', 'ফুচকা-চটপটি হাউস']),
    roadSigns: [roadSign('৩০'), roadSign('৪০', '#d68910'), roadSign('৫০')],
  };
  T.repaintText = () => { repaintSigns(T.signs); T.roadSigns.forEach(repaintRoadSign); };
  T.info = () => ({ count: list.length, maxW: Math.max(...list.map(l => l.w)), maxH: Math.max(...list.map(l => l.h)), pixels: list.reduce((a, l) => a + l.w * l.h, 0) });
  return T;
}
