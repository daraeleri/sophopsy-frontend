/* ------------------------------------------------------------------ */
/* CTA background — particles that gather into the map of Côte d'Ivoire, */
/* scatter, gather into "SOPHOPSY", scatter again, and loop.            */
/* ------------------------------------------------------------------ */

(function () {
	'use strict';

	var canvas = document.querySelector('[data-cta-particles]');
	if (!canvas || !canvas.getContext) return;

	var ctx = canvas.getContext('2d');
	var host = canvas.parentElement;
	var MAP_URL = canvas.getAttribute('data-map-src');
	var COLORS = ['#00C9A7', '#00C9A7', '#F5A623', '#7B61FF', '#F6F5EF'];
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Timeline (ms): gather into a shape, hold it, then scatter before the next one.
	var FORM = 2200;
	var HOLD = 2600;
	var SCATTER = 1800;

	var mapPaths = [];
	var shapes = [];      // [mapPoints, textPoints], each an array of {x, y}
	var particles = [];
	var width = 0;
	var height = 0;
	var dpr = 1;
	var running = false;
	var visible = false;
	var startTime = 0;
	var lastCycle = -1;
	var rafId = 0;

	function particleCount() {
		var area = width * height;
		return Math.round(Math.min(2200, Math.max(700, area / 260)));
	}

	/* Rasterise a draw function onto an offscreen canvas and collect lit pixels. */
	function samplePoints(draw, w, h, count) {
		var off = document.createElement('canvas');
		off.width = Math.max(1, Math.round(w));
		off.height = Math.max(1, Math.round(h));
		var octx = off.getContext('2d');
		octx.fillStyle = '#fff';
		draw(octx, off.width, off.height);

		var data = octx.getImageData(0, 0, off.width, off.height).data;
		var step = Math.max(2, Math.round(Math.sqrt((off.width * off.height) / (count * 3))));
		var pts = [];
		for (var y = 0; y < off.height; y += step) {
			for (var x = 0; x < off.width; x += step) {
				if (data[(y * off.width + x) * 4 + 3] > 128) pts.push({ x: x, y: y });
			}
		}

		// Shuffle, then trim or repeat so every shape has exactly `count` points.
		for (var i = pts.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var t = pts[i]; pts[i] = pts[j]; pts[j] = t;
		}
		var out = [];
		for (var k = 0; k < count && pts.length; k++) out.push(pts[k % pts.length]);
		return out;
	}

	function offset(points, ox, oy) {
		return points.map(function (p) {
			return { x: p.x + ox + (Math.random() - 0.5) * 1.5, y: p.y + oy + (Math.random() - 0.5) * 1.5 };
		});
	}

	function buildMapPoints(count) {
		// Source SVG viewBox: 799.06 × 842.07.
		var boxH = height * 0.78;
		var boxW = width * 0.86;
		var scale = Math.min(boxW / 799.06, boxH / 842.07);
		var w = 799.06 * scale;
		var h = 842.07 * scale;
		var pts = samplePoints(function (c) {
			c.scale(scale, scale);
			mapPaths.forEach(function (p) { c.fill(p); });
		}, w, h, count);
		return offset(pts, (width - w) / 2, (height - h) / 2);
	}

	function buildTextPoints(count) {
		var text = 'SOPHOPSY';
		var font = '800 100px Manrope, sans-serif';
		var probe = document.createElement('canvas').getContext('2d');
		probe.font = font;
		var size = Math.min((width * 0.88) / probe.measureText(text).width * 100, height * 0.42);
		var w = width;
		var h = size * 1.3;
		var pts = samplePoints(function (c, cw, ch) {
			c.font = '800 ' + size + 'px Manrope, sans-serif';
			c.textAlign = 'center';
			c.textBaseline = 'middle';
			c.fillText(text, cw / 2, ch / 2);
		}, w, h, count);
		return offset(pts, 0, (height - h) / 2);
	}

	function randomPoint() {
		return { x: Math.random() * width, y: Math.random() * height };
	}

	function resize() {
		var rect = host.getBoundingClientRect();
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = rect.width;
		height = rect.height;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		var count = particleCount();
		shapes = [buildMapPoints(count), buildTextPoints(count)];

		particles = [];
		for (var i = 0; i < count; i++) {
			var start = randomPoint();
			particles.push({
				x: start.x,
				y: start.y,
				scatter: randomPoint(),
				r: 1.1 + Math.random() * 1.3,
				color: COLORS[i % COLORS.length],
				phase: Math.random() * Math.PI * 2,
				delay: Math.random() * 0.35
			});
		}
		startTime = performance.now();
		lastCycle = -1;
	}

	function easeInOut(t) {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function draw(now) {
		var cycle = FORM + HOLD + SCATTER;
		var elapsed = now - startTime;
		var shapeIndex = Math.floor(elapsed / cycle) % shapes.length;
		var t = elapsed % cycle;
		var targets = shapes[shapeIndex];
		var cycleIndex = Math.floor(elapsed / cycle);

		// New cycle: gather from wherever each particle is now, and pick a fresh scatter point.
		if (cycleIndex !== lastCycle) {
			lastCycle = cycleIndex;
			particles.forEach(function (p) {
				p.from = { x: p.x, y: p.y };
				p.scatter = randomPoint();
			});
		}

		ctx.clearRect(0, 0, width, height);

		for (var i = 0; i < particles.length; i++) {
			var p = particles[i];
			var home = targets[i];
			var a, b, k;

			if (t < FORM) {
				// Gather: from the scattered cloud into the shape.
				a = p.from;
				b = home;
				k = Math.min(1, Math.max(0, (t / FORM - p.delay) / (1 - p.delay)));
			} else if (t < FORM + HOLD) {
				a = b = home;
				k = 1;
			} else {
				// Scatter: burst back out into the cloud.
				a = home;
				b = p.scatter;
				k = Math.min(1, Math.max(0, ((t - FORM - HOLD) / SCATTER - p.delay * 0.5) / (1 - p.delay * 0.5)));
			}

			var e = easeInOut(k);
			// "Dance": a small orbit around the target, wider while in flight.
			var settled = t >= FORM && t < FORM + HOLD;
			var wobble = settled ? 1.6 : 6 * Math.sin(Math.PI * e) + 1.2;
			var ang = now * 0.0016 + p.phase;
			p.x = a.x + (b.x - a.x) * e + Math.cos(ang) * wobble;
			p.y = a.y + (b.y - a.y) * e + Math.sin(ang * 1.3) * wobble;

			ctx.globalAlpha = 0.75 + 0.22 * Math.sin(ang * 0.7);
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function loop(now) {
		draw(now);
		rafId = requestAnimationFrame(loop);
	}

	function play() {
		if (running || !visible || reduceMotion) return;
		running = true;
		rafId = requestAnimationFrame(loop);
	}

	function pause() {
		running = false;
		cancelAnimationFrame(rafId);
	}

	/* Reduced motion: show the formed map once, no animation. */
	function drawStatic() {
		ctx.clearRect(0, 0, width, height);
		shapes[0].forEach(function (pt, i) {
			ctx.globalAlpha = 0.8;
			ctx.fillStyle = COLORS[i % COLORS.length];
			ctx.beginPath();
			ctx.arc(pt.x, pt.y, particles[i].r, 0, Math.PI * 2);
			ctx.fill();
		});
	}

	function init() {
		resize();
		if (reduceMotion) { drawStatic(); return; }

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
				if (visible) play(); else pause();
			}).observe(host);
		} else {
			visible = true;
			play();
		}

		document.addEventListener('visibilitychange', function () {
			if (document.hidden) pause(); else play();
		});

		var resizeTimer;
		window.addEventListener('resize', function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function () {
				if (Math.abs(host.getBoundingClientRect().width - width) < 1) return;
				resize();
				if (reduceMotion) drawStatic();
			}, 200);
		});
	}

	fetch(MAP_URL)
		.then(function (res) { return res.text(); })
		.then(function (svgText) {
			var doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
			mapPaths = Array.prototype.map.call(doc.querySelectorAll('path'), function (el) {
				return new Path2D(el.getAttribute('d'));
			});
			// Wait for Manrope so "SOPHOPSY" is sampled from the real typeface.
			var fontsReady = document.fonts && document.fonts.load
				? document.fonts.load('800 100px Manrope').catch(function () { })
				: Promise.resolve();
			return fontsReady;
		})
		.then(init)
		.catch(function () { /* Particles are decorative; fail quietly. */ });
})();
