/**
 * Main-thread scheduling helpers for the Home motion system.
 *
 * The motion layer is split into a small critical path (smooth scroll + hero)
 * and a set of non-critical effects. This module provides the primitives the
 * two halves use to stay off each other's critical path:
 *
 *  - `yieldToMain()` breaks a burst of work so no single task blocks the frame
 *    for long (the browser can paint, run input and run other tasks between
 *    effect initialisations).
 *  - `whenIdle()` runs a callback when the browser is next idle, with a hard
 *    timeout so deferred work can never be starved indefinitely.
 */

/** Minimal shape of the (still emerging) `scheduler.yield()` API. */
interface SchedulerLike {
  yield?: () => Promise<void>;
}

/**
 * Yield control back to the main thread, returning a promise that resolves on
 * the next task. Prefers `scheduler.yield()` when available (it preserves task
 * priority); otherwise falls back to a macrotask, which is enough to let the
 * browser paint and process input between chunks of work.
 */
export function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as unknown as { scheduler?: SchedulerLike }).scheduler;
  if (scheduler && typeof scheduler.yield === 'function') {
    return scheduler.yield();
  }
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

interface IdleWindow {
  requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
}

/**
 * Run `cb` in the browser's next idle period, or after `timeout` ms at the
 * latest. Browsers without `requestIdleCallback` (Safari) fall back to a short
 * timeout. The timeout guarantees deferred reveals always happen even when the
 * main thread stays busy.
 */
export function whenIdle(cb: () => void, timeout = 2000): void {
  const w = window as unknown as IdleWindow;
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(cb, { timeout });
    return;
  }
  window.setTimeout(cb, 200);
}
