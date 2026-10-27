/**
 * TYPE GARDEN ENGINE — Standalone Canvas Botanical Typography
 * Based on Type Garden (type-garden.vercel.app)
 */
class TypeGarden {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.F = '"Playfair Display", "GT Ultra", Georgia, serif';
    this.cache = {};
    this.props = { boil: true, recoil: 20, density: 1.1, transparentBg: options.transparentBg ?? false };
    this.PRESETS = [
      { id: 'breathe', label: 'Breathe', sub: 'Slow sway · 3s', T: 3000 },
      { id: 'grow', label: 'Grow & wither', sub: 'Bloom, then back · 6s', T: 6000 },
      { id: 'wind', label: 'Gust', sub: 'Wind sweeps through · 4s', T: 4000 },
      { id: 'reach', label: 'Reach', sub: 'Stems follow a light · 6s', T: 6000 },
      { id: 'scatter', label: 'Scatter', sub: 'Random bloom, fade · 6s', T: 6000 },
      { id: 'visit', label: 'Visitor', sub: 'Butterfly drops by · 7s', T: 7000 }
    ];
    this.PAL = [
      ['Rose noir', '#000000', '#FF1400', '#3257FF', '#FFB4A8', '#FFFFFF'],
      ['Paper', '#1c1917', '#FF3B1F', '#5282FF', '#FFD2C4', '#FFFFFF'],
      ['Midnight', '#0D1B4C', '#FF5A4E', '#9FB4FF', '#FFD6CF', '#FFFFFF'],
      ['Citrus', '#0E1A12', '#FF8A00', '#1FA463', '#FFE2B8', '#FFFFFF'],
      ['Orchid', '#140A1F', '#E63CFF', '#2FB8A6', '#F9D1FF', '#FFFFFF'],
      ['Moss', '#133A2A', '#FFB7C5', '#7FD18B', '#FFFFFF', '#FFFFFF'],
      ['Tomato', '#170606', '#FF3B1F', '#FFA07A', '#FFB4A8', '#FFFFFF'],
      ['Butter', '#171408', '#FFB800', '#48C774', '#FFE2B8', '#FFFFFF']
    ];
    this.state = {
      text: options.text || 'Happy Birthday!',
      preset: options.preset || 'scatter',
      palette: options.palette !== undefined ? options.palette : 0,
      seed: options.seed !== undefined ? options.seed : 7,
      busy: false
    };
    this.perch = [];
    this.pt0 = performance.now();
    this.buildPoster();
  }

  preset() {
    return this.PRESETS.find(p => p.id === this.state.preset) || this.PRESETS[0];
  }

  pal() {
    const p = this.PAL[this.state.palette] || this.PAL[0];
    return { bg: p[1], C: { red: p[2], blue: p[3], line: p[4], text: p[5], vein: p[1] } };
  }

  setPreset(id) {
    this.state.preset = id;
    this.buildPoster();
  }

  setPalette(idx) {
    this.state.palette = idx;
    this.buildPoster();
  }

  setSeed(seed) {
    this.state.seed = seed;
    this.buildPoster();
  }

  start() {
    this.stop();
    this.t0 = performance.now();
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      this.posterDraw(this.g, now - this.t0);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

// ---------- math ----------
  h(n) { const x = Math.sin(n) * 43758.5453; return x - Math.floor(x); }
  spr(t, k = 7, w = 16) { if (t <= 0) return 0; return 1 - Math.exp(-t * k) * Math.cos(t * w); }
  eo(t) { if (t <= 0) return 0; if (t >= 1) return 1; return 1 - Math.pow(1 - t, 3); }
  eb(t) { if (t <= 0) return 0; if (t >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  rng(seed) {
    let s = seed | 0;
    return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  bez(a, b, c, d, n) {
    const P = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t;
      P.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]); }
    return P;
  }
  at(P, u) {
    const n = P.length; const i = Math.min(n - 2, Math.max(1, Math.round(u * (n - 1))));
    return [P[i], Math.atan2(P[i+1][1] - P[i-1][1], P[i+1][0] - P[i-1][0])];
  }
  jit(id, f, amp) {
    if (!amp) return [0, 0, 0];
    return [(this.h(id*1.37 + f*7.13)*2 - 1)*amp, (this.h(id*2.71 + f*3.11)*2 - 1)*amp, (this.h(id*5.3 + f*1.7)*2 - 1)*0.035];
  }
  path(c, p, closed) {
    const n = p.length; if (n < 2) return;
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (closed) {
      const s = m(p[n-1], p[0]); c.moveTo(s[0], s[1]);
      for (let i = 0; i < n; i++) { const q = m(p[i], p[(i+1) % n]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.closePath();
    } else {
      c.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < n - 1; i++) { const q = m(p[i], p[i+1]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
      c.lineTo(p[n-1][0], p[n-1][1]);
    }
  }
  backend(g) {
    return {
      fill: (p, col) => { g.beginPath(); this.path(g, p, true); g.fillStyle = col; g.fill(); },
      stroke: (p, col, w) => { g.beginPath(); this.path(g, p, false); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); },
      rect: (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); },
      text: (ch, x, y, S, col) => { g.font = `700 ${S}px ${this.F}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = col; g.fillText(ch, x, y); }
    };
  }
  vine(base, dir, len, amp, waves, ph, bend, n) {
    n = n || 40; const P = [[base[0], base[1]]], step = len / n; let x = base[0], y = base[1];
    for (let i = 1; i <= n; i++) {
      const u = i / n, a = dir + bend * u + amp * Math.sin(u * Math.PI * waves + ph) * Math.min(1, u * 3);
      x += Math.cos(a) * step; y += Math.sin(a) * step; P.push([x, y]);
    }
    return P;
  }
  curl(P, sign, rad) {
    const n = P.length, e = P[n - 1], a = Math.atan2(e[1] - P[n - 2][1], e[0] - P[n - 2][0]);
    const c = [e[0] - Math.sin(a) * sign * rad, e[1] + Math.cos(a) * sign * rad];
    const a0 = Math.atan2(e[1] - c[1], e[0] - c[0]);
    for (let i = 1; i <= 14; i++) { const u = i / 14, t = a0 + sign * u * Math.PI * 1.6, rr = rad * (1 - 0.5 * u); P.push([c[0] + Math.cos(t) * rr, c[1] + Math.sin(t) * rr]); }
    return P;
  }
  weave(r, startLayer) {
    const cuts = []; const nc = 1 + Math.floor(r() * 3);
    for (let i = 0; i < nc; i++) cuts.push(0.15 + r() * 0.7);
    cuts.sort((a, b) => a - b);
    const segs = []; let u0 = 0, layer = startLayer;
    for (const c of cuts) {
      if (c <= u0) continue;
      segs.push({ u0, u1: c, layer });
      if (r() < 0.3) { const g = 0.02 + r() * 0.03; u0 = Math.min(0.98, c + g); } else u0 = c;
      layer = 1 - layer;
    }
    segs.push({ u0, u1: 1, layer });
    return segs;
  }
  layerAt(segs, u) { for (const s of segs) if (u >= s.u0 && u <= s.u1) return s.layer; return segs[segs.length - 1].layer; }

  // ---------- layout ----------
  resize() {
    const c = this.cv.current, r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (!r.width) return;
    this.W = r.width; this.H = r.height; this.dpr = d;
    c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
    this.layout(true);
  }
  mw(ch) {
    if (this.cache[ch] != null) return this.cache[ch];
    this.g.font = `700 100px ${this.F}`;
    let w = this.g.measureText(ch).width / 100;
    if (ch === ' ') w *= 1.4;
    return (this.cache[ch] = w);
  }
  // sets tx/ty/tw on letters; keeps headroom for the garden above and below the type
  layoutCore(A, W, H, prevWrapped) {
    const maxW = W * 0.8, S0 = H * 0.28, LH = 2.1;
    const ws = A.map(l => this.mw(l.ch));
    const words = []; let cur = null;
    A.forEach((l, i) => {
      if (l.ch === ' ') { if (cur) { words.push(cur); cur = null; } words.push({ sp: true, idx: [i] }); }
      else { if (!cur) cur = { idx: [] }; cur.idx.push(i); }
    });
    if (cur) words.push(cur);
    const lineW = (li, S) => { let e = li.length; while (e > 0 && A[li[e-1]].ch === ' ') e--; let w = 0; for (let k = 0; k < e; k++) w += ws[li[k]]; return w * S; };
    const wrap = S => {
      const lines = [[]]; let lw = 0;
      for (const w of words) {
        const ww = w.idx.reduce((s, i) => s + ws[i], 0) * S;
        if (!w.sp && lw > 0 && lw + ww > maxW) { lines.push([]); lw = 0; }
        lines[lines.length - 1].push(...w.idx); lw += ww;
      }
      return lines;
    };
    let lines = [A.map((_, i) => i)];
    const unit = lineW(lines[0], 1);
    let S = unit > 0 ? Math.min(S0, maxW / unit) : S0;
    const multi = words.filter(w => !w.sp).length > 1;
    let wrapped = multi && (S < H * 0.1 || (prevWrapped && S < H * 0.14));
    if (wrapped) {
      let lo = H * 0.03, hi = H * 0.15;
      for (let k = 0; k < 22; k++) {
        const mid = (lo + hi) / 2, ls = wrap(mid);
        const ok = ls.every(li => lineW(li, mid) <= maxW) && ls.length * LH * mid <= H * 0.82;
        if (ok) lo = mid; else hi = mid;
      }
      S = lo; lines = wrap(S);
      if (lines.length < 2) wrapped = false;
    }
    const n = lines.length, lh = LH * S;
    lines.forEach((li, k) => {
      let x = W / 2 - lineW(li, S) / 2;
      const y = H / 2 + (k - (n - 1) / 2) * lh + 0.33 * S;
      li.forEach(i => { const l = A[i], w = ws[i] * S; l.tx = x + w / 2; l.ty = y; l.tw = w; l.line = k; x += w; });
    });
    return { S, wrapped, n };
  }
  layout(snap) {
    if (!this.W) return;
    const A = this.letters.filter(l => !l.dead);
    const res = this.layoutCore(A, this.W, this.H, this.wrapped);
    this.wrapped = res.wrapped;
    A.forEach(l => { if (l.x == null) { l.x = l.tx; l.y = l.ty; } });
    const S = res.S, last = A[A.length - 1];
    this.St = S;
    this.ctx_ = last ? last.tx + last.tw / 2 + 0.07 * S : this.W / 2;
    this.cty = last ? last.ty - 0.33 * S : this.H / 2;
    if (snap || !this.Sd) { this.Sd = S; this.cx = this.ctx_; this.cy = this.cty; A.forEach(l => { l.x = l.tx; l.y = l.ty; }); }
  }

  // ---------- live: other gardeners ----------
  liveInit() {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    this.me = { id: Math.random().toString(36).slice(2, 10), n: pick(this.FLOWERS), c: pick(this.TINTS) };
    this.others = 0; this.lastSend = 0; this.sentX = null; this.sentY = null; this.roster = {};
    // double-click / double-tap on the garden leaves a rose for everyone
    this.onPlant = e => {
      if (this.state.mode !== 'type' || e.target !== this.cv.current) return;
      const now = performance.now(), lp = this.lastTap;
      this.lastTap = { t: now, x: e.clientX, y: e.clientY };
      if (lp && now - lp.t < 340 && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) < 40 && now - (this.lastPlant || 0) > 1800) {
        this.lastPlant = now; this.lastTap = null;
        const g = { x: Math.round(e.clientX / this.W * 1000) / 1000, y: Math.round(e.clientY / this.H * 1000) / 1000, s: Math.floor(Math.random() * 1e6) };
        this.liveRose(g); this.liveSend('r', g);
      }
    };
    window.addEventListener('pointerdown', this.onPlant);
    this.onOut = e => { if (!e.relatedTarget) { this.mx = null; this.sentX = null; this.liveSend('p', { i: this.me.id, h: 1 }); } }; // pointer left the window
    document.addEventListener('mouseout', this.onOut);
    this.onVis = () => {
      if (document.hidden) { this.liveSend('p', { i: this.me.id, h: 1 }); this._idleT = setTimeout(() => this.liveClose(), 60000); }
      else { clearTimeout(this._idleT); if (!this.net) this.liveConnect(); }
    };
    document.addEventListener('visibilitychange', this.onVis);
    setTimeout(() => this.liveConnect(), 1200);
  }
  liveConnect() {
    if (this.net || this._connecting) return;
    if (/[?&]tglocal/.test(location.search)) return this.liveLocal();
    if (!this.LIVE.url || !this.LIVE.key) return;
    const go = () => {
      this._connecting = false;
      if (!window.supabase || this.net) return;
      try {
        const sb = window.supabase.createClient(this.LIVE.url, this.LIVE.key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          realtime: { params: { eventsPerSecond: 20 } }
        });
        const ch = sb.channel('garden', { config: { broadcast: { self: false, ack: false }, presence: { key: this.me.id } } });
        const meta = () => { const st = ch.presenceState(), out = {}; for (const k in st) { const v = st[k] && st[k][0]; out[k] = { n: v && v.n, c: v && v.c }; } return out; };
        ch.on('broadcast', { event: 'p' }, ({ payload }) => this.livePeer(payload))
          .on('broadcast', { event: 'r' }, ({ payload }) => this.liveRose(payload))
          .on('presence', { event: 'sync' }, () => this.livePresence(meta()))
          .subscribe(status => {
            if (status === 'SUBSCRIBED') ch.track({ n: this.me.n, c: this.me.c });
            else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') this.livePresence({});
          });
        this.net = { send: (ev, payload) => ch.send({ type: 'broadcast', event: ev, payload }), close: () => { try { sb.removeChannel(ch); } catch (e) {} } };
      } catch (e) { this.net = null; }
    };
    if (window.supabase) return go();
    this._connecting = true;
    const s = document.createElement('script');
    s.src = '/vendor-supabase.js'; s.async = true; s.onload = go; s.onerror = () => { this._connecting = false; };
    document.head.appendChild(s);
  }
  // tabs on one machine talk over a BroadcastChannel (tests, no project needed)
  liveLocal() {
    const bc = new BroadcastChannel('tg-live'), roster = new Map();
    const publish = () => { const now = Date.now(), out = {}; for (const [k, v] of roster) { if (now - v.t > 3500) roster.delete(k); else out[k] = { n: v.n, c: v.c }; } this.livePresence(out); };
    const beat = () => { roster.set(this.me.id, { n: this.me.n, c: this.me.c, t: Date.now() }); bc.postMessage({ k: 'hello', id: this.me.id, n: this.me.n, c: this.me.c }); publish(); };
    bc.onmessage = ({ data: d }) => {
      if (d.k === 'hello') { const had = roster.has(d.id); roster.set(d.id, { n: d.n, c: d.c, t: Date.now() }); if (!had) publish(); }
      else if (d.k === 'bye') { roster.delete(d.id); publish(); }
      else if (d.k === 'p') this.livePeer(d.payload);
      else if (d.k === 'r') this.liveRose(d.payload);
    };
    beat(); this._beat = setInterval(beat, 1000);
    this.net = { send: (ev, payload) => bc.postMessage({ k: ev, payload }), close: () => { bc.postMessage({ k: 'bye', id: this.me.id }); clearInterval(this._beat); bc.close(); } };
  }
  liveClose() {
    if (this.net) { this.net.close(); this.net = null; }
    for (const id of [...this.peers.keys()]) this.peerDrop(id);
    this.others = 0; this.liveCount(1);
  }
  liveSend(ev, payload) { if (this.net && this.others > 0) { try { this.net.send(ev, payload); } catch (e) {} } }
  livePresence(meta) {
    this.roster = meta || {};
    const n = new Set([...Object.keys(this.roster), this.me.id]).size;
    this.others = n - 1;
    for (const id of [...this.peers.keys()]) if (!this.roster[id]) this.peerDrop(id);
    for (const [id, p] of this.peers) { const r = this.roster[id]; if (r && (r.n !== p.n || r.c !== p.c)) this.peerStyle(p, r); }
    this.liveCount(n);
  }
  liveCount(n) {
    const el = document.querySelector('[data-tg="count"]');
    if (el) el.textContent = n > 1 ? n + ' gardeners here' : '';
  }
  livePeer(d) {
    if (!d || typeof d.i !== 'string' || d.i === this.me.id) return;
    let p = this.peers.get(d.i);
    if (!p) { if (this.peers.size >= 40) return; p = this.peerMake(d.i); }
    p.t = performance.now(); p.h = !!d.h;
    if (!d.h && typeof d.x === 'number' && typeof d.y === 'number') {
      p.tx = Math.min(1.02, Math.max(-0.02, d.x)); p.ty = Math.min(1.02, Math.max(-0.02, d.y));
      if (p.x == null) { p.x = p.tx * this.W; p.y = p.ty * this.H; }
    }
  }
  peerMake(id) {
    const el = document.createElement('div');
    el.className = 'tg-peer'; el.style.opacity = '0';
    el.innerHTML = '<svg width="18" height="20" viewBox="0 0 18 20"><path d="M1 1L1 16L5.5 12L8.5 19L11.5 17.6L8.6 11H15Z" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/><\u002Fsvg><span><\u002Fspan>';
    const layer = document.querySelector('[data-tg="peers"]'); if (layer) layer.appendChild(el);
    const p = { id, el, x: null, y: null, tx: 0, ty: 0, t: 0, h: true, op: 0 };
    this.peers.set(id, p); this.peerStyle(p, this.roster[id] || {});
    return p;
  }
  peerStyle(p, r) {
    p.n = r.n || 'visitor'; p.c = /^#[0-9A-Fa-f]{6}$/.test(r.c || '') ? r.c : '#FFFFFF';
    p.el.querySelector('path').setAttribute('fill', p.c);
    const s = p.el.querySelector('span'); s.textContent = p.n; s.style.background = p.c;
  }
  peerDrop(id) { const p = this.peers.get(id); if (p) { p.el.remove(); this.peers.delete(id); } }
  // send only when someone else is here and the pointer moved; interval grows with the room (~40 msgs/s room-wide)
  liveStep(now, dt) {
    const N = this.others + 1, iv = Math.min(10000, Math.max(125, (1000 * N * N) / 40));
    if (this.net && this.others > 0 && this.mx != null && !document.hidden && now - this.lastSend >= iv) {
      const x = Math.round((this.mx / this.W) * 1000) / 1000, y = Math.round((this.my / this.H) * 1000) / 1000;
      if (x !== this.sentX || y !== this.sentY) { this.lastSend = now; this.sentX = x; this.sentY = y; this.liveSend('p', { i: this.me.id, x, y }); }
    }
    if (!this.peers.size) return;
    const tau = Math.min(900, Math.max(70, 0.55 * iv)), k = 1 - Math.exp(-dt / tau);
    let shown = 0;
    for (const p of [...this.peers.values()].sort((a, b) => b.t - a.t)) {
      const idle = now - p.t, vis = !p.h && p.x != null && idle < 45000 && shown < 24;
      if (vis) {
        shown++;
        p.x += (p.tx * this.W - p.x) * k; p.y += (p.ty * this.H - p.y) * k;
        p.el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
      }
      const op = !vis ? 0 : idle < 8000 ? 1 : 0.35;
      if (p.op !== op) { p.op = op; p.el.style.opacity = String(op); }
    }
  }
  // the nearest pointer: yours, or any visitor's who moved recently (roses and letters lean to it)
  near(x, y) {
    let best = this.mx != null ? [this.mx, this.my] : null, bd = best ? Math.hypot(best[0] - x, best[1] - y) : 1e9;
    if (this.peers && this.peers.size) {
      const now = performance.now();
      for (const p of this.peers.values()) {
        if (p.h || p.x == null || now - p.t > 8000) continue;
        const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = [p.x, p.y]; }
      }
    }
    return best;
  }
  liveRose(g) {
    if (!g || typeof g.x !== 'number' || typeof g.y !== 'number') return;
    const r = this.rng((g.s | 0) || 1);
    this.gifts.push({ x: Math.min(1, Math.max(0, g.x)), y: Math.min(1, Math.max(0, g.y)), t0: performance.now(), rot: (r() - 0.5) * 0.8,
      e: { ph1: r() * 6.283, ph2: r() * 6.283, turns: 1.4 + r() * 0.5 } });
    if (this.gifts.length > 14) this.gifts.shift();
  }

  // ---------- phone: keyboard + visible area ----------
  syncVV() {
    const vv = this.vv; if (!vv) return;
    const w = Math.round(vv.width);
    if (this.vvW !== w) { this.vvW = w; this.vvMax = 0; } // rotated: measure again
    this.vvMax = Math.max(this.vvMax, vv.height);
    const kb = this.vvMax - vv.height > 120, de = document.documentElement;
    de.style.setProperty('--tg-top', vv.offsetTop + 'px');
    de.style.setProperty('--tg-h', vv.height + 'px');
    if (kb) de.setAttribute('data-kb', ''); else de.removeAttribute('data-kb');
    // keyboard put away while the field kept focus (Android back gesture): let go, so the next tap brings it back
    if (!kb && this.kbWas && document.activeElement === this.inp.current) this.inp.current.blur();
    this.kbWas = kb;
    this.resize();
  }
  refocus() { if (this.ptype === 'mouse' && this.state.mode === 'type' && this.inp.current) this.inp.current.focus({ preventScroll: true }); }
  liveText() { return (this.letters || []).filter(l => !l.dead).map(l => l.ch).join('').trim(); }
  wither(now) {
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (!last) return;
    last.dead = now;
    const pv = A[A.length - 2];
    if (pv && pv.ch !== ' ') { pv.cut = null; pv.endEls = null; pv.tb = now; }
    this.layout();
  }
  // phone keyboards often skip real key events and write into the field instead, rewriting whole words while
  // they predict: mirror the field and apply the difference, new letters grow and removed ones wither
  inputDiff(el) {
    const S = this.SENT;
    if (this.state.mode !== 'type' || this._kd) { this.iv = this.composing ? el.value : S; if (!this.composing) el.value = S; return; }
    const old = this.iv == null ? S : this.iv, cur = el.value;
    let p = 0; while (p < old.length && p < cur.length && old[p] === cur[p]) p++;
    let dels = old.length - p;
    if (p === 0 && old[0] === S && old.length > 1) dels -= 1; // the sentinel is not a letter
    const now = performance.now(); this.lastKey = now;
    for (let i = 0; i < dels; i++) this.wither(now);
    for (const ch of cur.slice(p)) {
      if (ch === S) continue;
      if (ch.charCodeAt(0) === 10) { this.letters = []; this.layout(); } else this.add(ch, now);
    }
    if (this.composing) this.iv = cur; else { el.value = S; this.iv = S; }
  }

  // ---------- input ----------
  key(e) {
    if (this.state.mode !== 'type') return;
    if (e.metaKey || e.ctrlKey || e.altKey) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); e.shiftKey ? this.saveSVG() : this.savePNG(); }
      return;
    }
    if (e.target && e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    const now = performance.now();
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (e.key === 'Backspace') {
      e.preventDefault(); this.mark(); if (!last) return;
      last.dead = now;
      const pv = A[A.length - 2];
      if (pv && pv.ch !== ' ') { pv.cut = null; pv.endEls = null; pv.tb = now; }
      this.layout(); return;
    }
    if (e.key === 'Enter') { e.preventDefault(); this.mark(); this.letters = []; this.layout(); return; }
    if (e.key.length !== 1) return;
    e.preventDefault(); this.mark();
    this.add(e.key, now);
  }
  mark() { this.lastKey = performance.now(); this._kd = true; setTimeout(() => { this._kd = false; }, 0); }
  add(ch, now) {
    const A = this.letters.filter(l => !l.dead), last = A[A.length - 1];
    if (ch === ' ') {
      if (last && last.ch !== ' ') { last.cut = now; this.genEnd(last, now - last.birth); }
      this.letters.push({ ch: ' ', id: this.uid++, birth: now, els: [] });
      this.layout(); return;
    }
    const same = last && last.ch !== ' ';
    const l = { ch, id: this.uid++, birth: now, tb: now, ws: same ? last.ws : Math.floor(this.rand() * 1e9), wi: same ? last.wi + 1 : 0, prev: same ? last : null };
    this.gen(l);
    this.letters.push(l);
    this.layout();
  }

  // ---------- growth ----------
  wordParams(ws) {
    const r = this.rng(ws * 7 + 13), dens = this.props.density ?? 1;
    return { roseP: 0.3 + r() * 0.3, leafy: (0.6 + r() * 0.8) * dens, dens, lean: (r() - 0.5) * 0.6, big: 0.85 + r() * 0.45, curvy: 0.8 + r() * 0.6, bridgeP: Math.min(0.95, (0.45 + r() * 0.35) * dens), w: 0.5 };
  }
  grow(r, E, nid, p, o) {
    const tip = o.tip || (r() < p.roseP ? 'rose' : r() < 0.45 ? 'fan' : r() < 0.6 ? 'leaf' : 'curl');
    let P = o.pts || this.vine(o.base, o.dir, o.len, (0.35 + r() * 0.45) * p.curvy, 1 + r() * 1.6, r() * 6.28, (r() - 0.5) * 1.2, 40);
    if (tip === 'curl') P = this.curl(P, r() < 0.5 ? -1 : 1, 0.05 + r() * 0.05);
    const segs = this.weave(r, o.layer0 != null ? o.layer0 : (r() < 0.5 ? 0 : 1));
    const dur = Math.max(320, (o.len || 0.8) * 620);
    const thorns = []; const nt = Math.floor(r() * 2.5);
    for (let i = 0; i < nt; i++) thorns.push({ u: 0.15 + r() * 0.65, s: r() < 0.5 ? -1 : 1 });
    E.push({ t: 'stem', id: nid(), pts: P, segs, d0: o.d0, dur, w: o.depth ? 0.82 : 1, thorns });
    const nl = Math.floor(r() * 2.8 * p.leafy);
    let sd = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < nl; i++) {
      const u = 0.25 + r() * 0.6, [q, a] = this.at(P, u); sd = -sd;
      E.push({ t: 'leaf', id: nid(), x: q[0], y: q[1], a: a + sd * (0.55 + r() * 0.5), L: (0.14 + r() * 0.2) * (o.depth ? 0.8 : 1), bend: (r() - 0.5) * 1.2, layer: this.layerAt(segs, u), d0: o.d0 + dur * u });
    }
    const [tp, ta] = this.at(P, 1), td = o.d0 + dur * 0.8, tl = this.layerAt(segs, 1);
    if (tip === 'rose') {
      const R = (0.13 + r() * 0.15) * p.big * (o.depth ? 0.75 : 1);
      // legibility: a rose sitting over the letter body mostly goes behind it
      const over = tp[1] > -0.78 && tp[1] < 0.05 && Math.abs(tp[0]) < p.w * 0.5;
      const layer = over ? (r() < 0.22 ? 1 : 0) : (r() < 0.6 ? 1 : tl);
      E.push({ t: 'rose', id: nid(), x: tp[0], y: tp[1], R, rot: (r() - 0.5) * 1.0, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r() * 1, layer, d0: td });
      if (r() < 0.2) { const oo = ta + (r() < 0.5 ? 1 : -1) * 1.3; E.push({ t: 'rose', id: nid(), x: tp[0] + Math.cos(oo) * R * 1.4, y: tp[1] + Math.sin(oo) * R * 1.4, R: R * (0.6 + r() * 0.3), rot: (r() - 0.5) * 1.2, ph1: r() * 6.28, ph2: r() * 6.28, turns: 1.8 + r(), layer, d0: td + 120 }); }
    } else if (tip === 'fan') {
      const spread = 0.6 + r() * 0.3;
      for (let j = 0; j < 2; j++) E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (j - 0.5) * spread, L: 0.2 + r() * 0.2, bend: (j - 0.5) * 0.8, layer: tl, d0: td + j * 60 });
    } else if (tip === 'leaf') {
      E.push({ t: 'leaf', id: nid(), x: tp[0], y: tp[1], a: ta + (r() - 0.5) * 0.3, L: 0.16 + r() * 0.16, bend: (r() - 0.5), layer: tl, d0: td });
    }
    if (!o.depth && r() < 0.3) {
      const u = 0.35 + r() * 0.35, [q, a] = this.at(P, u);
      this.grow(r, E, nid, p, { base: q, dir: a + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4), len: (o.len || 0.8) * (0.35 + r() * 0.2), d0: o.d0 + dur * u, depth: 1, layer0: this.layerAt(segs, u) });
    }
    return P;
  }
  gen(l) {
    const r = this.rng((l.ws ^ Math.imul(l.wi + 1, 2654435761)) + Math.floor(this.rand() * 1e6));
    const p = this.wordParams(l.ws), E = []; let k0 = 0; const nid = () => l.id * 100 + (k0++);
    const w = this.mw(l.ch), inX = () => (r() - 0.5) * w * 0.7; p.w = w;
    const nUp = 1 + (r() < 0.45 * p.dens ? 1 : 0);
    for (let i = 0; i < nUp; i++) {
      this.grow(r, E, nid, p, { base: [inX(), -r() * 0.3], dir: -Math.PI / 2 + p.lean * 0.5 + (r() - 0.5) * 0.7, len: 0.6 + r() * 0.5, d0: 40 + i * 130, tip: l.wi === 0 && i === 0 ? 'rose' : null });
    }
    if (r() < 0.4 * p.dens) this.grow(r, E, nid, p, { base: [inX(), -0.1 - r() * 0.35], dir: Math.PI / 2 + (r() - 0.5) * 0.8, len: 0.35 + r() * 0.35, d0: 160 });
    if (l.prev && r() < p.bridgeP) {
      const px = -(this.mw(l.prev.ch) + w) / 2;
      const a = [inX(), -0.05 - r() * 0.55], b = [px + (r() - 0.5) * 0.25, -0.05 - r() * 0.55];
      const bulge = (r() < 0.55 ? -1 : 1) * (0.4 + r() * 0.4), dx = b[0] - a[0];
      let P = this.bez(a, [a[0] + dx * 0.15, a[1] + bulge], [b[0] - dx * 0.15, b[1] + bulge * 0.9], b, 40);
      if (r() < 0.45) P = P.slice(0, Math.floor(P.length * (0.7 + r() * 0.2)));
      this.grow(r, E, nid, p, { pts: P, len: Math.abs(dx) + Math.abs(bulge), d0: 90, tip: r() < 0.5 ? 'curl' : r() < 0.5 ? 'leaf' : 'rose' });
    }
    if (l.wi === 0) this.grow(r, E, nid, p, { base: [-w * 0.3, -0.15 - r() * 0.4], dir: Math.PI + (r() - 0.5) * 1.2, len: 0.45 + r() * 0.3, d0: 120, tip: 'curl' });
    l.els = E;
    l.endEls = null;
    const T = [], tr = this.rng(l.id * 977 + Math.floor(this.rand() * 1e6));
    this.grow(tr, T, () => l.id * 100 + 90 + T.length, p, { base: [w * 0.25, -0.1 - tr() * 0.45], dir: (tr() - 0.5) * 1.4, len: 0.45 + tr() * 0.25, d0: 0, tip: 'curl', depth: 1 });
    l.tend = T.filter(e => e.t === 'stem').slice(0, 1);
  }
  genEnd(l, rel) {
    const r = this.rng(l.ws + l.wi * 31 + Math.floor(this.rand() * 1e6)), p = this.wordParams(l.ws), E = [];
    let k0 = 50; const nid = () => l.id * 100 + (k0++);
    const w = this.mw(l.ch), n = 1 + Math.floor(r() * 2.5); p.w = w;
    for (let i = 0; i < n; i++) {
      const dir = -Math.PI / 2 + 0.6 + (i - (n - 1) / 2) * 0.9 + (r() - 0.5) * 0.4;
      this.grow(r, E, nid, p, { base: [(r() - 0.2) * w * 0.6, -r() * 0.5], dir, len: 0.4 + r() * 0.45, d0: rel + 40 + i * 90, depth: 1, tip: i === 0 || r() < 0.5 ? 'rose' : 'fan' });
    }
    l.endEls = E;
  }

  strokeRange(B, P, a, b, col, w) {
    const n = P.length - 1, ia = a * n, ib = b * n;
    const lerp = t => { const i = Math.min(n - 1, Math.floor(t)), f = t - i; return [P[i][0] + (P[i+1][0] - P[i][0]) * f, P[i][1] + (P[i+1][1] - P[i][1]) * f]; };
    const pts = [lerp(ia)];
    for (let i = Math.floor(ia) + 1; i < ib; i++) pts.push(P[i]);
    pts.push(lerp(ib));
    if (pts.length >= 2) B.stroke(pts, col, w);
  }
  thorn(B, P, u, s, S) {
    const [p, a] = this.at(P, u), d = a + s * 2.3, L = S * 0.045;
    B.stroke([p, [p[0] + Math.cos(d) * L, p[1] + Math.sin(d) * L]], this.cc.blue, S * 0.022);
  }
  leaf(B, bx, by, a, L, bend) {
    if (L < 0.5) return;
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const ax = u => { const b = Math.sin(Math.PI * u) * bend * 0.15 * L; return [bx + ca * u * L + px * b, by + sa * u * L + py * b]; };
    const hw = u => L * 0.18 * Math.sin(Math.PI * Math.pow(u, 0.8));
    const N = 12, s1 = [], s2 = [];
    for (let i = 0; i <= N; i++) { const u = i / N, c = ax(u), w = hw(u); s1.push([c[0] + px * w, c[1] + py * w]); s2.push([c[0] - px * w, c[1] - py * w]); }
    const tip = ax(1), base = ax(0);
    B.fill([base, ...s1.slice(1, N), tip, tip, ...s2.slice(1, N).reverse(), base], this.cc.blue);
    if (L > 6) { const v = []; for (let i = 0; i <= 8; i++) v.push(ax(0.08 + 0.72 * i / 8)); B.stroke(v, this.cc.vein, Math.max(0.8, L * 0.03)); }
  }
  rose(B, cx, cy, R, rot, e, a, tl) {
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const tm = tl ? Math.hypot(tl[0], tl[1]) : 0, ux = tm ? tl[0] / tm : 0, uy = tm ? tl[1] / tm : 0, sq = -0.28 * tm;
    const T = (x, y, z = 0) => {
      let dx = x * cr - y * sr, dy = x * sr + y * cr;
      if (tm) { const k = (dx * ux + dy * uy) * sq; dx += k * ux + tl[0] * R * z; dy += k * uy + tl[1] * R * z; }
      return [cx + dx, cy + dy];
    };
    // petals, back to front: [cx, cy, rx, ry, angle, depth, edge]
    const P = [
      [0, -0.36, 0.56, 0.54, 0, 0, 0],
      [-0.5, -0.06, 0.6, 0.6, -0.35, 0, 0],
      [0.52, -0.06, 0.6, 0.6, 0.35, 0, 0],
      [-0.42, 0.3, 0.62, 0.48, 0.2, 0.12, 1],
      [0.47, 0.3, 0.62, 0.48, -0.2, 0.12, 1],
      [0.05, 0.42, 0.56, 0.38, 0, 0.14, 0]
    ];
    const ax0 = 0, ay0 = 0.5, lw = Math.max(0.8, R * 0.045), st = 85;
    P.forEach((q, i) => {
      const s = this.spr((a - i * st) / 1000, 8, 14); if (s <= 0.001) return;
      const open = (1 - Math.min(1, s)) * (q[0] < 0 ? 0.5 : -0.5), ang = q[4] + open, ca = Math.cos(ang), sa = Math.sin(ang);
      const pt = (th, j) => {
        const rr = 1 + 0.08 * Math.sin(3 * th + e.ph1 + i) + 0.04 * Math.sin(5 * th + e.ph2);
        const lx = Math.cos(th) * q[2] * rr, ly = Math.sin(th) * q[3] * rr;
        const px = q[0] + lx * ca - ly * sa, py = q[1] + lx * sa + ly * ca;
        return T((ax0 + (px - ax0) * s) * R, (ay0 + (py - ay0) * s) * R, q[5]);
      };
      const pts = []; for (let k = 0; k < 26; k++) pts.push(pt(k / 26 * Math.PI * 2));
      B.fill(pts, this.cc.red);
      if (q[6] && R >= 12 && s > 0.4) {
        const arc = []; for (let k = 0; k <= 14; k++) arc.push(pt(Math.PI * (1.18 + 0.64 * k / 14)));
        this.strokeRange(B, arc, 0, Math.min(1, (s - 0.4) / 0.5), this.cc.line, lw * 0.8);
      }
    });
    const fr = this.eo((a - P.length * st - 80) / 520);
    if (fr > 0 && R > 3) {
      const sp = [], scl = [];
      const turns = R < 20 ? Math.min(e.turns, 1.3) : R < 32 ? e.turns * 0.8 : e.turns;
      for (let i = 0; i <= 70; i++) { const u = i / 70, th = e.ph1 + u * turns * Math.PI * 2, rr = R * (0.08 + 0.57 * u); sp.push(T(Math.cos(th) * rr * 1.05, Math.sin(th) * rr * 0.72 - 0.12 * R, 0.34 - 0.24 * u)); }
      this.strokeRange(B, sp, 0, fr, this.cc.line, lw);
      if (R >= 14) {
        for (let i = 0; i <= 36; i++) { const u = i / 36; scl.push(T((-0.72 + 1.5 * u) * R, 0.36 * R + 0.16 * R * Math.abs(Math.sin(u * Math.PI * 3)), 0.18)); }
        this.strokeRange(B, scl, 0, fr, this.cc.line, lw);
      }
    }
  }

  // ---------- render (shared by typing view + poster) ----------
  frame() {
    const now = performance.now(), dt = Math.min(64, now - (this.lt || now)); this.lt = now;
    if (this.state.mode === 'poster') {
      const c = this.pcv.current;
      if (c && !this.state.busy) this.posterDraw(c.getContext('2d'), now - (this.pt0 || 0));
      return;
    }
    const k = 1 - Math.exp(-dt / 80);
    this.Sd += (this.St - this.Sd) * k;
    this.cx += (this.ctx_ - this.cx) * k; this.cy += (this.cty - this.cy) * k;
    for (const l of this.letters) if (!l.dead && l.tx != null) { l.x += (l.tx - l.x) * k; l.y += (l.ty - l.y) * k; }
    this.letters = this.letters.filter(l => !(l.dead && now - l.dead > 300));
    this.liveStep(now, dt);
    this.paint(now, true);
  }
  pal() { const p = this.PAL[this.state.palette] || this.PAL[0]; return { bg: p[1], C: { red: p[2], blue: p[3], line: p[4], text: p[5], vein: p[1] } }; }
  mainState() { return { letters: this.letters, S: this.Sd, C: this.pal().C, boil: this.props.boil ?? true, recoil: this.props.recoil ?? 20, speed: 1, wither: 260, face: true }; }
  paint(now, caret) {
    const g = this.g, d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0);
    if (this.props.transparentBg) {
      g.clearRect(0, 0, this.W, this.H);
    } else {
      g.fillStyle = this.pal().bg;
      g.fillRect(0, 0, this.W, this.H);
    }
    const B = this.backend(g), st = this.mainState();
    this.render(B, now, st);
    this.drawFlies(B, now, st.C);
    if (caret && this.gifts && this.gifts.length) {
      const LIFE = 60000; this.gifts = this.gifts.filter(gf => now - gf.t0 < LIFE);
      for (const gf of this.gifts) {
        const age = now - gf.t0, w = 1 - this.eo((age - (LIFE - 2200)) / 2200);
        g.globalAlpha = Math.max(0, w);
        this.rose(B, gf.x * this.W, gf.y * this.H + (1 - w) * this.Sd * 0.3, this.Sd * 0.24 * (0.65 + 0.35 * w), gf.rot + (1 - w) * 0.6, gf.e, age, null);
      }
      g.globalAlpha = 1;
    }
    if (caret) {
      const S = this.Sd, on = now - this.lastKey < 500 || Math.floor(now / 530) % 2 === 0, hf = this.eo((now - this.t0) / 600);
      if (on && hf > 0) { const h = 0.8 * S * hf, w = Math.max(2, S * 0.03); B.rect(this.cx - w / 2, this.cy - h / 2, w, h, st.C.text); }
    }
  }
  render(B, now, st) {
    const S = st.S, L = st.letters, act = L.filter(l => !l.dead), sp = st.speed || 1;
    this.cc = st.C; this._now = now; if (st.face) this.perch = [];
    if (st.face) for (const l of L) {
      let tx = 0, ty = 0;
      const A = !l.dead && l.ch !== ' ' ? this.near(l.x, l.y - S * 0.6) : null;
      if (A) {
        const dx = A[0] - l.x, dy = A[1] - (l.y - S * 0.6), d = Math.hypot(dx, dy), reach = Math.max(260, S * 3.2);
        if (d < reach && d > 1) { const w = 1 - d / reach, s = w * w * (3 - 2 * w); tx = dx / d * s; ty = dy / d * s; }
      }
      const c = l.lean || (l.lean = [0, 0]);
      c[0] += (tx - c[0]) * 0.07; c[1] += (ty - c[1]) * 0.07;
    }
    const f = st.boil ? Math.floor(now / 120) : 0, amp = st.boil ? Math.max(0.8, S * 0.01) : 0;
    const kd = l => l.dead ? 1 - this.eo((now - l.dead) / st.wither) : 1;
    const draw = layer => {
      for (const l of L) {
        if (l.ch === ' ' || !l.els) continue;
        const age = (now - l.birth) * sp, kk = kd(l);
        const each = e => { if (e.t === 'stem') this.drawStem(B, e, l, age, kk, st, f, amp, layer); else if (e.layer === layer) this.drawEl(B, e, l, age, kk, st, f, amp); };
        l.els.forEach(each);
        if (l.endEls) l.endEls.forEach(each);
        const i = act.indexOf(l), nx = i >= 0 ? act[i + 1] : null;
        if (l.tend && (l.dead || !nx || nx.ch === ' ')) {
          let fr = this.eo(((now - l.tb) * sp - 150) / 450);
          if (l.cut != null) fr *= 1 - this.eo((now - l.cut) * sp / 150) * Math.min(0.85, st.recoil / (0.6 * S));
          for (const e of l.tend) this.drawStem(B, e, l, age, kk, st, f, amp, layer, fr * kk);
        }
      }
    };
    draw(0);
    for (const l of L) if (l.ch !== ' ' && (st.textAll || !l.dead)) B.text(l.ch, l.x, l.y, S, st.C.text);
    draw(1);
  }
  wpt(st, l, x, y) {
    if (l.birth != null && this._now != null) {
      const t = (this._now - l.birth) * (st.speed || 1) / 1000;
      if (t > 0 && t < 2.5) {
        const hh = Math.max(0, (l.y - y) / st.S), dmp = Math.exp(-t * 3.2), dir = (l.id % 2 ? 1 : -1);
        x += st.S * 0.07 * hh * dmp * Math.sin(t * 11) * dir;
        y += st.S * 0.035 * hh * dmp * Math.sin(t * 11 + 1.2);
      }
    }
    if (st.face && l.lean) {
      const hh = Math.min(2.5, Math.max(0, (l.y - y) / st.S)), f = hh * hh * 0.5 + hh * 0.5;
      x += l.lean[0] * st.S * 0.1 * f;
      y += l.lean[1] * st.S * 0.05 * f;
    }
    return st.warp ? st.warp(x, y, l) : [x, y];
  }
  drawStem(B, e, l, age, kk, st, f, amp, layer, frO) {
    const S = st.S, fr = frO != null ? frO : this.eo((age - e.d0) / e.dur) * kk; if (fr <= 0) return;
    const j = this.jit(e.id, f, amp);
    const P = e.pts.map(p => this.wpt(st, l, l.x + p[0] * S + j[0], l.y + p[1] * S + j[1]));
    for (const sg of e.segs) {
      if (sg.layer !== layer) continue;
      const b = Math.min(sg.u1, fr); if (b <= sg.u0) continue;
      this.strokeRange(B, P, sg.u0, b, st.C.blue, S * 0.022 * (e.w || 1));
    }
    for (const th of e.thorns) if (fr > th.u && this.layerAt(e.segs, th.u) === layer) this.thorn(B, P, th.u, th.s, S);
  }
  drawEl(B, e, l, age, kk, st, f, amp) {
    const S = st.S, j = this.jit(e.id, f, amp), wx = (x, y) => this.wpt(st, l, l.x + x * S + j[0], l.y + y * S + j[1]);
    const rw = st.rotw ? st.rotw(e) : 0;
    if (e.t === 'leaf') {
      const sc = this.spr((age - e.d0) / 1000, 7, 15) * kk; if (sc <= 0) return;
      const p = wx(e.x, e.y); this.leaf(B, p[0], p[1], e.a + j[2] + rw, e.L * S * sc, e.bend);
    } else if (e.t === 'rose') {
      const a = age - e.d0; if (a < 0) return;
      if (kk <= 0.001) return;
      const p = wx(e.x, e.y), tl = st.face ? this.faceTurn(e, p[0], p[1]) : null;
      if ((st.face || st.perchOn) && !l.dead && a > 700) this.perch.push({ id: e.id, x: p[0], y: p[1], R: e.R * S * kk }); this.rose(B, p[0], p[1], e.R * S * kk, e.rot + j[2] + rw + (tl ? tl[0] * 0.22 : 0), e, a, tl);
    }
  }

  // ---------- poster ----------
  preset() { return this.PRESETS.find(p => p.id === this.state.preset) || this.PRESETS[0]; }
  buildPoster() {
    if (!this.g) return;
    const s = this.state, pr = this.preset(), text = (s.text || '').slice(0, 40) || ' ';
    this.rand = this.rng(s.seed * 7919 + 1);
    const L = []; let prev = null, uid = 1;
    for (const ch of text) {
      if (ch === ' ') { const sp = { ch: ' ', id: 9000 + uid++, els: [] }; L.push(sp); prev = sp; continue; }
      const same = prev && prev.ch !== ' ';
      const l = { ch, id: 9000 + uid++, ws: same ? prev.ws : Math.floor(this.rand() * 1e9), wi: same ? prev.wi + 1 : 0, prev: same ? prev : null };
      this.gen(l); L.push(l); prev = l;
    }
    const n = L.length;
    const step = pr.id === 'reference' ? 30 : pr.id === 'grow' ? Math.min(110, 3000 / n) : pr.id === 'typed' ? Math.min(85, 3600 / n) : 0;
    const off = pr.id === 'grow' ? 200 : pr.id === 'typed' ? 300 : 0;
    L.forEach((l, i) => { l.b = off + i * step; });
    if (pr.id === 'scatter') { const r = this.rng(s.seed * 31 + 5); L.forEach(l => { l.b = 150 + r() * 2400; }); }
    const wd = Math.min(60, 900 / n);
    L.forEach((l, i) => {
      l.d = pr.id === 'scatter' ? 4700 + i * 8 : 4200 + (n - 1 - i) * wd;
      const nx = L[i + 1];
      l.cutRel = null;
      if (pr.id !== 'scatter' && l.ch !== ' ' && nx && nx.ch === ' ') { l.cutRel = Math.max(30, nx.b - l.b); this.genEnd(l, l.cutRel); }
    });
    this.rand = Math.random;
    const res = this.layoutCore(L, 1080, 1080, false);
    // fit the whole garden (not just the type) inside a 6% margin
    let S = res.S, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const addP = (l, x, y, r) => { const X = l.tx + x * S, Y = l.ty + y * S, R = (r || 0) * S; x0 = Math.min(x0, X - R); x1 = Math.max(x1, X + R); y0 = Math.min(y0, Y - R); y1 = Math.max(y1, Y + R); };
    for (const l of L) {
      if (l.ch === ' ') continue;
      addP(l, -l.tw / S / 2, -0.75); addP(l, l.tw / S / 2, 0.1);
      const all = [...l.els, ...(l.endEls || [])];
      for (const e of all) {
        if (e.t === 'stem') e.pts.forEach(q => addP(l, q[0], q[1], 0.02));
        else if (e.t === 'leaf') addP(l, e.x, e.y, e.L);
        else addP(l, e.x, e.y, e.R * 1.15);
      }
    }
    // centre on the type itself; shrink just enough for the garden to clear the margins on every side
    let tx0 = 1e9, tx1 = -1e9, ty0 = 1e9, ty1 = -1e9;
    for (const l of L) if (l.ch !== ' ') { tx0 = Math.min(tx0, l.tx - l.tw / 2); tx1 = Math.max(tx1, l.tx + l.tw / 2); ty0 = Math.min(ty0, l.ty - 0.72 * S); ty1 = Math.max(ty1, l.ty); }
    const Z = 1080, half = Z * 0.44, bcx = (tx0 + tx1) / 2, bcy = (ty0 + ty1) / 2;
    const k = Math.min(1.25, half / Math.max(1, bcx - x0, x1 - bcx), half / Math.max(1, bcy - y0, y1 - bcy));
    L.forEach(l => { l.tx = Z / 2 + (l.tx - bcx) * k; l.ty = Z / 2 + (l.ty - bcy) * k; l.tw *= k; l.x = l.tx; l.y = l.ty; });
    this.P = { letters: L, S: S * k, T: pr.T, preset: pr.id };
    this.pt0 = performance.now();
  }
  posterFly(B, tt, P, C) {
    const ps = this.perch.slice().sort((a, b) => a.x - b.x);
    if (!ps.length) return;
    const p1 = ps[Math.floor(ps.length * 0.25)], p2 = ps[Math.min(ps.length - 1, Math.floor(ps.length * 0.75))];
    const A = [-80, 300], s1 = [p1.x, p1.y - p1.R * 0.55], s2 = [p2.x, p2.y - p2.R * 0.55], E = [1160, 260];
    const sz = Math.max(12, P.S * 0.09), t = tt / 1000, eo = v => this.eo(Math.max(0, Math.min(1, v)));
    const leg = (a, b, u, lift) => { const e = eo(u); return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e - Math.sin(e * Math.PI) * lift]; };
    let p, flying = true, vx = 0;
    if (t < 1.8) { p = leg(A, s1, t / 1.8, 160); vx = 1; }
    else if (t < 3.4) { p = s1; flying = false; }
    else if (t < 4.6) { p = leg(s1, s2, (t - 3.4) / 1.2, 140); vx = s2[0] > s1[0] ? 1 : -1; }
    else if (t < 5.8) { p = s2; flying = false; }
    else { p = leg(s2, E, (t - 5.8) / 1.2, 60); vx = 1; }
    let o, ang;
    if (flying) { o = Math.abs(Math.cos(t * 17)); p = [p[0] + Math.sin(t * 7) * 6, p[1] + Math.sin(t * 13) * 4]; ang = vx * 0.3; }
    else { const burst = (t > 2.4 && t < 2.8) || (t > 5 && t < 5.3); o = burst ? 0.2 + 0.8 * Math.abs(Math.cos(t * 9)) : 0.3 + 0.1 * Math.sin(t * 3); ang = 0; }
    this.butterfly(B, p[0], p[1], sz, ang, o, C);
  }
  drawBg(g, Z) {
    if (this.props.transparentBg) {
      g.clearRect(0, 0, Z, Z);
      return;
    }
    g.fillStyle = this.pal().bg;
    g.fillRect(0, 0, Z, Z);
  }
  bars(B, P, st, spread, hf) {
    const S = P.S, byLine = {};
    for (const l of P.letters) { if (l.ch === ' ') continue; const b = byLine[l.line] || (byLine[l.line] = { a: 1e9, z: -1e9, y: l.ty }); b.a = Math.min(b.a, l.tx - l.tw / 2); b.z = Math.max(b.z, l.tx + l.tw / 2); }
    const w = Math.max(2, S * 0.035), h = 1.0 * S * hf;
    for (const k in byLine) {
      const b = byLine[k], cx = (b.a + b.z) / 2, half = (b.z - b.a) / 2 + 0.14 * S, cy = b.y - 0.33 * S;
      B.rect(cx - half * spread - w / 2, cy - h / 2, w, h, st.C.text);
      B.rect(cx + half * spread - w / 2, cy - h / 2, w, h, st.C.text);
    }
  }
  posterDraw(g, t) {
    const P = this.P; if (!P) return;
    const Z = 1080, pc = this.pal();
    g.setTransform(1, 0, 0, 1, 0, 0);
    this.drawBg(g, Z);
    const tt = ((t % P.T) + P.T) % P.T, L = P.letters, B = this.backend(g);
    const st = { letters: L, S: P.S, C: pc.C, boil: this.props.boil ?? true, recoil: this.props.recoil ?? 20, speed: 1, wither: 600, textAll: true };
    L.forEach(l => { l.x = l.tx; l.y = l.ty; l.dead = null; });
    const set = base => L.forEach(l => { l.birth = base + l.b; l.tb = l.birth; l.cut = l.cutRel != null ? l.birth + l.cutRel : null; });
    let bars = null;
    if (P.preset === 'reference') {
      if (tt < 1950) { set(-1e5); bars = 1; }
      else if (tt < 2050) return;
      else if (tt < 2600) { this.bars(B, P, st, 0, this.eo((tt - 2050) / 550)); return; }
      else { const e = this.eo((tt - 2600) / 400); const lc = {}; L.forEach(l => { if (l.ch === ' ') return; const b = lc[l.line] || (lc[l.line] = [1e9, -1e9]); b[0] = Math.min(b[0], l.tx - l.tw / 2); b[1] = Math.max(b[1], l.tx + l.tw / 2); });
        L.forEach(l => { const b = lc[l.line], c = b ? (b[0] + b[1]) / 2 : 540; l.x = c + (l.tx - c) * e; }); set(3000); st.speed = 2.2; bars = e; }
    } else if (P.preset === 'breathe') {
      set(-1e5);
      const ph = tt / P.T * Math.PI * 2, S = P.S;
      st.warp = (x, y, l) => { const h = Math.max(0, (l.y - y) / S); return [x + Math.sin(ph + l.x * 0.004 + h * 1.1) * S * 0.03 * h, y + Math.cos(ph + x * 0.003) * S * 0.008 * h]; };
      st.rotw = e => Math.sin(ph + e.id * 0.7) * 0.12;
    } else if (P.preset === 'grow' || P.preset === 'scatter') {
      set(0);
      L.forEach(l => { if (tt >= l.d) l.dead = l.d; });
    } else if (P.preset === 'wind') {
      set(-1e5);
      const S = P.S, u = tt / P.T, front = -0.35 + u * 1.9;
      st.warp = (x, y, l) => {
        const hh = Math.max(0, (l.y - y) / S), d = l.x / 1080 - front;
        const g = d < 0 ? Math.exp(d * 2.2) * Math.cos(-d * 9) : Math.exp(-d * d * 30);
        const idle = Math.sin(tt / 1000 * 1.6 + l.x * 0.01) * 0.012;
        return [x + (g * 0.13 + idle) * S * hh * hh * 0.6 + (g * 0.13 + idle) * S * hh * 0.4, y + Math.abs(g) * 0.02 * S * hh];
      };
      st.rotw = e => { const d = e.x / 1080 - front; return (d < 0 ? Math.exp(d * 2.2) * Math.cos(-d * 9) : Math.exp(-d * d * 30)) * 0.35; };
    } else if (P.preset === 'reach') {
      set(-1e5);
      const S = P.S, ph = tt / P.T * Math.PI * 2, lx = 540 + Math.sin(ph) * 430, ly = 540 + Math.sin(ph * 2) * 260;
      this._light = [lx, ly];
      st.warp = (x, y, l) => {
        const dx = lx - l.x, dy = ly - (l.y - S * 0.6), d = Math.hypot(dx, dy) || 1, w = Math.max(0, 1 - d / 560), s = w * w * (3 - 2 * w);
        const hh = Math.min(2.5, Math.max(0, (l.y - y) / S)), f = hh * hh * 0.5 + hh * 0.5;
        return [x + dx / d * s * S * 0.12 * f, y + dy / d * s * S * 0.06 * f];
      };
      st.rotw = e => { const a = Math.atan2(ly - e.y, lx - e.x); return Math.sin(a) * 0.15; };
    } else if (P.preset === 'visit') {
      set(-1e5);
      st.perchOn = true; this.perch = [];
      const ph = tt / P.T * Math.PI * 2;
      st.warp = (x, y, l) => { const hh = Math.max(0, (l.y - y) / P.S); return [x + Math.sin(ph + l.x * 0.004 + hh) * P.S * 0.015 * hh, y]; };
    } else {
      if (tt >= 4400) return;
      set(0);
      st.letters = L.filter(l => tt >= l.birth);
      st.textAll = false;
    }
    this.render(B, tt, st);
    if (bars != null) this.bars(B, P, st, bars, 1);
    if (P.preset === 'reach') {
      const [lx, ly] = this._light, r = P.S * 0.09, pts = [];
      for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; pts.push([lx + Math.cos(a) * r, ly + Math.sin(a) * r]); }
      B.fill(pts, st.C.line);
    }
    if (P.preset === 'visit') this.posterFly(B, tt, P, st.C);
    if (P.preset === 'typed') {
      const born = st.letters, last = born[born.length - 1], S = P.S;
      if (Math.floor(tt / 400) % 2 === 0 || (last && tt - last.birth < 300)) {
        const x = last ? last.tx + last.tw / 2 + 0.07 * S : 540, y = last ? last.ty - 0.33 * S : 540, w = Math.max(2, S * 0.03), h = 0.8 * S;
        B.rect(x - w / 2, y - h / 2, w, h, st.C.text);
      }
    }
  }

  

}

window.TypeGarden = TypeGarden;
