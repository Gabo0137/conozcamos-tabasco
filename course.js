// ===== Conozcamos Tabasco — Course Page =====

document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const showRouteForHash = () => {
        if (window.location.hash === '#mapa') body.classList.remove('welcome-pending');
    };
    showRouteForHash();
    window.addEventListener('hashchange', showRouteForHash);


    // ===== Navbar Scroll Effect =====
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // ===== Nav Link Active State =====
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = ['bienvenida', 'mapa', 'juegos'];

    function updateActiveNav() {
        const scrollY = window.scrollY + 120;
        sections.forEach(id => {
            const section = document.getElementById(id);
            if (!section) return;
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            if (scrollY >= top && scrollY < top + height) {
                navLinks.forEach(l => l.classList.remove('active'));
                if (link) link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);



    // ===== Scroll Reveal for Module Cards =====
    const moduleCards = document.querySelectorAll('.module-card');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    moduleCards.forEach(card => observer.observe(card));

    // ===== Zoom from the welcome screen into the route =====
    let routeTransitionRunning = false;
    async function enterRoute() {
        if (routeTransitionRunning) return;
        const hero = document.querySelector('.hero');
        const route = document.getElementById('mapa');
        if (!route) return;
        const heading = route.querySelector('h2');
        const animations = [];
        routeTransitionRunning = true;
        body.classList.remove('welcome-pending');

        function revealRoute() {
            const top = route.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: Math.max(0, top - navbar.getBoundingClientRect().height), behavior: 'instant' });
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus({ preventScroll: true });
            }
        }

        try {
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduceMotion || !hero || typeof route.animate !== 'function') {
                revealRoute();
                return;
            }
            const exit = hero.animate([
                { transform: 'scale(1)', opacity: 1, transformOrigin: 'center center' },
                { transform: 'scale(1.08)', opacity: 0, transformOrigin: 'center center' }
            ], { duration: 280, easing: 'cubic-bezier(.4,0,1,1)', fill: 'both' });
            animations.push(exit);
            await exit.finished;

            // Cover the scroll jump with the entrance's transparent first frame.
            const entrance = route.animate([
                { transform: 'scale(.94)', opacity: 0, transformOrigin: 'center top' },
                { transform: 'scale(1)', opacity: 1, transformOrigin: 'center top' }
            ], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
            animations.push(entrance);
            // Hold the first frame until the route is positioned below the header.
            entrance.pause();
            revealRoute();
            entrance.play();
            await entrance.finished;
        } catch {
            // Navigation remains usable even if an animation is interrupted.
            animations.forEach(animation => animation.cancel());
            revealRoute();
        } finally {
            animations.forEach(animation => animation.cancel());
            routeTransitionRunning = false;
        }
    }

    // ===== Smooth Scroll for Anchor Links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            if (this.id === 'btnIniciarRecorrido') return;
            const href = this.getAttribute('href');
            const target = href === '#' ? document.body : document.getElementById(href.slice(1));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    const btnExplorar = document.getElementById('btnExplorar');
    const btnIniciarRecorrido = document.getElementById('btnIniciarRecorrido');
    const welcomeAudio = new Audio('Bienvenida.mp3');
    welcomeAudio.preload = 'auto';
    welcomeAudio.loop = false;
    welcomeAudio.load();
    let welcomeStarted = false;

    btnExplorar?.addEventListener('click', async () => {
        if (welcomeStarted) return;
        welcomeStarted = true;
        btnExplorar.hidden = true;

        welcomeAudio.pause();
        welcomeAudio.currentTime = 0;
        const audioStarted = new Promise(resolve => {
            welcomeAudio.addEventListener('playing', resolve, { once: true });
        });
        const audioFinished = new Promise(resolve => {
            welcomeAudio.addEventListener('ended', resolve, { once: true });
            welcomeAudio.addEventListener('error', resolve, { once: true });
        });

        welcomeAudio.play().catch(() => {});
        await audioStarted;
        const animationFinished = typeof window.startAvatarAnimation === 'function'
            ? window.startAvatarAnimation(25000)
            : new Promise(resolve => window.setTimeout(resolve, 25000));
        await Promise.all([audioFinished, animationFinished]);
        btnIniciarRecorrido.hidden = false;
        btnIniciarRecorrido.focus();
    });

    btnIniciarRecorrido?.addEventListener('click', event => {
        event.preventDefault();
        void enterRoute();
    });



    // ===== Module Navigation =====
    function navigateWithSound(url) {
        if (window.playUIEntry) {
            window.playUIEntry();
            setTimeout(() => { window.location.href = url; }, 300);
        } else {
            window.location.href = url;
        }
    }

    const btnJuegos = document.getElementById('btnJuegos');
    if (btnJuegos) btnJuegos.addEventListener('click', () => navigateWithSound('games.html'));

});
