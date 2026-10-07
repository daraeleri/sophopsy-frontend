import Lenis from 'https://esm.sh/lenis@1.3.26';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Lenis smooth scroll                                                 */
/* ------------------------------------------------------------------ */

let lenis = null;
let lenisRaf = 0;

if (!reduceMotion) {
lenis = new Lenis({
lerp: 0.1,
smoothWheel: true,
syncTouch: false
});

// Drive Lenis from a plain requestAnimationFrame loop (GSAP removed).
const raf = (time) => {
lenis.raf(time);
lenisRaf = requestAnimationFrame(raf);
};
lenisRaf = requestAnimationFrame(raf);
}

/* ------------------------------------------------------------------ */
/* Expertise — fixed-height, horizontally-railed card reveal           */
/*   - `.expertise` is height:100vh + overflow:hidden, so the page      */
/*     never grows because of this section.                            */
/*   - `.stack` scrolls horizontally (custom scroll, hidden scrollbar). */
/*   - Cards start hidden and are revealed bottom-to-top (sequential    */
/*     rise) once the section scrolls into view.                       */
/* ------------------------------------------------------------------ */

const expertise = document.querySelector('.expertise');
const stack = document.querySelector('.stack');

if (expertise && stack && !reduceMotion) {
/* 1. Rewrite vertical wheel input into horizontal travel so the
      rail behaves like a custom carousel. `data-lenis-prevent` on
      `.stack` keeps Lenis from hijacking the wheel over it. */
stack.addEventListener(
'wheel',
(event) => {
const maxScroll = stack.scrollWidth - stack.clientWidth;
if (maxScroll <= 0) return;

const goingDown = event.deltaY > 0;
const atStart = stack.scrollLeft <= 0;
const atEnd = stack.scrollLeft >= maxScroll - 1;

// Reached the end of the rail: let the wheel fall through.
if ((goingDown && atEnd) || (!goingDown && atStart)) return;

event.preventDefault();
stack.scrollLeft += event.deltaY;
},
{ passive: false }
);

/* 2. Reveal the cards (stagger handled by CSS transitions). */
const reveal = () => {
expertise.classList.add('is-revealed');
if (typeof io !== 'undefined') io.disconnect();
};

let io;

if ('IntersectionObserver' in window) {
io = new IntersectionObserver(
(entries) => {
entries.forEach((entry) => {
if (entry.isIntersecting) reveal();
});
},
{ threshold: 0.3 }
);
io.observe(expertise);
} else {
reveal();
}

/* Fallback: if the section is already on screen by the time the page
   finishes loading (short pages, small viewports). */
window.addEventListener('load', () => {
const rect = expertise.getBoundingClientRect();
if (rect.top < window.innerHeight * 0.7) reveal();
});
}

/* ------------------------------------------------------------------ */
/* Anchor links routed through Lenis                                  */
/* ------------------------------------------------------------------ */

if (lenis) {
document.querySelectorAll('a[href^="#"]').forEach((link) => {
link.addEventListener('click', (event) => {
const hash = link.getAttribute('href');
if (!hash || hash === '#') return;
const target = document.querySelector(hash);
if (!target) return;
event.preventDefault();
lenis.scrollTo(target, { offset: -84 });
});
});
}