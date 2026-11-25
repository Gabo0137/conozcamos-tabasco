document.addEventListener('DOMContentLoaded', () => {
    // ===== DOM Elements =====
    
    // Navigation
    const btnBack = document.getElementById('btnBack');
    const sections = document.querySelectorAll('.content-section');
    const steps = document.querySelectorAll('.step');
    const progressCircle = document.getElementById('progressCircle');
    const progressText = document.getElementById('progressText');
    const stepLines = document.querySelectorAll('.step-line');

    // Continuar Buttons
    const btnContinueToParts = document.getElementById('btnContinueToParts');
    const btnContinueToSimulador = document.getElementById('btnContinueToSimulador');
    const btnContinueToCultura = document.getElementById('btnContinueToCultura');
    const btnContinueToRitmo = document.getElementById('btnContinueToRitmo');

    let currentSection = 0;
    const totalSections = sections.length;

    // ===== Navigation Logic =====
    btnBack.addEventListener('click', () => {
        window.location.href = 'sonidos.html';
    });

    function updateProgress() {
        const progress = Math.min(100, Math.round((currentSection / (totalSections - 1)) * 100));
        progressText.textContent = `${progress}%`;
        
        const offset = 113.1 - (113.1 * progress) / 100;
        progressCircle.style.strokeDashoffset = offset;

        steps.forEach((step, index) => {
            if (index === currentSection) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else if (index < currentSection) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        stepLines.forEach((line, index) => {
            if (index < currentSection) {
                line.classList.add('filled');
            } else {
                line.classList.remove('filled');
            }
        });
    }

    function goToSection(index) {
        if (window.playUINext && currentSection !== index) {
            window.playUINext();
        }
        sections.forEach(sec => sec.classList.remove('active'));
        sections[index].classList.add('active');
        currentSection = index;
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    btnContinueToParts.addEventListener('click', () => goToSection(1));
    btnContinueToSimulador.addEventListener('click', () => goToSection(2));
    btnContinueToCultura.addEventListener('click', () => goToSection(3));
    btnContinueToRitmo.addEventListener('click', () => goToSection(4));

    // ===== Audio System (Web Audio API) =====
    let audioCtx = null;

    function initAudio() {
        if(!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playDrumSound(type) {
        initAudio();
        const now = audioCtx.currentTime;
        
        // Oscillator for the body/tone of the drum
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        
        // Noise buffer for the 'smack' of the drum head
        const bufferSize = audioCtx.sampleRate * 0.5;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = audioCtx.createBiquadFilter();
        const noiseGain = audioCtx.createGain();
        
        noiseFilter.type = 'lowpass';
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);

        if (type === 'grave') {
            // Deep center hit
            osc.type = 'sine';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            
            oscGain.gain.setValueAtTime(1, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            
            noiseFilter.frequency.value = 400;
            noiseGain.gain.setValueAtTime(0.3, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            
        } else if (type === 'medio') {
            // Edge hit
            osc.type = 'sine';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            
            oscGain.gain.setValueAtTime(0.8, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            noiseFilter.frequency.value = 1000;
            noiseGain.gain.setValueAtTime(0.5, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            
        } else if (type === 'ligero') {
            // Soft hit / rim click
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            
            oscGain.gain.setValueAtTime(0.5, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            
            noiseFilter.frequency.value = 3000;
            noiseGain.gain.setValueAtTime(0.2, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        } else if (type === 'aro') {
            // Rim shot / seco
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            oscGain.gain.setValueAtTime(0.4, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            
            noiseFilter.frequency.value = 5000;
            noiseGain.gain.setValueAtTime(0.6, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        }

        osc.start(now);
        noise.start(now);
        osc.stop(now + 0.5);
        noise.stop(now + 0.5);
    }



    // ===== Section 2: Hotspots Logic =====
    const hotspots = document.querySelectorAll('.hotspot');
    const hotspotInfoPanel = document.getElementById('hotspotInfoPanel');
    const hsTitle = document.getElementById('hsTitle');
    const hsDesc = document.getElementById('hsDesc');
    let hotspotsClicked = new Set();

    const hotspotData = {
        'Cuerpo de madera': 'Estructura cilíndrica que da forma al instrumento y amplifica el sonido.',
        'Parche': 'Superficie de piel que vibra al ser golpeada, generando las ondas sonoras.',
        'Cuerdas o amarres': 'Sistema de tensión que mantiene el parche ajustado para la afinación correcta.',
        'Baquetas o manos': 'Herramientas utilizadas por el músico para ejecutar los diferentes ritmos.'
    };

    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            hotspots.forEach(h => h.classList.remove('active'));
            hotspot.classList.add('active');
            
            const infoKey = hotspot.getAttribute('data-info');
            hsTitle.textContent = infoKey;
            hsDesc.textContent = hotspotData[infoKey];
            
            hotspotInfoPanel.classList.add('show');
            
            hotspotsClicked.add(infoKey);
            if(hotspotsClicked.size === 4) {
                btnContinueToSimulador.disabled = false;
            }
        });
    });

    // ===== Section 3: Simulador Básico =====
    const drumZones = document.querySelectorAll('.drum-zone');
    const simFeedback = document.getElementById('simFeedback');
    let zonesClicked = new Set();

    drumZones.forEach(zone => {
        zone.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent selection
            const soundType = zone.getAttribute('data-sound');
            playDrumSound(soundType);
            
            zonesClicked.add(soundType);
            
            // Highlight zone
            zone.style.background = zone.classList.contains('zone-center') ? 'rgba(0,0,0,0.4)' : 
                                    (zone.classList.contains('zone-edge') ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)');
            
            setTimeout(() => {
                zone.style.background = '';
            }, 100);

            if(zonesClicked.size === 3 && btnContinueToCultura.disabled) {
                simFeedback.style.display = 'none';
                btnContinueToCultura.disabled = false;
            }
        });
        
        // Touch support
        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            zone.dispatchEvent(new Event('mousedown'));
        });
    });

    // ===== Section 5: Repite el Ritmo (Simon Says) =====
    const btnPlayPattern = document.getElementById('btnPlayPattern');
    const rhythmPads = document.querySelectorAll('.rhythm-pad');
    const rhythmDotsContainer = document.getElementById('rhythmDots');
    const rhythmStatus = document.getElementById('rhythmStatus');
    const rhythmFeedback = document.getElementById('rhythmFeedback');
    const quizResults = document.getElementById('quizResults');
    const btnFinish = document.getElementById('btnFinish');
    const levelIndicator = document.getElementById('levelIndicator');

    const drumColorMap = {
        'tum': '#1d4ed8', // Dark Blue
        'ta': '#f97316',  // Orange
        'pa': '#16a34a',  // Green
        'ti': '#0ea5e9'   // Light Blue
    };

    // Niveles del juego rítmico
    const levels = [
        { pattern: ['tum', 'ta', 'tum'], speed: 800 },
        { pattern: ['tum', 'tum', 'pa', 'ta'], speed: 700 },
        { pattern: ['ta', 'pa', 'ti', 'tum', 'pa'], speed: 600 },
        { pattern: ['tum', 'ti', 'pa', 'ta', 'tum', 'ti'], speed: 500 }
    ];
    let currentLevel = 0;
    let userSequence = [];
    let isPlayingPattern = false;
    let isUserTurn = false;

    function initLevel() {
        levelIndicator.textContent = `Nivel ${currentLevel + 1} de ${levels.length}`;
        rhythmDotsContainer.innerHTML = '';
        rhythmDotsContainer.style.display = 'none';
        rhythmStatus.textContent = "Haz clic en \"Escuchar\" para conocer el patrón.";
        btnPlayPattern.style.display = 'inline-flex';
        rhythmFeedback.style.display = 'none';
        rhythmPads.forEach(pad => {
            pad.disabled = true;
            pad.classList.remove('playing', 'error');
        });
    }
    
    initLevel();

    btnPlayPattern.addEventListener('click', () => {
        if(isPlayingPattern) return;
        
        isPlayingPattern = true;
        isUserTurn = false;
        userSequence = [];
        
        rhythmStatus.textContent = "Escucha atentamente...";
        rhythmFeedback.style.display = 'none';
        
        rhythmDotsContainer.innerHTML = '';
        rhythmDotsContainer.style.display = 'flex';

        // Disable pads
        rhythmPads.forEach(pad => pad.disabled = true);

        // Play sequence
        let delay = 0;
        const currentPattern = levels[currentLevel].pattern;
        const currentSpeed = levels[currentLevel].speed;
        
        currentPattern.forEach((note, index) => {
            setTimeout(() => {
                const pad = document.querySelector(`.rhythm-pad[data-pad="${note}"]`);
                let sound = 'grave';
                if(note === 'ta') sound = 'medio';
                else if(note === 'pa') sound = 'ligero';
                else if(note === 'ti') sound = 'aro';
                
                playDrumSound(sound);
                
                // Visual pop for pad
                pad.classList.add('playing');
                setTimeout(() => pad.classList.remove('playing'), 200);

                // Add dot to sequence box
                const dot = document.createElement('div');
                dot.className = 'seq-dot playing';
                dot.style.backgroundColor = drumColorMap[note];
                rhythmDotsContainer.appendChild(dot);
                setTimeout(() => dot.classList.remove('playing'), 200);

                if (index === currentPattern.length - 1) {
                    setTimeout(() => {
                        isPlayingPattern = false;
                        isUserTurn = true;
                        rhythmStatus.textContent = "¡Tu turno! Repite el patrón.";
                        rhythmDotsContainer.innerHTML = ''; // Clear for user to play
                        rhythmPads.forEach(p => p.disabled = false);
                    }, 500);
                }
            }, delay);
            delay += currentSpeed;
        });
    });

    rhythmPads.forEach(pad => {
        pad.addEventListener('click', () => {
            if(!isUserTurn) return;

            const note = pad.getAttribute('data-pad');
            let sound = 'grave';
            if(note === 'ta') sound = 'medio';
            else if(note === 'pa') sound = 'ligero';
            else if(note === 'ti') sound = 'aro';
            
            playDrumSound(sound);
            userSequence.push(note);
            
            const currentIndex = userSequence.length - 1;
            const currentPattern = levels[currentLevel].pattern;

            if (currentIndex === 0) {
                rhythmDotsContainer.innerHTML = '';
            }
            
            const dot = document.createElement('div');
            dot.className = 'seq-dot playing';
            dot.style.backgroundColor = drumColorMap[note];
            rhythmDotsContainer.appendChild(dot);
            setTimeout(() => dot.classList.remove('playing'), 200);
            
            // Check if correct so far
            if(userSequence[currentIndex] !== currentPattern[currentIndex]) {
                // Mistake
                if (window.playUIError) window.playUIError();
                isUserTurn = false;
                rhythmPads.forEach(p => p.disabled = true);
                
                dot.classList.add('error');
                
                rhythmFeedback.style.display = 'block';
                rhythmFeedback.className = 'sort-feedback error';
                rhythmFeedback.textContent = "Oops, ese no era el tambor correcto. ¡Reintenta el nivel!";
                
                btnPlayPattern.style.display = 'inline-flex';
                btnPlayPattern.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Reintentar Nivel';
            } else {
                // Check if sequence complete
                if(userSequence.length === currentPattern.length) {
                    if (window.playUISuccess) window.playUISuccess();
                    isUserTurn = false;
                    rhythmPads.forEach(p => p.disabled = true);
                    
                    if(currentLevel < levels.length - 1) {
                        // Nivel superado, avanzar al siguiente
                        rhythmFeedback.style.display = 'block';
                        rhythmFeedback.className = 'sort-feedback success';
                        rhythmFeedback.textContent = `¡Nivel ${currentLevel + 1} superado! Prepárate para el siguiente...`;
                        
                        setTimeout(() => {
                            currentLevel++;
                            initLevel();
                            btnPlayPattern.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Escuchar Ritmo';
                        }, 2000);
                    } else {
                        // Juego terminado (Nivel 4 superado)
                        document.querySelector('#sectionRitmo .section-intro').style.display = 'none';
                        document.querySelector('.rhythm-game-container').style.display = 'none';
                        
                        quizResults.style.display = 'block';
                        quizResults.style.marginTop = '0';
                        fireConfetti();
                    }
                }
            }
        });
    });

    btnFinish.addEventListener('click', () => {
        localStorage.setItem('module3_completed', 'true');
        window.location.href = 'course.html';
    });

    // ===== Confetti Animation =====
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    function fireConfetti() {
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2 + 100,
                r: Math.random() * 6 + 2,
                dx: Math.random() * 10 - 5,
                dy: Math.random() * -10 - 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncrement: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0
            });
        }
        requestAnimationFrame(updateConfetti);
    }

    function updateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            p.tiltAngle += p.tiltAngleIncrement;
            p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2;
            p.x += Math.sin(p.tiltAngle) * 2;
            
            p.dy += 0.05;
            p.x += p.dx;
            p.y += p.dy;

            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.stroke();

            if (p.y < canvas.height) active = true;
        }

        if (active) {
            requestAnimationFrame(updateConfetti);
        } else {
            particles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Initialize
    updateProgress();
});
