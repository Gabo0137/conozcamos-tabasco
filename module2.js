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
    const btnContinueToCompare = document.getElementById('btnContinueToCompare');
    const btnContinueToHistory = document.getElementById('btnContinueToHistory');
    const btnContinueToMatch = document.getElementById('btnContinueToMatch');

    let currentSection = 0;
    const totalSections = sections.length;

    // ===== Navigation Logic =====
    btnBack.addEventListener('click', () => {
        window.location.href = 'course.html';
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
    btnContinueToCompare.addEventListener('click', () => goToSection(2));
    btnContinueToHistory.addEventListener('click', () => goToSection(3));
    btnContinueToMatch.addEventListener('click', () => goToSection(4));

    // ===== Section 2: Hotspots Logic =====
    const hotspots = document.querySelectorAll('.hotspot');
    const hotspotInfoPanel = document.getElementById('hotspotInfoPanel');
    const hsTitle = document.getElementById('hsTitle');
    const hsDesc = document.getElementById('hsDesc');
    let hotspotsClicked = new Set();

    const hotspotData = {
        'Caparazón': 'Funciona como caja de resonancia natural que amplifica el sonido.',
        'Baquetas o astas': 'Elementos, tradicionalmente astas de venado, usados para percutir el caparazón.',
        'Resonancia': 'Vibración interna que enriquece el sonido, dándole su tono característico.'
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
            if (hotspotsClicked.size === 3) {
                btnContinueToCompare.disabled = false;
            }
        });
    });

    // ===== Section 3: Audio Comparator Logic =====
    const compareCards = document.querySelectorAll('.audio-compare-card');
    const compareQuestionCard = document.getElementById('compareQuestionCard');
    const compareOpts = document.querySelectorAll('.compare-question-card .audio-opt');
    const compareFeedback = document.getElementById('compareFeedback');

    let audioCtx = null;
    const fluteAudio = new Audio('MusicaFlauta.mpeg');
    const tamborAudio = new Audio('SonidoTambor.mpeg');
    const tortugaAudio = new Audio('SonidoTortuga.mpeg');

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playSound(type) {
        initAudio();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'flauta') {
            fluteAudio.currentTime = 0;
            fluteAudio.play().catch(e => console.log(e));
            setTimeout(() => {
                fluteAudio.pause();
                fluteAudio.currentTime = 0;
            }, 3000);
            return 4.0; // We return early here since duration is different and we didn't use oscillator
        } else if (type === 'caparazon') {
            tortugaAudio.currentTime = 0;
            tortugaAudio.play().catch(e => console.log(e));
            setTimeout(() => {
                tortugaAudio.pause();
                tortugaAudio.currentTime = 0;
            }, 3000);
            return 3.0;

        } else if (type === 'tambor') {
            tamborAudio.currentTime = 0;
            tamborAudio.play().catch(e => console.log(e));
            setTimeout(() => {
                tamborAudio.pause();
                tamborAudio.currentTime = 0;
            }, 3000);
            return 3.0;
        }

        return 0.8; // only caparazon reaches this line now
    }

    let soundsPlayed = new Set();

    compareCards.forEach(card => {
        const btn = card.querySelector('.btn-play-compare');
        const type = card.getAttribute('data-sound');

        btn.addEventListener('click', () => {
            const playIcon = btn.querySelector('.play-icon');
            const pauseIcon = btn.querySelector('.pause-icon');

            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';

            const duration = playSound(type);
            soundsPlayed.add(type);

            setTimeout(() => {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';

                if (soundsPlayed.size === 3) {
                    compareQuestionCard.style.display = 'block';
                }
            }, duration * 1000 + 100);
        });
    });

    compareOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            compareOpts.forEach(o => o.classList.remove('selected', 'wrong'));
            opt.classList.add('selected');

            const ans = opt.getAttribute('data-answer');
            if (ans === 'caparazon') {
                if (window.playUISuccess) window.playUISuccess();
                compareFeedback.className = 'audio-feedback success';
                compareFeedback.textContent = "¡Correcto! El caparazón de tortuga tiene ese sonido percusivo, hueco y de tono distintivo al ser golpeado.";
                btnContinueToHistory.disabled = false;
            } else {
                opt.classList.remove('selected');
                opt.classList.add('wrong');

                if (window.playUIError) window.playUIError();
                compareFeedback.className = 'audio-feedback error';
                compareFeedback.textContent = "Ese no es el caparazón. Vuelve a escuchar y elige el sonido de percusión con tono amaderado/óseo.";
                btnContinueToHistory.disabled = true;
            }
        });
    });

    // ===== Section 4: History Carousel =====
    const historyCards = document.querySelectorAll('.history-carousel .process-card');
    const btnHistPrev = document.getElementById('btnHistPrev');
    const btnHistNext = document.getElementById('btnHistNext');
    const carouselDotsHist = document.querySelectorAll('#carouselDotsHist .dot');
    let currentHistStep = 0;

    function updateHistCarousel() {
        historyCards.forEach((card, index) => {
            card.classList.toggle('active', index === currentHistStep);
        });

        carouselDotsHist.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentHistStep);
        });

        btnHistPrev.disabled = currentHistStep === 0;

        if (currentHistStep === historyCards.length - 1) {
            btnHistNext.disabled = true;
            btnContinueToMatch.style.display = 'inline-flex';
        } else {
            btnHistNext.disabled = false;
        }
    }

    btnHistNext.addEventListener('click', () => {
        if (currentHistStep < historyCards.length - 1) {
            currentHistStep++;
            updateHistCarousel();
        }
    });

    btnHistPrev.addEventListener('click', () => {
        if (currentHistStep > 0) {
            currentHistStep--;
            updateHistCarousel();
        }
    });

    carouselDotsHist.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentHistStep = index;
            updateHistCarousel();
        });
    });

    // ===== Section 5: Juego Rítmico de la Concha Logic =====
    const shellHotspots = document.querySelectorAll('.concha-btn');
    const btnPlayConchaPattern = document.getElementById('btnPlayConchaPattern');
    const conchaLevelIndicator = document.getElementById('conchaLevelIndicator');
    const sequenceStatusText = document.getElementById('sequenceStatusText');
    const conchaSequenceDotsContainer = document.getElementById('conchaSequenceDotsContainer');
    const conchaRhythmFeedback = document.getElementById('conchaRhythmFeedback');
    
    const quizResults = document.getElementById('quizResults');
    const btnFinish = document.getElementById('btnFinish');

    const conchaLevels = [
        { pattern: ['0', '2', '1'], speed: 800 },
        { pattern: ['0', '1', '3', '2'], speed: 700 },
        { pattern: ['2', '3', '0', '3', '1'], speed: 600 },
        { pattern: ['0', '3', '2', '2', '0', '1'], speed: 500 }
    ];
    let conchaCurrentLevel = 0;
    let conchaUserSequence = [];
    let isConchaPlaying = false;
    let isConchaUserTurn = false;

    const conchaColorMap = {
        '0': '#3b82f6', // blue
        '1': '#f97316', // orange
        '2': '#10b981', // green
        '3': '#eab308'  // yellow
    };

    function playShellSound(tone) {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (tone === 'grave') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
            gain.gain.setValueAtTime(0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (tone === 'medio') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
            gain.gain.setValueAtTime(0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (tone === 'ligero') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (tone === 'agudo') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        }
    }

    function initConchaLevel() {
        conchaLevelIndicator.textContent = `Nivel ${conchaCurrentLevel + 1} de ${conchaLevels.length}`;
        conchaSequenceDotsContainer.innerHTML = '';
        sequenceStatusText.style.display = 'block';
        sequenceStatusText.textContent = "Haz clic en \"Escuchar\" para conocer la secuencia.";
        conchaSequenceDotsContainer.appendChild(sequenceStatusText);
        
        btnPlayConchaPattern.style.display = 'inline-flex';
        conchaRhythmFeedback.style.display = 'none';
        
        shellHotspots.forEach(hs => {
            hs.disabled = true;
            hs.classList.remove('error', 'playing');
        });
    }

    initConchaLevel();

    btnPlayConchaPattern.addEventListener('click', () => {
        if(isConchaPlaying) return;
        
        isConchaPlaying = true;
        isConchaUserTurn = false;
        conchaUserSequence = [];
        
        conchaRhythmFeedback.style.display = 'none';
        sequenceStatusText.style.display = 'none';
        conchaSequenceDotsContainer.innerHTML = '';
        
        shellHotspots.forEach(hs => {
            hs.disabled = true;
            hs.classList.remove('error');
        });

        let delay = 0;
        const currentPattern = conchaLevels[conchaCurrentLevel].pattern;
        const currentSpeed = conchaLevels[conchaCurrentLevel].speed;
        
        currentPattern.forEach((note, index) => {
            setTimeout(() => {
                const pad = document.querySelector(`.concha-btn[data-id="${note}"]`);
                const tone = pad.getAttribute('data-tone');
                
                // Add dot to display box
                const dot = document.createElement('div');
                dot.className = 'seq-dot';
                dot.style.backgroundColor = conchaColorMap[note];
                conchaSequenceDotsContainer.appendChild(dot);
                
                playShellSound(tone);
                
                pad.classList.add('playing');
                dot.classList.add('playing');
                setTimeout(() => {
                    pad.classList.remove('playing');
                    dot.classList.remove('playing');
                }, 300);

                if (index === currentPattern.length - 1) {
                    setTimeout(() => {
                        isConchaPlaying = false;
                        isConchaUserTurn = true;
                        conchaSequenceDotsContainer.innerHTML = '';
                        sequenceStatusText.style.display = 'block';
                        sequenceStatusText.textContent = "¡Tu turno! Repite la secuencia en los caparazones.";
                        conchaSequenceDotsContainer.appendChild(sequenceStatusText);
                        shellHotspots.forEach(p => p.disabled = false);
                    }, 500);
                }
            }, delay);
            delay += currentSpeed;
        });
    });

    shellHotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            if(!isConchaUserTurn) return;

            const note = hotspot.getAttribute('data-id');
            const tone = hotspot.getAttribute('data-tone');
            
            playShellSound(tone);
            conchaUserSequence.push(note);
            
            const currentIndex = conchaUserSequence.length - 1;
            const currentPattern = conchaLevels[conchaCurrentLevel].pattern;
            
            if (currentIndex === 0) {
                sequenceStatusText.style.display = 'none';
                conchaSequenceDotsContainer.innerHTML = '';
            }
            
            const dot = document.createElement('div');
            dot.className = 'seq-dot';
            dot.style.backgroundColor = conchaColorMap[note];
            conchaSequenceDotsContainer.appendChild(dot);
            
            if(conchaUserSequence[currentIndex] !== currentPattern[currentIndex]) {
                if (window.playUIError) window.playUIError();
                isConchaUserTurn = false;
                shellHotspots.forEach(p => p.disabled = true);
                
                hotspot.classList.add('error');
                
                conchaRhythmFeedback.style.display = 'block';
                conchaRhythmFeedback.className = 'sort-feedback error';
                conchaRhythmFeedback.textContent = "Oops, caparazón incorrecto. ¡Reintenta el nivel!";
                
                btnPlayConchaPattern.style.display = 'inline-flex';
                btnPlayConchaPattern.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Reintentar Nivel';
            } else {
                if(conchaUserSequence.length === currentPattern.length) {
                    if (window.playUISuccess) window.playUISuccess();
                    isConchaUserTurn = false;
                    shellHotspots.forEach(p => p.disabled = true);
                    
                    if(conchaCurrentLevel < conchaLevels.length - 1) {
                        conchaRhythmFeedback.style.display = 'block';
                        conchaRhythmFeedback.className = 'sort-feedback success';
                        conchaRhythmFeedback.textContent = `¡Nivel ${conchaCurrentLevel + 1} superado!`;
                        
                        setTimeout(() => {
                            conchaCurrentLevel++;
                            initConchaLevel();
                            btnPlayConchaPattern.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Escuchar Secuencia';
                        }, 2000);
                    } else {
                        document.querySelector('#sectionMatch .section-intro').style.display = 'none';
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
        localStorage.setItem('module2_completed', 'true');
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
