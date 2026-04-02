/* ============================================
   TRIAL — Main JavaScript
   GSAP + ScrollTrigger + Lenis (ES Modules)
   ============================================ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import emailjs from '@emailjs/browser';
import './styles.css';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// ─── WAIT FOR DOM ──────────────────────────
function init() {

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
        const projects = [
            { num: '01', name: 'Plataforma E-Commerce', type: 'Web', year: '2026', filter: 'web' },
            { num: '02', name: 'Dashboard Analítico SaaS', type: 'SaaS', year: '2025', filter: 'saas' },
            { num: '03', name: 'Asistente IA Conversacional', type: 'IA', year: '2025', filter: 'ia' },
            { num: '04', name: 'App de Gestión Financiera', type: 'Mobile', year: '2025', filter: 'mobile' },
            { num: '05', name: 'Portal Inmobiliario', type: 'Web', year: '2024', filter: 'web' },
            { num: '06', name: 'Sistema de Inventario Cloud', type: 'SaaS', year: '2024', filter: 'saas' },
            { num: '07', name: 'Automatización de Reportes IA', type: 'IA', year: '2024', filter: 'ia' },
        ];

        const filters = ['todo', 'web', 'saas', 'ia', 'mobile'];
        const pillsC = document.getElementById('filterPills');
        const listC = document.getElementById('projectsList');

        if (!pillsC || !listC) return;

        // Build filter pills
        filters.forEach((f) => {
            const b = document.createElement('button');
            b.className = 'filter-pill' + (f === 'todo' ? ' active' : '');
            b.textContent = f === 'todo' ? 'Todo' : f.toUpperCase();
            b.dataset.filter = f;
            b.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
                b.classList.add('active');
                renderProjects(f);
            });
            pillsC.appendChild(b);
        });

        function renderProjects(filter) {
            const filtered = filter === 'todo' ? projects : projects.filter((p) => p.filter === filter);

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

        renderProjects('todo');
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

// Run init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
