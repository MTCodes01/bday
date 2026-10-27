/**
 * ============================================================
 * BIRTHDAY SURPRISE — Obsidian Capsule Script
 * Stitch Design System & Craft-Floor Architecture
 * ============================================================
 */
const CONFIG = {
  /** Birthday person name displayed across all screens */
  birthdayPersonName: 'Alex',

  /** Opening screen tagline */
  openingTagline: 'Someone has something to tell you…',

  /** Duration (ms) the cinematic intro screen displays */
  introDuration: 3200,

  /** Fallback background music playlist for text slides */
  bgMusicFallback: [
    'assets/music/nastelbom-background-music-617073.mp3',
    'assets/music/dailyvibe-upbeat-corporate-614426.mp3',
    'assets/music/jonasblakewood-future-beat-music-619127.mp3',
    'assets/music/bombinsound-podcast-music-intro-version-4-ridingx27-617278.mp3',
    'assets/music/nastelbom-no-copyright-music-617081.mp3',
    'assets/music/the_mountain-presentation-610155.mp3',
    'assets/music/atlasaudio-rap-617598.mp3',
    'assets/music/atlasaudio-house-music-617575.mp3',
    'assets/music/kulakovka-adrenaline-sport-620584.mp3',
  ],

  /** Exact fallback durations (seconds) for voice notes across all browser engines */
  audioDurations: {
    'alex': 15.0,
  },

  /** Finale music for the botanical garden celebration section */
  finaleMusic: 'assets/music/nastelbom-background-music-617073.mp3',

  /** Photos from assets/collage displayed in the background bento conveyor of the finale section */
  collageImages: [
    'sample_memory_1.jpg',
    'sample_memory_2.jpg',
  ],
};

/* ============================================================
   GLOBAL STATE
   ============================================================ */
