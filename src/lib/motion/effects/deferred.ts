/**
 * Home motion — deferred, non-critical effects.
 *
 * Split out of `home.ts` and loaded with a dynamic `import()` from the idle
 * callback so the effects and their plugin (DrawSVGPlugin) never sit on the
 * critical path. `home.ts` boots smooth scroll + the hero eagerly; this module
 * boots everything else.
 *
 * Order is deliberate: content-revealing effects run first so any pre-hidden
 * state gated on `html.js-motion` is settled as early as possible, then the
 * scroll-driven depth, then the pointer-driven cursor (which is pure garnish).
 */
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { yieldToMain } from '../schedule';
import { initTitleWipe } from './title-wipe';
import { initStaggerGrid } from './stagger-grid';
import { initTimelineRail } from './timeline-rail';
import { initStatement } from './statement';
import { initDossier } from './dossier';
import { initGallery } from './gallery';
import { initSeaDepth } from './sea-depth';
import { initMagneticCursor } from './magnetic-cursor';

gsap.registerPlugin(DrawSVGPlugin);

type InitEffect = () => () => void;

const EFFECTS: readonly InitEffect[] = [
  initTitleWipe,
  initStaggerGrid,
  initTimelineRail,
  initStatement,
  initDossier,
  initGallery,
  initSeaDepth,
  initMagneticCursor,
];

/**
 * Initialise the deferred effects one at a time, yielding to the main thread
 * between each so no single task blocks the frame for long.
 *
 * `register` collects each effect's teardown for the owning teardown function.
 * If an effect throws, the whole motion layer is torn down (the `js-motion`
 * class is dropped by the caller) rather than leaving that effect's pre-hidden
 * content stuck invisible — the same guarantee the inline failsafe offers.
 *
 * Returns `true` when the run started (even if the page was disposed mid-way),
 * `false` when the motion layer had to be abandoned because an effect failed.
 */
export async function runDeferredEffects(
  register: (cleanup: () => void) => void,
  isDisposed: () => boolean,
): Promise<boolean> {
  for (const init of EFFECTS) {
    if (isDisposed()) return true;

    try {
      register(init());
    } catch {
      // A failed effect would leave its `html.js-motion` pre-hidden content
      // invisible forever; abandon the layer so the page falls back to its
      // fully-visible static state.
      return false;
    }

    // Break the burst: let the browser paint / run input between effects.
    await yieldToMain();
  }

  return true;
}
