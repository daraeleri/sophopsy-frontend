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
/*   - ScrollTrigger pins the whole .expertise section (adds           */
/*     .is-fixed), locking it into a 100vh stage so the background and  */
/*     heading stay perfectly still while you scroll.                   */
/*   - The cards are absolutely stacked inside that stage; a scrubbed   */
/*     timeline lifts each card up over the previous one while the     */
/*     card behind shrinks + tilts (same card feel as before, but the  */
/*     section no longer travels with the scroll).                      */
/* ------------------------------------------------------------------ */

const section = document.querySelector('.expertise');
const cards = gsap.utils.toArray('.stack-card');

// Desktop only: tablet + mobile (and reduced-motion users) just get plain,
// static cards. gsap.matchMedia() tears everything down when the query stops
// matching, so resizing across the breakpoint switches behaviour cleanly.
if (section && cards.length) {
	const mm = gsap.matchMedia();

	mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
		// Lock the section into the fixed stage (see .expertise.is-fixed CSS).
		section.classList.add('is-fixed');

		// GSAP owns the cards' transforms from here on — restate the CSS origin.
		gsap.set(cards, { transformOrigin: '50% 0%' });

		// Every card after the first waits just below the stage (clipped by it).
		gsap.set(cards.slice(1), { yPercent: 105 });

		// First card's content rises as the section scrolls into view.
		const firstInner = cards[0].querySelector('.stack-card-inner');
		if (firstInner) {
			gsap.from(firstInner, {
				y: 60,
				opacity: 0,
				duration: 0.8,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: section,
					start: 'top 85%',
					toggleActions: 'play none none reverse'
				}
			});
		}

		// One viewport of scroll per hand-off to the next card.
		const tl = gsap.timeline({
			defaults: { ease: 'none' },
			scrollTrigger: {
				trigger: section,
				start: 'top top',
				end: () => '+=' + Math.max(cards.length - 1, 1) * window.innerHeight,
				pin: true,
				anticipatePin: 1,
				scrub: true,
				invalidateOnRefresh: true
			}
		});

		cards.forEach((card, i) => {
			const inner = card.querySelector('.stack-card-inner');

			if (i > 0) {
				// This card rises from below the stage as you scroll.
				tl.fromTo(
					card,
					{ yPercent: 105 },
					{ yPercent: 0, duration: 1, immediateRender: false },
					i - 1
				);

				// Its content settles in during the first half of the rise.
				if (inner) {
					tl.fromTo(
						inner,
						{ y: 60, opacity: 0 },
						{ y: 0, opacity: 1, duration: 0.5, immediateRender: false },
						i - 1
					);
				}
			}

			// As the next card slides up and covers this one, push it back.
			if (i < cards.length - 1) {
				tl.fromTo(
					card,
					{ scale: 1, yPercent: 0, rotate: 0 },
					{
						scale: 0.93,
						yPercent: -7,
						rotate: i % 2 === 0 ? -1.6 : 1.6,
						duration: 1,
						immediateRender: false
					},
					i
				);
			}
		});

		// Keep trigger positions accurate once fonts/images settle.
		const refresh = () => ScrollTrigger.refresh();
		window.addEventListener('load', refresh);

		return () => {
			window.removeEventListener('load', refresh);
			section.classList.remove('is-fixed');
		};
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
			lenis.scrollTo(target, { offset: -80 });
		});
	});
}
