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
    const btnContinueToProcess = document.getElementById('btnContinueToProcess');
    const btnContinueToAudio = document.getElementById('btnContinueToAudio');
    const btnContinueToActivity = document.getElementById('btnContinueToActivity');

    // Section 2: Hotspots
    const hotspots = document.querySelectorAll('.hotspot');
    const hotspotInfoPanel = document.getElementById('hotspotInfoPanel');
    const hsTitle = document.getElementById('hsTitle');
    const hsDesc = document.getElementById('hsDesc');
    let hotspotsClicked = new Set();

    const hotspotData = {
        'Carrizo': 'Material natural (caña) con el que se elabora el cuerpo principal de la flauta.',
        'Boquilla': 'Parte superior donde el músico sopla para producir la vibración y el sonido.',
        'Orificio': 'Perforaciones que el músico tapa y destapa con los dedos para cambiar las notas musicales.',
        'Cuerpo': 'La estructura hueca por donde viaja el aire, amplificando el sonido del instrumento.'
    };

    // Section 3: Process Carousel
    const processCards = document.querySelectorAll('.process-card');
    const btnProcPrev = document.getElementById('btnProcPrev');
    const btnProcNext = document.getElementById('btnProcNext');
    const carouselDots = document.querySelectorAll('.dot');
    let currentProcessStep = 0;

    // Section 4: Audio
    const btnPlayFlute = document.getElementById('btnPlayFlute');
    const playIcon = btnPlayFlute.querySelector('.play-icon');
    const pauseIcon = btnPlayFlute.querySelector('.pause-icon');
    const audioWave = document.getElementById('audioWave');
    const audioStatus = document.getElementById('audioStatus');
    const audioQuestionCard = document.getElementById('audioQuestionCard');
    const audioOpts = document.querySelectorAll('.audio-opt');
    const audioFeedback = document.getElementById('audioFeedback');
    
    let audioCtx = null;
    let oscillator = null;
    let isPlaying = false;

    // Section 5: Drag & Drop Sorting
    const sortItems = document.querySelectorAll('.sort-item');
    const sortTargetZones = document.querySelectorAll('.sort-target-zone');
    const sortSource = document.getElementById('sortSource');
    const btnCheckSort = document.getElementById('btnCheckSort');
    const sortFeedback = document.getElementById('sortFeedback');
    const quizResults = document.getElementById('quizResults');
    const btnFinish = document.getElementById('btnFinish');

    let currentSection = 0;
    const totalSections = sections.length;

    // ===== Navigation Logic =====
    btnBack.addEventListener('click', () => {
        window.location.href = 'course.html';
    });

    function updateProgress() {
        // Calculate progress (0 to 100%)
        const progress = Math.min(100, Math.round((currentSection / (totalSections - 1)) * 100));
        progressText.textContent = `${progress}%`;
        
        // Circumference of the circle is 113.1
        const offset = 113.1 - (113.1 * progress) / 100;
        progressCircle.style.strokeDashoffset = offset;

        // Update step indicators
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

        // Update step lines
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
    btnContinueToProcess.addEventListener('click', () => goToSection(2));
    btnContinueToAudio.addEventListener('click', () => goToSection(3));
    btnContinueToActivity.addEventListener('click', () => goToSection(4));

    // ===== Section 2: Hotspots Logic =====
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            // Remove active from all
            hotspots.forEach(h => h.classList.remove('active'));
            // Add active to current
            hotspot.classList.add('active');
            
            const infoKey = hotspot.getAttribute('data-info');
            hsTitle.textContent = infoKey;
            hsDesc.textContent = hotspotData[infoKey];
            
            hotspotInfoPanel.classList.add('show');
            
            hotspotsClicked.add(infoKey);
            if(hotspotsClicked.size === 3) {
                btnContinueToProcess.disabled = false;
            }
        });
    });

    // ===== Section 3: Process Carousel Logic =====
    function updateCarousel() {
        processCards.forEach((card, index) => {
            if(index === currentProcessStep) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });

        carouselDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentProcessStep);
        });

        btnProcPrev.disabled = currentProcessStep === 0;
        
        if (currentProcessStep === processCards.length - 1) {
            btnProcNext.disabled = true;
            btnContinueToAudio.style.display = 'inline-flex';
        } else {
            btnProcNext.disabled = false;
        }
    }

    btnProcNext.addEventListener('click', () => {
        if(currentProcessStep < processCards.length - 1) {
            currentProcessStep++;
            updateCarousel();
        }
    });

    btnProcPrev.addEventListener('click', () => {
        if(currentProcessStep > 0) {
            currentProcessStep--;
            updateCarousel();
        }
    });

    carouselDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentProcessStep = index;
            updateCarousel();
        });
    });

    // ===== Section 4: Audio Web API Logic =====
    const fluteAudio = new Audio('MusicaFlauta.mpeg');
    
    function handleAudioEnd() {
        isPlaying = false;
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        audioStatus.textContent = 'Haz clic para escuchar el sonido de nuevo';
        animateWave();
        
        btnContinueToActivity.disabled = false;
    }
    
    fluteAudio.addEventListener('ended', handleAudioEnd);
    
    fluteAudio.addEventListener('timeupdate', () => {
        if (fluteAudio.currentTime >= 5) {
            fluteAudio.pause();
            fluteAudio.currentTime = 0;
            handleAudioEnd();
        }
    });
    
    // Generate wave bars
    for(let i=0; i<15; i++) {
        const bar = document.createElement('div');
        bar.className = 'wave-bar';
        audioWave.appendChild(bar);
    }
    const waveBars = document.querySelectorAll('.wave-bar');

    function animateWave() {
        if(!isPlaying) {
            waveBars.forEach(bar => bar.style.height = '10px');
            return;
        }
        waveBars.forEach(bar => {
            const h = Math.floor(Math.random() * 40) + 10;
            bar.style.height = `${h}px`;
        });
        setTimeout(animateWave, 100);
    }

    function playFluteSound() {
        fluteAudio.currentTime = 0;
        fluteAudio.play().catch(e => console.log('Audio play failed:', e));
        isPlaying = true;
        animateWave();
        
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        audioStatus.textContent = 'Reproduciendo...';
    }

    btnPlayFlute.addEventListener('click', () => {
        if(isPlaying) return;
        playFluteSound();
    });



    // ===== Section 5: Flute Rhythm Game Logic =====
    const fluteHoles = document.querySelectorAll('.flute-hole');
    const btnPlayFlutePattern = document.getElementById('btnPlayFlutePattern');
    const fluteLevelIndicator = document.getElementById('fluteLevelIndicator');
    const sequenceStatusText = document.getElementById('sequenceStatusText');
    const sequenceDotsContainer = document.getElementById('sequenceDotsContainer');
    const fluteRhythmFeedback = document.getElementById('fluteRhythmFeedback');

    const fluteLevels = [
        { pattern: ['0', '2', '3'], speed: 1000 },
        { pattern: ['1', '4', '2', '5'], speed: 900 },
        { pattern: ['0', '3', '2', '4', '1'], speed: 800 },
        { pattern: ['5', '3', '0', '2', '4', '1'], speed: 700 }
    ];
    let fluteCurrentLevel = 0;
    let fluteUserSequence = [];
    let isFlutePlaying = false;
    let isFluteUserTurn = false;
    
    function initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    
    // Simple Synth for Flute
    function playFluteNote(noteId) {
        if (!audioCtx) initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        // Frequencies for a pentatonic/diatonic scale approx
        const freqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00]; // C5 to A5
        const f = freqs[parseInt(noteId)] || 440;
        
        osc.type = 'sine'; // Flute like
        osc.frequency.setValueAtTime(f, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        
        osc.start(now);
        osc.stop(now + 0.6);
    }
    
    // Mapping IDs to color codes for display
    const colorMap = {
        '0': '#3b82f6', // blue
        '1': '#1e293b', // black
        '2': '#10b981', // green
        '3': '#eab308', // yellow
        '4': '#94a3b8', // grey
        '5': '#f97316'  // orange
    };

    function initFluteLevel() {
        fluteLevelIndicator.textContent = `Nivel ${fluteCurrentLevel + 1} de ${fluteLevels.length}`;
        sequenceDotsContainer.innerHTML = '';
        sequenceStatusText.style.display = 'block';
        sequenceStatusText.textContent = 'Secuencia';
        sequenceDotsContainer.style.display = 'none';
        
        btnPlayFlutePattern.style.display = 'inline-flex';
        fluteRhythmFeedback.style.display = 'none';
        
        fluteHoles.forEach(hs => {
            hs.disabled = true;
            hs.classList.remove('error', 'playing');
        });
    }

    initFluteLevel();

    btnPlayFlutePattern.addEventListener('click', () => {
        if(isFlutePlaying) return;
        
        isFlutePlaying = true;
        isFluteUserTurn = false;
        fluteUserSequence = [];
        
        fluteRhythmFeedback.style.display = 'none';
        sequenceStatusText.style.display = 'none';
        sequenceDotsContainer.style.display = 'flex';
        sequenceDotsContainer.innerHTML = ''; // Clear previous dots
        
        fluteHoles.forEach(hs => hs.disabled = true);

        let delay = 0;
        const currentPattern = fluteLevels[fluteCurrentLevel].pattern;
        const currentSpeed = fluteLevels[fluteCurrentLevel].speed;
        
        currentPattern.forEach((note, index) => {
            setTimeout(() => {
                const pad = document.querySelector(`.flute-hole[data-id="${note}"]`);
                
                // Add dot to display box
                const dot = document.createElement('div');
                dot.className = 'seq-dot';
                dot.style.backgroundColor = colorMap[note];
                sequenceDotsContainer.appendChild(dot);
                
                playFluteNote(note);
                
                pad.classList.add('playing');
                dot.classList.add('playing');
                setTimeout(() => {
                    pad.classList.remove('playing');
                    dot.classList.remove('playing');
                }, 300);

                if (index === currentPattern.length - 1) {
                    setTimeout(() => {
                        isFlutePlaying = false;
                        isFluteUserTurn = true;
                        sequenceStatusText.style.display = 'block';
                        sequenceStatusText.textContent = "¡Tu turno! Repite la secuencia en la flauta.";
                        sequenceDotsContainer.style.display = 'none';
                        fluteHoles.forEach(p => p.disabled = false);
                    }, 500);
                }
            }, delay);
            delay += currentSpeed;
        });
    });

    fluteHoles.forEach(hole => {
        hole.addEventListener('click', () => {
            if(!isFluteUserTurn) return;

            const note = hole.getAttribute('data-id');
            playFluteNote(note);
            fluteUserSequence.push(note);
            
            const currentIndex = fluteUserSequence.length - 1;
            const currentPattern = fluteLevels[fluteCurrentLevel].pattern;
            
            // Re-show dots as user plays them
            if (currentIndex === 0) {
                sequenceStatusText.style.display = 'none';
                sequenceDotsContainer.style.display = 'flex';
                sequenceDotsContainer.innerHTML = '';
            }
            
            const dot = document.createElement('div');
            dot.className = 'seq-dot';
            dot.style.backgroundColor = colorMap[note];
            sequenceDotsContainer.appendChild(dot);
            
            if(fluteUserSequence[currentIndex] !== currentPattern[currentIndex]) {
                if (window.playUIError) window.playUIError();
                isFluteUserTurn = false;
                fluteHoles.forEach(p => p.disabled = true);
                
                hole.classList.add('error');
                setTimeout(() => hole.classList.remove('error'), 500);
                
                fluteRhythmFeedback.style.display = 'block';
                fluteRhythmFeedback.className = 'sort-feedback error';
                fluteRhythmFeedback.textContent = "Oops, nota incorrecta. ¡Reintenta el nivel!";
                
                btnPlayFlutePattern.style.display = 'inline-flex';
                btnPlayFlutePattern.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Reintentar Nivel';
            } else {
                if(fluteUserSequence.length === currentPattern.length) {
                    if (window.playUISuccess) window.playUISuccess();
                    isFluteUserTurn = false;
                    fluteHoles.forEach(p => p.disabled = true);
                    
                    if(fluteCurrentLevel < fluteLevels.length - 1) {
                        fluteRhythmFeedback.style.display = 'block';
                        fluteRhythmFeedback.className = 'sort-feedback success';
                        fluteRhythmFeedback.textContent = `¡Nivel ${fluteCurrentLevel + 1} superado!`;
                        
                        setTimeout(() => {
                            fluteCurrentLevel++;
                            initFluteLevel();
                            btnPlayFlutePattern.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Mostrar Secuencia';
                        }, 2000);
                    } else {
                        // All levels passed
                        setTimeout(() => {
                            goToSection(5);
                            fireConfetti();
                        }, 1000);
                    }
                }
            }
        });
    });

    btnFinish.addEventListener('click', () => {
        localStorage.setItem('module1_completed', 'true');
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
            
            p.dy += 0.05; // gravity
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