const State = {
  messages: [],
  currentStoryIndex: 0,
  totalStories: 0,
  currentScreen: 'opening', // opening | intro | stories | botanical
  audio: {
    element: null,
    currentId: null,
    isPlaying: false,
  },
  touch: { startX: 0, startY: 0 },
  typewriterTimer: null,
  prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

/* ============================================================
   DOM UTILITIES
   ============================================================ */
const $  = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

let DOM = {};
let typeGardenInstance = null;

/* Authoritative SVG Icons for Playback & Stats */
const SVG_ICONS = {
  play: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  rewind: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>`,
  forward: `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>`,
  quote: `<svg class="quote-icon-header" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>`,
  voiceNoteBadge: `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="margin-right:4px;"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`,
  textNoteBadge: `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style="margin-right:4px;"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`
};

/* ============================================================
   INITIALISE
   ============================================================ */
async function init() {
  DOM = {
    loadingOverlay: $('#loading-overlay'),
    app: $('#app'),

    // Screens
    screenOpening: $('#screen-opening'),
    screenIntro: $('#screen-intro'),
    screenStories: $('#screen-stories'),
    screenBotanical: $('#screen-botanical'),

    // Botanical Finale
    bentoConveyor: $('#bento-conveyor'),
    tgCanvas: $('#tg-canvas'),
    btnTgReplay: $('#btn-tg-replay'),
    btnTgBack: $('#btn-tg-back'),

    // Opening
    openingName: $('#opening-name'),
    openingTagline: $('#opening-tagline'),
    btnOpen: $('#btn-open'),

    // Intro
    introLine: $('#intro-line'),
    introSub: $('#intro-sub'),

    // Stories
    progressBarRow: $('#progress-bar-row'),
    storyTopBar: $('#story-top-bar'),
    storiesContainer: $('#stories-container'),
    storyAvatarPlaceholder: $('#story-avatar-placeholder'),
    storyAvatar: $('#story-avatar'),
    storyFriendName: $('#story-friend-name'),
    storyTypeBadge: $('#story-type-badge'),
    storyCounter: $('#story-counter'),
    zonePrev: $('#zone-prev'),
    zoneNext: $('#zone-next'),
    btnStoryPrev: $('#btn-story-prev'),
    btnStoryNext: $('#btn-story-next'),
    btnStoryPause: $('#btn-story-pause'),
    storyPauseIndicator: $('#story-pause-indicator'),

    // Toast
    toastContainer: $('#toast-container'),
  };

  DOM.openingName.textContent = CONFIG.birthdayPersonName;
  DOM.openingTagline.textContent = CONFIG.openingTagline;

  // Load messages from data/messages.json
  try {
    const res = await fetch('data/messages.json?v=20261022');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    State.messages = await res.json();
  } catch (e) {
    console.error('Could not load messages.json:', e);
    State.messages = [];
    showToast('⚠️ Could not load messages. Check data/messages.json');
  }

  State.totalStories = State.messages.length;
  buildProgressBars();
  buildStorySlides();
  initParticles();

  // Defer botanical collage construction to background idle time
  if (window.requestIdleCallback) {
    requestIdleCallback(() => initBotanicalCollage(), { timeout: 4000 });
  } else {
    setTimeout(() => initBotanicalCollage(), 2000);
  }

  bindEvents();

  // Hide loader
  DOM.loadingOverlay.classList.add('hidden');
  setTimeout(() => DOM.loadingOverlay.remove(), 600);

  // Show opening
  showScreen('opening');
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ============================================================
   SCREEN MANAGEMENT
   ============================================================ */
function showScreen(name) {
  const screens = {
    opening: DOM.screenOpening,
    intro: DOM.screenIntro,
    stories: DOM.screenStories,
    botanical: DOM.screenBotanical,
  };

  if (name !== 'botanical' && typeGardenInstance) {
    typeGardenInstance.stop();
  }

  if (name !== 'stories') {
    if (typeof StoryProgress !== 'undefined') {
      StoryProgress.clear();
    }
  }

  if (name !== 'stories' && name !== 'botanical') {
    if (typeof BGM !== 'undefined') {
      BGM.stopImmediate();
    }
  }

  Object.entries(screens).forEach(([key, el]) => {
    if (!el) return;
    if (key === name) {
      el.classList.remove('exit');
      el.classList.add('active');
    } else if (el.classList.contains('active')) {
      el.classList.remove('active');
      el.classList.add('exit');
      setTimeout(() => el.classList.remove('exit'), 550);
    }
  });

  State.currentScreen = name;

  if (name === 'botanical') {
    initBotanicalCollage();
    initTypeGarden();
    applyBotanicalTheme(typeGardenInstance ? typeGardenInstance.state.palette : 4);
    if (typeof BGM !== 'undefined') {
      BGM.play(CONFIG.finaleMusic || 'assets/music/nastelbom-background-music-617073.mp3');
    }
  }
}

/* ============================================================
   BOTANICAL FINALE PALETTES & THEME CONTROLLER
   Synchronizes flowers, glows, backdrop, and floating dock controls
   ============================================================ */
const BOTANICAL_PALETTE_THEMES = [
  {
    name: 'Rose noir',
    bg: '#08080c',
    accent: '#FF1400',
    glow: 'rgba(255, 20, 0, 0.45)',
    secondaryGlow: 'rgba(50, 87, 255, 0.35)',
    border: 'rgba(255, 20, 0, 0.3)',
    btnBg: 'rgba(255, 20, 0, 0.18)',
    btnHover: 'rgba(255, 20, 0, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(10, 8, 16, 0.12) 0%, rgba(8, 8, 12, 0.38) 60%, rgba(4, 4, 8, 0.72) 100%)'
  },
  {
    name: 'Paper',
    bg: '#181512',
    accent: '#FF3B1F',
    glow: 'rgba(255, 59, 31, 0.45)',
    secondaryGlow: 'rgba(82, 130, 255, 0.3)',
    border: 'rgba(255, 59, 31, 0.3)',
    btnBg: 'rgba(255, 59, 31, 0.18)',
    btnHover: 'rgba(255, 59, 31, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(24, 20, 16, 0.12) 0%, rgba(18, 15, 12, 0.38) 60%, rgba(12, 10, 8, 0.72) 100%)'
  },
  {
    name: 'Midnight',
    bg: '#081024',
    accent: '#9FB4FF',
    glow: 'rgba(159, 180, 255, 0.48)',
    secondaryGlow: 'rgba(255, 90, 78, 0.32)',
    border: 'rgba(159, 180, 255, 0.32)',
    btnBg: 'rgba(159, 180, 255, 0.18)',
    btnHover: 'rgba(159, 180, 255, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(12, 22, 50, 0.12) 0%, rgba(8, 16, 36, 0.38) 60%, rgba(4, 8, 20, 0.72) 100%)'
  },
  {
    name: 'Citrus',
    bg: '#0A1810',
    accent: '#FF8A00',
    glow: 'rgba(255, 138, 0, 0.48)',
    secondaryGlow: 'rgba(31, 164, 99, 0.35)',
    border: 'rgba(255, 138, 0, 0.3)',
    btnBg: 'rgba(255, 138, 0, 0.18)',
    btnHover: 'rgba(255, 138, 0, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(12, 26, 16, 0.12) 0%, rgba(8, 20, 12, 0.38) 60%, rgba(4, 12, 6, 0.72) 100%)'
  },
  {
    name: 'Orchid',
    bg: '#140A1F',
    accent: '#E63CFF',
    glow: 'rgba(230, 60, 255, 0.45)',
    secondaryGlow: 'rgba(47, 184, 166, 0.35)',
    border: 'rgba(230, 60, 255, 0.3)',
    btnBg: 'rgba(230, 60, 255, 0.18)',
    btnHover: 'rgba(230, 60, 255, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(20, 10, 31, 0.12) 0%, rgba(16, 8, 26, 0.38) 60%, rgba(10, 4, 16, 0.72) 100%)'
  },
  {
    name: 'Moss',
    bg: '#0A1C12',
    accent: '#7FD18B',
    glow: 'rgba(127, 209, 139, 0.45)',
    secondaryGlow: 'rgba(255, 183, 197, 0.35)',
    border: 'rgba(127, 209, 139, 0.3)',
    btnBg: 'rgba(127, 209, 139, 0.18)',
    btnHover: 'rgba(127, 209, 139, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(12, 28, 18, 0.12) 0%, rgba(8, 22, 14, 0.38) 60%, rgba(4, 14, 8, 0.72) 100%)'
  },
  {
    name: 'Tomato',
    bg: '#1C0808',
    accent: '#FF3B1F',
    glow: 'rgba(255, 59, 31, 0.48)',
    secondaryGlow: 'rgba(255, 160, 122, 0.35)',
    border: 'rgba(255, 59, 31, 0.3)',
    btnBg: 'rgba(255, 59, 31, 0.18)',
    btnHover: 'rgba(255, 59, 31, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(28, 8, 8, 0.12) 0%, rgba(20, 6, 6, 0.38) 60%, rgba(12, 3, 3, 0.72) 100%)'
  },
  {
    name: 'Butter',
    bg: '#181406',
    accent: '#FFB800',
    glow: 'rgba(255, 184, 0, 0.48)',
    secondaryGlow: 'rgba(72, 199, 116, 0.35)',
    border: 'rgba(255, 184, 0, 0.3)',
    btnBg: 'rgba(255, 184, 0, 0.18)',
    btnHover: 'rgba(255, 184, 0, 0.32)',
    overlay: 'radial-gradient(circle at 50% 50%, rgba(26, 20, 8, 0.12) 0%, rgba(18, 14, 5, 0.38) 60%, rgba(12, 9, 3, 0.72) 100%)'
  }
];

function applyBotanicalTheme(palIndex) {
  const theme = BOTANICAL_PALETTE_THEMES[palIndex] || BOTANICAL_PALETTE_THEMES[4];
  const screen = DOM.screenBotanical || $('#screen-botanical');
  if (screen) {
    screen.style.backgroundColor = theme.bg;
    screen.style.setProperty('--theme-accent', theme.accent);
    screen.style.setProperty('--theme-glow', theme.glow);
    screen.style.setProperty('--theme-secondary-glow', theme.secondaryGlow);
    screen.style.setProperty('--theme-bg', theme.bg);
    screen.style.setProperty('--theme-border', theme.border);
    screen.style.setProperty('--theme-btn-bg', theme.btnBg);
    screen.style.setProperty('--theme-btn-hover', theme.btnHover);
  }
  const floatingActions = $('.tg-floating-actions');
  if (floatingActions) {
    floatingActions.style.setProperty('--theme-accent', theme.accent);
    floatingActions.style.setProperty('--theme-glow', theme.glow);
    floatingActions.style.setProperty('--theme-border', theme.border);
    floatingActions.style.setProperty('--theme-btn-bg', theme.btnBg);
    floatingActions.style.setProperty('--theme-btn-hover', theme.btnHover);
  }
  const backdrop = $('#botanical-collage-backdrop');
  if (backdrop) backdrop.style.backgroundColor = theme.bg;
  const overlay = $('#botanical-collage-overlay') || $('.botanical-collage-overlay');
  if (overlay) overlay.style.background = theme.overlay;
  const glowOrb = $('#botanical-theme-glow');
  if (glowOrb) {
    glowOrb.style.background = `radial-gradient(circle at 50% 50%, ${theme.glow} 0%, ${theme.secondaryGlow} 42%, transparent 72%)`;
  }
}

function cycleBotanicalTheme(e) {
  if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
  if (!typeGardenInstance || !typeGardenInstance.PAL) return;
  const currentPal = typeGardenInstance.state.palette;
  const nextPal = (currentPal + 1) % typeGardenInstance.PAL.length;
  typeGardenInstance.setPalette(nextPal);
  applyBotanicalTheme(nextPal);
}

/* ============================================================
   TYPE GARDEN BOTANICAL FINALE CONTROLLER
   ============================================================ */
function initTypeGarden() {
  if (!DOM.tgCanvas) return;
  if (!typeGardenInstance && window.TypeGarden) {
    typeGardenInstance = new window.TypeGarden(DOM.tgCanvas, {
      text: 'Happy Birthday ' + (CONFIG.birthdayPersonName || 'Friend'),
      preset: 'breathe',
      palette: 4, // 4 = Orchid Theme (Magenta #E63CFF & Teal #2FB8A6)
      seed: 7,
      transparentBg: true
    });
  }
  if (typeGardenInstance) {
    typeGardenInstance.start();
  }
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getShuffledCollageImages() {
  const rawImages = CONFIG.collageImages || [];
  if (!rawImages.length) return [];

  // Repeat/cycle rawImages cleanly to populate the 44 bento grid slots
  const targetCount = 44;
  const pool = [];
  while (pool.length < targetCount) {
    pool.push(...shuffleArray(rawImages));
  }
  return pool.slice(0, targetCount);
}

/* ============================================================
   BOTANICAL FINALE PHOTO COLLAGE CONTROLLER
   True Bento Grid with Hero Feature Cards & Infinite Diagonal Scroll
   ============================================================ */
function initBotanicalCollage(forceReshuffle = false) {
  const conveyor = DOM.bentoConveyor || $('#bento-conveyor');
  if (!conveyor) return;
  if (!forceReshuffle && conveyor.dataset.loaded === 'true') return;

  const images = getShuffledCollageImages();
  if (!images.length) return;

  // True Bento layout: 2 Hero [2, 2] cards, 5 Wide [2, 1] cards, 1 Tall [1, 2] card, 36 [1, 1] cards (44 cards total)
  // 8 cols x 7 rows = 56 cells (zero empty, zero overlapping, perfectly orientation-matched)
  const bentoSpans = [
    [2, 2], [1, 1], [1, 1], [1, 1], [2, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1],
    [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [2, 1], [1, 1], [2, 1],
    [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [2, 2], [1, 1], [1, 1], [1, 1], [1, 1],
    [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 2], [1, 1],
    [2, 1], [2, 1], [1, 1], [1, 1]
  ];

  function createBentoCluster() {
    const cluster = document.createElement('div');
    cluster.className = 'botanical-bento-cluster';

    images.forEach((imgName, index) => {
      const card = document.createElement('div');
      const [w, h] = bentoSpans[index] || [1, 1];
      card.className = `bento-card bento-w-${w} bento-h-${h}`;

      const safeName = encodeURIComponent(imgName);
      const thumbUrl = `assets/collage/thumbs/${safeName}?v=20261022`;

      // Seamless ambient blur background
      const blurBg = document.createElement('div');
      blurBg.className = 'bento-blur-bg';

      const img = document.createElement('img');
      img.src = thumbUrl;
      img.onerror = function() {
        if (this.src.indexOf('thumbs') !== -1) {
          const origSrc = `assets/collage/${safeName}`;
          this.src = origSrc;
        }
      };
      img.alt = `${CONFIG.birthdayPersonName || 'Birthday'} Memory ${index + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';

      card.appendChild(blurBg);
      card.appendChild(img);
      cluster.appendChild(card);
    });

    return cluster;
  }

  conveyor.innerHTML = '';
  const fragment = document.createDocumentFragment();

  // Create a 5x3 grid of clusters (15 clusters)
  // With kx=2, ky=1 diagonal scroll (-3264px, -1848px), this guarantees 100% of all 44 photos
  // are visible during scrolling across any screen size (from 360px mobile to 4K desktop)
  for (let i = 0; i < 15; i++) {
    fragment.appendChild(createBentoCluster());
  }

  conveyor.appendChild(fragment);
  conveyor.dataset.loaded = 'true';
}

