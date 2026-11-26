document.addEventListener('DOMContentLoaded', () => {
    const isEmbedded = new URLSearchParams(window.location.search).get('embedded') === '1';
    if (isEmbedded) document.body.classList.add('games-embedded');

    const notifyEmbedHeight = () => {
        if (!isEmbedded || window.parent === window) return;
        window.parent.postMessage({ type: 'games-embed-height', height: document.documentElement.scrollHeight }, '*');
    };

    // ===== Navigation =====
    const btnBack = document.getElementById('btnBack');
    const sections = document.querySelectorAll('.content-section');
    const steps = document.querySelectorAll('.games-selector .step');

    if (!isEmbedded) {
        btnBack.addEventListener('click', () => {
            window.location.href = 'course.html';
        });
    }


    function goToGame(index) {
        if (window.playUINext) window.playUINext();
        document.body.classList.add('memory-mode');
        sections.forEach(sec => sec.classList.remove('active'));
        steps.forEach(step => step.classList.remove('active'));
        
        sections[index].classList.add('active');
        steps[index].classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.setTimeout(notifyEmbedHeight, 50);
    }

    steps.forEach((step, index) => {
        step.addEventListener('click', () => goToGame(index));
    });
    notifyEmbedHeight();

    // ===== Universal Audio Engine =====
    let audioCtx = null;
    const audioCache = {
        'flauta': new Audio('MusicaFlauta.mpeg'),
        'tambor': new Audio('TamborSonido.mpeg'),
        'caparazon': new Audio('SonidoTortuga.mpeg')
    };

    function initAudio() {
        if(!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playMemoryTone(kind) {
        initAudio();
        const now = audioCtx.currentTime;
        const notes = kind === 'victory' ? [523, 659, 784, 1046] : kind === 'match' ? [523, 659] : kind === 'stop' ? [280] : [560, 760];
        const duration = kind === 'victory' ? 0.32 : kind === 'match' ? 0.2 : kind === 'stop' ? 0.16 : 0.14;
        notes.forEach((frequency, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const start = now + (kind === 'victory' ? index * 0.07 : kind === 'match' ? index * 0.045 : kind === 'stop' ? 0 : index * 0.025);
            osc.type = kind === 'stop' ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(kind === 'stop' ? 0.08 : 0.12, start + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(start);
            osc.stop(start + duration);
        });
    }

    function playSound(instrument) {
        let audioSrc = '';
        if (instrument === 'flauta') {
            audioSrc = 'MusicaFlauta.mpeg';
        } else if (instrument === 'tambor') {
            audioSrc = 'TamborSonido.mpeg';
        } else if (instrument === 'caparazon') {
            audioSrc = 'SonidoTortuga.mpeg';
        } else if (instrument === 'marimba') {
            initAudio();
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now); // A4
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.8, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            return 0.5;
        }

        if (audioSrc) {
            const audio = audioCache[instrument];
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.error("Error playing audio", e));
                setTimeout(() => {
                    audio.pause();
                }, 2000);
            }
            return 2.0;
        }
        return 0;
    }

    function playSynthSound(instrument) {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (instrument === 'flauta') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 1.0);
            osc.start(now);
            osc.stop(now + 1.0);
            return 1.0;
        } else if (instrument === 'tambor') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            const bufferSize = audioCtx.sampleRate * 0.4;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = audioCtx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 500;
            const noiseGain = audioCtx.createGain();
            noiseGain.gain.setValueAtTime(0.3, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            
            osc.start(now);
            noise.start(now);
            osc.stop(now + 0.4);
            noise.stop(now + 0.4);
            return 0.4;
        } else if (instrument === 'caparazon') {
            const audio = audioCache['caparazon'];
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.error("Error playing audio", e));
                setTimeout(() => {
                    audio.pause();
                }, 2000);
            }
            return 2.0;
        }
        return 0;
    }

    // ===== GAME 1: Memorama =====
    const memoryBoard = document.getElementById('memoryBoard');
    const memoryWinDialog = document.getElementById('memoryWinDialog');
    
    const memoryItems = [
        { id: 'flauta', name: 'Flauta de carrizo', icon: '<img src="Hueco.png" alt="Hueco" />' },
        { id: 'tambor', name: 'Tambor', icon: '<img src="Tambor.png" alt="Tambor tradicional" />' },
        { id: 'caparazon', name: 'Caparazón', icon: '<img src="Concha.png" alt="Concha" />' },
        { id: 'marimba', name: 'Marimba', icon: '<img src="marimba.png" alt="Marimba" />' }
    ];

    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let lockBoard = false;

    function initMemorama() {
        memoryBoard.innerHTML = '';
        matchedPairs = 0;
        flippedCards = [];
        lockBoard = false;

        // Duplicate and shuffle
        cards = [...memoryItems, ...memoryItems]
            .sort(() => 0.5 - Math.random());

        cards.forEach((item, index) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.id = item.id;
            card.dataset.index = index;

            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front"></div>
                    <div class="memory-card-back">
                        <span style="font-size: 3rem;">${item.icon}</span>
                        <span style="font-size: 1rem; text-align: center;">${item.name}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', flipCard);
            memoryBoard.appendChild(card);
        });
    }

    function flipCard() {
        if (lockBoard) return;
        if (this === flippedCards[0]) return;

        this.classList.add('flipped');
        playMemoryTone('flip');
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    function checkForMatch() {
        let isMatch = flippedCards[0].dataset.id === flippedCards[1].dataset.id;
        isMatch ? disableCards() : unflipCards();
    }

    function disableCards() {
        playMemoryTone('match');
        flippedCards[0].removeEventListener('click', flipCard);
        flippedCards[1].removeEventListener('click', flipCard);
        flippedCards[0].classList.add('matched');
        flippedCards[1].classList.add('matched');
        
        matchedPairs++;
        if (matchedPairs === memoryItems.length) {
            setTimeout(() => playMemoryTone('victory'), 260);
            setTimeout(() => {
                fireConfetti();
                memoryWinDialog?.showModal();
            }, 500);
        }
        
        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;
        playMemoryTone('stop');
        setTimeout(() => {
            flippedCards[0].classList.remove('flipped');
            flippedCards[1].classList.remove('flipped');
            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [flippedCards, lockBoard] = [[], false];
    }

    document.getElementById('btnAcceptMemoryWin')?.addEventListener('click', () => {
        memoryWinDialog?.close();
        initMemorama();
    });
    initMemorama();

    // ===== GAME 2: Arrastrar y Soltar =====
    const dragItems = document.querySelectorAll('#gameRelacionar .match-item');
    const dragTargetZones = document.querySelectorAll('#gameRelacionar .match-target-zone');
    const dragSource = document.getElementById('dragSource');
    const dragTargets = document.getElementById('dragTargets');
    const btnCheckDrag = document.getElementById('btnCheckDrag');
    const dragFeedback = document.getElementById('dragFeedback');
    const dragResultDialog = document.getElementById('dragResultDialog');
    const dragResultTitle = document.getElementById('dragResultTitle');
    const dragResultText = document.getElementById('dragResultText');
    const dragResultIcon = document.getElementById('dragResultIcon');

    let draggedItem = null;
    let dragReviewed = false;
    let dragWasCorrect = false;

    function initDragDrop() {
        // Reset items to source
        dragItems.forEach(item => {
            dragSource.appendChild(item);
        });
        
        dragTargetZones.forEach(zone => {
            zone.classList.remove('filled');
        });
        
        dragFeedback.style.display = 'none';
        btnCheckDrag.style.display = 'inline-flex';
        btnCheckDrag.textContent = 'Verificar';
        btnCheckDrag.disabled = true;
        dragResultDialog?.close();
        dragReviewed = false;
        dragWasCorrect = false;
        dragTargetZones.forEach(zone => zone.classList.remove('relation-correct','relation-incorrect'));
        dragItems.forEach(item => { item.draggable = true; item.classList.remove('relation-correct','relation-incorrect'); });
        
        // Shuffle both the materials and the question rows on every restart.
        for (let i = dragSource.children.length - 1; i > 0; i--) {
            dragSource.appendChild(dragSource.children[Math.floor(Math.random() * (i + 1))]);
        }
        const rows = [...dragTargets.querySelectorAll('.match-row')];
        rows.sort(() => Math.random() - 0.5).forEach(row => dragTargets.appendChild(row));
    }

    dragItems.forEach(item => {
        item.addEventListener('dragstart', function() {
            draggedItem = this;
            setTimeout(() => this.classList.add('dragging'), 0);
        });
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
            checkAllFilled(dragTargetZones, btnCheckDrag, '.match-item');
        });
    });

    dragTargetZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            if(draggedItem) {
                const existing = this.querySelector('.match-item');
                if(existing) dragSource.appendChild(existing);
                this.appendChild(draggedItem);
                this.classList.add('filled');
            }
        });
    });

    dragSource.addEventListener('dragover', e => e.preventDefault());
    dragSource.addEventListener('drop', function(e) {
        e.preventDefault();
        if(draggedItem) {
            this.appendChild(draggedItem);
            dragTargetZones.forEach(z => {
                if(!z.querySelector('.match-item')) z.classList.remove('filled');
            });
        }
    });

    function checkAllFilled(zones, btn, itemClass) {
        let allFilled = true;
        zones.forEach(zone => {
            if(!zone.querySelector(itemClass)) allFilled = false;
        });
        btn.disabled = !allFilled;
    }

    btnCheckDrag.addEventListener('click', () => {
        if (dragReviewed) {
            initDragDrop();
            return;
        }
        let isCorrect = true;
        dragTargetZones.forEach(zone => {
            const expected = zone.getAttribute('data-pos');
            const item = zone.querySelector('.match-item');
            if(!item || item.getAttribute('data-concept') !== expected) isCorrect = false;
        });

        dragFeedback.style.display = 'none';
        if(isCorrect) {
            dragWasCorrect = true;
            if (window.playUISuccess) window.playUISuccess();
            dragResultIcon.textContent = '✓';
            dragResultTitle.textContent = '¡Correcto!';
            dragResultText.textContent = 'Relacionaste correctamente todos los materiales.';
            btnCheckDrag.style.display = 'none';
            fireConfetti();
        } else {
            dragWasCorrect = false;
            if (window.playUIError) window.playUIError();
            dragResultIcon.textContent = '!';
            dragResultTitle.textContent = 'Sigue intentando';
            dragResultText.textContent = 'Algunas relaciones no son correctas. Revisa las respuestas y vuelve a intentarlo.';
        }
        dragResultDialog?.showModal();
    });

    function revealDragResults() {
        dragReviewed = true;
        btnCheckDrag.textContent = 'Reiniciar';
        btnCheckDrag.disabled = false;
        dragItems.forEach(item => { item.draggable = false; });
        dragTargetZones.forEach(zone => {
            const expected = zone.getAttribute('data-pos');
            const item = zone.querySelector('.match-item');
            const correct = item && item.getAttribute('data-concept') === expected;
            zone.classList.toggle('relation-correct', Boolean(correct));
            zone.classList.toggle('relation-incorrect', !correct);
            item?.classList.toggle('relation-correct', Boolean(correct));
            item?.classList.toggle('relation-incorrect', !correct);
        });
    }

    document.getElementById('btnAcceptDragResult')?.addEventListener('click', () => {
        dragResultDialog?.close();
        if (dragWasCorrect) initDragDrop();
        else revealDragResults();
    });
    initDragDrop();

    // ===== GAME 3: Ordenar Pasos =====
    const sortItems = document.querySelectorAll('#gameOrdenar .sort-item');
    const sortTargetZones = document.querySelectorAll('#gameOrdenar .sort-target-zone');
    const sortSource = document.getElementById('sortSourceGames');
    const btnCheckSort = document.getElementById('btnCheckSortGames');
    const sortFeedback = document.getElementById('sortFeedbackGames');
    const sortResultDialog = document.getElementById('sortResultDialog');
    const sortResultTitle = document.getElementById('sortResultTitle');
    const sortResultText = document.getElementById('sortResultText');
    const sortResultIcon = document.getElementById('sortResultIcon');

    let draggedSortItem = null;
    let sortReviewed = false;
    let sortWasCorrect = false;

    function initSort() {
        sortItems.forEach(item => sortSource.appendChild(item));
        sortTargetZones.forEach(zone => {
            zone.classList.remove('filled', 'sort-correct', 'sort-incorrect');
            zone.querySelector('.sort-item')?.classList.remove('sort-correct', 'sort-incorrect');
        });
        sortFeedback.style.display = 'none';
        btnCheckSort.style.display = 'inline-flex';
        btnCheckSort.textContent = 'Verificar';
        btnCheckSort.disabled = true;
        sortResultDialog?.close();
        sortReviewed = false;
        sortWasCorrect = false;
        sortItems.forEach(item => {
            item.draggable = true;
            item.classList.remove('sort-correct', 'sort-incorrect');
        });
        
        for (let i = sortSource.children.length; i >= 0; i--) {
            sortSource.appendChild(sortSource.children[Math.random() * i | 0]);
        }
    }

    sortItems.forEach(item => {
        item.addEventListener('dragstart', function() {
            draggedSortItem = this;
            setTimeout(() => this.classList.add('dragging'), 0);
        });
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedSortItem = null;
            checkAllFilled(sortTargetZones, btnCheckSort, '.sort-item');
        });
    });

    sortTargetZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            if(draggedSortItem) {
                const existing = this.querySelector('.sort-item');
                if(existing) sortSource.appendChild(existing);
                this.appendChild(draggedSortItem);
                this.classList.add('filled');
            }
        });
    });

    sortSource.addEventListener('dragover', e => e.preventDefault());
    sortSource.addEventListener('drop', function(e) {
        e.preventDefault();
        if(draggedSortItem) {
            this.appendChild(draggedSortItem);
            sortTargetZones.forEach(z => {
                if(!z.querySelector('.sort-item')) z.classList.remove('filled');
            });
        }
    });

    btnCheckSort.addEventListener('click', () => {
        if (sortReviewed) {
            initSort();
            return;
        }

        let isCorrect = true;
        sortTargetZones.forEach(zone => {
            const expected = zone.getAttribute('data-pos');
            const item = zone.querySelector('.sort-item');
            if(!item || item.getAttribute('data-step') !== expected) isCorrect = false;
        });

        sortFeedback.style.display = 'none';
        if(isCorrect) {
            sortWasCorrect = true;
            if (window.playUISuccess) window.playUISuccess();
            sortResultIcon.textContent = '✓';
            sortResultTitle.textContent = '¡Correcto!';
            sortResultText.textContent = 'Ordenaste correctamente el proceso de elaboración.';
            btnCheckSort.style.display = 'none';
            fireConfetti();
        } else {
            sortWasCorrect = false;
            if (window.playUIError) window.playUIError();
            sortResultIcon.textContent = '!';
            sortResultTitle.textContent = 'Sigue intentando';
            sortResultText.textContent = 'El orden no es correcto. Revisa tus respuestas para ver cuáles acertaste.';
        }
        sortResultDialog?.showModal();
    });

    function revealSortResults() {
        sortReviewed = true;
        btnCheckSort.textContent = 'Reiniciar';
        btnCheckSort.style.display = 'inline-flex';
        btnCheckSort.disabled = false;
        sortItems.forEach(item => { item.draggable = false; });
        sortTargetZones.forEach(zone => {
            const expected = zone.getAttribute('data-pos');
            const item = zone.querySelector('.sort-item');
            const correct = item && item.getAttribute('data-step') === expected;
            zone.classList.toggle('sort-correct', Boolean(correct));
            zone.classList.toggle('sort-incorrect', !correct);
            item?.classList.toggle('sort-correct', Boolean(correct));
            item?.classList.toggle('sort-incorrect', !correct);
        });
    }

    document.getElementById('btnAcceptSortResult')?.addEventListener('click', () => {
        sortResultDialog?.close();
        if (sortWasCorrect) initSort();
        else revealSortResults();
    });

    initSort();

    // ===== GAME 4: Adivina el sonido =====
    const btnPlayMystery = document.getElementById('btnPlayMystery');
    const guessOpts = document.querySelectorAll('.guess-opt');
    const guessFeedback = document.getElementById('guessFeedback');
    const btnNextMystery = document.getElementById('btnNextMystery');
    
    const instruments = ['flauta', 'caparazon', 'tambor'];
    let currentMystery = '';
    let mysteryPlaying = false;

    function initMystery() {
        currentMystery = instruments[Math.floor(Math.random() * instruments.length)];
        guessOpts.forEach(opt => {
            opt.classList.remove('correct', 'wrong');
            opt.style.pointerEvents = 'auto';
        });
        guessFeedback.style.display = 'none';
        btnNextMystery.style.display = 'none';
        btnPlayMystery.disabled = false;
    }

    btnPlayMystery.addEventListener('click', () => {
        if (mysteryPlaying) return;
        mysteryPlaying = true;
        btnPlayMystery.classList.add('playing');
        
        const duration = playSound(currentMystery);
        
        setTimeout(() => {
            mysteryPlaying = false;
            btnPlayMystery.classList.remove('playing');
        }, duration * 1000);
    });

    guessOpts.forEach(opt => {
        opt.addEventListener('click', () => {
            if (opt.style.pointerEvents === 'none') return;
            
            const selected = opt.getAttribute('data-inst');
            
            if (selected === currentMystery) {
                if (window.playUISuccess) window.playUISuccess();
                opt.classList.add('correct');
                guessFeedback.className = 'sort-feedback success';
                guessFeedback.textContent = '¡Correcto! Tienes buen oído.';
                guessFeedback.style.display = 'block';
                btnNextMystery.style.display = 'block';
                
                guessOpts.forEach(o => o.style.pointerEvents = 'none');
                fireConfetti();
            } else {
                if (window.playUIError) window.playUIError();
                opt.classList.add('wrong');
                guessFeedback.className = 'sort-feedback error';
                guessFeedback.textContent = 'Ese no es el instrumento. Intenta escuchar de nuevo.';
                guessFeedback.style.display = 'block';
                
                // Keep wrong ones disabled, user can keep guessing
                opt.style.pointerEvents = 'none';
            }
        });
    });

    btnNextMystery.addEventListener('click', initMystery);
    initMystery();

    // ===== GAME 5: Repite el Ritmo (Arcade) =====
    const btnStartArcadeRhythm = document.getElementById('btnStartArcadeRhythm');
    const rhythmPads = document.querySelectorAll('#gameRitmo .rhythm-pad');
    const arcadeFeedback = document.getElementById('arcadeRhythmFeedback');
    const rhythmStatusArcade = document.getElementById('rhythmStatusArcade');
    const rhythmLevelBadge = document.getElementById('rhythmLevelBadge');

    let arcadeLevel = 1;
    let arcadeSequence = [];
    let userArcadeSequence = [];
    let isArcadePlaying = false;
    let isArcadeUserTurn = false;

    const padInstMap = {
        '0': 'flauta',
        '1': 'caparazon',
        '2': 'tambor'
    };

    const padColors = {
        '0': '#70916a', // Green (Hueco)
        '1': '#edb336', // Orange (Concha)
        '2': '#074c45'  // Blue (Tambor)
    };

    function updateSequenceDisplay() {
        const dotsContainer = document.getElementById('rhythmDotsArcade');
        dotsContainer.style.display = 'flex';
        document.getElementById('sequenceStatusTextArcade').style.display = 'none';
        
        dotsContainer.innerHTML = '';
        arcadeSequence.forEach((note, index) => {
            const dot = document.createElement('div');
            dot.id = `seq-dot-${index}`;
            dot.style.width = '40px';
            dot.style.height = '40px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = padColors[note];
            dot.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            dot.style.border = '2px solid white';
            dot.style.opacity = '0'; // Hidden initially
            dot.style.transition = 'opacity 0.2s ease-in';
            dotsContainer.appendChild(dot);
        });
    }

    function initArcadeLevel() {
        userArcadeSequence = [];
        arcadeFeedback.style.display = 'none';
        rhythmLevelBadge.textContent = `Nivel ${arcadeLevel}`;
        rhythmStatusArcade.textContent = "Escucha atentamente...";
        btnStartArcadeRhythm.style.display = 'none';
        
        // Add a new random note to sequence, guaranteeing variety
        let randomNote = Math.floor(Math.random() * 3).toString();
        if (arcadeLevel === 2) {
            while (randomNote === arcadeSequence[0]) {
                randomNote = Math.floor(Math.random() * 3).toString();
            }
        } else if (arcadeLevel === 3) {
            const usedNotes = new Set(arcadeSequence);
            if (usedNotes.size < 3) {
                for (let i = 0; i < 3; i++) {
                    if (!usedNotes.has(i.toString())) {
                        randomNote = i.toString();
                        break;
                    }
                }
            }
        }
        
        arcadeSequence.push(randomNote);

        // Update the visual sequence in the box
        updateSequenceDisplay();

        rhythmPads.forEach(p => p.disabled = true);
        playArcadeSequence();
    }

    function playArcadeSequence() {
        isArcadePlaying = true;
        let delay = 500;
        
        arcadeSequence.forEach((note, index) => {
            setTimeout(() => {
                const pad = document.querySelector(`#gameRitmo .rhythm-pad[data-pad="${note}"]`);
                playSynthSound(padInstMap[note]);
                
                // Show the dot in the sequence box
                const dot = document.getElementById(`seq-dot-${index}`);
                if (dot) dot.style.opacity = '1';
                
                pad.classList.add('playing');
                setTimeout(() => pad.classList.remove('playing'), 300);

                if (index === arcadeSequence.length - 1) {
                    setTimeout(() => {
                        isArcadePlaying = false;
                        isArcadeUserTurn = true;
                        rhythmStatusArcade.textContent = "¡Tu turno!";
                        rhythmPads.forEach(p => p.disabled = false);
                        
                        // Hide the visual sequence so the user uses memory
                        const dotsContainer = document.getElementById('rhythmDotsArcade');
                        dotsContainer.innerHTML = '';
                        dotsContainer.style.display = 'none';
                        
                        const statusText = document.getElementById('sequenceStatusTextArcade');
                        statusText.style.display = 'block';
                        statusText.textContent = '¿Recuerdas el orden?';
                        
                    }, 500);
                }
            }, delay);
            delay += 800 - (arcadeLevel * 20); // speeds up slightly per level
        });
    }

    btnStartArcadeRhythm.addEventListener('click', () => {
        if (btnStartArcadeRhythm.textContent !== "Siguiente Nivel") {
            arcadeLevel = 1;
            arcadeSequence = [];
        }
        initArcadeLevel();
    });

    rhythmPads.forEach(pad => {
        pad.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if(!isArcadeUserTurn) return;

            const note = pad.getAttribute('data-pad');
            playSynthSound(padInstMap[note]);
            userArcadeSequence.push(note);
            
            // Visual active state
            pad.style.transform = 'scale(0.95)';
            setTimeout(() => pad.style.transform = 'none', 100);

            const currentIndex = userArcadeSequence.length - 1;
            
            if(userArcadeSequence[currentIndex] !== arcadeSequence[currentIndex]) {
                // Wrong note
                if (window.playUIError) window.playUIError();
                isArcadeUserTurn = false;
                rhythmPads.forEach(p => p.disabled = true);
                
                arcadeFeedback.className = 'sort-feedback error';
                arcadeFeedback.innerHTML = `<strong>¡Te equivocaste!</strong> Llegaste hasta el Nivel ${arcadeLevel}.`;
                arcadeFeedback.style.display = 'block';
                
                btnStartArcadeRhythm.textContent = "Volver a jugar";
                btnStartArcadeRhythm.style.display = 'inline-block';
                rhythmStatusArcade.textContent = "Fin del juego.";
            } else {
                // Correct note
                if(userArcadeSequence.length === arcadeSequence.length) {
                    if (window.playUISuccess) window.playUISuccess();
                    isArcadeUserTurn = false;
                    rhythmPads.forEach(p => p.disabled = true);
                    
                    if (arcadeLevel === 4) {
                        arcadeFeedback.className = 'sort-feedback success';
                        arcadeFeedback.textContent = `¡Felicidades! Completaste los 4 niveles.`;
                        arcadeFeedback.style.display = 'block';
                        
                        btnStartArcadeRhythm.textContent = "Volver a jugar";
                        btnStartArcadeRhythm.style.display = 'inline-block';
                        rhythmStatusArcade.textContent = "¡Juego completado!";
                        
                        fireConfetti();
                    } else {
                        arcadeFeedback.className = 'sort-feedback success';
                        arcadeFeedback.textContent = `¡Nivel ${arcadeLevel} superado!`;
                        arcadeFeedback.style.display = 'block';
                        
                        btnStartArcadeRhythm.textContent = "Siguiente Nivel";
                        btnStartArcadeRhythm.style.display = 'inline-block';
                        rhythmStatusArcade.textContent = "¡Excelente memoria!";
                        
                        arcadeLevel++;
                    }
                }
            }
        });
        
        pad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            pad.dispatchEvent(new Event('mousedown'));
        });
    });

    // ===== Confetti =====
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const colors = ['#074c45', '#70916a', '#edb336', '#a66a09', '#fcf9f0'];

    function fireConfetti() {
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
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
});
