document.addEventListener('DOMContentLoaded', () => {
    const btnBack = document.getElementById('btnBack');
    const fluteNotesGrid = document.getElementById('fluteNotesGrid');
    const fluteNotesStatus = document.getElementById('fluteNotesStatus');
    const positionIntro = document.getElementById('sectionPositionIntro');
    const positionIntroNext = document.getElementById('positionIntroNext');
    const notesSection = document.getElementById('sectionAudio');
    const positionIntroBack = document.getElementById('positionIntroBack');
    const notesNext = document.getElementById('fluteNotesNext');
    const sequenceSection = document.getElementById('sectionSequence');
    const sequenceBack = document.getElementById('fluteSequenceBack');
    const sequenceNext = document.getElementById('fluteSequenceNext');
    const notePracticeSection = document.getElementById('sectionNotePractice');
    const notePracticeBack = document.getElementById('notePracticeBack');

    function showNotesSection() {
        positionIntro.hidden = true;
        positionIntro.classList.remove('active');
        notesSection.hidden = false;
        notesSection.classList.add('active');
        window.scrollTo(0, 0);
    }

    function showPositionIntro() {
        notesSection.hidden = true;
        notesSection.classList.remove('active');
        positionIntro.hidden = false;
        positionIntro.classList.add('active');
        window.scrollTo(0, 0);
        positionIntroNext?.focus({ preventScroll: true });
    }

    function showSequenceSection() {
        notesSection.hidden = true;
        notesSection.classList.remove('active');
        sequenceSection.hidden = false;
        sequenceSection.classList.add('active');
        window.scrollTo(0, 0);
    }

    function showNotesFromSequence() {
        sequenceSection.hidden = true;
        sequenceSection.classList.remove('active');
        notesSection.hidden = false;
        notesSection.classList.add('active');
        window.scrollTo(0, 0);
        notesNext?.focus({ preventScroll: true });
    }

    function showNotePractice() {
        sequenceSection.hidden = true;
        sequenceSection.classList.remove('active');
        notePracticeSection.hidden = false;
        notePracticeSection.classList.add('active');
        window.scrollTo(0, 0);
    }

    function showSequenceFromPractice() {
        notePracticeSection.hidden = true;
        notePracticeSection.classList.remove('active');
        sequenceSection.hidden = false;
        sequenceSection.classList.add('active');
        window.scrollTo(0, 0);
        sequenceNext?.focus({ preventScroll: true });
    }

    positionIntroNext?.addEventListener('click', showNotesSection);
    positionIntroBack?.addEventListener('click', showPositionIntro);
    notesNext?.addEventListener('click', showSequenceSection);
    sequenceBack?.addEventListener('click', showNotesFromSequence);
    sequenceNext?.addEventListener('click', showNotePractice);
    notePracticeBack?.addEventListener('click', showSequenceFromPractice);

    const fluteNoteData = [
        { note: 'SOL', slug: 'sol', thumbOpen: true, frontStates: ['open', 'open', 'open', 'open', 'open', 'covered'] },
        { note: 'FA', slug: 'fa', thumbOpen: false, frontStates: ['open', 'open', 'open', 'open', 'open', 'covered'] },
        { note: 'MI', slug: 'mi', thumbOpen: false, frontStates: ['covered', 'open', 'open', 'open', 'open', 'covered'] },
        { note: 'RE', slug: 're', thumbOpen: false, frontStates: ['covered', 'covered', 'open', 'open', 'open', 'covered'] },
        { note: 'DO', slug: 'do', thumbOpen: false, frontStates: ['covered', 'covered', 'covered', 'open', 'open', 'covered'] },
        { note: 'SI', slug: 'si', thumbOpen: false, frontStates: ['covered', 'covered', 'covered', 'covered', 'open', 'covered'] },
        { note: 'LA', slug: 'la', thumbOpen: false, frontStates: ['covered', 'covered', 'covered', 'covered', 'covered', 'covered'] }
    ];

    const practiceAudioPaths = {
        sol: 'Notas Flauta/sol grave.mp3',
        fa: 'Notas Flauta/FA GRAVE.mp3',
        mi: 'Notas Flauta/Mi Grave.mp3',
        re: 'Notas Flauta/RE GRAVE.mp3',
        do: 'Notas Flauta/DO.mp3',
        si: 'Notas Flauta/SI GRAVE.mp3',
        la: 'Notas Flauta/LA GRAVE.mp3'
    };

    const practiceHoles = [...document.querySelectorAll('.practice-hole')];
    const practiceCounter = document.getElementById('practiceCounter');
    const practiceNoteName = document.getElementById('practiceNoteName');
    const practiceInstruction = document.getElementById('practiceInstruction');
    const practiceFingerList = document.getElementById('practiceFingerList');
    const practiceFeedback = document.getElementById('practiceFeedback');
    const practiceCheck = document.getElementById('practiceCheck');
    const practiceRetry = document.getElementById('practiceRetry');
    const practiceNext = document.getElementById('practiceNext');
    const practiceComplete = document.getElementById('practiceComplete');
    const practiceActions = document.querySelector('.practice-actions');
    const practiceHelp = document.getElementById('practiceHelp');
    const practiceNoHelp = document.getElementById('practiceNoHelp');
    const practiceRestart = document.getElementById('practiceRestart');
    const practiceFinish = document.getElementById('practiceFinish');
    let practiceIndex = 0;
    let practiceWithHelp = true;
    let practiceAudio = null;
    let practiceState = { thumb: 'open', front: Array(6).fill('open') };

    function targetPracticeState(noteData) {
        return {
            thumb: noteData.thumbOpen ? 'open' : 'covered',
            front: [...noteData.frontStates]
        };
    }

    function setPracticeHoleVisual(hole, state) {
        hole.classList.toggle('is-open', state === 'open');
        hole.classList.toggle('is-covered', state === 'covered');
        const label = hole.dataset.hole === 'thumb'
            ? 'Pulgar izquierdo, orificio posterior'
            : ['Índice izquierdo', 'Medio izquierdo', 'Anular izquierdo', 'Índice derecho', 'Medio derecho', 'Anular derecho'][Number(hole.dataset.hole)];
        hole.setAttribute('aria-label', `${label}, ${state === 'open' ? 'abierto' : 'tapado'}`);
    }

    function updatePracticeHints() {
        const target = targetPracticeState(fluteNoteData[practiceIndex]);
        practiceFingerList?.querySelectorAll('li').forEach(item => {
            const state = item.dataset.finger === 'thumb' ? target.thumb : target.front[Number(item.dataset.finger)];
            item.dataset.target = state;
            item.title = practiceWithHelp ? `Debes dejarlo ${state === 'open' ? 'abierto' : 'tapado'}` : 'Recuerda la posición de esta digitación';
            item.classList.toggle('is-target-covered', state === 'covered');
            item.classList.toggle('is-target-open', state === 'open');
        });
        if (practiceInstruction) {
            practiceInstruction.textContent = practiceWithHelp
                ? 'Sigue las indicaciones de los dedos para construir la nota:'
                : 'Recuerda la digitación y construye la nota:';
        }
    }

    function resetPracticeNote() {
        practiceState = { thumb: 'open', front: Array(6).fill('open') };
        practiceHoles.forEach(hole => setPracticeHoleVisual(hole, 'open'));
        practiceFeedback.textContent = '';
        practiceFeedback.className = 'practice-feedback';
        practiceNext.disabled = true;
        updatePracticeHints();
    }

    function renderPracticeNote() {
        const noteData = fluteNoteData[practiceIndex];
        practiceCounter.textContent = `Nota ${practiceIndex + 1} de ${fluteNoteData.length}`;
        practiceNoteName.textContent = noteData.note;
        resetPracticeNote();
    }

    function playPracticeAudio(noteData) {
        practiceAudio?.pause();
        practiceAudio = new Audio(practiceAudioPaths[noteData.slug]);
        practiceAudio.play().catch(() => {
            practiceFeedback.textContent += ' El audio se encuentra pendiente de carga.';
        });
    }

    function practiceMatchesTarget() {
        const target = targetPracticeState(fluteNoteData[practiceIndex]);
        return practiceState.thumb === target.thumb && practiceState.front.every((state, index) => state === target.front[index]);
    }

    practiceHoles.forEach(hole => {
        hole.addEventListener('click', () => {
            const key = hole.dataset.hole;
            if (key === 'thumb') {
                practiceState.thumb = practiceState.thumb === 'open' ? 'covered' : 'open';
                setPracticeHoleVisual(hole, practiceState.thumb);
            } else {
                const index = Number(key);
                practiceState.front[index] = practiceState.front[index] === 'open' ? 'covered' : 'open';
                setPracticeHoleVisual(hole, practiceState.front[index]);
            }
            practiceFeedback.textContent = '';
            practiceFeedback.className = 'practice-feedback';
            practiceNext.disabled = true;
        });
    });

    practiceCheck?.addEventListener('click', () => {
        if (practiceMatchesTarget()) {
            practiceFeedback.textContent = '¡Correcto! Has construido la nota.';
            practiceFeedback.className = 'practice-feedback is-correct';
            practiceNext.disabled = false;
            playPracticeAudio(fluteNoteData[practiceIndex]);
        } else {
            practiceFeedback.textContent = 'Aún no coincide. Revisa los orificios tapados y abiertos.';
            practiceFeedback.className = 'practice-feedback is-incorrect';
            practiceNext.disabled = true;
        }
    });

    practiceRetry?.addEventListener('click', resetPracticeNote);
    practiceNext?.addEventListener('click', () => {
        if (practiceNext.disabled) return;
        if (practiceIndex === fluteNoteData.length - 1) {
            practiceActions.hidden = true;
            practiceComplete.hidden = false;
            practiceFeedback.textContent = '';
            return;
        }
        practiceIndex += 1;
        renderPracticeNote();
    });

    practiceHelp?.addEventListener('click', () => {
        practiceWithHelp = true;
        practiceHelp.classList.add('is-active');
        practiceNoHelp.classList.remove('is-active');
        practiceHelp.setAttribute('aria-pressed', 'true');
        practiceNoHelp.setAttribute('aria-pressed', 'false');
        updatePracticeHints();
    });

    practiceNoHelp?.addEventListener('click', () => {
        practiceWithHelp = false;
        practiceNoHelp.classList.add('is-active');
        practiceHelp.classList.remove('is-active');
        practiceNoHelp.setAttribute('aria-pressed', 'true');
        practiceHelp.setAttribute('aria-pressed', 'false');
        updatePracticeHints();
    });

    practiceRestart?.addEventListener('click', () => {
        practiceIndex = 0;
        practiceComplete.hidden = true;
        practiceActions.hidden = false;
        practiceFinish.disabled = false;
        renderPracticeNote();
    });

    practiceFinish?.addEventListener('click', () => {
        practiceFinish.disabled = true;
        practiceFinish.textContent = 'Finalizada';
        practiceComplete.querySelector('p').textContent = 'Actividad finalizada. ¡Muy bien!';
    });

    renderPracticeNote();

    let activeNoteAudio = null;
    let activeNoteCard = null;
    let activeNoteButton = null;

    btnBack?.addEventListener('click', () => {
        window.location.href = 'sonidos.html';
    });

    function clearActiveNote() {
        if (activeNoteAudio) {
            activeNoteAudio.pause();
            activeNoteAudio.currentTime = 0;
            activeNoteAudio = null;
        }
        activeNoteCard?.classList.remove('is-playing', 'is-selected');
        activeNoteButton?.classList.remove('is-active');
        activeNoteButton?.setAttribute('aria-pressed', 'false');
        activeNoteCard = null;
        activeNoteButton = null;
    }

    function createFluteNoteCard({ note, slug, thumbOpen, frontStates }) {
        const card = document.createElement('article');
        card.className = 'flute-note-card';
        card.dataset.note = note;

        const frontHoles = frontStates.map((state, index) => {
            const label = state === 'open' ? 'abierto' : 'tapado';
            const visualClass = state === 'open' ? 'is-open' : 'is-covered';
            return `<span class="finger-hole ${visualClass}" aria-label="Orificio ${index + 1}: ${label}"></span>`;
        }).join('');
        const thumbState = thumbOpen ? 'is-open' : 'is-covered';

        card.innerHTML = `
            <div class="note-flute" role="img" aria-label="Flauta de carrizo con la digitación de ${note}">
                <div class="flute-mouthpiece"><span class="flute-opening"></span></div>
                <div class="flute-tube">
                    ${frontHoles}
                    <span class="thumb-hole ${thumbState}" aria-label="Orificio posterior del pulgar: ${thumbOpen ? 'abierto' : 'tapado'}"></span>
                </div>
            </div>
            <h3 class="flute-note-label">${note}</h3>
            <div class="flute-note-controls" aria-label="Reproducir nota ${note}">
                <button class="flute-note-button" type="button" data-register="grave" data-audio="audio/flauta/${slug}_grave.mp3" aria-label="Reproducir ${note} grave" aria-pressed="false">Grave</button>
                <button class="flute-note-button" type="button" data-register="agudo" data-audio="audio/flauta/${slug}_agudo.mp3" aria-label="Reproducir ${note} agudo" aria-pressed="false">Agudo</button>
            </div>`;

        return card;
    }

    function playExplorerNote(button) {
        clearActiveNote();

        const card = button.closest('.flute-note-card');
        const note = card.dataset.note;
        const register = button.dataset.register;
        const audioPath = button.dataset.audio;
        const audio = new Audio(audioPath);

        activeNoteAudio = audio;
        activeNoteCard = card;
        activeNoteButton = button;
        card.classList.add('is-selected');
        button.classList.add('is-active');
        button.setAttribute('aria-pressed', 'true');
        fluteNotesStatus.textContent = `${note} ${register}: buscando el audio preparado…`;

        const finishPlayback = () => {
            card.classList.remove('is-playing');
            button.classList.remove('is-active');
            button.setAttribute('aria-pressed', 'false');
            if (activeNoteAudio === audio) {
                activeNoteAudio = null;
                activeNoteCard = null;
                activeNoteButton = null;
            }
        };

        audio.addEventListener('ended', () => {
            finishPlayback();
            fluteNotesStatus.textContent = `${note} ${register}: reproducción terminada.`;
        }, { once: true });

        audio.addEventListener('error', () => {
            finishPlayback();
            fluteNotesStatus.textContent = `Audio pendiente: añade «${audioPath}» para escuchar esta nota.`;
        }, { once: true });

        audio.play().then(() => {
            card.classList.add('is-playing');
            fluteNotesStatus.textContent = `Reproduciendo ${note} ${register}.`;
        }).catch(() => {
            finishPlayback();
            fluteNotesStatus.textContent = `Audio pendiente: añade «${audioPath}» para escuchar esta nota.`;
        });
    }

    if (fluteNotesGrid && fluteNotesStatus) {
        fluteNoteData.forEach(noteData => {
            fluteNotesGrid.appendChild(createFluteNoteCard(noteData));
        });

        fluteNotesGrid.addEventListener('click', event => {
            const button = event.target.closest('.flute-note-button');
            if (button) playExplorerNote(button);
        });
    }
});
