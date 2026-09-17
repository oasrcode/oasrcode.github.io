/**
 * main.js — Application entry point.
 * Keeps bootstrapping in one place; feature modules own their own setup.
 */

import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initTheme } from './theme.js';

function init() {
  initTheme();
  initNav();
  initReveal();

  // Current year in the footer, without hard-coding it in the markup.
  const yearSlot = document.querySelector('[data-current-year]');
  if (yearSlot) {
    yearSlot.textContent = String(new Date().getFullYear());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
