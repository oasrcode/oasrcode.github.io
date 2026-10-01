import gsap from 'gsap';
import { hasFinePointer, prefersReducedMotion } from '../env';

/**
 * Hero — wandering grid traces ("Pac-Man" maze feel).
 *
 * A few "travellers" walk the hero's hairline grid: they move along the lines
 * (horizontal / vertical), turn at intersections (never reverse), and draw a
 * comet trail — a `--spark -> --trigger` gradient with a glowing head and a
 * fading tail. Same visual language as the Experience timeline rail.
 *
 * The canvas lives *inside* the grid layer, so it shares the grid's cell size
 * and any transform (parallax / cursor tilt) — the travellers sit exactly on
 * the lines at every breakpoint and while the grid drifts.
 *
 * Performance guards (mirrors the old field):
 *  - one requestAnimationFrame loop, cancelled while the hero is offscreen
 *    (IntersectionObserver) or the tab is hidden (visibilitychange);
 *  - backing store capped at DPR 2, sized from the grid's untransformed box;
 *  - travellers and trail ring buffers are preallocated (zero per-frame
 *    allocations); the head glow is a pre-rendered sprite;
 *  - traveller count scales down on narrow viewports.
 *
 * Reduced motion: never initialised (no-op), so the canvas stays transparent and
 * the grid is a plain static hairline. No JS: same — decoration only.
 */

const MAX_TRAVELERS = 30;
const STEP = 7; // px between trail samples (tail granularity)
const CAP = 30; // samples per traveller -> ~200px tail
const TURN_CHANCE = 0.5;
const MIN_SPEED = 38; // px/s — calm, not frantic
const MAX_SPEED = 62;
const PAL = 56; // gradient palette resolution
const HEAD_RADIUS = 8.5; // px, canvas-space
const VISIBLE = 0.58; // share of grid height the mask keeps fully opaque

type Color = [number, number, number];

interface Traveler {
  x: number;
  y: number;
  axis: number; // 0 = horizontal, 1 = vertical
  dir: number; // +1 | -1
  speed: number;
  turns: number;
  baseAlpha: number;
  histX: Float32Array;
  histY: Float32Array;
  histHead: number;
  histCount: number;
  lastX: number;
  lastY: number;
}

function parseColor(raw: string, fallback: Color): Color {
  const hex = raw.trim().replace('#', '');
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const n = Number.parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    const n = Number.parseInt(hex, 16);
    return [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17];
  }
  return fallback;
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

function mix(a: Color, b: Color, t: number): Color {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgb(c: Color, alpha: number): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
}

/** Tail (spark) -> head (trigger) gradient, precomputed once. */
function buildPalette(spark: Color, trigger: Color): string[] {
  const out: string[] = [];
  for (let i = 0; i < PAL; i += 1) out.push(rgb(mix(spark, trigger, i / (PAL - 1)), 1));
  return out;
}

/** Pre-rendered comet head: white core, trigger ring, spark halo. */
function makeHead(trigger: Color, mid: Color): HTMLCanvasElement {
  const r = 32;
  const c = document.createElement('canvas');
  c.width = r * 2;
  c.height = r * 2;
  const g = c.getContext('2d');
  if (!g) return c;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.24, rgb(trigger, 0.98));
  grad.addColorStop(0.52, rgb(mid, 0.5));
  grad.addColorStop(1, rgb(mid, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, r * 2, r * 2);
  return c;
}