/* ============================================================
   ATMOSPHERIC PARTICLE DUST (OPENING)
   ============================================================ */
function initParticles() {
  const canvas = $('#particle-canvas');
  if (!canvas || State.prefersReducedMotion) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + 10;
      this.size = Math.random() * 2.5 + 1;
      this.speedY = -(Math.random() * 1.0 + 0.3);
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.35 + 0.15;
      const palette = ['#FF5C58', '#B78AF7', '#FFB347', '#FFFFFF'];
      this.color = palette[Math.floor(Math.random() * palette.length)];
      this.life = 1;
      this.decay = Math.random() * 0.003 + 0.001;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
      this.opacity = this.life * 0.4;
      if (this.life <= 0 || this.y < -10) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animate);
  }

  function start() {
    resize();
    particles = Array.from({ length: 35 }, () => {
      const p = new Particle();
      p.y = Math.random() * canvas.height;
      return p;
    });
    animate();
  }

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas);
  start();

  DOM.screenOpening.addEventListener('transitionend', () => {
    if (!DOM.screenOpening.classList.contains('active')) {
      cancelAnimationFrame(animId);
    }
  });
}



/* ============================================================
   DURATION HELPERS & STORY PROGRESS CONTROLLER
   ============================================================ */
function getAudioDuration(audio, msg) {
  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.duration;
  }
  if (msg && msg.id && CONFIG.audioDurations[msg.id]) {
    return CONFIG.audioDurations[msg.id];
  }
  return 0;
}

function getTextStoryDuration(msg) {
  const text = (msg.message || '') + ' ' + (msg.heading || '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Base 7.5s + 180ms per word, capped between 7.5s and 14s
  return Math.max(7500, Math.min(14000, 7500 + words * 180));
}

const StoryProgress = {
  timer: null,
  startTime: 0,
  duration: 0,
  elapsedBeforePause: 0,
  isPaused: false,
  currentIndex: -1,

  startTextProgress(index, duration) {
    this.clear();
    this.currentIndex = index;
    this.duration = duration;
    this.elapsedBeforePause = 0;
    this.isPaused = false;
    this.startTime = performance.now();

    const tick = (now) => {
      if (this.currentIndex !== State.currentStoryIndex || State.currentScreen !== 'stories') {
        this.clear();
        return;
      }
      if (!this.isPaused) {
        const elapsed = (now - this.startTime) + this.elapsedBeforePause;
        const pct = Math.min(1, elapsed / this.duration);
        const fill = $(`#progress-seg-${index} .progress-segment-fill`);
        if (fill) fill.style.transform = `scaleX(${pct})`;

        if (pct >= 1) {
          this.clear();
          navigateStory(1);
          return;
        }
      }
      this.timer = requestAnimationFrame(tick);
    };
    this.timer = requestAnimationFrame(tick);
  },

  pause() {
    if (this.isPaused || !this.timer) return;
    this.isPaused = true;
    this.elapsedBeforePause += (performance.now() - this.startTime);
  },

  resume() {
    if (!this.isPaused || !this.timer) return;
    this.isPaused = false;
    this.startTime = performance.now();
  },

  clear() {
    if (this.timer) {
      cancelAnimationFrame(this.timer);
      this.timer = null;
    }
    this.isPaused = false;
    this.currentIndex = -1;
  }
};

/* ============================================================
   STORY PROGRESS BARS
   ============================================================ */
function buildProgressBars() {
  if (!DOM.progressBarRow) return;
  DOM.progressBarRow.innerHTML = '';
  State.messages.forEach((msg, i) => {
    const seg = document.createElement('div');
    seg.className = 'progress-segment';
    seg.id = `progress-seg-${i}`;
    seg.setAttribute('role', 'button');
    seg.setAttribute('tabindex', '0');
    seg.setAttribute('aria-label', `Story ${i + 1} of ${State.totalStories}: ${msg.name}`);

    const fill = document.createElement('div');
    fill.className = 'progress-segment-fill';
    seg.appendChild(fill);

    seg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (State.currentStoryIndex !== i) {
        StoryProgress.clear();
        if (typeof BGM !== 'undefined') BGM.fadeOut(350);
        stopAllAudio();
        showStory(i);
      }
    });

    DOM.progressBarRow.appendChild(seg);
  });
}

function updateProgressBars(activeIndex) {
  State.messages.forEach((_, i) => {
    const seg = $(`#progress-seg-${i}`);
    if (!seg) return;
    seg.classList.remove('done', 'active');
    const fill = $('.progress-segment-fill', seg);
    if (i < activeIndex) {
      seg.classList.add('done');
      if (fill) fill.style.transform = 'scaleX(1)';
    } else if (i === activeIndex) {
      seg.classList.add('active');
      if (fill) fill.style.transform = 'scaleX(0)';
    } else {
      if (fill) fill.style.transform = 'scaleX(0)';
    }
  });
}

/* ============================================================
   BUILD STORY SLIDES — STRICT SINGLE TYPE (AUDIO OR TEXT)
   ============================================================ */
function buildStorySlides() {
  if (!DOM.storiesContainer) return;
  DOM.storiesContainer.innerHTML = '';

  State.messages.forEach((msg, i) => {
    const slide = document.createElement('div');
    slide.className = 'story-slide';
    slide.id = `story-slide-${msg.id}`;
    slide.dataset.index = i;
    slide.setAttribute('role', 'article');
    slide.setAttribute('aria-label', `Story from ${msg.name}`);

    const isAudio = Boolean(msg.audio);

    if (isAudio) {
      // BUILD PURE AUDIO STORY
      const audioContent = buildAudioStorySlide(msg, i);
      slide.appendChild(audioContent);
    } else {
      // BUILD PURE TEXT STORY
      const textContent = buildTextStorySlide(msg, i);
      slide.appendChild(textContent);
    }

    DOM.storiesContainer.appendChild(slide);
  });
}

