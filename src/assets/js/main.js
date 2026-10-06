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
	if (savedTheme === 'dark') root.classList.add('dark');

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
