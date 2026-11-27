document.addEventListener('DOMContentLoaded', () => {
    const timing = { slow: 760, normal: 500, fast: 300, veryFast: 220 };
    const baseCard = document.querySelector('.zapateado-card');
    const demoContainer = baseCard?.parentElement;
    let activeSimulator = null;
    let activeView = 'menu';
    const progressionKey = 'tambor_toque_progress_v1';
    let rhythmProgress = { zapateado: false, valceo: false };
    try {
        const saved = JSON.parse(localStorage.getItem(progressionKey));
        if (saved && typeof saved === 'object') {
            rhythmProgress = {
                zapateado: saved.zapateado === true,
                valceo: saved.valceo === true
            };
        }
    } catch { /* El recorrido sigue disponible aunque el almacenamiento no responda. */ }

    function persistRhythmProgress() {
        try { localStorage.setItem(progressionKey, JSON.stringify(rhythmProgress)); } catch { /* Opcional. */ }
    }

    const rhythmConfigs = {
        zapateado: {
            title: 'Zapateado',
            groups: [['D', 'I', 'I'], ['D', 'I', 'I'], ['D', 'I', 'D', 'I', 'D', 'I']],
            audio: {
                left: 'Valceo/I-1.mp3',
                right: 'Valceo/D-1.mp3'
            }
        },
        valceo: {
            title: 'Valceo',
            groups: [['D', 'I'], ['D', 'I'], ['D', 'I'], ['D', 'I'], ['D', 'I'], ['D', 'I']],
            audio: {
                specialRight: 'Valceo/D-1.mp3',
                specialRightIndex: 6,
                left: 'Valceo/I-1.mp3',
                right: 'Valceo/D-2.mp3'
            }
        }
    };

    function flattenGroups(groups) {
        return groups.flat();
    }

    function renderSequence(card, config) {
        const groupsContainer = card.querySelector('.sequence-groups');
        const sequence = flattenGroups(config.groups);
        groupsContainer.replaceChildren();
        config.groups.forEach((group, groupIndex) => {
            const groupElement = document.createElement('span');
            groupElement.className = 'sequence-group';
            group.forEach((hand, hitIndex) => {
                const index = config.groups.slice(0, groupIndex).flat().length + hitIndex;
                const hit = document.createElement('span');
                hit.className = 'sequence-hit';
                hit.dataset.hit = index;
                hit.setAttribute('aria-label', `Golpe ${index + 1}, mano ${hand === 'D' ? 'derecha' : 'izquierda'}`);
                hit.textContent = hand;
                groupElement.appendChild(hit);
                if (hitIndex < group.length - 1) {
                    const dash = document.createElement('span');
                    dash.className = 'sequence-dash';
                    dash.textContent = '-';
                    groupElement.appendChild(dash);
                }
            });
            groupsContainer.appendChild(groupElement);
            if (groupIndex < config.groups.length - 1) {
                const divider = document.createElement('span');
                divider.className = 'sequence-divider';
                divider.textContent = '|';
                groupsContainer.appendChild(divider);
            }
        });
        card.querySelector('.zapateado-sequence').setAttribute('aria-label', `Secuencia del ritmo ${config.title}`);
        return sequence;
    }

    function isolateSvgIds(card, prefix) {
        const svg = card.querySelector('.zapateado-drum');
        if (!svg) return;
        const replacements = new Map();
        svg.querySelectorAll('[id]').forEach(element => {
            const oldId = element.id;
            const newId = `${prefix}${oldId}`;
            replacements.set(oldId, newId);
            element.id = newId;
        });
        svg.querySelectorAll('*').forEach(element => {
            [...element.attributes].forEach(attribute => {
                let value = attribute.value;
                replacements.forEach((newId, oldId) => {
                    value = value.replaceAll(`#${oldId}`, `#${newId}`);
                });
                attribute.value = value;
            });
        });
    }

    function createSimulator(card, config, rhythmKey) {
        const sequence = renderSequence(card, config);
        const hits = [...card.querySelectorAll('.sequence-hit')];
        const rightStick = card.querySelector('.stick-right');
        const leftStick = card.querySelector('.stick-left');
        const ripple = card.querySelector('.hit-ripple');
        const playButton = card.querySelector('.demo-control.primary');
        const pauseButton = card.querySelectorAll('.demo-control')[1];
        const status = card.querySelector('.demo-status');
        const speedInputs = [...card.querySelectorAll('input[name="zapSpeed"], input[name="valceoSpeed"]')];
        let position = 0;
        let timer = null;
        let completionTimer = null;
        let isPlaying = false;
        let nextDue = 0;
        let currentSpeed = 'normal';
        const rhythmAudio = config.audio ? {
            specialRight: config.audio.specialRight ? new Audio(config.audio.specialRight) : null,
            left: new Audio(config.audio.left),
            right: new Audio(config.audio.right)
        } : null;
        let activeRhythmAudio = null;

        if (rhythmAudio) {
            Object.values(rhythmAudio).forEach(audio => {
                if (!audio) return;
                audio.preload = 'auto';
            });
        }

        function stopRhythmAudio() {
            const audio = activeRhythmAudio;
            activeRhythmAudio = null;
            if (!audio) return;

            audio.pause();
            audio.currentTime = 0;
        }

        function playHit(hand, index) {
            if (rhythmAudio) {
                const audio = hand === 'I'
                    ? rhythmAudio.left
                    : (rhythmAudio.specialRight && index === config.audio.specialRightIndex
                        ? rhythmAudio.specialRight
                        : rhythmAudio.right);
                stopRhythmAudio();
                audio.currentTime = 0;
                activeRhythmAudio = audio;
                audio.play().catch(() => {});
                return;
            }

        }

        function clearActive() {
            hits.forEach(hit => hit.classList.remove('is-active'));
            stopMotion();
        }

        function stopMotion() {
            [rightStick, leftStick, ripple].forEach(element => {
                element.getAnimations().forEach(animation => animation.cancel());
            });
            rightStick.classList.remove('is-hit');
            leftStick.classList.remove('is-hit');
            ripple.classList.remove('is-hit');
        }

        function animateStick(stick, hand, beatLength) {
            const resting = hand === 'D' ? 'rotate(27deg)' : 'rotate(-27deg)';
            const strike = hand === 'D' ? 'translateY(28px) rotate(4deg)' : 'translateY(18px) rotate(-8deg)';
            const duration = Math.min(230, Math.max(115, Math.round(beatLength * .72)));
            stick.getAnimations().forEach(animation => animation.cancel());
            const animation = stick.animate([
                { transform: resting, offset: 0 },
                { transform: strike, offset: .52 },
                { transform: resting, offset: 1 }
            ], { duration, easing: hand === 'D' ? 'cubic-bezier(.25,.8,.25,1)' : 'cubic-bezier(.32,.72,.34,1)', fill: 'none' });
            animation.finished.catch(() => {});
        }

        function animateRipple() {
            ripple.getAnimations().forEach(animation => animation.cancel());
            ripple.animate([
                { opacity: .9, transform: 'translate(-50%, -50%) scale(.5)' },
                { opacity: 0, transform: 'translate(-50%, -50%) scale(2.6)' }
            ], { duration: 230, easing: 'ease-out', fill: 'none' });
        }

        function renderHit(index) {
            clearActive();
            const hand = sequence[index];
            hits[index].classList.add('is-active');
            animateStick(hand === 'D' ? rightStick : leftStick, hand, timing[currentSpeed]);
            animateRipple();
            playHit(hand, index);
            status.textContent = `Golpe ${index + 1} de ${sequence.length}: mano ${hand === 'D' ? 'derecha' : 'izquierda'}.`;
        }

        function scheduleNext(delay = 0) {
            if (!isPlaying) return;
            timer = window.setTimeout(() => {
                if (!isPlaying) return;
                renderHit(position);
                position += 1;
                if (position >= sequence.length) {
                    isPlaying = false;
                    timer = null;
                    position = 0;
                    nextDue = 0;
                    rhythmProgress[rhythmKey] = true;
                    persistRhythmProgress();
                    updateMenuProgress();
                    playButton.classList.remove('is-selected');
                    pauseButton.classList.remove('is-selected');
                    completionTimer = window.setTimeout(() => {
                        clearActive();
                        status.textContent = '';
                    }, 260);
                    activeSimulator = null;
                    return;
                }
                nextDue = performance.now() + timing[currentSpeed];
                scheduleNext(timing[currentSpeed]);
            }, delay);
        }

        const api = {
            stopAndReset() {
                isPlaying = false;
                window.clearTimeout(timer);
                window.clearTimeout(completionTimer);
                timer = null;
                completionTimer = null;
                stopRhythmAudio();
                position = 0;
                nextDue = 0;
                clearActive();
                playButton.classList.remove('is-selected');
                pauseButton.classList.remove('is-selected');
                status.textContent = '';
            }
        };

        playButton.addEventListener('click', () => {
            if (isPlaying) return;
            if (activeSimulator && activeSimulator !== api) activeSimulator.stopAndReset();
            activeSimulator = api;
            isPlaying = true;
            playButton.classList.add('is-selected');
            pauseButton.classList.remove('is-selected');
            status.textContent = position ? 'Demostración reanudada.' : 'Reproduciendo…';
            scheduleNext(position ? Math.max(0, nextDue - performance.now()) : 0);
        });

        pauseButton.addEventListener('click', () => {
            if (!isPlaying) return;
            isPlaying = false;
            window.clearTimeout(timer);
            timer = null;
            playButton.classList.remove('is-selected');
            pauseButton.classList.add('is-selected');
            status.textContent = `Pausa en el golpe ${Math.max(1, Math.min(position, sequence.length))} de ${sequence.length}.`;
            stopRhythmAudio();
            stopMotion();
        });

        speedInputs.forEach(input => input.addEventListener('change', () => {
            currentSpeed = input.value;
            if (isPlaying) {
                window.clearTimeout(timer);
                nextDue = performance.now() + timing[currentSpeed];
                scheduleNext(timing[currentSpeed]);
            }
        }));

        return api;
    }

    if (!baseCard || !demoContainer) return;

    baseCard.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    isolateSvgIds(baseCard, 'zapateado-');
    const valceoCard = baseCard.cloneNode(true);
    valceoCard.dataset.rhythm = 'valceo';
    valceoCard.querySelector('.rhythm-card-title').textContent = 'Valceo';
    valceoCard.querySelectorAll('input[name="zapSpeed"]').forEach(input => { input.name = 'valceoSpeed'; });
    valceoCard.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    isolateSvgIds(valceoCard, 'valceo-');
    demoContainer.appendChild(valceoCard);

    const zapateadoSimulator = createSimulator(baseCard, rhythmConfigs.zapateado, 'zapateado');
    const valceoSimulator = createSimulator(valceoCard, rhythmConfigs.valceo, 'valceo');

    // ===== Minijuego: desafíos individuales y combinados =====
    const gameChallengeName = document.getElementById('gameChallengeName');
    const gameCounter = document.getElementById('gameCounter');
    const gameReset = document.getElementById('gameReset');
    const gameResults = document.getElementById('gameResults');
    const expectedResult = document.getElementById('expectedResult');
    const playedResult = document.getElementById('playedResult');
    const gameModal = document.getElementById('gameModal');
    const gameModalTitle = document.getElementById('gameModalTitle');
    const gameModalAccept = document.getElementById('gameModalAccept');
    const gameHitButtons = [...document.querySelectorAll('[data-game-hand]')];
    function audioSequenceFor(rhythm) {
        return flatGroups(rhythmConfigs[rhythm].groups).map((hand, index) => ({ rhythm, index, hand }));
    }

    const gameChallenges = [
        {
            name: 'Zapateado',
            prompt: '¡Toca el ritmo Zapateado!',
            groups: rhythmConfigs.zapateado.groups,
            audioSequence: audioSequenceFor('zapateado')
        },
        {
            name: 'Valceo',
            prompt: '¡Toca el ritmo Valceo!',
            groups: rhythmConfigs.valceo.groups,
            audioSequence: audioSequenceFor('valceo')
        },
        {
            name: 'Zapateado + Valceo',
            prompt: '¡Combina el ritmo Zapateado con Valceo!',
            groups: [...rhythmConfigs.zapateado.groups, ...rhythmConfigs.valceo.groups],
            audioSequence: [...audioSequenceFor('zapateado'), ...audioSequenceFor('valceo')]
        },
        {
            name: 'Valceo + Zapateado',
            prompt: '¡Combina el ritmo Valceo con Zapateado!',
            groups: [...rhythmConfigs.valceo.groups, ...rhythmConfigs.zapateado.groups],
            audioSequence: [...audioSequenceFor('valceo'), ...audioSequenceFor('zapateado')]
        }
    ];
    let currentChallenge;
    let gameExpected = [];
    let gamePlayed = [];
    let gameOutcome = 'error';

    function flatGroups(groups) { return groups.flat(); }

    function gameSound(hand, index) {
        const entry = currentChallenge.audioSequence[index];
        const config = rhythmConfigs[entry.rhythm].audio;
        const path = hand === 'I'
            ? config.left
            : (config.specialRight && entry.index === config.specialRightIndex
                ? config.specialRight
                : config.right);
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.play().catch(() => {});
    }

    function renderGameSequence(container, groups, played, showOutcome) {
        container.replaceChildren();
        let start = 0;
        groups.forEach((group, groupIndex) => {
            const available = played ? Math.max(0, Math.min(group.length, played.length - start)) : group.length;
            for (let offset = 0; offset < available; offset += 1) {
                const index = start + offset;
                const hand = group[offset];
                const hit = document.createElement('span');
                hit.className = 'game-result-hit';
                hit.textContent = (played ? played[index] : hand) || hand;
                if (showOutcome && played) {
                    hit.classList.add(index < gameExpected.length && played[index] === gameExpected[index] ? 'correct' : 'wrong');
                } else if (showOutcome && !played) {
                    hit.classList.add('correct');
                }
                container.appendChild(hit);
            }
            const hasMoreGroups = groupIndex < groups.length - 1;
            const hasMorePlayed = !played || played.length > start + group.length;
            if (hasMoreGroups && available > 0 && hasMorePlayed) {
                const divider = document.createElement('span');
                divider.className = 'game-result-separator';
                divider.textContent = '|';
                container.appendChild(divider);
            }
            start += group.length;
        });
    }

    function updateGameCounter() {
        gameCounter.textContent = `${gamePlayed.length} de ${gameExpected.length} golpes`;
    }

    function setGameButtonsDisabled(disabled) {
        gameHitButtons.forEach(button => { button.disabled = disabled; });
    }

    function showGameModal(message, outcome) {
        gameOutcome = outcome;
        gameModalTitle.textContent = message;
        gameModal.hidden = false;
        setGameButtonsDisabled(true);
        gameModalAccept.focus();
    }

    function chooseGameChallenge() {
        currentChallenge = gameChallenges[Math.floor(Math.random() * gameChallenges.length)];
        gameExpected = flatGroups(currentChallenge.groups);
        gamePlayed = [];
        gameChallengeName.textContent = currentChallenge.name;
        gameResults.hidden = true;
        gameModal.hidden = true;
        updateGameCounter();
        setGameButtonsDisabled(false);
    }

    function stopAllActivities() {
        zapateadoSimulator.stopAndReset();
        valceoSimulator.stopAndReset();
        activeSimulator = null;
        chooseGameChallenge();
    }

    function triggerGameHit(hand, button) {
        if (gameModal.hidden === false || gamePlayed.length >= gameExpected.length) return;
        button?.classList.add('is-playing');
        window.setTimeout(() => button?.classList.remove('is-playing'), 150);
        gameSound(hand, gamePlayed.length);
        gamePlayed.push(hand);
        updateGameCounter();
        const index = gamePlayed.length - 1;
        if (gamePlayed[index] !== gameExpected[index]) {
            showGameModal('¡Ups! Te equivocaste en la secuencia.', 'error');
        } else if (gamePlayed.length === gameExpected.length) {
            showGameModal('¡Excelente! Has tocado correctamente el ritmo solicitado.', 'success');
        }
    }

    gameHitButtons.forEach(button => {
        button.addEventListener('click', () => triggerGameHit(button.dataset.gameHand, button));
    });

    window.addEventListener('keydown', event => {
        if (event.repeat) return;
        const hand = event.key.toUpperCase();
        if (hand !== 'D' && hand !== 'I') return;
        if (activeView !== 'game') return;
        event.preventDefault();
        if (activeView === 'game') {
            const button = gameHitButtons.find(candidate => candidate.dataset.gameHand === hand);
            triggerGameHit(hand, button);
        }
    });

    gameModalAccept.addEventListener('click', () => {
        gameModal.hidden = true;
        gameResults.hidden = false;
        renderGameSequence(expectedResult, currentChallenge.groups, null, gameOutcome === 'success');
        renderGameSequence(playedResult, currentChallenge.groups, gamePlayed, true);
        gameReset.focus();
    });

    gameReset.addEventListener('click', () => {
        chooseGameChallenge();
        gameResults.hidden = false;
        expectedResult.replaceChildren();
        playedResult.replaceChildren();
    });
    chooseGameChallenge();

    const menu = document.getElementById('tamborMenu');
    const demoSection = document.getElementById('tamborDemo');
    const gameSection = document.getElementById('tamborGame');
    const viewSections = [demoSection, gameSection];
    const backButton = document.getElementById('btnBack');
    const menuButton = document.getElementById('btnMenu');
    const menuCards = [...document.querySelectorAll('[data-open-view]')];
    const gameMenuCard = menuCards.find(card => card.dataset.openView === 'game');
    const lockedDialog = document.createElement('dialog');
    lockedDialog.className = 'tambor-lock-dialog';
    lockedDialog.innerHTML = '<p>Antes de continuar, explora los dos tipos de toques: Zapateado y Valceo</p><button type="button">Aceptar</button>';
    document.body.appendChild(lockedDialog);
    lockedDialog.querySelector('button').addEventListener('click', () => lockedDialog.close());

    function updateMenuProgress() {
        const bothRhythmsCompleted = rhythmProgress.zapateado && rhythmProgress.valceo;
        menuCards.forEach(card => {
            const view = card.dataset.openView;
            const isGame = view === 'game';
            const completed = view === 'zapateado' ? rhythmProgress.zapateado : view === 'valceo' ? rhythmProgress.valceo : bothRhythmsCompleted;
            card.classList.toggle('is-complete', completed);
            card.classList.toggle('is-locked', isGame && !bothRhythmsCompleted);
            card.setAttribute('aria-disabled', String(isGame && !bothRhythmsCompleted));
            let state = card.querySelector('.menu-card-state');
            if (!state) {
                state = document.createElement('span');
                state.className = 'menu-card-state';
                state.setAttribute('aria-hidden', 'true');
                card.appendChild(state);
            }
            state.textContent = isGame && !bothRhythmsCompleted ? '🔒' : completed ? '✓' : '';
        });
        if (gameMenuCard) gameMenuCard.title = bothRhythmsCompleted ? '' : 'Completa Zapateado y Valceo para continuar';
    }

    function showMenu() {
        stopAllActivities();
        activeView = 'menu';
        viewSections.forEach(section => section.classList.remove('is-visible'));
        baseCard.hidden = false;
        valceoCard.hidden = false;
        menu.classList.remove('is-hidden');
        backButton.hidden = false;
        menuButton.hidden = true;
    }

    menuButton?.addEventListener('click', showMenu);

    function showView(view) {
        stopAllActivities();
        activeView = view;
        menu.classList.add('is-hidden');
        backButton.hidden = true;
        menuButton.hidden = false;
        viewSections.forEach(section => section.classList.remove('is-visible'));
        baseCard.hidden = view !== 'zapateado';
        valceoCard.hidden = view !== 'valceo';
        if (view === 'zapateado' || view === 'valceo') demoSection.classList.add('is-visible');
        if (view === 'game') gameSection.classList.add('is-visible');
    }

    document.querySelectorAll('[data-open-view]').forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.openView === 'game' && !(rhythmProgress.zapateado && rhythmProgress.valceo)) {
                if (typeof lockedDialog.showModal === 'function') lockedDialog.showModal();
                return;
            }
            showView(card.dataset.openView);
        });
    });
    updateMenuProgress();
    showMenu();

    backButton?.addEventListener('click', () => {
        stopAllActivities();
        window.location.href = 'sonidos.html';
    });
});