export function initHeroTrace(): () => void {
  if (prefersReducedMotion()) return () => {};

  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const grid = hero?.querySelector<HTMLElement>('[data-hero-grid]');
  const canvas = grid?.querySelector<HTMLCanvasElement>('[data-hero-trace]');
  if (!hero || !grid || !canvas) return () => {};

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  // Colours come from the locked tokens (read only).
  const spark = parseColor(cssVar('--spark'), [45, 60, 240]);
  const trigger = parseColor(cssVar('--trigger'), [255, 176, 0]);
  const mid = mix(spark, trigger, 0.5);
  const palette = buildPalette(spark, trigger);
  const glow = rgb(mid, 0.9);
  const headSprite = makeHead(trigger, mid);

  const travelers: Traveler[] = [];
  for (let i = 0; i < MAX_TRAVELERS; i += 1) {
    travelers.push({
      x: 0,
      y: 0,
      axis: 0,
      dir: 1,
      speed: MIN_SPEED,
      turns: 0,
      baseAlpha: 0.85,
      histX: new Float32Array(CAP),
      histY: new Float32Array(CAP),
      histHead: 0,
      histCount: 0,
      lastX: 0,
      lastY: 0,
    });
  }

  let width = 1;
  let height = 1;
  let cell = 88;
  let cols = 0;
  let rows = 0;
  let count = 0;
  let dpr = 1;
  let rafId = 0;
  let running = false;
  let visible = true;
  let last = 0;

  const push = (t: Traveler, x: number, y: number) => {
    t.histHead = (t.histHead + 1) % CAP;
    t.histX[t.histHead] = x;
    t.histY[t.histHead] = y;
    if (t.histCount < CAP) t.histCount += 1;
    t.lastX = x;
    t.lastY = y;
  };

  const seat = (t: Traveler, alpha: number) => {
    t.histHead = 0;
    t.histCount = 0;
    t.turns = 0;
    t.baseAlpha = alpha;
    if (cols < 1 || rows < 1) return;
    t.axis = Math.random() < 0.5 ? 0 : 1;
    t.dir = Math.random() < 0.5 ? -1 : 1;
    t.speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    const i = (Math.random() * (cols + 1)) | 0;
    const j = (Math.random() * (rows + 1)) | 0;
    t.x = i * cell;
    t.y = j * cell;
    push(t, t.x, t.y);
  };

  // Pick a new heading at an intersection: prefer straight, otherwise turn
  // (perpendicular only — reversing is impossible since the axis switches).
  const choose = (t: Traveler) => {
    const i = Math.round(t.x / cell);
    const j = Math.round(t.y / cell);

    const canContinue =
      t.axis === 0 ? (t.dir > 0 ? i < cols : i > 0) : t.dir > 0 ? j < rows : j > 0;

    if (canContinue && Math.random() >= TURN_CHANCE) return;

    let optA: number;
    let optB: number;
    if (t.axis === 0) {
      optA = j < rows ? 1 : 0;
      optB = j > 0 ? -1 : 0;
    } else {
      optA = i < cols ? 1 : 0;
      optB = i > 0 ? -1 : 0;
    }
    const validA = optA !== 0;
    const validB = optB !== 0;
    if (!validA && !validB) return; // fully boxed (degenerate)

    let ndir: number;
    if (validA && validB) ndir = Math.random() < 0.5 ? optA : optB;
    else ndir = validA ? optA : optB;

    t.axis = t.axis === 0 ? 1 : 0;
    t.dir = ndir;
    t.x = i * cell;
    t.y = j * cell;
    t.turns += 1;
  };

  const advance = (t: Traveler, dt: number) => {
    let remaining = t.speed * dt;
    let guard = 0;
    while (remaining > 0 && guard < 64) {
      guard += 1;
      const pos = t.axis === 0 ? t.x : t.y;
      const next =
        t.dir > 0
          ? (Math.floor(pos / cell + 1e-6) + 1) * cell
          : (Math.ceil(pos / cell - 1e-6) - 1) * cell;
      const dist = Math.abs(next - pos);
      if (dist <= remaining) {
        if (t.axis === 0) t.x = next;
        else t.y = next;
        remaining -= dist;
        push(t, t.x, t.y); // sample the exact corner
        choose(t);
      } else {
        if (t.axis === 0) t.x += t.dir * remaining;
        else t.y += t.dir * remaining;
        remaining = 0;
      }
    }
    // Distance-based sampling between corners; corners are always exact.
    const dx = t.x - t.lastX;
    const dy = t.y - t.lastY;
    if (dx * dx + dy * dy >= STEP * STEP) push(t, t.x, t.y);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let ti = 0; ti < count; ti += 1) {
      const t = travelers[ti];
      const n = t.histCount;
      if (n < 2) continue;
      const start = (t.histHead - (n - 1) + CAP) % CAP;

      // Soft under-glow, one pass.
      ctx.globalAlpha = t.baseAlpha * 0.2;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      let idx = start;
      ctx.moveTo(t.histX[idx], t.histY[idx]);
      for (let k = 1; k < n; k += 1) {
        idx = (idx + 1) % CAP;
        ctx.lineTo(t.histX[idx], t.histY[idx]);
      }
      ctx.stroke();

      // Core: gradient stroke (spark at the tail -> trigger at the head) with a
      // fading tail. The soft curve keeps the mid-trail visible so the gradient
      // reads, while the very tail dissolves.
      for (let k = 0; k < n - 1; k += 1) {
        const a = (start + k) % CAP;
        const b = (start + k + 1) % CAP;
        const f = (k + 1) / (n - 1);
        ctx.globalAlpha = t.baseAlpha * f * (0.4 + 0.6 * f);
        ctx.strokeStyle = palette[(f * (PAL - 1)) | 0];
        ctx.lineWidth = 0.7 + f * 1.6;
        ctx.beginPath();
        ctx.moveTo(t.histX[a], t.histY[a]);
        ctx.lineTo(t.histX[b], t.histY[b]);
        ctx.stroke();
      }

      // Glowing head.
      ctx.globalAlpha = t.baseAlpha;
      ctx.drawImage(headSprite, t.x - HEAD_RADIUS, t.y - HEAD_RADIUS, HEAD_RADIUS * 2, HEAD_RADIUS * 2);
    }
    ctx.globalAlpha = 1;
  };

  const readCell = () => {
    const raw = getComputedStyle(grid).backgroundSize;
    const first = Number.parseFloat(raw);
    return Number.isFinite(first) && first > 8 ? first : 80;
  };

  const resize = () => {
    // offsetWidth/Height ignore the parallax + tilt transforms.
    const w = Math.max(1, Math.round(grid.offsetWidth));
    const h = Math.max(1, Math.round(grid.offsetHeight));
    const nextCell = readCell();
    const changed = w !== width || h !== height || nextCell !== cell;

    width = w;
    height = h;
    cell = nextCell;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = Math.floor(width / cell);
    rows = Math.floor((VISIBLE * height) / cell);
    count = cols >= 1 && rows >= 1 ? Math.min(MAX_TRAVELERS, width < 700 ? 4 : 8) : 0;

    if (changed) {
      const alphas = [0.92, 0.66, 0.8, 0.74, 0.6, 0.86, 0.7, 0.9];
      // Re-seat every traveller (not just the active ones) so no stale,
      // off-grid position can survive a breakpoint change.
      for (let i = 0; i < MAX_TRAVELERS; i += 1) seat(travelers[i], alphas[i]);
    }
  };

  // --- pointer: a very subtle plane tilt on the grid (travellers ride along) --
  const fine = hasFinePointer();
  let tiltX: ((v: number) => void) | null = null;
  let tiltY: ((v: number) => void) | null = null;
  if (fine) {
    gsap.set(grid, { transformPerspective: 900 });
    tiltX = gsap.quickTo(grid, 'rotationX', { duration: 0.7, ease: 'power2.out' });
    tiltY = gsap.quickTo(grid, 'rotationY', { duration: 0.7, ease: 'power2.out' });
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!tiltX || !tiltY) return;
    const rect = hero.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    tiltX(-ny * 1.6);
    tiltY(nx * 1.6);
  };

  const onPointerLeave = () => {
    if (!tiltX || !tiltY) return;
    tiltX(0);
    tiltY(0);
  };

  // --- the single rAF loop ---------------------------------------------------
  const step = (now: number) => {
    rafId = requestAnimationFrame(step);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;

    for (let i = 0; i < count; i += 1) advance(travelers[i], dt);
    draw();
  };

  const startLoop = () => {
    if (running) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(step);
  };

  const stopLoop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(rafId);
  };

  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else if (visible) startLoop();
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !document.hidden) startLoop();
      else stopLoop();
    },
    { threshold: 0 },
  );
  io.observe(hero);

  const ro = new ResizeObserver(() => resize());
  ro.observe(grid);

  document.addEventListener('visibilitychange', onVisibility);
  if (fine) {
    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    hero.addEventListener('pointerleave', onPointerLeave);
  }

  resize();
  if (!document.hidden) startLoop();

  return () => {
    stopLoop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    if (fine) {
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
    }
    gsap.killTweensOf(grid);
    ctx.clearRect(0, 0, width, height);
  };
}