/* ============================================================
   REAL-TIME AUDIO FREQUENCY VISUALIZER
   Reads Web Audio Analyser frequency data to dynamically dance the 36 bars
   ============================================================ */
const AudioVisualizer = {
  ctx: null,
  analyser: null,
  sourceMap: new WeakMap(),
  rafId: null,
  freqData: null,
  currentWaveform: null,
  baseHeights: [20, 34, 56, 44, 76, 52, 28, 86, 72, 44, 62, 82, 38, 66, 92, 56, 38, 72, 48, 86, 62, 28, 52, 76, 38, 62, 86, 44, 28, 56, 72, 44, 52, 66, 34, 20],

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.76;
        this.analyser.connect(this.ctx.destination);
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  },

  connectAudio(audio) {
    this.init();
    if (!this.ctx || !this.analyser || !audio) return false;
    try {
      if (!this.sourceMap.has(audio)) {
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(this.analyser);
        this.sourceMap.set(audio, source);
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  start(waveformMeter, audio, slideIndex, msg) {
    this.stop();
    this.init();
    const isConnected = this.connectAudio(audio);
    this.currentWaveform = waveformMeter;

    const bars = $$('.waveform-bar', waveformMeter);
    const barCount = bars.length;

    const animate = () => {
      if (!State.audio.isPlaying || State.currentStoryIndex !== slideIndex || State.currentScreen !== 'stories') {
        this.resetBars(bars);
        return;
      }

      const dur = getAudioDuration(audio, msg);
      const currentTime = audio.currentTime || 0;
      const pct = dur > 0 ? (currentTime / dur) : 0;
      const playedCount = Math.floor(pct * barCount);

      let hasFrequencies = false;
      if (isConnected && this.analyser && this.freqData) {
        this.analyser.getByteFrequencyData(this.freqData);
        let sum = 0;
        for (let i = 0; i < 28; i++) sum += this.freqData[i];
        if (sum > 30) hasFrequencies = true;
      }

      const time = performance.now() * 0.005;

      bars.forEach((bar, idx) => {
        // Highlight played section
        if (idx < playedCount) {
          bar.classList.add('played');
        } else {
          bar.classList.remove('played');
        }

        const base = this.baseHeights[idx % this.baseHeights.length];

        if (hasFrequencies) {
          // Map to voice bins with gentle smoothing
          const bin = Math.min(this.freqData.length - 1, Math.floor((idx / barCount) * 26) + 1);
          const raw = this.freqData[bin] / 255;
          const targetH = Math.max(12, Math.min(100, (raw * 90) + (base * 0.22)));
          bar.style.height = `${targetH}%`;
        } else {
          // Dynamic organic speech harmonic wave when frequency data is loading
          const wave = Math.sin(time * 3.5 + idx * 0.5) * 0.3 + Math.cos(time * 2.1 + idx * 0.8) * 0.2;
          const targetH = Math.max(14, Math.min(95, base * (0.7 + wave)));
          bar.style.height = `${targetH}%`;
        }
      });

      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  },

  resetBars(bars) {
    const list = bars || (this.currentWaveform ? $$('.waveform-bar', this.currentWaveform) : []);
    list.forEach((bar, idx) => {
      bar.style.height = `${this.baseHeights[idx % this.baseHeights.length]}%`;
    });
  },

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.currentWaveform) {
      this.resetBars();
      this.currentWaveform = null;
    }
  }
};

/* ============================================================
   AUDIO STORY SLIDE BUILDER (TACTILE VINYL & WAVEFORM)
   ============================================================ */
function buildAudioStorySlide(msg, slideIndex) {
  const container = document.createElement('div');
  container.className = 'audio-story-stage';
  container.id = `audio-stage-${msg.id}`;

  const initials = msg.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // 1. Tactile Vinyl Record Component
  const vinylWrapper = document.createElement('div');
  vinylWrapper.className = 'vinyl-component-wrapper';

  const vinylDisc = document.createElement('div');
  vinylDisc.className = 'vinyl-disc animate-spin-vinyl paused';
  vinylDisc.id = `vinyl-disc-${msg.id}`;

  // Concentric grooves
  const grooves = document.createElement('div');
  grooves.className = 'vinyl-grooves';
  const sheen = document.createElement('div');
  sheen.className = 'vinyl-sheen';

  // Center label
  const centerLabel = document.createElement('div');
  centerLabel.className = 'vinyl-center-label';
  centerLabel.style.background = msg.color || 'var(--clr-coral)';
  if (msg.avatar) {
    centerLabel.style.backgroundImage = `url("${msg.avatar}")`;
    centerLabel.style.backgroundSize = 'cover';
    centerLabel.style.backgroundPosition = 'center';
  } else {
    centerLabel.textContent = initials;
  }

  vinylDisc.appendChild(grooves);
  vinylDisc.appendChild(sheen);
  vinylDisc.appendChild(centerLabel);

  const rpmTag = document.createElement('div');
  rpmTag.className = 'vinyl-tag';
  rpmTag.textContent = '33 ⅓ RPM';

  vinylWrapper.appendChild(vinylDisc);
  vinylWrapper.appendChild(rpmTag);
  container.appendChild(vinylWrapper);

  // 2. Audio Story Info
  const metaBlock = document.createElement('div');
  metaBlock.className = 'audio-meta-block';

  const trackEyebrow = document.createElement('span');
  trackEyebrow.className = 'audio-track-eyebrow';
  trackEyebrow.textContent = `Track ${String(slideIndex + 1).padStart(2, '0')} · Voice Note`;

  const headline = document.createElement('h2');
  headline.className = 'audio-story-headline';
  headline.textContent = `A Voice Note from ${msg.name}`;

  const caption = document.createElement('p');
  caption.className = 'audio-story-caption';
  caption.textContent = msg.caption || `Hit play to hear what ${msg.name} recorded for your birthday.`;

  metaBlock.appendChild(trackEyebrow);
  metaBlock.appendChild(headline);
  metaBlock.appendChild(caption);
  container.appendChild(metaBlock);

  // 3. Audio Player Module
  const playerModule = document.createElement('div');
  playerModule.className = 'audio-player-module';

  // Waveform Meter (36 dynamic vertical bars)
  const waveformMeter = document.createElement('div');
  waveformMeter.className = 'waveform-meter';
  waveformMeter.id = `waveform-${msg.id}`;

  const barCount = 36;
  const barHeights = [20, 35, 60, 45, 80, 55, 30, 90, 75, 45, 65, 85, 40, 70, 95, 60, 40, 75, 50, 90, 65, 30, 55, 80, 40, 65, 90, 45, 30, 60, 75, 45, 55, 70, 35, 20];

  for (let b = 0; b < barCount; b++) {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    bar.style.height = `${barHeights[b % barHeights.length]}%`;
    waveformMeter.appendChild(bar);
  }
  playerModule.appendChild(waveformMeter);

  // Scrubber & Timestamps
  const scrubberModule = document.createElement('div');
  scrubberModule.className = 'scrubber-module';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'audio-slider-input';
  slider.id = `slider-${msg.id}`;
  slider.min = '0';
  slider.max = '100';
  slider.value = '0';
  slider.style.setProperty('--progress', '0%');
  slider.setAttribute('aria-label', `Audio scrubber for ${msg.name}`);

  const timeRow = document.createElement('div');
  timeRow.className = 'time-row';

  const elapsedEl = document.createElement('span');
  elapsedEl.id = `elapsed-${msg.id}`;
  elapsedEl.className = 'time-elapsed';
  elapsedEl.textContent = '0:00';

  const totalEl = document.createElement('span');
  totalEl.id = `total-${msg.id}`;
  totalEl.textContent = '0:00';

  timeRow.appendChild(elapsedEl);
  timeRow.appendChild(totalEl);
  scrubberModule.appendChild(slider);
  scrubberModule.appendChild(timeRow);
  playerModule.appendChild(scrubberModule);

  // Controls Row (Rewind, Master Play/Pause, Forward)
  const controlsRow = document.createElement('div');
  controlsRow.className = 'player-controls-row';

  // Rewind 10s button
  const btnRewind = document.createElement('button');
  btnRewind.className = 'btn-ctrl-secondary';
  btnRewind.setAttribute('aria-label', 'Rewind 10 seconds');
  btnRewind.innerHTML = SVG_ICONS.rewind;

  // Master Play/Pause button
  const btnMasterPlay = document.createElement('button');
  btnMasterPlay.className = 'btn-master-play';
  btnMasterPlay.id = `btn-play-${msg.id}`;
  btnMasterPlay.setAttribute('aria-label', `Play voice note from ${msg.name}`);
  btnMasterPlay.innerHTML = SVG_ICONS.play;

  // Forward 10s button
  const btnForward = document.createElement('button');
  btnForward.className = 'btn-ctrl-secondary';
  btnForward.setAttribute('aria-label', 'Forward 10 seconds');
  btnForward.innerHTML = SVG_ICONS.forward;

  controlsRow.appendChild(btnRewind);
  controlsRow.appendChild(btnMasterPlay);
  controlsRow.appendChild(btnForward);
  playerModule.appendChild(controlsRow);

  container.appendChild(playerModule);

  // Audio Engine Lifecycle
  const audio = new Audio();
  audio.preload = 'metadata';

  // Prevent parent tap zone from triggering story navigation
  container.addEventListener('click', e => e.stopPropagation());
  container.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  container.addEventListener('touchend', e => e.stopPropagation(), { passive: true });

  // Initialize with reliable known duration
  const initDur = getAudioDuration(audio, msg);
  if (initDur > 0) {
    totalEl.textContent = formatTime(initDur);
  }

  // Unified visual progress update function (fills slider left section, top progress bar, timestamps, and waveform)
  const updateAudioProgressVisuals = (current, total) => {
    if (!total || total <= 0) return;
    const ratio = Math.min(1, Math.max(0, current / total));
    const pct = ratio * 100;
    slider.value = pct;
    slider.style.setProperty('--progress', `${pct}%`);
    elapsedEl.textContent = formatTime(current);

    // Update top story progress bar segment
    if (State.currentStoryIndex === slideIndex && State.currentScreen === 'stories') {
      const currentSegFill = $(`#progress-seg-${slideIndex} .progress-segment-fill`);
      if (currentSegFill) {
        currentSegFill.style.transform = `scaleX(${ratio})`;
      }
    }

    // Update waveform played bars
    const bars = $$('.waveform-bar', waveformMeter);
    const playedCount = Math.floor(ratio * bars.length);
    bars.forEach((bar, idx) => {
      if (idx < playedCount) bar.classList.add('played');
      else bar.classList.remove('played');
    });
  };

  audio.addEventListener('loadedmetadata', () => {
    slider.max = '100';
    const dur = getAudioDuration(audio, msg);
    if (dur > 0) {
      totalEl.textContent = formatTime(dur);
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (State.currentStoryIndex !== slideIndex || State.currentScreen !== 'stories') return;
    const dur = getAudioDuration(audio, msg);
    updateAudioProgressVisuals(audio.currentTime, dur);
  });

  audio.addEventListener('ended', () => {
    btnMasterPlay.innerHTML = SVG_ICONS.play;
    vinylDisc.classList.add('paused');
    AudioVisualizer.stop();
    State.audio.isPlaying = false;

    if (State.currentStoryIndex !== slideIndex || State.currentScreen !== 'stories') return;

    const dur = getAudioDuration(audio, msg);
    updateAudioProgressVisuals(dur, dur);

    // Auto-advance to next story smoothly
    setTimeout(() => {
      if (State.currentScreen === 'stories' && State.currentStoryIndex === slideIndex) {
        navigateStory(1);
      }
    }, 1000);
  });

  btnMasterPlay.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudioPlayback(audio, msg, btnMasterPlay, vinylDisc, waveformMeter);
  });

  btnRewind.addEventListener('click', (e) => {
    e.stopPropagation();
    const dur = getAudioDuration(audio, msg);
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    updateAudioProgressVisuals(audio.currentTime, dur);
  });

  btnForward.addEventListener('click', (e) => {
    e.stopPropagation();
    const dur = getAudioDuration(audio, msg);
    if (dur > 0) {
      audio.currentTime = Math.min(dur, audio.currentTime + 10);
      updateAudioProgressVisuals(audio.currentTime, dur);
    }
  });

  slider.addEventListener('input', (e) => {
    e.stopPropagation();
    const dur = getAudioDuration(audio, msg);
    if (dur > 0) {
      const targetTime = (slider.value / 100) * dur;
      audio.currentTime = targetTime;
      updateAudioProgressVisuals(targetTime, dur);
    }
  });

  // Tap anywhere on waveform to seek
  waveformMeter.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = waveformMeter.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const dur = getAudioDuration(audio, msg);
    if (dur > 0) {
      const targetTime = ratio * dur;
      audio.currentTime = targetTime;
      updateAudioProgressVisuals(targetTime, dur);
    }
  });

  container._audio = audio;
  container._msgId = msg.id;
  container._msg = msg;
  container._btnMasterPlay = btnMasterPlay;
  container._vinylDisc = vinylDisc;
  container._waveformMeter = waveformMeter;

  return container;
}

