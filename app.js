// ===== Raíces de Tabasco — Splash App =====
document.addEventListener('DOMContentLoaded', () => {
    // Generate particles
    createParticles();

    function createParticles() {
        const container = document.getElementById('particles');
        const count = 25;
        const colors = [
            'rgba(212, 166, 58, 0.15)',
            'rgba(46, 204, 113, 0.1)',
            'rgba(237, 208, 120, 0.1)',
            'rgba(176, 133, 32, 0.12)',
        ];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            const size = Math.random() * 6 + 2;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 20;
            const left = Math.random() * 100;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;

            container.appendChild(particle);
        }
    }

    // Play splash screen animation and redirect to course after 5 seconds
    setTimeout(() => {
        if (window.playUIEntry) window.playUIEntry();
        window.location.href = 'course.html';
    }, 5000);
});
