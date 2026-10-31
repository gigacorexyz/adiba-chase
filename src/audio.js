// ADIBA CHASE audio: synthesized SFX + procedural music (Web Audio) and a Bangla voice layer.
// - Nothing starts until unlock() is called from a user gesture (mobile autoplay rules).
// - Voice lines are spoken by the device's own Bangla text-to-speech when one exists
//   (speechSynthesis, lang bn-*). Every line is ALSO shown as a caption, so the game still
//   works without any Bangla voice installed. Real recordings can be dropped into
//   assets/audio/voice/ and listed in assets/audio/voice/manifest.json (see README).
// - One voice at a time, global + per-category cooldowns, random non-repeating selection.
export const VOICE = {
  coin: ['টাকা টাকা টাকা!', 'বাহ, বড়লোক হয়ে গেলাম!', 'ইয়াহু! ঢাকার টাকা!', 'এই টাকায় বিরিয়ানি হবে!'],
  near: ['ওরে বাবা, কী স্পিড!', 'ভাই, রাস্তা দেখে দৌড়ান!', 'এই যে! সামনে বাস!', 'বাঁচাইলা ভাই!'],
  jump: ['হুপ্পা!', 'উড়াল দিছি!', 'এক লাফে পার!'],
  slide: ['পিছলে গেলাম!', 'সরো সরো!', 'ভুশ!'],
  jet: ['ভাই, এবার আকাশে উড়ার পালা!', 'জেটপ্যাক চালু! নাসা, আমি আসতেছি!', 'এই গতিতে গেলে চাঁদেও পৌঁছে যাবেন!'],
  land: ['আস্তে নামেন, বিল্ডিং আছে!', 'মাটিতে ফিরলাম, আদিবাও ফিরছে!', 'ল্যান্ডিং সাকসেস!'],
  caught: ['ধরা খাইছো!', 'আদিবার হাত থেকে কেউ পালাতে পারে না!', 'এবার বাসায় চলো!'],
  hit: ['উফ! লাগছে!', 'আরে ধাক্কা লাগছে!', 'ঢাকার রাস্তা বলে কথা!'],
  ped: ['ভাই, প্রেমের জন্য এত কষ্ট!', 'ঢাকার রাস্তায় আবার কী শুরু হলো!', 'জেটপ্যাকটা আমাকে একটু দেন!', 'ভাই, রাস্তা দেখে দৌড়ান!', 'এই যে! সামনে বাস!', 'ওরে বাবা, কী স্পিড!', 'এই গতিতে গেলে চাঁদেও পৌঁছে যাবেন!'],
};
const COOLDOWN = { coin: 3.5, near: 3, jump: 8, slide: 8, jet: 0, land: 4, caught: 0, hit: 3, ped: 0 };
const PRIORITY = { caught: 3, jet: 2, near: 2, hit: 1, land: 1, coin: 1, jump: 0, slide: 0, ped: 0 };