/* ============================================================
   TEXT STORY SLIDE BUILDER (CLEAN EDITORIAL TYPOGRAPHY)
   ============================================================ */
function buildTextStorySlide(msg, slideIndex) {
  const container = document.createElement('div');
  container.className = 'text-story-stage';
  container.id = `text-stage-${msg.id}`;

  const card = document.createElement('div');
  card.className = 'text-story-card';

  // Authentic SVG Quote Icon
  const quoteWrapper = document.createElement('div');
  quoteWrapper.innerHTML = SVG_ICONS.quote;
  card.appendChild(quoteWrapper.firstElementChild);

  // Optional Heading
  if (msg.heading) {
    const headingEl = document.createElement('h3');
    headingEl.className = 'story-message-heading';
    headingEl.textContent = msg.heading;
    card.appendChild(headingEl);
  }

  // Message paragraph(s) container
  const textEl = document.createElement('div');
  textEl.className = 'story-message-text';
  textEl.dataset.fullText = msg.message || '';
  card.appendChild(textEl);

  // Author sign-off footer
  const footer = document.createElement('div');
  footer.className = 'text-story-signature';
  footer.innerHTML = `- <span>${msg.name}</span>`;
  card.appendChild(footer);

  container.appendChild(card);

  // Media attachment rendered directly connected below message card
  if (msg.clip || msg.image) {
    card.classList.add('has-media');
    const mediaCard = buildStoryMediaCard(msg);
    if (mediaCard) container.appendChild(mediaCard);
  }

  return container;
}

