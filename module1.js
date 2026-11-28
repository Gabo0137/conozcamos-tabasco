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

    positionIntroNext?.addEventListener('click', showNotesSection);
    positionIntroBack?.addEventListener('click', showPositionIntro);
    notesNext?.addEventListener('click', showSequenceSection);
    sequenceBack?.addEventListener('click', showNotesFromSequence);

    const fluteNoteData = [
        { note: 'SOL', slug: 'sol', thumbOpen: true, frontStates: ['open', 'open', 'open', 'open', 'open', 'covered'] },
        { note: 'FA', slug: 'fa', thumbOpen: false, frontStates: ['open', 'open', 'open', 'open', 'open', 'covered'] },
        { note: 'MI', slug: 'mi', thumbOpen: false, frontStates: ['covered', 'open', 'open', 'open', 'open', 'covered'] },
        { note: 'RE', slug: 're', thumbOpen: false, frontStates: ['covered', 'covered', 'open', 'open', 'open', 'covered'] },
        { note: 'DO', slug: 'do', thumbOpen: false, frontStates: ['covered', 'covered', 'covered', 'open', 'open', 'covered'] },
        { note: 'SI', slug: 'si', thumbOpen: false, frontStates: ['covered', 'covered', 'covered', 'covered', 'open', 'covered'] },
        { note: 'LA', slug: 'la', thumbOpen: false, frontStates: ['covered', 'covered', 'covered', 'covered', 'covered', 'covered'] }
    ];

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
