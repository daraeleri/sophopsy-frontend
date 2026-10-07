import Lenis from 'https://esm.sh/lenis@1.3.26';
import gsap from 'https://esm.sh/gsap@3.13.0';
import ScrollTrigger from 'https://esm.sh/gsap@3.13.0/ScrollTrigger?deps=gsap@3.13.0';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Lenis smooth scroll                                                 */
/* ------------------------------------------------------------------ */

let lenis = null;

if (!reduceMotion) {
	lenis = new Lenis({
		lerp: 0.1,
		smoothWheel: true,
		syncTouch: false
	});

	lenis.on('scroll', ScrollTrigger.update);

	gsap.ticker.add((time) => {
		lenis.raf(time * 1000);
	});
	gsap.ticker.lagSmoothing(0);
}

/* ------------------------------------------------------------------ */
/* Expertise card stack                                                */
/*   - CSS `position: sticky` handles the "card moves bottom to top"   */
/*     travel and keeps each card pinned.                              */
/*   - GSAP scrubs each card backwards (shrink + tilt + lift) as the   */
/*     next card slides up and covers it.                              */
/* ------------------------------------------------------------------ */

const cards = gsap.utils.toArray('.stack-card');

if (cards.length && !reduceMotion) {
	cards.forEach((card, i) => {
		const next = cards[i + 1];

		// Entrance: card content rises as the card scrolls into view.
		gsap.from(card.querySelector('.stack-card-inner'), {
			y: 60,
			opacity: 0,
			duration: 0.8,
			ease: 'power2.out',
			scrollTrigger: {
				trigger: card,
				start: 'top 90%',
				toggleActions: 'play none none reverse'
			}
		});

		if (!next) return;

		// As the next card travels up over this one, push this card back.
		gsap.to(card, {
			scale: 0.93,
			yPercent: -7,
			rotate: i % 2 === 0 ? -1.6 : 1.6,
			ease: 'none',
			scrollTrigger: {
				trigger: next,
				start: 'top bottom',
				end: 'top top',
				scrub: true
			}
		});
	});

	// Keep trigger positions accurate once fonts/images settle.
	window.addEventListener('load', () => ScrollTrigger.refresh());
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
			lenis.scrollTo(target, { offset: -80 });
		});
	});
}