function buildStoryMediaCard(msg) {
  const mediaSrc = msg.image || msg.clip;
  if (!mediaSrc) return null;

  const mediaBox = document.createElement('div');
  mediaBox.className = 'story-media-card';
  const altText = msg.imageCaption || msg.clipCaption || msg.clipAlt || `${msg.name}'s image`;
  mediaBox.setAttribute('aria-label', altText);

  const isVideo = mediaSrc.endsWith('.mp4') || mediaSrc.endsWith('.webm');

  if (isVideo) {
    const video = document.createElement('video');
    video.src = mediaSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'metadata';
    video.className = 'story-media-content';
    mediaBox.appendChild(video);
  } else {
    const img = document.createElement('img');
    img.src = mediaSrc;
    img.alt = altText;
    img.className = 'story-media-content';
    img.loading = 'lazy';
    img.decoding = 'async';
    mediaBox.appendChild(img);
  }

  const captionText = msg.caption || msg.imageCaption || msg.clipCaption;
  if (captionText) {
    const capEl = document.createElement('p');
    capEl.className = 'story-media-caption';
    capEl.textContent = captionText;
    mediaBox.appendChild(capEl);
  }

  return mediaBox;
}

function buildStoryClip(msg) {
  const mediaSrc = msg.image || msg.clip;
  if (!mediaSrc) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'story-clip-wrapper';
  const altText = msg.imageCaption || msg.clipCaption || msg.clipAlt || `${msg.name}'s picture`;
  wrapper.setAttribute('aria-label', altText);

  const isVideo = mediaSrc.endsWith('.mp4') || mediaSrc.endsWith('.webm');

  if (isVideo) {
    const video = document.createElement('video');
    video.src = mediaSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'metadata';
    video.className = 'story-clip-media';
    wrapper.appendChild(video);
  } else {
    const img = document.createElement('img');
    img.src = mediaSrc;
    img.alt = altText;
    img.className = 'story-clip-media';
    img.loading = 'lazy';
    img.decoding = 'async';
    wrapper.appendChild(img);
  }

  const captionText = msg.caption || msg.imageCaption || msg.clipCaption;
  if (captionText) {
    const capEl = document.createElement('p');
    capEl.className = 'story-clip-caption';
    capEl.textContent = captionText;
    wrapper.appendChild(capEl);
  }

  return wrapper;
}

/* ============================================================
   BACKGROUND MUSIC CONTROLLER (FOR TEXT STORIES)
   Fades in smoothly on entry, fades out smoothly on departure.
   ============================================================ */
const BGM = {
  currentAudio: null,
  targetVolume: 0.38,
  activeFades: new Set(),

  /**
   * Play background music with smooth fade-in
   * @param {string} src - Audio track file path
   */
  play(src) {
    if (!src) return;

    // If already playing this exact track, ensure it is at target volume
    if (this.currentAudio && this.currentAudio.dataset.src === src && !this.currentAudio.paused) {
      this.fadeIn(this.currentAudio, 800);
      return;
    }

    // Fade out any currently playing background audio
    if (this.currentAudio) {
      this.fadeOutElement(this.currentAudio, 500);
      this.currentAudio = null;
    }

    const audio = new Audio();
    audio.src = src;
    audio.dataset.src = src;
    audio.loop = true;
    audio.volume = 0;
    this.currentAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        if (this.currentAudio === audio) {
          this.fadeIn(audio, 1200);
        } else {
          this.fadeOutElement(audio, 400);
        }
      }).catch(err => {
        console.warn('BGM playback was prevented by browser policy:', err);
      });
    }
  },

  /**
   * Fade in an audio element to target volume
   */
  fadeIn(audio, duration = 1000) {
    if (!audio) return;
    this.clearFade(audio);

    const stepMs = 50;
    const steps = Math.max(1, Math.round(duration / stepMs));
    const volStep = this.targetVolume / steps;

    audio._fadeInterval = setInterval(() => {
      if (audio.paused) {
        this.clearFade(audio);
        return;
      }
      const nextVol = Math.min(this.targetVolume, audio.volume + volStep);
      audio.volume = Math.max(0, Math.min(1, nextVol));
      if (audio.volume >= this.targetVolume - 0.01) {
        audio.volume = this.targetVolume;
        this.clearFade(audio);
      }
    }, stepMs);
  },

  /**
   * Fade out the currently active background music
   */
  fadeOut(duration = 500) {
    if (this.currentAudio) {
      const audioToFade = this.currentAudio;
      this.currentAudio = null;
      this.fadeOutElement(audioToFade, duration);
    }
  },

  /**
   * Fade out an arbitrary audio element and clean up
   */
  fadeOutElement(audio, duration = 500) {
    if (!audio) return;
    this.clearFade(audio);
    this.activeFades.add(audio);

    const stepMs = 50;
    const steps = Math.max(1, Math.round(duration / stepMs));
    const startVol = audio.volume;
    const volStep = startVol / steps;

    audio._fadeInterval = setInterval(() => {
      const nextVol = Math.max(0, audio.volume - volStep);
      audio.volume = Math.max(0, Math.min(1, nextVol));
      if (audio.volume <= 0.01 || audio.paused) {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        this.clearFade(audio);
        this.activeFades.delete(audio);
      }
    }, stepMs);
  },

  /**
   * Clear active fade interval on an audio element
   */
  clearFade(audio) {
    if (audio && audio._fadeInterval) {
      clearInterval(audio._fadeInterval);
      audio._fadeInterval = null;
    }
  },

  /**
   * Pause the currently playing background music
   */
  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.clearFade(this.currentAudio);
      this.currentAudio.pause();
    }
  },

  /**
   * Resume the paused background music
   */
  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().then(() => {
        this.fadeIn(this.currentAudio, 600);
      }).catch(() => {});
    }
  },

  /**
   * Stop all background music and pending fades immediately
   */
  stopImmediate() {
    if (this.currentAudio) {
      this.clearFade(this.currentAudio);
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio.volume = 0;
      this.currentAudio = null;
    }
    this.activeFades.forEach(a => {
      this.clearFade(a);
      try {
        a.pause();
        a.currentTime = 0;
        a.volume = 0;
      } catch (e) {}
    });
    this.activeFades.clear();
  }
};

/* ============================================================
   AUDIO PLAYBACK CONTROLLER
   ============================================================ */
function startAudioPlayback(audio, msg, btnPlay, disc, waveform) {
  if (!audio) return;
  if (typeof BGM !== 'undefined') {
    BGM.stopImmediate();
  }
  if (State.audio.currentId && State.audio.currentId !== msg.id) {
    stopAllAudio();
  }

  // Load src if not ready
  if (!audio.src || audio.src === window.location.href) {
    audio.src = msg.audio;
    audio.load();
  }

  if (audio.ended || (audio.duration && audio.currentTime >= audio.duration)) {
    audio.currentTime = 0;
  }

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      if (btnPlay) btnPlay.innerHTML = SVG_ICONS.pause;
      if (disc) disc.classList.remove('paused');

      State.audio.element = audio;
      State.audio.currentId = msg.id;
      State.audio.isPlaying = true;

      if (waveform) {
        AudioVisualizer.start(waveform, audio, State.currentStoryIndex, msg);
      }
    }).catch(err => {
      console.warn('Playback error or autoplay prevented:', err);
    });
  }
}

function updateStoryPauseUI(isPaused) {
  if (DOM.btnStoryPause) {
    if (isPaused) {
      DOM.btnStoryPause.classList.add('paused');
      DOM.btnStoryPause.innerHTML = SVG_ICONS.play;
      DOM.btnStoryPause.setAttribute('aria-label', 'Resume story');
    } else {
      DOM.btnStoryPause.classList.remove('paused');
      DOM.btnStoryPause.innerHTML = SVG_ICONS.pause;
      DOM.btnStoryPause.setAttribute('aria-label', 'Pause story');
    }
  }

  if (DOM.storyPauseIndicator) {
    if (isPaused) {
      DOM.storyPauseIndicator.classList.add('visible');
    } else {
      DOM.storyPauseIndicator.classList.remove('visible');
    }
  }
}

