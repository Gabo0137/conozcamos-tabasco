// ===== Conozcamos Tabasco — Course Page =====

document.addEventListener('DOMContentLoaded', () => {


    // ===== Navbar Scroll Effect =====
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // ===== Nav Link Active State =====
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = ['bienvenida', 'modulos'];

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



    // ===== Mobile Menu Toggle =====
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinksContainer = document.getElementById('navLinks');

    mobileToggle.addEventListener('click', () => {
        navLinksContainer.classList.toggle('open');
        mobileToggle.classList.toggle('open');
        mobileToggle.setAttribute('aria-expanded', String(navLinksContainer.classList.contains('open')));
    });

    // Close mobile menu when clicking a link
    navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('open');
            mobileToggle.classList.remove('open');
            mobileToggle.setAttribute('aria-expanded', 'false');
        });
    });

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
            if (this.id === 'btnExplorar') {
                void enterRoute();
                return;
            }
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

    // ===== Video de Bienvenida Modal =====
    const btnVerVideoBienvenida = document.getElementById('btnVerVideoBienvenida');
    const videoModalOverlay = document.getElementById('videoModalOverlay');
    const videoModalContent = document.getElementById('videoModalContent');
    const modalVideoPlayer = document.getElementById('modalVideoPlayer');
    const videoEndOverlay = document.getElementById('videoEndOverlay');
    const btnFinalizarVideo = document.getElementById('btnFinalizarVideo');

    if (btnVerVideoBienvenida && videoModalOverlay && modalVideoPlayer) {
        // Asegurarnos de que no esté en bucle
        modalVideoPlayer.loop = false;

        btnVerVideoBienvenida.addEventListener('click', (e) => {
            e.preventDefault();
            // Reset video and overlay state
            videoEndOverlay.style.display = 'none';
            modalVideoPlayer.currentTime = 0;
            
            // Show modal
            videoModalOverlay.style.display = 'flex';
            
            // Trigger animation
            setTimeout(() => {
                videoModalOverlay.style.opacity = '1';
                videoModalContent.style.transform = 'scale(1)';
            }, 10);

            document.getElementById('closeWelcomeVideo').focus();
            // Play after the visitor explicitly opens the video
            modalVideoPlayer.play().catch(err => console.log('Autoplay prevent by browser', err));
        });

        document.getElementById('closeWelcomeVideo').addEventListener('click', closeVideoModal);
        videoModalOverlay.addEventListener('click', (event) => { if (event.target === videoModalOverlay) closeVideoModal(); });
        document.addEventListener('keydown', (event) => {
            if (videoModalOverlay.style.display !== 'flex') return;
            if (event.key === 'Escape') closeVideoModal();
            if (event.key === 'Tab') {
                const focusable = [document.getElementById('closeWelcomeVideo'), modalVideoPlayer];
                if (videoEndOverlay.style.display === 'flex') focusable.push(btnFinalizarVideo);
                const first = focusable[0], last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });
        // When video ends, show "Finalizar" button
        modalVideoPlayer.addEventListener('ended', () => {
            videoEndOverlay.style.display = 'flex';
        });

        // "Finalizar" button logic
        btnFinalizarVideo.addEventListener('click', () => {
            closeVideoModal();
        });

        // Function to close the modal
        function closeVideoModal() {
            modalVideoPlayer.pause();
            btnVerVideoBienvenida.focus();
            
            // Animate out
            videoModalOverlay.style.opacity = '0';
            videoModalContent.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                videoModalOverlay.style.display = 'none'; 
            }, 300);
        }
    }
});
