// ===== Raíces de Tabasco — Course Page =====

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
    });

    // Close mobile menu when clicking a link
    navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinksContainer.classList.remove('open');
            mobileToggle.classList.remove('open');
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

    // ===== Smooth Scroll for Anchor Links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
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

    const btnModule1 = document.getElementById('btnModule1');
    if (btnModule1) {
        btnModule1.addEventListener('click', () => {
            navigateWithSound('module1.html');
        });
    }

    const btnModule2 = document.getElementById('btnModule2');
    if (btnModule2) {
        btnModule2.addEventListener('click', () => {
            navigateWithSound('module2.html');
        });
    }

    const btnModule3 = document.getElementById('btnModule3');
    if (btnModule3) {
        btnModule3.addEventListener('click', () => {
            navigateWithSound('module3.html');
        });
    }

    const btnJuegos = document.getElementById('btnJuegos');
    if (btnJuegos) {
        btnJuegos.addEventListener('click', () => {
            navigateWithSound('games.html');
        });
    }

    // ===== Resumen Final / Módulo 4 Logic =====
    const mod1Completed = localStorage.getItem('module1_completed') === 'true';
    const mod2Completed = localStorage.getItem('module2_completed') === 'true';
    const mod3Completed = localStorage.getItem('module3_completed') === 'true';

    if (mod1Completed && mod2Completed && mod3Completed) {
        const module4 = document.getElementById('module4');
        if (module4) {
            module4.style.display = 'block';
            setTimeout(() => {
                module4.classList.add('visible'); // the cards use .visible for animation based on the scroll reveal, let's just make it visible
                module4.style.opacity = '1';
                module4.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    const btnModule4 = document.getElementById('btnModule4');
    if (btnModule4) {
        btnModule4.addEventListener('click', () => {
            navigateWithSound('resumen.html');
        });
    }
});