function toggleCurrentStoryPause() {
  if (State.currentScreen !== 'stories') return;
  const msg = State.messages[State.currentStoryIndex];
  if (!msg) return;

  if (msg.audio) {
    // Audio Voice Note story
    const stage = $(`#audio-stage-${msg.id}`);
    const audio = stage ? stage._audio : State.audio.element;
    const btnPlay = stage ? stage._btnMasterPlay : $(`#btn-play-${msg.id}`);
    const disc = stage ? stage._vinylDisc : $(`#vinyl-disc-${msg.id}`);
    const waveform = stage ? stage._waveformMeter : $(`#waveform-${msg.id}`);

    if (audio) {
      if (!audio.paused) {
        pauseAudioPlayback(audio, btnPlay, disc, waveform);
        updateStoryPauseUI(true);
      } else {
        startAudioPlayback(audio, msg, btnPlay, disc, waveform);
        updateStoryPauseUI(false);
      }
    }
  } else {
    // Written Text Note story
    const curSlide = $(`#story-slide-${msg.id}`);
    const vid = curSlide ? $('video', curSlide) : null;
    if (StoryProgress.isPaused) {
      StoryProgress.resume();
      if (typeof BGM !== 'undefined') BGM.resume();
      if (vid) vid.play().catch(() => {});
      updateStoryPauseUI(false);
    } else {
      StoryProgress.pause();
      if (typeof BGM !== 'undefined') BGM.pause();
      if (vid) vid.pause();
      updateStoryPauseUI(true);
    }
  }
}

function pauseAudioPlayback(audio, btnPlay, disc, waveform) {
  if (!audio) return;
  audio.pause();
  if (btnPlay) btnPlay.innerHTML = SVG_ICONS.play;
  if (disc) disc.classList.add('paused');
  AudioVisualizer.stop();
  State.audio.isPlaying = false;
  updateStoryPauseUI(true);
}

function toggleAudioPlayback(audio, msg, btnPlay, disc, waveform) {
  if (audio.paused) {
    startAudioPlayback(audio, msg, btnPlay, disc, waveform);
  } else {
    pauseAudioPlayback(audio, btnPlay, disc, waveform);
  }
}

function stopAllAudio() {
  if (State.audio.element) {
    State.audio.element.pause();
    State.audio.element = null;
  }

  AudioVisualizer.stop();

  $$('.btn-master-play').forEach(btn => { btn.innerHTML = SVG_ICONS.play; });
  $$('.vinyl-disc').forEach(disc => { disc.classList.add('paused'); });

  State.audio.isPlaying = false;
  State.audio.currentId = null;
  updateStoryPauseUI(false);
}

function preloadNextAudio(index) {
  const next = State.messages[index + 1];
  if (next && next.audio) {
    const stage = $(`#audio-stage-${next.id}`);
    if (stage && stage._audio && !stage._audio.src) {
      stage._audio.src = next.audio;
    }
  }
}

/* ============================================================
   STORY NAVIGATION
   ============================================================ */
function navigateStory(direction) {
  StoryProgress.clear();
  const newIndex = State.currentStoryIndex + direction;

  if (newIndex < 0) {
    if (typeof BGM !== 'undefined') BGM.fadeOut(400);
    stopAllAudio();
    showScreen('opening');
    return;
  }

  if (newIndex >= State.totalStories) {
    if (typeof BGM !== 'undefined') BGM.fadeOut(400);
    stopAllAudio();
    showScreen('botanical');
    return;
  }

  // Fade out current background music when leaving the story
  if (typeof BGM !== 'undefined') BGM.fadeOut(500);
  stopAllAudio();
  showStory(newIndex);
}

function showStory(index) {
  StoryProgress.clear();

  const current = $(`.story-slide.active`);
  if (current) {
    current.classList.remove('active');
    const oldVid = $('video', current);
    if (oldVid) {
      try { oldVid.pause(); } catch (e) {}
    }
  }

  State.currentStoryIndex = index;
  const msg = State.messages[index];
  if (!msg) return;

  // 1. Update Header Information
  const placeholder = DOM.storyAvatarPlaceholder;
  const avatarImg = DOM.storyAvatar;

  const initials = msg.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  placeholder.textContent = initials;
  placeholder.style.background = msg.color || 'var(--clr-coral)';

  if (msg.avatar) {
    avatarImg.src = msg.avatar;
    avatarImg.style.display = 'block';
    placeholder.style.display = 'none';
    avatarImg.onerror = () => {
      avatarImg.style.display = 'none';
      placeholder.style.display = 'flex';
    };
  } else {
    avatarImg.style.display = 'none';
    placeholder.style.display = 'flex';
  }

  DOM.storyFriendName.textContent = msg.name;
  if (index === State.totalStories - 1) {
    DOM.storyCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(State.totalStories).padStart(2, '0')} · Finale →`;
  } else {
    DOM.storyCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(State.totalStories).padStart(2, '0')}`;
  }

  // Update story type tag with SVG
  if (msg.audio) {
    DOM.storyTypeBadge.innerHTML = `${SVG_ICONS.voiceNoteBadge} Voice Note`;
  } else {
    DOM.storyTypeBadge.innerHTML = `${SVG_ICONS.textNoteBadge} Written Note`;
  }

  updateProgressBars(index);

  // 2. Activate Slide
  const slide = $(`#story-slide-${msg.id}`);
  if (slide) {
    slide.classList.add('active');

    // Play active media video if attached
    const activeVid = $('video', slide);
    if (activeVid) {
      activeVid.play().catch(() => {});
    }

    // If Text Story: display message statically, start background music and animate top progress bar
    if (!msg.audio) {
      const textEl = $('.story-message-text', slide);
      if (textEl) {
        textEl.textContent = textEl.dataset.fullText || '';
      }

      // Start text story background music with smooth fade-in
      const musicSrc = msg.music || msg.bgMusic || CONFIG.bgMusicFallback[index % CONFIG.bgMusicFallback.length];
      if (musicSrc && typeof BGM !== 'undefined') {
        BGM.play(musicSrc);
      }

      // Run top progress bar animation for text story
      const duration = getTextStoryDuration(msg);
      StoryProgress.startTextProgress(index, duration);
    }

    // If Audio Story: fade out background music, prime audio element and auto-play
    if (msg.audio) {
      if (typeof BGM !== 'undefined') {
        BGM.fadeOut(300);
      }

      const audioStage = $(`#audio-stage-${msg.id}`);
      if (audioStage && audioStage._audio) {
        const dur = getAudioDuration(audioStage._audio, msg);
        if (dur > 0) {
          const totalEl = $(`#total-${msg.id}`);
          if (totalEl) totalEl.textContent = formatTime(dur);
        }

        if (!audioStage._audio.src || audioStage._audio.src === window.location.href) {
          audioStage._audio.src = msg.audio;
          audioStage._audio.load();
        }
        setTimeout(() => {
          if (State.currentStoryIndex === index && State.currentScreen === 'stories') {
            if (typeof BGM !== 'undefined') {
              BGM.stopImmediate();
            }
            startAudioPlayback(
              audioStage._audio,
              msg,
              audioStage._btnMasterPlay,
              audioStage._vinylDisc,
              audioStage._waveformMeter
            );
          }
        }, 300);
      }
    }
  }

  // Preload next audio
  preloadNextAudio(index);
}

/* ============================================================
   STATIC TEXT REVEAL (FOR TEXT STORIES)
   ============================================================ */
function typewriteText(el, text) {
  if (State.typewriterTimer) {
    clearInterval(State.typewriterTimer);
    State.typewriterTimer = null;
  }
  el.querySelectorAll('.typewriter-cursor').forEach(c => c.remove());
  el.textContent = text || '';
}



