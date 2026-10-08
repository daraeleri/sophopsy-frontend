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
				partnersTrack.style.setProperty('--partners-duration', distance / 40 + 's');
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
})();
