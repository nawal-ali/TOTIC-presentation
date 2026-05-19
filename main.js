/* ═══════════════════════════════════════════════════
   TOTC LMS — Presentation JavaScript
═══════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── State ─────────────────────────────────────── */
    var current = 0;
    var isAnimating = false;
    var slides, dots, counter, labelEl;

    /* ── Init ──────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function () {
        slides = document.querySelectorAll('.slide');
        labelEl = document.getElementById('slide-label');
        counter = document.getElementById('slide-counter');
        buildDots();
        activateSlide(0, false);
        bindEvents();
    });

    /* ── Build dot navigation ───────────────────────── */
    function buildDots() {
        var dotRow = document.getElementById('dot-row');
        if (!dotRow) return;
        slides.forEach(function (_, i) {
            var d = document.createElement('div');
            d.className = 'dot';
            d.setAttribute('aria-label', 'Slide ' + (i + 1));
            d.addEventListener('click', function () { goTo(i); });
            dotRow.appendChild(d);
        });
        dots = dotRow.querySelectorAll('.dot');
    }

    /* ── Navigate to slide n ───────────────────────── */
    function goTo(n) {
        if (isAnimating || n === current || n < 0 || n >= slides.length) return;
        isAnimating = true;

        var dir = n > current ? 'exit-up' : 'exit-down';
        var prev = current;

        /* exit current */
        slides[prev].classList.remove('active');
        slides[prev].classList.add(dir);

        /* clean up exit class after transition */
        setTimeout(function () {
            slides[prev].classList.remove(dir);
        }, 620);

        current = n;
        activateSlide(current, true);

        setTimeout(function () { isAnimating = false; }, 650);
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    /* ── Activate a slide ───────────────────────────── */
    function activateSlide(n, animate) {
        slides[n].classList.add('active');

        /* reset scroll position */
        var inner = slides[n].querySelector('.slide-inner');
        if (inner) inner.scrollTop = 0;

        /* animate progress bars */
        setTimeout(function () {
            slides[n].querySelectorAll('.prog-bar').forEach(function (bar) {
                var target = bar.dataset.width || bar.style.width;
                bar.style.width = '0%';
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        bar.style.width = target;
                    });
                });
            });
        }, 250);

        /* animate counters */
        setTimeout(function () {
            slides[n].querySelectorAll('[data-count]').forEach(function (el) {
                animateCounter(el);
            });
        }, 300);

        updateHUD(n);
    }

    /* ── HUD (dots, counter, label) ─────────────────── */
    function updateHUD(n) {
        if (dots) {
            dots.forEach(function (d, i) {
                d.classList.toggle('active', i === n);
            });
        }
        if (counter) counter.textContent = (n + 1) + ' / ' + slides.length;
        if (labelEl) {
            var label = slides[n].dataset.label || '';
            labelEl.textContent = label;
        }

        /* prev / next button states */
        var btnPrev = document.getElementById('btn-prev');
        var btnNext = document.getElementById('btn-next');
        if (btnPrev) btnPrev.disabled = n === 0;
        if (btnNext) btnNext.disabled = n === slides.length - 1;
    }

    /* ── Counter animation ──────────────────────────── */
    function animateCounter(el) {
        var target = parseFloat(el.dataset.count) || 0;
        var suffix = el.dataset.suffix || '';
        var prefix = el.dataset.prefix || '';
        var dur = 900;
        var start = performance.now();

        function step(now) {
            var p = Math.min((now - start) / dur, 1);
            var val = Math.floor(p * target);
            el.textContent = prefix + val + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = prefix + target + suffix;
        }
        requestAnimationFrame(step);
    }

    /* ── Event bindings ─────────────────────────────── */
    function bindEvents() {

        /* keyboard */
        document.addEventListener('keydown', function (e) {
            switch (e.key) {
                case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
                    e.preventDefault(); next(); break;
                case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
                    e.preventDefault(); prev(); break;
                case 'Home': goTo(0); break;
                case 'End': goTo(slides.length - 1); break;
            }
        });

        /* nav buttons */
        var btnPrev = document.getElementById('btn-prev');
        var btnNext = document.getElementById('btn-next');
        if (btnPrev) btnPrev.addEventListener('click', prev);
        if (btnNext) btnNext.addEventListener('click', next);

        /* touch / swipe */
        var tx = 0, ty = 0;
        document.addEventListener('touchstart', function (e) {
            tx = e.touches[0].clientX;
            ty = e.touches[0].clientY;
        }, { passive: true });
        document.addEventListener('touchend', function (e) {
            var dx = tx - e.changedTouches[0].clientX;
            var dy = ty - e.changedTouches[0].clientY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
                if (dx > 0) next(); else prev();
            }
        }, { passive: true });

        /* scroll wheel on slide body (not inner) — navigate slides */
        var wheelTimer = null;
        document.addEventListener('wheel', function (e) {
            var inner = slides[current] && slides[current].querySelector('.slide-inner');
            if (inner && inner.contains(e.target)) {
                /* let the inner scroll normally — only switch slide if at edge */
                var atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 4;
                var atTop = inner.scrollTop <= 0;
                if ((e.deltaY > 0 && atBottom) || (e.deltaY < 0 && atTop)) {
                    clearTimeout(wheelTimer);
                    wheelTimer = setTimeout(function () {
                        if (e.deltaY > 0) next(); else prev();
                    }, 120);
                }
                return;
            }
            clearTimeout(wheelTimer);
            wheelTimer = setTimeout(function () {
                if (e.deltaY > 0) next(); else prev();
            }, 100);
        }, { passive: true });
    }

    /* expose to global for onclick="" */
    window.presGoTo = goTo;
    window.presNext = next;
    window.presPrev = prev;

})();