/* ============================================================
   INTRO ANIMATION
   ============================================================ */
function animateIntro() {
  const line = DOM.introLine;
  const sub = DOM.introSub;
  if (!line || !sub) return;

  line.style.opacity = '0';
  line.style.transform = 'translateY(20px)';
  sub.style.opacity = '0';
  sub.style.transform = 'translateY(12px)';

  requestAnimationFrame(() => {
    line.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    line.style.opacity = '1';
    line.style.transform = 'translateY(0)';

    setTimeout(() => {
      sub.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      sub.style.opacity = '1';
      sub.style.transform = 'translateY(0)';
    }, 200);
  });
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */
function bindEvents() {
  // Opening button
  DOM.btnOpen.addEventListener('click', () => {
    // Prime audio permissions for mobile browsers upon direct user gesture
    const firstAudio = State.messages[0]?.audio ? $(`#audio-stage-${State.messages[0].id}`)?._audio : null;
    if (firstAudio) {
      firstAudio.muted = true;
      firstAudio.play().then(() => {
        firstAudio.pause();
        firstAudio.currentTime = 0;
        firstAudio.muted = false;
      }).catch(() => {
        firstAudio.muted = false;
      });
    }

    showScreen('intro');
    animateIntro();
    setTimeout(() => {
      showScreen('stories');
      showStory(0);
    }, CONFIG.introDuration);
  });

  // Tap zones
  DOM.zonePrev.addEventListener('click', () => navigateStory(-1));
  DOM.zoneNext.addEventListener('click', () => navigateStory(1));

  // Accessible buttons
  DOM.btnStoryPrev.addEventListener('click', (e) => { e.stopPropagation(); navigateStory(-1); });
  DOM.btnStoryNext.addEventListener('click', (e) => { e.stopPropagation(); navigateStory(1); });

  // Pause button in story header
  DOM.btnStoryPause?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCurrentStoryPause();
  });

  // Tap pause indicator to resume
  DOM.storyPauseIndicator?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCurrentStoryPause();
  });

  // Keyboard navigation & pause
  document.addEventListener('keydown', (e) => {
    if (State.currentScreen === 'stories') {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigateStory(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigateStory(-1);
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        // Spacebar or 'K' toggles pause on the active story
        e.preventDefault();
        toggleCurrentStoryPause();
      }
    } else if (State.currentScreen === 'botanical') {
      if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        handleBackToStories();
      } else if (e.key === 'r' || e.key === 'R') {
        if (document.activeElement !== DOM.tgInputText) {
          handleRegrowGarden();
        }
      }
    }
  });

  // Touch Hold-to-Pause & Swipe Navigation
  let touchHoldTimer = null;
  let isTouchHolding = false;

  DOM.screenStories.addEventListener('touchstart', (e) => {
    State.touch.startX = e.touches[0].clientX;
    State.touch.startY = e.touches[0].clientY;
    isTouchHolding = false;

    // If touching interactive controls (button, slider, audio controls), skip hold-to-pause
    if (e.target.closest('button, input, a, .scrubber-module, .story-pause-btn')) return;

    touchHoldTimer = setTimeout(() => {
      isTouchHolding = true;
      toggleCurrentStoryPause();
    }, 450);
  }, { passive: true });

  DOM.screenStories.addEventListener('touchmove', (e) => {
    const dx = e.touches[0].clientX - State.touch.startX;
    const dy = e.touches[0].clientY - State.touch.startY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (touchHoldTimer) {
        clearTimeout(touchHoldTimer);
        touchHoldTimer = null;
      }
    }
  }, { passive: true });

  DOM.screenStories.addEventListener('touchend', (e) => {
    if (touchHoldTimer) {
      clearTimeout(touchHoldTimer);
      touchHoldTimer = null;
    }

    if (isTouchHolding) {
      // Released after hold: resume story playback
      isTouchHolding = false;
      toggleCurrentStoryPause();
      return;
    }

    const dx = e.changedTouches[0].clientX - State.touch.startX;
    const dy = e.changedTouches[0].clientY - State.touch.startY;
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 40) {
      if (dx < 0) navigateStory(1);
      else navigateStory(-1);
    }
  }, { passive: true });

  // --- Type Garden Botanical Finale Navigation (Replay Capsule & Stories) ---
  const handleReplayCapsule = () => {
    if (typeGardenInstance) typeGardenInstance.stop();
    if (typeof StoryProgress !== 'undefined') StoryProgress.clear();
    if (typeof BGM !== 'undefined') BGM.stopImmediate();
    stopAllAudio();
    if (DOM.bentoConveyor) DOM.bentoConveyor.dataset.loaded = 'false';
    showScreen('opening');
  };
  DOM.btnTgReplay?.addEventListener('click', handleReplayCapsule);

  const handleBackToStories = () => {
    if (typeGardenInstance) typeGardenInstance.stop();
    if (typeof StoryProgress !== 'undefined') StoryProgress.clear();
    if (typeof BGM !== 'undefined') BGM.fadeOut(400);
    stopAllAudio();
    showScreen('stories');
    showStory(State.totalStories - 1);
  };
  DOM.btnTgBack?.addEventListener('click', handleBackToStories);

  // --- Cycle Type Garden Botanical Themes on Text Click ---

  DOM.tgCanvas?.addEventListener('click', cycleBotanicalTheme);
  const stage = $('.tg-full-stage');
  stage?.addEventListener('click', (e) => {
    if (e.target.closest('#btn-tg-replay, #btn-tg-back, .tg-floating-actions')) return;
    cycleBotanicalTheme(e);
  });

  // Hold anywhere on stories screen to pause progress & audio (like Instagram / WhatsApp stories)
  let holdTimer = null;
  let isStoryHeld = false;

  const handleStoryHoldStart = (e) => {
    if (State.currentScreen !== 'stories') return;
    if (e.target.closest('.audio-player-module, .btn-story-prev, .btn-story-next, .story-progress-row, button, input')) return;
    holdTimer = setTimeout(() => {
      isStoryHeld = true;
      StoryProgress.pause();
      if (State.audio.isPlaying && State.audio.element) {
        State.audio.element.pause();
        $$('.vinyl-disc').forEach(d => d.classList.add('paused'));
        $$('.waveform-bar').forEach(b => b.classList.remove('animating'));
      }
    }, 220);
  };

  const handleStoryHoldEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (isStoryHeld) {
      isStoryHeld = false;
      StoryProgress.resume();
      if (State.audio.element && State.audio.isPlaying) {
        State.audio.element.play().catch(() => {});
        $$('.vinyl-disc').forEach(d => d.classList.remove('paused'));
        $$('.waveform-bar').forEach(b => b.classList.add('animating'));
      }
    }
  };

  DOM.screenStories.addEventListener('mousedown', handleStoryHoldStart);
  window.addEventListener('mouseup', handleStoryHoldEnd);
  DOM.screenStories.addEventListener('touchstart', handleStoryHoldStart, { passive: true });
  window.addEventListener('touchend', handleStoryHoldEnd, { passive: true });

  // Page Visibility Change (pause audio when leaving tab)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      StoryProgress.pause();
      stopAllAudio();
      if (typeof BGM !== 'undefined') BGM.stopImmediate();
    } else {
      if (State.currentScreen === 'stories') {
        StoryProgress.resume();
      } else if (State.currentScreen === 'botanical') {
        if (typeof BGM !== 'undefined') {
          BGM.play(CONFIG.finaleMusic || 'assets/music/nastelbom-background-music-617073.mp3');
        }
      }
    }
  });
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Expose global App controls
window.App = {
  showScreen,
  showBotanicalFinale: () => showScreen('botanical'),
  applyBotanicalTheme,
  cycleBotanicalTheme
};

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', init);