export function createAudio({ onCaption = () => {}, storage = window.localStorage } = {}) {
  const A = { ctx: null, log: [], settings: { sound: true, voice: true, music: true, vol: 0.8 }, speaking: false, lastVoiceAt: -1e9, lastLine: {}, catAt: {}, clips: {}, voiceName: null };
  try { Object.assign(A.settings, JSON.parse(storage.getItem('adibaAudio') || '{}')); } catch (e) {}
  const save = () => { try { storage.setItem('adibaAudio', JSON.stringify(A.settings)); } catch (e) {} };
  const now = () => performance.now() / 1000;
  const log = (type, id) => { A.log.push({ type, id, t: now() }); if (A.log.length > 400) A.log.splice(0, 200); };
  let master, sfx, mus, noiseBuf, jetNode = null, motoNode = null;

  A.unlock = () => {
    try {
      if (!A.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        A.ctx = new AC();
        master = A.ctx.createGain(); sfx = A.ctx.createGain(); mus = A.ctx.createGain();
        sfx.connect(master); mus.connect(master); master.connect(A.ctx.destination);
        const len = A.ctx.sampleRate; noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        A.applyVolumes(); loadClips(); pickVoice();
      }
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return true;
    } catch (e) { return false; }
  };
  A.applyVolumes = () => {
    if (!A.ctx) return;
    master.gain.value = A.settings.vol; sfx.gain.value = A.settings.sound ? 1 : 0; mus.gain.value = A.settings.music ? 0.22 : 0;
  };
  A.set = (k, v) => {
    A.settings[k] = v; save(); A.applyVolumes();
    if (k === 'music' && !v) A.stopMusic();
    if (k === 'voice' && !v) A.cancelVoice();
    if (k === 'sound' && !v) A.jet(false);
  };
  A.suspend = () => { try { A.cancelVoice(); if (A.ctx && A.ctx.state === 'running') A.ctx.suspend(); } catch (e) {} };
  A.resume = () => { try { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); } catch (e) {} };

  // ---------- primitives ----------
  function tone({ f = 440, f2 = null, dur = .2, type = 'sine', vol = .3, at = 0, attack = .005, bus = sfx }) {
    if (!A.ctx) return; const c = A.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(bus || sfx); o.start(t); o.stop(t + dur + .05);
  }
  function noise({ dur = .15, f = 800, type = 'lowpass', vol = .2, at = 0, f2 = null }) {
    if (!A.ctx) return; const c = A.ctx, t = c.currentTime + at, s = c.createBufferSource(), flt = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; flt.type = type; flt.frequency.setValueAtTime(f, t); if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(flt); flt.connect(g); g.connect(sfx); s.start(t); s.stop(t + dur + .05);
  }
  const SFX = {
    coin() { tone({ f: 988, dur: .09, type: 'square', vol: .12 }); tone({ f: 1319, dur: .22, type: 'square', vol: .12, at: .08 }); tone({ f: 300, f2: 700, dur: .18, type: 'sine', vol: .18, at: .02 }); }, // ting + cartoon boing
    jump() { tone({ f: 260, f2: 620, dur: .22, type: 'triangle', vol: .22 }); },
    slide() { noise({ dur: .3, f: 2400, f2: 400, type: 'bandpass', vol: .25 }); },
    land() { tone({ f: 140, f2: 50, dur: .18, type: 'sine', vol: .5 }); noise({ dur: .1, f: 500, vol: .2 }); },
    step() { noise({ dur: .06, f: 520 + Math.random() * 160, vol: .07 }); },
    bell() { for (let i = 0; i < 2; i++) { tone({ f: 2350, dur: .5, type: 'sine', vol: .16, at: i * .16 }); tone({ f: 3520, dur: .3, type: 'sine', vol: .07, at: i * .16 }); } },
    horn() { tone({ f: 415, dur: .38, type: 'square', vol: .1 }); tone({ f: 523, dur: .38, type: 'square', vol: .1 }); },
    busHorn() { tone({ f: 196, dur: .8, type: 'sawtooth', vol: .16 }); tone({ f: 247, dur: .8, type: 'sawtooth', vol: .13 }); },
    truckHorn() { tone({ f: 150, dur: .9, type: 'sawtooth', vol: .18 }); tone({ f: 190, dur: .9, type: 'square', vol: .08 }); },
    moto() { tone({ f: 70, f2: 190, dur: .55, type: 'sawtooth', vol: .15 }); noise({ dur: .5, f: 300, f2: 900, vol: .1 }); },
    boing() { tone({ f: 200, f2: 700, dur: .15, type: 'sine', vol: .3 }); tone({ f: 700, f2: 180, dur: .25, type: 'sine', vol: .3, at: .15 }); },
    trombone() { [[233, 0], [220, .28], [208, .56]].forEach(([f, at]) => tone({ f, dur: .28, type: 'sawtooth', vol: .15, at })); tone({ f: 196, f2: 150, dur: .7, type: 'sawtooth', vol: .15, at: .84 }); },
    bruh() { tone({ f: 120, f2: 70, dur: .45, type: 'sawtooth', vol: .22 }); },
    airhorn() { for (let i = 0; i < 3; i++) { tone({ f: 466, dur: .12, type: 'square', vol: .1, at: i * .16 }); tone({ f: 587, dur: .12, type: 'square', vol: .08, at: i * .16 }); } },
    whoosh() { noise({ dur: .45, f: 300, f2: 3000, type: 'bandpass', vol: .25 }); },
    unlock() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, dur: .18, type: 'triangle', vol: .2, at: i * .09 })); },
    bump() { tone({ f: 110, f2: 45, dur: .25, type: 'square', vol: .3 }); noise({ dur: .18, f: 900, vol: .3 }); },
    gameover() { [392, 330, 262, 196].forEach((f, i) => tone({ f, dur: .35, type: 'triangle', vol: .22, at: i * .22 })); noise({ dur: .6, f: 400, vol: .1, at: .5 }); },
    ui() { tone({ f: 660, dur: .06, type: 'square', vol: .08 }); },
  };
  const lastSfx = {};
  A.sfx = (name, minGap = .05) => {
    const t = now(); if (!A.settings.sound || !A.ctx || !SFX[name]) return false;
    if (t - (lastSfx[name] || 0) < minGap) return false; lastSfx[name] = t;
    try { SFX[name](); log('sfx', name); return true; } catch (e) { return false; }
  };

  // ---------- jetpack engine loop ----------
  A.jet = on => {
    if (!A.ctx) return;
    if (on && !jetNode && A.settings.sound) {
      const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      s.buffer = noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = 650; g.gain.value = 0; g.gain.linearRampToValueAtTime(.35, c.currentTime + .25);
      lfo.frequency.value = 17; lg.gain.value = 180; lfo.connect(lg); lg.connect(f.frequency);
      s.connect(f); f.connect(g); g.connect(sfx); s.start(); lfo.start(); jetNode = { s, g, lfo }; log('loop', 'jet');
    } else if (!on && jetNode) {
      const c = A.ctx, n = jetNode; jetNode = null; n.g.gain.cancelScheduledValues(c.currentTime); n.g.gain.setValueAtTime(n.g.gain.value, c.currentTime); n.g.gain.linearRampToValueAtTime(0, c.currentTime + .3);
      n.s.stop(c.currentTime + .35); n.lfo.stop(c.currentTime + .35); log('loop', 'jet-off');
    }
  };

  // ---------- music: pentatonic bazaar groove, scheduled ahead of time ----------
  let musicTimer = null, nextT = 0, step = 0;
  const SCALE = [293.66, 311.13, 349.23, 392, 440, 466.16, 523.25, 587.33];
  const MEL = [0, 2, 3, 4, 3, 2, 1, 2, 0, 3, 4, 6, 4, 3, 2, 1];
  A.startMusic = () => {
    if (!A.ctx || !A.settings.music || musicTimer) return;
    nextT = A.ctx.currentTime + .1; step = 0;
    const spb = 60 / 112 / 2; // eighth notes
    musicTimer = setInterval(() => {
      if (!A.ctx || A.ctx.state !== 'running') return;
      if (nextT < A.ctx.currentTime - .1) nextT = A.ctx.currentTime + .05; // after a pause: don't replay missed notes
      while (nextT < A.ctx.currentTime + .5) {
        const at = nextT - A.ctx.currentTime, i = step % 16;
        tone({ f: SCALE[MEL[i]], dur: spb * .9, type: 'triangle', vol: .35, at, bus: mus });
        if (i % 4 === 0) tone({ f: SCALE[0] / 2, dur: spb * 1.8, type: 'sine', vol: .6, at, bus: mus });          // bass
        if (i % 4 === 0) tone({ f: 120, f2: 45, dur: .16, type: 'sine', vol: .8, at, bus: mus });                  // dhol thump
        if (i % 2 === 1) { const c = A.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + at; s.buffer = noiseBuf; fl.type = 'highpass'; fl.frequency.value = 6000; g.gain.setValueAtTime(.2, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); s.connect(fl); fl.connect(g); g.connect(mus); s.start(t); s.stop(t + .08); }
        nextT += spb; step++;
      }
    }, 150);
    log('music', 'start');
  };
  A.stopMusic = () => { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; log('music', 'stop'); } };

  // ---------- voice ----------
  function pickVoice() {
    try {
      const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
      const v = vs.find(x => /^bn/i.test(x.lang)) || null; A.voice = v; A.voiceName = v ? v.name : null;
    } catch (e) {}
  }
  try { if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); } } catch (e) {}
  async function loadClips() {
    try { const r = await fetch('assets/audio/voice/manifest.json', { cache: 'no-cache' }); if (r.ok) { const j = await r.json(); A.clips = j.lines || {}; } } catch (e) {}
  }
  A.cancelVoice = () => { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} if (A.audioEl) { try { A.audioEl.pause(); } catch (e) {} } A.speaking = false; };
  // category: key of VOICE; opts.force skips probability (still honours cooldowns); returns the line or null
  A.say = (cat, opts = {}) => {
    const lines = VOICE[cat]; if (!lines) return null;
    const t = now(), prio = PRIORITY[cat] || 0;
    if (!A.settings.voice) return null;
    if (A.speaking && prio <= (A.curPrio || 0)) return null;                 // never overlap voices
    if (t - A.lastVoiceAt < (opts.gap ?? 1.8) && prio <= (A.curPrio || 0)) return null; // global gap (a more important line may cut in)
    if (t - (A.catAt[cat] || -1e9) < COOLDOWN[cat]) return null;             // per-category cooldown
    if (opts.p !== undefined && Math.random() > opts.p) return null;         // random chance
    let line, tries = 0; do { line = lines[Math.floor(Math.random() * lines.length)]; } while (line === A.lastLine[cat] && lines.length > 1 && ++tries < 8);
    if (A.speaking) A.cancelVoice();                                          // higher priority interrupts lower: still one voice at a time
    const tok = A.tok = (A.tok || 0) + 1;
    A.lastLine[cat] = line; A.catAt[cat] = t; A.lastVoiceAt = t; A.curPrio = prio; A.speaking = true;
    log('voice', cat + '|' + line);
    onCaption(line, cat);
    const done = () => { if (A.tok === tok) A.speaking = false; };
    const clip = A.clips[line] || A.clips[cat];
    if (clip && A.ctx) { try { A.audioEl = A.audioEl || new Audio(); A.audioEl.src = 'assets/audio/voice/' + clip; A.audioEl.volume = A.settings.vol; A.audioEl.onended = done; A.audioEl.play().catch(done); return line; } catch (e) { done(); } }
    try {
      if (window.speechSynthesis && A.voice) {
        const u = new SpeechSynthesisUtterance(line); u.voice = A.voice; u.lang = A.voice.lang; u.volume = A.settings.vol;
        u.rate = 1.05 + Math.random() * .2; u.pitch = .9 + Math.random() * .5; u.onend = u.onerror = done;
        if (prio >= 3) speechSynthesis.cancel(); speechSynthesis.speak(u);
        setTimeout(done, 4500);                                               // safety: never stay "speaking"
        return line;
      }
    } catch (e) {}
    setTimeout(done, Math.min(2200, 600 + line.length * 55));                  // caption-only: pace like speech
    return line;
  };
  A.setCaptionHandler = f => { onCaption = f; };
  return A;
}
