(function () {
	'use strict';

	var root = document.documentElement;

	/* ------------------------------------------------------------------ */
	/* Theme restore (persisted)                                          */
	/* ------------------------------------------------------------------ */

	var savedTheme = null;
	try {
		savedTheme = localStorage.getItem('sophopsy-theme');
	} catch (e) { }
	var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark)) root.classList.add('dark');

	var themeToggle = document.getElementById('theme-toggle');

	function syncThemeLabel() {
		if (!themeToggle) return;
		themeToggle.setAttribute('aria-label', root.classList.contains('dark') ? 'Switch to light mode' : 'Switch to dark mode');
	}
	syncThemeLabel();

	if (themeToggle) {
		themeToggle.addEventListener('click', function () {
			var isDark = root.classList.toggle('dark');
			try { localStorage.setItem('sophopsy-theme', isDark ? 'dark' : 'light'); } catch (e) { }
			syncThemeLabel();
		});
	}

	/* ------------------------------------------------------------------ */
	/* Language switch (visual stub — translations wired later)            */
	/* ------------------------------------------------------------------ */

	var langSwitch = document.querySelector('.lang-switch');

	if (langSwitch) {
		var savedLang = null;
		try { savedLang = localStorage.getItem('sophopsy-lang'); } catch (e) { }

		var setLang = function (lang) {
			Array.prototype.slice.call(langSwitch.querySelectorAll('button[data-lang]')).forEach(function (btn) {
				var active = btn.getAttribute('data-lang') === lang;
				btn.classList.toggle('is-active', active);
				btn.setAttribute('aria-pressed', active ? 'true' : 'false');
			});
			try { localStorage.setItem('sophopsy-lang', lang); } catch (e) { }
		};

		if (savedLang === 'fr' || savedLang === 'en') setLang(savedLang);

		langSwitch.addEventListener('click', function (event) {
			var btn = event.target.closest ? event.target.closest('button[data-lang]') : null;
			if (btn) setLang(btn.getAttribute('data-lang'));
		});
	}

	/* ------------------------------------------------------------------ */
	/* Navbar scroll state                                                 */
	/* ------------------------------------------------------------------ */

	var navShell = document.getElementById('nav-shell');

	function onScroll() {
		if (navShell) {
			navShell.classList.toggle('is-scrolled', window.scrollY > 16);
		}
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	onScroll();

	/* ------------------------------------------------------------------ */
	/* Partner logos — scroll only when the original row overflows          */
	/* ------------------------------------------------------------------ */

	var partnersViewport = document.querySelector('.partners-viewport');
	var partnersRow = document.querySelector('.partners-row');
	var partnersTrack = document.querySelector('.partners-track');

	if (partnersViewport && partnersRow && partnersTrack) {
		var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		var partnersClone = null;
		var partnersFrame = 0;

		function updatePartners() {
			partnersFrame = 0;
			var rowWidth = partnersRow.getBoundingClientRect().width;
			var overflowing = rowWidth > partnersViewport.clientWidth + 1;
			var scrolling = overflowing && !reducedMotion.matches;
			partnersViewport.classList.toggle('is-overflowing', overflowing);
			partnersViewport.classList.toggle('is-scrolling', scrolling);

			if (partnersClone) {
				partnersClone.remove();
				partnersClone = null;
			}

			if (scrolling) {
				var gap = parseFloat(window.getComputedStyle(partnersTrack).columnGap) || 0;
				var distance = rowWidth + gap;
				partnersTrack.style.setProperty('--partners-distance', distance + 'px');
				partnersTrack.style.setProperty('--partners-duration', distance / 80 + 's');
				partnersClone = partnersRow.cloneNode(true);
				partnersClone.setAttribute('aria-hidden', 'true');
				partnersClone.setAttribute('inert', '');
				partnersTrack.appendChild(partnersClone);
				partnersViewport.scrollLeft = 0;
			}
		}

		function schedulePartnersUpdate() {
			if (!partnersFrame) partnersFrame = window.requestAnimationFrame(updatePartners);
		}

		partnersRow.addEventListener('load', schedulePartnersUpdate, true);
		reducedMotion.addEventListener('change', schedulePartnersUpdate);
		window.addEventListener('resize', schedulePartnersUpdate);
		if (window.ResizeObserver) {
			var partnersResizeObserver = new ResizeObserver(schedulePartnersUpdate);
			partnersResizeObserver.observe(partnersViewport);
			partnersResizeObserver.observe(partnersRow);
		}
		if (window.MutationObserver) {
			new MutationObserver(schedulePartnersUpdate).observe(partnersRow, {
				childList: true, subtree: true, attributes: true
			});
		}
		updatePartners();
	}

	/* ------------------------------------------------------------------ */
	/* About tabs — swap the active panel                                  */
	/* ------------------------------------------------------------------ */

	var aboutTablist = document.querySelector('.about-tabs');

	if (aboutTablist) {
		var aboutTabs = Array.prototype.slice.call(aboutTablist.querySelectorAll('.about-tab'));
		var aboutPanels = Array.prototype.slice.call(document.querySelectorAll('.about-panels .about-panel'));

		var activateAboutTab = function (tab) {
			aboutTabs.forEach(function (item) {
				var active = item === tab;
				item.classList.toggle('is-active', active);
				item.setAttribute('aria-selected', active ? 'true' : 'false');
				item.setAttribute('tabindex', active ? '0' : '-1');
			});
			aboutPanels.forEach(function (panel) {
				var active = panel.id === tab.getAttribute('aria-controls');
				panel.classList.toggle('is-active', active);
				if (active) panel.removeAttribute('hidden');
				else panel.setAttribute('hidden', '');
			});
		};

		aboutTablist.addEventListener('click', function (event) {
			var tab = event.target.closest ? event.target.closest('.about-tab') : null;
			if (tab) activateAboutTab(tab);
		});

		aboutTablist.addEventListener('keydown', function (event) {
			var index = aboutTabs.indexOf(document.activeElement);
			if (index === -1) return;

			var next = index;
			if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
				next = (index + 1) % aboutTabs.length;
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
				next = (index - 1 + aboutTabs.length) % aboutTabs.length;
			} else if (event.key === 'Home') {
				next = 0;
			} else if (event.key === 'End') {
				next = aboutTabs.length - 1;
			} else {
				return;
			}

			event.preventDefault();
			aboutTabs[next].focus();
			activateAboutTab(aboutTabs[next]);
		});
	}

	/* ------------------------------------------------------------------ */
	/* Mobile menu                                                         */
	/* ------------------------------------------------------------------ */

	var burger = document.getElementById('nav-burger');
	var mobileMenu = document.getElementById('mobile-menu');

	function setMenu(open) {
		if (!burger || !mobileMenu) return;
		burger.classList.toggle('is-active', open);
		mobileMenu.classList.toggle('is-open', open);
		burger.setAttribute('aria-expanded', open ? 'true' : 'false');
		burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
		document.body.style.overflow = open ? 'hidden' : '';
	}

	if (burger && mobileMenu) {
		burger.addEventListener('click', function () {
			setMenu(!mobileMenu.classList.contains('is-open'));
		});

		Array.prototype.slice.call(mobileMenu.querySelectorAll('a')).forEach(function (link) {
			link.addEventListener('click', function () {
				setMenu(false);
			});
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape') setMenu(false);
		});
	}

	/* ------------------------------------------------------------------ */
	/* Impact — stagger reveal + count-up when the card scrolls into view   */
	/* ------------------------------------------------------------------ */

	var impact = document.querySelector('.impact');

	if (impact && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		var impactItems = Array.prototype.slice.call(impact.querySelectorAll('.impact-item'));
		var counters = Array.prototype.slice.call(impact.querySelectorAll('[data-count]'));

		impactItems.forEach(function (item, i) { item.style.setProperty('--i', i); });
		counters.forEach(function (el) { el.textContent = '0'; });
		impact.classList.add('js-reveal');

		var runCounters = function () {
			var start = null;
			var duration = 1100;
			var tick = function (now) {
				if (start === null) start = now;
				var t = Math.min((now - start) / duration, 1);
				var eased = 1 - Math.pow(1 - t, 3);
				counters.forEach(function (el) {
					el.textContent = String(Math.round(parseInt(el.getAttribute('data-count'), 10) * eased));
				});
				if (t < 1) window.requestAnimationFrame(tick);
			};
			window.requestAnimationFrame(tick);
		};

		var impactObserver = new IntersectionObserver(function (entries) {
			if (!entries[0].isIntersecting) return;
			impactObserver.disconnect();
			impact.classList.add('is-visible');
			runCounters();
		}, { threshold: 0.35 });
		impactObserver.observe(impact.querySelector('.impact-card'));
	}

	/* ------------------------------------------------------------------ */
	/* Our work — looping vertical columns                                 */
	/* ------------------------------------------------------------------ */

	var workCols = document.querySelector('.work-cols');

	if (workCols) {
		var workTracks = Array.prototype.slice.call(workCols.querySelectorAll('.work-track'));

		workTracks.forEach(function (track) {
			var group = track.querySelector('.work-group');
			var clone = group.cloneNode(true);
			clone.setAttribute('aria-hidden', 'true');
			clone.setAttribute('inert', '');
			track.appendChild(clone);
		});

		var updateWork = function () {
			workTracks.forEach(function (track) {
				var h = track.firstElementChild.getBoundingClientRect().height;
				track.style.setProperty('--work-dur', Math.max(h / 28, 12) + 's');
			});
		};

		workCols.classList.add('is-live');
		updateWork();
		window.addEventListener('resize', updateWork);
		window.addEventListener('load', updateWork);
	}

	/* ------------------------------------------------------------------ */
	/* Testimonials — next button ring fills, then the quote advances       */
	/* ------------------------------------------------------------------ */

	var testi = document.querySelector('[data-testimonials]');

	if (testi) {
		var tSlides = Array.prototype.slice.call(testi.querySelectorAll('.testi-slide'));
		var tNext = testi.querySelector('[data-testi-next]');
		var tPrev = testi.querySelector('[data-testi-prev]');
		var tCount = testi.querySelector('[data-testi-count]');
		var tRing = testi.querySelector('.testi-btn--next');
		var tDuration = 6000;
		var tIndex = 0;
		var tElapsed = 0;
		var tLast = 0;
		var tFrame = 0;
		var tHover = false;
		var tVisible = false;
		var tAuto = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

		var pad = function (n) { return (n < 10 ? '0' : '') + n; };

		var showSlide = function (i) {
			tIndex = (i + tSlides.length) % tSlides.length;
			tSlides.forEach(function (s, k) {
				var on = k === tIndex;
				s.classList.toggle('is-active', on);
				s.setAttribute('aria-hidden', on ? 'false' : 'true');
			});
			if (tCount) tCount.textContent = pad(tIndex + 1) + ' / ' + pad(tSlides.length);
			tElapsed = 0;
			tRing.style.setProperty('--testi-progress', '0');
		};

		var tick = function (now) {
			tFrame = 0;
			if (!tAuto || tHover || !tVisible || document.hidden) { tLast = 0; return; }
			if (tLast) tElapsed += now - tLast;
			tLast = now;
			if (tElapsed >= tDuration) {
				showSlide(tIndex + 1);
			} else {
				tRing.style.setProperty('--testi-progress', String((tElapsed / tDuration) * 100));
			}
			tFrame = window.requestAnimationFrame(tick);
		};

		var tRun = function () {
			if (!tFrame && tAuto) { tLast = 0; tFrame = window.requestAnimationFrame(tick); }
		};

		tNext.addEventListener('click', function () { showSlide(tIndex + 1); tRun(); });
		tPrev.addEventListener('click', function () { showSlide(tIndex - 1); tRun(); });
		testi.addEventListener('mouseenter', function () { tHover = true; });
		testi.addEventListener('mouseleave', function () { tHover = false; tRun(); });
		document.addEventListener('visibilitychange', tRun);

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				tVisible = entries[0].isIntersecting;
				tRun();
			}, { threshold: 0.3 }).observe(testi);
		} else {
			tVisible = true;
		}

		showSlide(0);
		tRun();
	}
})();
