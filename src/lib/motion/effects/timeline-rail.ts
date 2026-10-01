import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

/**
 * Experience rail — the timeline's single signature scroll moment.
 *
 * One ScrollTrigger owns a scrubbed progress value that drives everything in
 * lockstep:
 *   1. the gradient rail (--spark -> --trigger) draws over a faint track,
 *   2. a comet head travels down the rail with the drawn tip,
 *   3. each entry's node lights as the head passes: hollow -> lit -> inked,
 *      and the entry's number settles from muted to ink.
 *
 * Only transform / opacity / stroke-dashoffset / filter are touched, so the
 * whole thing stays off the layout path. Under reduced motion this effect is
 * never initialised (home.ts skips the boot); the page then shows a fully
 * drawn rail with no head and every entry fully visible. With no JS the
 * decorative hooks are inert and all content renders in its final state.
 */
export function initTimelineRail(): () => void {
  const wrap = document.querySelector<HTMLElement>('[data-timeline]');
  if (!wrap) return () => {};

  const rail = wrap.querySelector<SVGPathElement>('[data-rail-lit]');
  const head = wrap.querySelector<HTMLElement>('[data-rail-head]');
  if (!rail || !head) return () => {};

  const nodes = gsap.utils.toArray<HTMLElement>('[data-tl-node]', wrap);
  const items = nodes.map((node) => node.closest<HTMLElement>('.tl'));

  const hasDrawSVG = typeof DrawSVGPlugin !== 'undefined';

  const length = hasDrawSVG ? 0 : rail.getTotalLength();

  // --- geometry, re-measured on every ScrollTrigger refresh -----------------
  let railHeight = 0;
  const nodeProgress: number[] = nodes.map(() => 0);

  const measure = () => {
    const wrapTop = wrap.getBoundingClientRect().top;
    railHeight = wrap.offsetHeight;
    if (railHeight <= 0) return;
    nodes.forEach((node, i) => {
      const rect = node.getBoundingClientRect();
      const center = rect.top - wrapTop + rect.height / 2;
      nodeProgress[i] = gsap.utils.clamp(0, 1, center / railHeight);
    });
  };

  // --- initial hidden state -------------------------------------------------
  if (hasDrawSVG) {
    gsap.set(rail, { drawSVG: '0%', opacity: 1 });
  } else {
    gsap.set(rail, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 });
  }
  gsap.set(head, { xPercent: -50, yPercent: -50, y: 0, opacity: 0 });

  measure();

  // --- per-node state, toggled only when it changes -------------------------
  // 0 = upcoming, 1 = passed, 2 = active.
  const nodeState = nodes.map(() => -1);

  const applyNodes = (progress: number) => {
    let active = -1;
    for (let i = 0; i < nodeProgress.length; i += 1) {
      if (progress + 0.003 >= nodeProgress[i]) active = i;
      else break;
    }

    for (let i = 0; i < nodes.length; i += 1) {
      const next = i < active ? 1 : i === active ? 2 : 0;
      if (nodeState[i] === next) continue;
      nodeState[i] = next;

      const item = items[i];
      if (!item) continue;
      item.classList.toggle('is-reached', next > 0);
      item.classList.toggle('is-active', next === 2);
      item.classList.toggle('is-passed', next === 1);
    }
  };

  // --- single source of truth: progress -> every animated value -------------
  const state = { p: 0 };

  const apply = () => {
    const p = state.p;

    if (hasDrawSVG) gsap.set(rail, { drawSVG: `${p * 100}%` });
    else rail.style.strokeDashoffset = String(length * (1 - p));

    gsap.set(head, {
      y: railHeight * p,
      opacity: Math.min(1, p * 40, (1 - p) * 40),
    });

    applyNodes(p);
  };

  const tween = gsap.to(state, {
    p: 1,
    ease: 'none',
    onUpdate: apply,
    scrollTrigger: {
      trigger: wrap,
      start: 'top 80%',
      end: 'bottom 55%',
      scrub: 0.4,
      invalidateOnRefresh: true,
      onRefresh: () => {
        measure();
        apply();
      },
    },
  });

  apply();

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(head, { clearProps: 'all' });
    gsap.set(rail, { clearProps: 'all' });
    items.forEach((item) => item?.classList.remove('is-reached', 'is-active', 'is-passed'));
  };
}
