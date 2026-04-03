/* ============================================
   TRIAL — Main JavaScript
   GSAP + ScrollTrigger + Lenis (ES Modules)
   ============================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import emailjs from '@emailjs/browser';
import { applyLanguage, translations } from './i18n.js';
import './styles.css';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Global translation trigger hook for dynamic pieces
window.updateDynamicLanguage = null;

// ═══════════════════════════════════════════════
//  SPLASH SCREEN — Vortex Animation Engine
// ═══════════════════════════════════════════════
function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) { initLandingPage(); return; }

    const svg = splash.querySelector('.splash-logo');
    const circles = splash.querySelectorAll('.vortex-c');
    const splashUI = splash.querySelector('.splash-ui');
    const enterBtn = splash.querySelector('.splash-enter');
    const langBtns = splash.querySelectorAll('.lang-btn');
    const glass = splash.querySelector('.splash-glass');

    // Initialize default language translation to 'es'
    applyLanguage('es');

    // ── SVG viewBox center ──
    const svgCX = 35, svgCY = 32.5;

    // ── Each circle's native SVG position ──
    const circleData = [
        { cx: 35, cy: 18 },   // top center
        { cx: 21, cy: 46 },   // bottom-left
        { cx: 49, cy: 46 },   // bottom-right
    ];

    // ── Entry directions (in SVG units from center of viewBox) ──
    //    Top circle → from top-left       (-120, -100)
    //    Bottom-left → from bottom-left   (-120, +100)
    //    Bottom-right → from bottom-right (+120, +100)
    const entryOffsets = [
        { x: -150, y: -130 },  // top-left corner
        { x: -150, y: 130 },   // bottom-left corner
        { x: 150, y: 130 },    // bottom-right corner
    ];

    // ── Create motion trail ghost circles for each circle ──
    const TRAIL_COUNT = 5;
    const trails = [];

    circles.forEach((c, i) => {
        const ghostGroup = [];
        for (let g = 0; g < TRAIL_COUNT; g++) {
            const ghost = c.cloneNode(true);
            ghost.classList.remove('vortex-c');
            ghost.classList.add('vortex-trail');
            ghost.setAttribute('fill', 'none');
            ghost.setAttribute('stroke', '#080808');
            ghost.setAttribute('stroke-width', '0.8');
            ghost.style.opacity = '0';
            // Insert before the real circle so trail is behind
            svg.insertBefore(ghost, c);
            ghostGroup.push({ el: ghost, delay: (g + 1) * 0.04 });
        }
        trails.push(ghostGroup);
    });

    // ── Set initial positions (far from center, at their corners) ──
    circles.forEach((c, i) => {
        gsap.set(c, {
            attr: {
                cx: circleData[i].cx + entryOffsets[i].x,
                cy: circleData[i].cy + entryOffsets[i].y,
            },
            opacity: 0,
        });
    });

    // ── Position history for trails ──
    const posHistory = circles.length ? Array.from({ length: circles.length }, () => []) : [];

    // ── Vortex IN timeline ──
    const tlIn = gsap.timeline({
        delay: 0.4,
        defaults: { force3D: true }
    });

    circles.forEach((c, i) => {
        const startX = circleData[i].cx + entryOffsets[i].x;
        const startY = circleData[i].cy + entryOffsets[i].y;
        const endX = circleData[i].cx;
        const endY = circleData[i].cy;

        const proxy = { t: 0 };

        tlIn.to(proxy, {
            t: 1,
            duration: 2.2,
            ease: 'power2.inOut',
            onStart: () => {
                gsap.to(c, { opacity: 1, duration: 0.4, ease: 'power2.out' });
            },
            onUpdate: () => {
                const t = proxy.t;

                // Curved path: add a perpendicular arc offset
                // This creates the sweeping "vortex" feel
                const arcStrength = 60 * Math.sin(t * Math.PI); // peaks at t=0.5
                const perpX = -(entryOffsets[i].y / 130) * arcStrength;
                const perpY = (entryOffsets[i].x / 150) * arcStrength;

                const curX = startX + (endX - startX) * t + perpX * (1 - t);
                const curY = startY + (endY - startY) * t + perpY * (1 - t);

                c.setAttribute('cx', curX);
                c.setAttribute('cy', curY);

                // Store position for trail
                posHistory[i].push({ x: curX, y: curY, opacity: 1 - t * 0.3 });

                // Update trail ghosts
                trails[i].forEach((ghost, g) => {
                    const histIdx = Math.max(0, posHistory[i].length - 1 - Math.round((g + 1) * 3));
                    const pos = posHistory[i][histIdx];
                    if (pos) {
                        ghost.el.setAttribute('cx', pos.x);
                        ghost.el.setAttribute('cy', pos.y);
                        // Trail fades: farther ghosts are more transparent
                        const trailOpacity = Math.max(0, (0.35 - g * 0.07)) * (1 - Math.pow(t, 3));
                        ghost.el.style.opacity = trailOpacity;
                    }
                });
            },
            onComplete: () => {
                // Set explicitly and remove elastic bounce to fix the stutter "tiron"
                c.setAttribute('cx', endX);
                c.setAttribute('cy', endY);
                // Fade out all trail ghosts
                trails[i].forEach(ghost => {
                    gsap.to(ghost.el, { opacity: 0, duration: 0.5, ease: 'power2.out' });
                });
            }
        }, i * 0.2); // staggered entry
    });

    // ── Show UI after circles settle ──
    gsap.set(splashUI, { y: 20 });
    tlIn.to(splashUI, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
    }, '-=0.3');

    // ── Language Toggle ──
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const lang = btn.dataset.lang;
            const translations = applyLanguage(lang);

            // Re-update the dynamic ENTER button text (in case applyLanguage logic needs it directly overriden in splash)
            enterBtn.textContent = translations ? translations.splashEnter : (lang === 'en' ? 'ENTER' : 'ENTRAR');
        });
    });

    // ── ENTER button — Exit Animation ──
    enterBtn.addEventListener('click', () => {
        enterBtn.style.pointerEvents = 'none';

        const tlOut = gsap.timeline({
            defaults: { force3D: true },
            onComplete: () => {
                splash.remove();
                initLandingPage();
            }
        });

        // Fade out UI first
        tlOut.to(splashUI, {
            opacity: 0,
            y: -15,
            duration: 0.35,
            ease: 'power2.in',
        });

        // Fade out the entire SVG container (Venn diagram and trails)
        tlOut.to(svg, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out',
        }, "-=0.15");

        // Glass fade out
        tlOut.to(glass, {
            opacity: 0,
            duration: 0.7,
            ease: 'power2.inOut',
        }, '-=0.5');
    });
}


// ═══════════════════════════════════════════════
//  LANDING PAGE — All site animations
// ═══════════════════════════════════════════════
function initLandingPage() {

    // Force scroll to top before revealing anything, preventing jump after splash
    window.scrollTo(0, 0);

    // Reveal page content (hidden by inline style to prevent FOUC)
    document.querySelectorAll('.navbar, section, .metrics, .marquee-section, footer').forEach(el => {
        el.style.visibility = 'visible';
    });

    // ─── LENIS SMOOTH SCROLL ───────────────────
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // ─── NAVBAR LOGO DRAW ANIMATION ────────────
    (function initNavLogo() {
        const circles = document.querySelectorAll('.nav-logo svg circle');
        if (!circles.length) return;

        gsap.to(circles, {
            strokeDashoffset: 0,
            duration: 1,
            ease: 'expo.out',
            stagger: 0.25,
        });
    })();

    // ─── HERO ANIMATIONS (GSAP TIMELINE) ───────
    (function initHero() {
        const tl = gsap.timeline({ delay: 0.6 });

        // Eyebrow
        tl.to('.eyebrow', {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
        })

            // Word reveal
            .to('.hero h1 .word-inner', {
                y: 0,
                duration: 0.9,
                ease: 'expo.out',
                stagger: 0.08,
            }, '-=0.3')

            // Hero bottom
            .to('.hero-bottom', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
            }, '-=0.4');
    })();

    // ─── SCROLL REVEAL (GSAP ScrollTrigger) ────
    (function initScrollReveal() {
        const reveals = document.querySelectorAll('.reveal');

        reveals.forEach((el) => {
            // Determine delay from class
            let delay = 0;
            if (el.classList.contains('reveal-delay-1')) delay = 0.1;
            if (el.classList.contains('reveal-delay-2')) delay = 0.2;
            if (el.classList.contains('reveal-delay-3')) delay = 0.3;
            if (el.classList.contains('reveal-delay-4')) delay = 0.4;

            gsap.to(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
                opacity: 1,
                y: 0,
                duration: 0.9,
                delay: delay,
                ease: 'expo.out',
            });
        });
    })();

    // ─── METRICS COUNTER ANIMATION ─────────────
    (function initMetrics() {
        const metricNums = document.querySelectorAll('.metric-num');

        metricNums.forEach((el) => {
            const original = el.textContent.trim();
            const numMatch = original.match(/[\d.]+/);
            if (!numMatch) return;

            const num = parseFloat(numMatch[0]);
            const prefix = original.slice(0, original.indexOf(numMatch[0]));
            const suffix = original.slice(original.indexOf(numMatch[0]) + numMatch[0].length);
            const isInt = Number.isInteger(num);

            // Set initial text to show 0
            el.textContent = prefix + '0' + suffix;

            const proxy = { val: 0 };

            ScrollTrigger.create({
                trigger: el,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    gsap.to(proxy, {
                        val: num,
                        duration: 1.8,
                        ease: 'power2.out',
                        onUpdate: () => {
                            el.textContent = prefix + (isInt ? Math.round(proxy.val) : proxy.val.toFixed(1)) + suffix;
                        },
                    });
                },
            });
        });
    })();

    // ─── PROJECTS ──────────────────────────────
    (function initProjects() {
        const rawProjects = [
            { num: '01', i18nKey: 'proj1', type: 'Web', year: '2026', filter: 'web' },
            { num: '02', i18nKey: 'proj2', type: 'SaaS', year: '2025', filter: 'saas' },
            { num: '03', i18nKey: 'proj3', type: 'IA', year: '2025', filter: 'ia' },
            { num: '04', i18nKey: 'proj4', type: 'Mobile', year: '2025', filter: 'mobile' },
            { num: '05', i18nKey: 'proj5', type: 'Web', year: '2024', filter: 'web' },
            { num: '06', i18nKey: 'proj6', type: 'SaaS', year: '2024', filter: 'saas' },
            { num: '07', i18nKey: 'proj7', type: 'IA', year: '2024', filter: 'ia' },
        ];

        const filters = ['todo', 'web', 'saas', 'ia', 'mobile'];
        const pillsC = document.getElementById('filterPills');
        const listC = document.getElementById('projectsList');
        let currentFilter = 'todo';

        if (!pillsC || !listC) return;

        function renderPills() {
            pillsC.innerHTML = '';
            const activeLang = document.documentElement.lang || 'es';
            const t = translations[activeLang];

            filters.forEach((f) => {
                const b = document.createElement('button');
                b.className = 'filter-pill' + (f === currentFilter ? ' active' : '');
                b.textContent = f === 'todo' ? t.projFilterAll : f.toUpperCase();
                b.dataset.filter = f;
                b.addEventListener('click', () => {
                    document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
                    b.classList.add('active');
                    currentFilter = f;
                    renderProjects(f);
                });
                pillsC.appendChild(b);
            });
        }

        function renderProjects(filter) {
            const activeLang = document.documentElement.lang || 'es';
            const t = translations[activeLang];

            // Map the raw data to localized names
            const mapped = rawProjects.map(p => ({
                ...p,
                name: t[p.i18nKey]
            }));

            const filtered = filter === 'todo' ? mapped : mapped.filter((p) => p.filter === filter);

            // Animate out existing rows
            const existingRows = listC.querySelectorAll('.proj-row');
            if (existingRows.length) {
                gsap.to(existingRows, {
                    opacity: 0,
                    y: -10,
                    duration: 0.2,
                    stagger: 0.03,
                    ease: 'power2.in',
                    onComplete: () => buildRows(filtered),
                });
            } else {
                buildRows(filtered);
            }
        }

        function buildRows(data) {
            listC.innerHTML = '';
            data.forEach((p) => {
                const row = document.createElement('div');
                row.className = 'proj-row';
                row.innerHTML = `
            <span class="proj-num">${p.num}</span>
            <span class="proj-name">${p.name}</span>
            <div class="proj-meta">
              <span class="proj-type">${p.type}</span>
              <span class="proj-year">${p.year}</span>
              <span class="proj-arrow">↗</span>
            </div>`;
                listC.appendChild(row);
            });

            // Animate in using fromTo to avoid FOUC
            const rows = listC.querySelectorAll('.proj-row');
            gsap.fromTo(rows,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'expo.out' }
            );
        }

        // Expose a hook to re-render when language changes
        window.updateDynamicLanguage = () => {
            renderPills();
            renderProjects(currentFilter);
        };

        renderPills();
        renderProjects(currentFilter);
    })();

    // ─── MARQUEE (GSAP-powered infinite scroll) ─
    (function initMarquee() {
        const row1 = ['Next.js', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Firebase', 'Supabase', 'Docker', 'AWS', 'Vercel'];
        const row2 = ['Python', 'FastAPI', 'Tailwind CSS', 'Figma', 'Git', 'REST APIs', 'GraphQL', 'React Native', 'Prisma', 'Redis'];

        function buildMarquee(id, items) {
            const track = document.getElementById(id);
            if (!track) return;
            const str = items.map((i) => `<span class="marquee-item">${i}</span><span class="marquee-item">·</span>`).join('');
            track.innerHTML = str + str;
        }

        buildMarquee('marquee1', row1);
        buildMarquee('marquee2', row2);

        // Need a small delay so the browser has rendered the elements and scrollWidth is accurate
        requestAnimationFrame(() => {
            const track1 = document.getElementById('marquee1');
            const track2 = document.getElementById('marquee2');

            if (track1) {
                const w1 = track1.scrollWidth / 2;
                gsap.to(track1, {
                    x: -w1,
                    duration: 40,
                    ease: 'none',
                    repeat: -1,
                });
            }

            if (track2) {
                const w2 = track2.scrollWidth / 2;
                gsap.fromTo(track2,
                    { x: -w2 },
                    { x: 0, duration: 40, ease: 'none', repeat: -1 }
                );
            }
        });
    })();

    // ─── FAQ ACCORDION ─────────────────────────
    (function initFAQ() {
        document.querySelectorAll('.faq-q').forEach((btn) => {
            btn.addEventListener('click', () => {
                const item = btn.parentElement;
                const wasOpen = item.classList.contains('open');

                // Close all
                document.querySelectorAll('.faq-item.open').forEach((i) => {
                    i.classList.remove('open');
                });

                // Open clicked if it was closed
                if (!wasOpen) {
                    item.classList.add('open');
                }
            });
        });
    })();

    // ─── SERVICE CARDS STAGGERED REVEAL ────────
    (function initServiceReveal() {
        const cards = document.querySelectorAll('.srv');
        if (!cards.length) return;

        // Set initial state explicitly to prevent FOUC
        gsap.set(cards, { opacity: 0, y: 40 });

        gsap.to(cards, {
            scrollTrigger: {
                trigger: '.services-grid',
                start: 'top 80%',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'expo.out',
        });
    })();

    // ─── PROCESS STEPS STAGGERED REVEAL ────────
    (function initProcessReveal() {
        const steps = document.querySelectorAll('.proc-step');
        if (!steps.length) return;

        // Set initial state explicitly to prevent FOUC
        gsap.set(steps, { opacity: 0, y: 40 });

        gsap.to(steps, {
            scrollTrigger: {
                trigger: '.process-grid',
                start: 'top 80%',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'expo.out',
        });
    })();

    // ─── FOUNDERS STAGGERED REVEAL ─────────────
    (function initFounderReveal() {
        const cards = document.querySelectorAll('.founder-card');
        if (!cards.length) return;

        // Set initial state explicitly to prevent FOUC
        gsap.set(cards, { opacity: 0, y: 40 });

        gsap.to(cards, {
            scrollTrigger: {
                trigger: '.founders-grid',
                start: 'top 80%',
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'expo.out',
        });
    })();

    // ─── CTA SECTION REVEAL ───────────────────
    (function initCTAReveal() {
        const cta = document.querySelector('.cta');
        if (!cta) return;

        const children = cta.children;

        // Set initial state explicitly to prevent FOUC
        gsap.set(children, { opacity: 0, y: 30 });

        gsap.to(children, {
            scrollTrigger: {
                trigger: cta,
                start: 'top 75%',
            },
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'expo.out',
        });
    })();

    // ─── SMOOTH ANCHOR LINKS ───────────────────
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                lenis.scrollTo(target, { offset: -60 });
            }
        });
    });

    // ─── EMAILJS TERMINAL FORM ─────────────────
    (function initContactForm() {
        // Initialize EmailJS
        emailjs.init('_LdZpmHXbkEo_2YV4');

        const form = document.getElementById('contactForm');
        const statusEl = document.getElementById('formStatus');
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn ? submitBtn.innerHTML : '';

        if (!form) return;

        // Auto-resize textarea
        const textarea = form.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', function () {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // UI state: sending
            submitBtn.innerHTML = 'esperando_respuesta...';
            submitBtn.style.opacity = '0.7';
            statusEl.textContent = '';
            statusEl.className = 'form-status';

            const templateParams = {
                user_name: document.getElementById('user_name').value,
                user_email: document.getElementById('user_email').value,
                message: document.getElementById('message').value
            };

            emailjs.send('service_j6mp1x9', 'template_efkjfqn', templateParams)
                .then(function () {
                    statusEl.textContent = '> mensaje_enviado_exitosamente';
                    statusEl.className = 'form-status success';
                    form.reset();
                    if (textarea) textarea.style.height = 'auto';
                }, function (error) {
                    statusEl.textContent = '> error: ' + JSON.stringify(error);
                    statusEl.className = 'form-status error';
                }).finally(function () {
                    // Restore button state
                    submitBtn.innerHTML = btnText;
                    submitBtn.style.opacity = '1';

                    // Clear status after 5s
                    setTimeout(() => {
                        statusEl.textContent = '';
                        statusEl.className = 'form-status';
                    }, 5000);
                });
        });
    })();

}

// ── Bootstrap ──────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplash);
} else {
    initSplash();
}
