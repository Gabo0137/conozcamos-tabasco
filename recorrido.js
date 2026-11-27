/* Cultural route v1: independent from the old instrument completion flags. */
(() => {
  'use strict';
  const key = 'conozcamos_tabasco_recorrido_v1';
  const module = document.body.dataset.module;
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const validModules = ['tradicion', 'instrumentos', 'sonidos', 'descubrimientos'];
  let state = { visited: [], discovered: [], pieces: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved === 'object') {
      for (const field of ['visited', 'discovered']) state[field] = Array.isArray(saved[field]) ? saved[field].filter(v => validModules.includes(v)) : [];
      state.pieces = Array.isArray(saved.pieces) ? saved.pieces.filter(v => Number.isInteger(v) && v >= 0 && v < 3) : [];
    }
  } catch { /* Browsing remains available without storage. */ }
  const persist = () => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* Optional persistence. */ } };
  function status() {
    all('[data-progress]').forEach(el => {
      const id = el.dataset.progress;
      el.textContent = state.discovered.includes(id) ? 'Descubrimiento realizado' : state.visited.includes(id) ? 'Visitado · sigue explorando' : 'Exploración libre';
    });
  }
  function discover() {
    if (!state.discovered.includes(module)) state.discovered.push(module);
    persist(); status();
  }
  if (validModules.includes(module) && !state.visited.includes(module)) { state.visited.push(module); persist(); }
  status();
  // Only one recording or video plays at once, including native media controls.
  document.addEventListener('play', event => {
    if (event.target instanceof HTMLMediaElement) all('audio,video').forEach(media => { if (media !== event.target) media.pause(); });
  }, true);
  all('audio,video').forEach(media => media.addEventListener('error', () => {
    const message = document.getElementById(media.dataset.error);
    if (message) message.textContent = 'No se pudo reproducir este archivo. Puedes continuar explorando y volver a intentarlo.';
  }));
  window.addEventListener('pagehide', () => all('audio,video').forEach(media => media.pause()));
  document.addEventListener('visibilitychange', () => { if (document.hidden) all('audio,video').forEach(media => media.pause()); });
  function select(group, chosen) { all(group).forEach(b => b.setAttribute('aria-pressed', String(b === chosen))); }

  if (module === 'tradicion') {
    const journeyStages = all('[data-journey-stage]');
    const journeySteps = all('[data-journey-target]');
    const journeyNav = $('[data-journey-nav]');
    const journeyState = { current:0, completed:new Set(), mapVisited:new Set(), evaluationFinished:false };
    let restartReinforcementEvaluation = null;
    const journeyStageCount = journeyStages.length;
    const journeyStepLabels = ['Carrusel','Mapa interactivo','¿Sabías que?','Video','Evaluación final'];

    function updateJourneyProgress() {
      const evaluationLocked = journeyState.current === 4 && !journeyState.evaluationFinished;
      journeySteps.forEach((button, index) => {
        const unlocked = index === 0 || journeyState.completed.has(index - 1);
        const current = index === journeyState.current;
        const icon = button.querySelector('.learning-journey-icon');
        button.disabled = evaluationLocked ? !current : !unlocked;
        button.closest('li')?.classList.toggle('is-complete', journeyState.completed.has(index));
        button.closest('li')?.classList.toggle('is-current', current);
        button.closest('li')?.classList.toggle('is-locked', !unlocked);
        button.setAttribute('aria-current', current ? 'step' : 'false');
        button.setAttribute('aria-label', `${journeyStepLabels[index]}${journeyState.completed.has(index) ? ', completada' : !unlocked ? ', bloqueada' : current ? ', actual' : ''}`);
        if (icon) icon.textContent = journeyState.completed.has(index) ? '✓' : !unlocked ? '🔒' : String(index + 1);
      });
      journeyStages.forEach((stage, index) => {
        const isCurrent = index === journeyState.current;
        stage.hidden = !isCurrent;
        stage.classList.toggle('journey-stage-active', isCurrent);
        stage.querySelector('[data-stage-prev]')?.toggleAttribute('hidden', index === 0 || (index === 4 && !journeyState.evaluationFinished));
        const next = stage.querySelector('[data-stage-next]');
        if (next) next.hidden = index === 4 || (index < 2 && !journeyState.completed.has(index));
      });
    }

    function completeJourneyStage(index) {
      journeyState.completed.add(index);
      updateJourneyProgress();
    }

    function scrollToJourneyStage(stage) {
      const navRect = journeyNav?.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const visibleTop = navRect ? navRect.bottom + 8 : 8;
      const targetTop = Math.max(0, window.scrollY + stageRect.top - visibleTop);
      window.scrollTo({ top:targetTop, behavior:'smooth' });
    }

    function showJourneyStage(index) {
      if (index < 0 || index >= journeyStageCount) return;
      if (index === 4 && journeyState.evaluationFinished && restartReinforcementEvaluation) {
        journeyState.evaluationFinished = false;
        journeyState.completed.delete(4);
        restartReinforcementEvaluation();
      }
      const evaluationLocked = journeyState.current === 4 && !journeyState.evaluationFinished;
      const unlocked = index === 0 || journeyState.completed.has(index - 1);
      if (evaluationLocked || !unlocked) return;
      journeyState.current = index;
      updateJourneyProgress();
      const activeStage = journeyStages[index];
      if (activeStage) window.requestAnimationFrame(() => scrollToJourneyStage(activeStage));
      if (index === 1) window.requestAnimationFrame(() => { window.dispatchEvent(new Event('resize')); refreshTabascoMapMarkerPositions(); });
    }

    journeySteps.forEach(button => button.addEventListener('click', () => showJourneyStage(Number(button.dataset.journeyTarget))));
    all('[data-stage-next]').forEach(button => button.addEventListener('click', () => {
      const current = journeyState.current;
      if (current === 2 || current === 3) completeJourneyStage(current);
      showJourneyStage(current + 1);
    }));
    all('[data-stage-prev]').forEach(button => button.addEventListener('click', () => showJourneyStage(journeyState.current - 1)));
    updateJourneyProgress();

    all('.instrument-flip').forEach(button => button.addEventListener('click', () => {
      const flipped = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(flipped));
      button.querySelector('.instrument-front').setAttribute('aria-hidden', String(flipped));
      button.querySelector('.instrument-back').setAttribute('aria-hidden', String(!flipped));
    }));
    const storyTrack = $('.story-track');
    const storyCards = all('[data-story-card]');
    const storyCount = storyCards.length;
    const storyInstruction = document.createElement('p');
    storyInstruction.className = 'story-instruction';
    storyInstruction.textContent = 'Lee la información de cada tarjeta, voltéala y responde correctamente la pregunta para avanzar al siguiente nivel';
    storyTrack?.parentElement?.before(storyInstruction);
    const storyQuestions = [
      { question:'¿Qué instrumentos utilizan los tamborileros?', options:['Guitarra y violín.','Flauta de carrizo y tambores.','Trompeta y maracas.'], correct:1, feedback:['La guitarra y el violín son instrumentos de cuerda. Recuerda que los tamborileros utilizan instrumentos de viento y percusión.','¡Correcto! Has identificado sus instrumentos tradicionales.','Estos instrumentos no corresponden a los mencionados en la tarjeta. Recuerda la agrupación musical que acabas de conocer.'] },
      { question:'¿Con qué pueblo originario se relacionan los antecedentes históricos de los tamborileros?', options:['Pueblo mexica.','Pueblo purépecha.',"Pueblo yokot'an (chontal de Tabasco)."], correct:2, feedback:['Los antecedentes de esta tradición se relacionan con un pueblo originario de Tabasco.','Recuerda que esta tradición tiene raíces en las comunidades indígenas tabasqueñas.','¡Correcto! Esta tradición tiene antecedentes vinculados con el pueblo yokot\'an.'] },
      { question:'¿Quiénes integran una agrupación tradicional de tamborileros?', options:['Flautista y tamborileros.','Guitarristas y cantantes.','Violinistas y trompetistas.'], correct:0, feedback:['¡Correcto! Has identificado a los integrantes de esta agrupación musical.','Recuerda que la agrupación se conforma por músicos que interpretan instrumentos de viento y percusión.','Piensa en los músicos que interpretan los instrumentos tradicionales de los tamborileros.'] },
      { question:'¿Qué ritmos forman parte del repertorio tradicional de los tamborileros?', options:['Rock y jazz.','Zapateados, sones y valseados.','Salsa y merengue.'], correct:1, feedback:['Estos géneros no corresponden al repertorio tradicional presentado en la tarjeta.','¡Correcto! Has reconocido los ritmos de esta tradición musical.','Recuerda los ritmos tradicionales asociados con las celebraciones y danzas tabasqueñas.'] },
      { question:'¿Qué elemento forma parte de la vestimenta tradicional de los tamborileros?', options:['Corbata negra.','Gorra deportiva.','Paliacate rojo.'], correct:2, feedback:['Recuerda los accesorios tradicionales que acompañan la vestimenta de manta blanca.','Este accesorio no corresponde a la vestimenta tradicional presentada.','¡Correcto! El paliacate rojo forma parte de su vestimenta tradicional.'] }
    ];
    const storyEvaluation = storyQuestions.map(() => ({ selectedAnswers:[], correctAnswers:0, incorrectAnswers:0, totalAttempts:0, readAgain:0, responseTimes:[], completed:false, state:'pendiente', startedAt:null, attemptStartedAt:null }));
    window.tamborilerosEvaluation = storyEvaluation;
    let storyIndex = 0;
    let questionPending = false;

    function setStoryNavigationDisabled(disabled) {
      all('#story-prev,#story-next,[data-story]').forEach(control => { control.disabled = disabled; control.setAttribute('aria-disabled', String(disabled)); });
      storyTrack?.classList.toggle('question-pending', disabled);
    }

    function buildQuestionFace(card, index) {
      const front = document.createElement('div');
      front.className = 'story-card-face story-card-front';
      while (card.firstChild) front.append(card.firstChild);
      const flipIcon = document.createElement('span');
      flipIcon.className = 'story-flip-icon';
      flipIcon.setAttribute('aria-hidden', 'true');
      flipIcon.textContent = '↻';
      front.append(flipIcon);
      const back = document.createElement('div');
      back.className = 'story-card-face story-card-back';
      const question = storyQuestions[index];
      back.innerHTML = `<span class="story-quiz-kicker">Refuerza lo aprendido</span><p class="story-quiz-question">${question.question}</p><div class="story-quiz-options" role="group" aria-label="Opciones de respuesta"></div><p class="story-quiz-attempt" aria-live="polite"></p><p class="story-quiz-feedback" aria-live="polite"></p><button type="button" class="story-quiz-action" hidden></button>`;
      const options = back.querySelector('.story-quiz-options');
      question.options.forEach((option, optionIndex) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'story-quiz-option';
        button.dataset.option = String(optionIndex);
        button.textContent = `${String.fromCharCode(65 + optionIndex)}. ${option}`;
        options.append(button);
      });
      const inner = document.createElement('div');
      inner.className = 'story-card-inner';
      inner.append(front, back);
      card.append(inner);
      card.setAttribute('aria-label', `${card.getAttribute('aria-label')}. Haz clic en la tarjeta central para reforzar lo aprendido.`);
    }

    function updateQuizFace(card, index) {
      const record = storyEvaluation[index];
      const attempt = record.totalAttempts + 1;
      card.querySelector('.story-quiz-attempt').textContent = `Intento ${Math.min(attempt, 2)} de 2`;
      card.querySelector('.story-quiz-feedback').textContent = '';
      card.querySelector('.story-quiz-action').hidden = true;
      card.querySelectorAll('.story-quiz-option').forEach((button, optionIndex) => {
        button.disabled = false;
        button.classList.remove('is-correct','is-incorrect');
        button.textContent = `${String.fromCharCode(65 + optionIndex)}. ${storyQuestions[index].options[optionIndex]}`;
      });
    }

    function flipCard(index) {
      if (index !== storyIndex || questionPending) return;
      const card = storyCards[index];
      const record = storyEvaluation[index];
      record.startedAt ??= Date.now();
      record.attemptStartedAt = Date.now();
      record.totalAttempts = 0;
      updateQuizFace(card, index);
      card.classList.add('is-flipped');
      questionPending = true;
      setStoryNavigationDisabled(true);
    }

    function finishQuiz(card, index, passed) {
      const record = storyEvaluation[index];
      card.querySelectorAll('.story-quiz-option').forEach(button => { button.disabled = true; });
      const action = card.querySelector('.story-quiz-action');
      action.hidden = false;
      action.textContent = passed ? 'Volver a la información' : (record.totalAttempts === 1 ? 'Intentar nuevamente' : 'Volver a leer');
      action.dataset.action = passed ? 'return' : (record.totalAttempts === 1 ? 'retry' : 'review');
    }

    function answerQuiz(index, optionIndex) {
      const card = storyCards[index];
      const record = storyEvaluation[index];
      const question = storyQuestions[index];
      if (!questionPending || index !== storyIndex || record.totalAttempts >= 2) return;
      record.totalAttempts += 1;
      record.selectedAnswers.push(optionIndex);
      record.responseTimes.push(Date.now() - record.attemptStartedAt);
      const correct = optionIndex === question.correct;
      const option = card.querySelector(`[data-option="${optionIndex}"]`);
      option.classList.add(correct ? 'is-correct' : 'is-incorrect');
      option.insertAdjacentHTML('beforeend', `<span class="story-quiz-result-icon" aria-hidden="true">${correct ? '✓' : '✕'}</span>`);
      card.querySelectorAll('.story-quiz-option').forEach(button => { button.disabled = true; });
      const feedback = card.querySelector('.story-quiz-feedback');
      feedback.innerHTML = `<strong>${correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}</strong><span>${question.feedback[optionIndex].replace(/^¡Correcto!\s*/, '')}</span>`;
      if (correct) {
        record.correctAnswers += 1; record.completed = true; record.state = 'completada';
        card.classList.add('is-completed');
        if (storyEvaluation.every(item => item.completed)) completeJourneyStage(0);
        finishQuiz(card, index, true);
      } else {
        record.incorrectAnswers += 1;
        finishQuiz(card, index, false);
      }
    }

    function returnToFront(index, action) {
      const card = storyCards[index];
      const record = storyEvaluation[index];
      if (action === 'retry') { updateQuizFace(card, index); record.attemptStartedAt = Date.now(); return; }
      if (action === 'review') record.readAgain += 1;
      card.classList.remove('is-flipped');
      questionPending = false;
      setStoryNavigationDisabled(false);
      if (action === 'return' || action === 'review') { record.totalAttempts = 0; record.attemptStartedAt = null; }
    }

    storyCards.forEach((card, index) => {
      buildQuestionFace(card, index);
      card.querySelectorAll('.story-quiz-option').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); answerQuiz(index, Number(button.dataset.option)); }));
      card.querySelector('.story-quiz-action').addEventListener('click', event => { event.stopPropagation(); returnToFront(index, card.querySelector('.story-quiz-action').dataset.action); });
      card.addEventListener('click', () => { if (index === storyIndex && !card.classList.contains('is-flipped')) flipCard(index); else if (index !== storyIndex && !questionPending) renderStory(index); });
      card.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && index === storyIndex && !questionPending) { event.preventDefault(); flipCard(index); } });
    });

    function renderStory(index) {
      if (!storyCount || questionPending) return;
      storyIndex = (index + storyCount) % storyCount;
      storyCards.forEach((card, i) => {
        const offset = (i - storyIndex + storyCount) % storyCount;
        card.classList.toggle('is-active', offset === 0);
        card.classList.toggle('is-prev', offset === storyCount - 1);
        card.classList.toggle('is-next', offset === 1);
        card.classList.toggle('is-hidden', offset > 1 && offset < storyCount - 1);
        card.setAttribute('aria-hidden', String(offset > 1 && offset < storyCount - 1));
      });
      all('[data-story]').forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.story) === storyIndex)));
    }
    all('[data-story]').forEach(button => button.addEventListener('click', () => renderStory(Number(button.dataset.story))));
    $('#story-prev')?.addEventListener('click', () => renderStory(storyIndex - 1));
    $('#story-next')?.addEventListener('click', () => renderStory(storyIndex + 1));
    let storyTouchStart = 0;
    storyTrack?.addEventListener('touchstart', event => { if (!questionPending) storyTouchStart = event.changedTouches[0].clientX; }, { passive: true });
    storyTrack?.addEventListener('touchend', event => { if (!questionPending) { const distance = event.changedTouches[0].clientX - storyTouchStart; if (Math.abs(distance) > 45) renderStory(storyIndex + (distance < 0 ? 1 : -1)); } }, { passive: true });
    storyTrack?.addEventListener('keydown', event => { if (!questionPending && event.key === 'ArrowLeft') renderStory(storyIndex - 1); if (!questionPending && event.key === 'ArrowRight') renderStory(storyIndex + 1); });
    renderStory(0);

    const municipalityData = {
      '27013': { title:'Nacajuca', description:'En comunidades yokot’an como Tucta, los tamborileros acompañan la Danza del Baila Viejo, fiestas patronales, ofrendas de siembra y celebraciones religiosas.', image:'Nacajuca.webp' },
      '27003': { title:'Centla', description:'Forma parte de la región yokot’an, donde la tradición musical de los tamborileros se transmite de generación en generación.', image:'centla.webp' },
      '27004': { title:'Centro', description:'La música de los tamborileros forma parte de la vida cultural del municipio y se relaciona con danzas como la del Caballito y diversas celebraciones comunitarias.', image:'Centro.webp' },
      '27012': { title:'Macuspana', description:'Cuenta con agrupaciones como el Semillero Creativo «Talla Brava», que contribuyen a la continuidad de esta tradición musical.', image:'Macuspana.webp' },
      '27010': { title:'Jalpa de Méndez', description:'Forma parte de la región yokot’an, donde la tradición de los tamborileros se conserva en las comunidades y familias.', image:'Jalpa.webp' },
      '27011': { title:'Jonuta', description:'Cuenta con población yokot’an y presencia tradicional de agrupaciones de tamborileros.', image:'Jonuta.webp' },
      '27005': { title:'Comalcalco', description:'Cuenta con agrupaciones de tamborileros reconocidas en el inventario estatal de patrimonio cultural inmaterial. Esta tradición también se enseña en casas de cultura.', image:'Comalcalco.webp' },
      '27015': { title:'Tacotalpa', description:'Cuenta con la agrupación de tamborileros «Iak Guid», registrada en el programa Cultura Comunitaria.', image:'Tacotalpa.webp' }
    };
    const mapHost = $('#tabascoMap');
    const municipalityCard = $('#municipalityCard');
    const municipalityImage = $('#municipalityImage');
    const municipalityTitle = $('#municipalityTitle');
    const municipalityDescription = $('#municipalityDescription');
    let selectedMunicipality = '27013';
    let mapLayout = null;

    function updateMunicipalityMarkerLabels() {
      const markers = all('.tabasco-map-marker');
      const selectedMarker = markers.find(marker => marker.dataset.municipality === selectedMunicipality);
      markers.forEach(marker => {
        const isSelected = marker === selectedMarker;
        marker.style.zIndex = isSelected ? '20' : '3';
        const label = marker.querySelector('.tabasco-map-marker-label');
        if (!label) return;
        label.dataset.position = 'top';
        label.style.removeProperty('--label-shift-x');
        label.style.removeProperty('--label-shift-y');
      });
      if (!selectedMarker || markers.length < 2) return;

      const hostRect = mapHost.getBoundingClientRect();
      const markerRect = selectedMarker.getBoundingClientRect();
      const label = selectedMarker.querySelector('.tabasco-map-marker-label');
      if (!label) return;
      const labelRect = label.getBoundingClientRect();
      const gap = 10;
      const spaces = {
        top: markerRect.top - hostRect.top,
        bottom: hostRect.bottom - markerRect.bottom,
        right: hostRect.right - markerRect.right,
        left: markerRect.left - hostRect.left
      };
      const fits = {
        top: spaces.top >= labelRect.height + gap,
        bottom: spaces.bottom >= labelRect.height + gap,
        right: spaces.right >= labelRect.width + gap,
        left: spaces.left >= labelRect.width + gap
      };
      const position = ['top', 'bottom', 'right', 'left'].find(side => fits[side]) || Object.keys(spaces).sort((a, b) => spaces[b] - spaces[a])[0];
      label.dataset.position = position;

      if (position === 'top' || position === 'bottom') {
        const markerCenter = markerRect.left + markerRect.width / 2;
        const desiredLeft = markerCenter - labelRect.width / 2;
        const clampedLeft = Math.min(hostRect.right - labelRect.width - 4, Math.max(hostRect.left + 4, desiredLeft));
        label.style.setProperty('--label-shift-x', `${clampedLeft - desiredLeft}px`);
      } else {
        const markerCenter = markerRect.top + markerRect.height / 2;
        const desiredTop = markerCenter - labelRect.height / 2;
        const clampedTop = Math.min(hostRect.bottom - labelRect.height - 4, Math.max(hostRect.top + 4, desiredTop));
        label.style.setProperty('--label-shift-y', `${clampedTop - desiredTop}px`);
      }
    }

    function renderMunicipality(id, interacted = false) {
      const municipality = municipalityData[id];
      if (!municipality) return;
      selectedMunicipality = id;
      if (interacted) {
        journeyState.mapVisited.add(id);
        if (journeyState.mapVisited.size === Object.keys(municipalityData).length) completeJourneyStage(1);
      }
      all('#tabascoMap svg path').forEach(path => path.classList.toggle('is-selected', path.id === id));
      all('.tabasco-map-marker').forEach(marker => {
        const selected = marker.dataset.municipality === id;
        const visited = journeyState.mapVisited.has(marker.dataset.municipality);
        marker.classList.toggle('is-selected', selected);
        marker.classList.toggle('is-visited', visited);
        marker.dataset.visited = String(visited);
        marker.setAttribute('aria-pressed', String(selected));
      });
      window.requestAnimationFrame(updateMunicipalityMarkerLabels);
      municipalityCard?.classList.add('is-changing');
      municipalityTitle.textContent = municipality.title;
      municipalityDescription.textContent = municipality.description;
      municipalityImage.alt = `Fotografía pendiente de ${municipality.title}`;
      municipalityImage.hidden = true;
      municipalityImage.onload = () => { municipalityImage.hidden = false; municipalityCard?.classList.remove('is-changing'); };
      municipalityImage.onerror = () => { municipalityImage.hidden = true; municipalityCard?.classList.remove('is-changing'); };
      municipalityImage.src = municipality.image;
      window.setTimeout(() => municipalityCard?.classList.remove('is-changing'), 280);
    }

    function refreshTabascoMapMarkerPositions() {
      const svg = mapHost?.querySelector('svg');
      if (!svg || !mapLayout) return;
      Object.keys(municipalityData).forEach(id => {
        const path = svg.getElementById(id);
        const marker = mapHost.querySelector(`[data-municipality="${id}"]`);
        if (!path || !marker) return;
        const bounds = path.getBBox();
        marker.style.left = `${((bounds.x + bounds.width / 2 - mapLayout.viewBoxX) / mapLayout.viewBoxWidth) * 100}%`;
        marker.style.top = `${((bounds.y + bounds.height / 2 - mapLayout.viewBoxY) / mapLayout.viewBoxHeight) * 100}%`;
      });
      updateMunicipalityMarkerLabels();
    }

    function activateTabascoMap(svg) {
        if (!svg || svg.tagName.toLowerCase() !== 'svg') throw new Error('SVG inválido');
        svg.classList.add('tabasco-map-svg');
        svg.setAttribute('aria-hidden', 'true');
        mapHost.replaceChildren(svg);
        const originalViewBox = svg.getAttribute('viewBox').trim().split(/\s+/).map(Number);
        const [originalX, originalY, originalWidth, originalHeight] = originalViewBox;
        const mapMargin = Math.min(originalWidth, originalHeight) * 0.045;
        const viewBoxX = originalX - mapMargin;
        const viewBoxY = originalY - mapMargin;
        const viewBoxWidth = originalWidth + mapMargin * 2;
        const viewBoxHeight = originalHeight + mapMargin * 2;
        mapLayout = { viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight };
        svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
        Object.entries(municipalityData).forEach(([id, municipality]) => {
          const path = svg.getElementById(id);
          if (!path) return;
          const bounds = path.getBBox();
          const marker = document.createElement('button');
          marker.type = 'button';
          marker.className = 'tabasco-map-marker';
          marker.dataset.municipality = id;
          marker.setAttribute('aria-label', municipality.title);
          marker.setAttribute('aria-pressed', 'false');
          const label = document.createElement('span');
          label.className = 'tabasco-map-marker-label';
          label.textContent = municipality.title;
          label.dataset.position = 'top';
          marker.append(label);
          marker.addEventListener('click', () => renderMunicipality(id, true));
          marker.style.left = `${((bounds.x + bounds.width / 2 - viewBoxX) / viewBoxWidth) * 100}%`;
          marker.style.top = `${((bounds.y + bounds.height / 2 - viewBoxY) / viewBoxHeight) * 100}%`;
          mapHost.append(marker);
          path.addEventListener('click', () => renderMunicipality(id, true));
          path.setAttribute('tabindex', '0');
          path.setAttribute('aria-label', municipality.title);
        });
        renderMunicipality(selectedMunicipality);
        refreshTabascoMapMarkerPositions();
        window.addEventListener('resize', updateMunicipalityMarkerLabels, { passive: true });
    }

    async function loadTabascoMap() {
      if (!mapHost) return;
      try {
        const response = await fetch('tabasco-municipios.svg');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const svgText = await response.text();
        const template = document.createElement('template');
        template.innerHTML = svgText;
        activateTabascoMap(template.content.firstElementChild);
      } catch (error) {
        console.error('No se pudo cargar el mapa municipal de Tabasco', error);
        if (window.location.protocol === 'file:') {
          const object = document.createElement('object');
          object.className = 'tabasco-map-object';
          object.type = 'image/svg+xml';
          object.data = 'tabasco-municipios.svg';
          object.setAttribute('aria-label', 'Mapa vectorial de los municipios de Tabasco');
          object.addEventListener('load', () => {
            try { activateTabascoMap(object.contentDocument.documentElement); }
            catch (fallbackError) { console.error('No se pudo activar el mapa local', fallbackError); }
          }, { once: true });
          mapHost.replaceChildren(object);
          return;
        }
        const message = document.createElement('p');
        message.className = 'tabasco-map-loading';
        message.textContent = 'No se pudo cargar el mapa. Las tarjetas están preparadas para futuras fotografías municipales.';
        mapHost.replaceChildren(message);
        renderMunicipality(selectedMunicipality);
      }
    }
    loadTabascoMap();

    const reinforcementActivity = $('#reinforcementActivity');
    const reinforcementProgress = $('#reinforcementProgress');
    const reinforcementProgressFill = $('#reinforcementProgressFill');
    if (reinforcementActivity) {
      const reinforcementSection = reinforcementActivity.closest('.reinforcement-section');
      const reinforcementHeading = reinforcementSection?.querySelector('.reinforcement-heading');
      const reinforcementProgressContainer = reinforcementSection?.querySelector('.reinforcement-progress');
      const reinforcementData = [
      { type:'multi-image', title:'Identifica los instrumentos', instruction:'Selecciona los dos instrumentos que utilizan tradicionalmente los tamborileros.', correct:['flauta','tambor'], feedbackCorrect:'¡Excelente! La flauta de carrizo interpreta la melodía y los tambores acompañan con sus ritmos.', feedbackIncorrect:'Recuerda que los tamborileros utilizan instrumentos de viento y percusión.', options:[{id:'flauta',label:'Flauta de carrizo',image:'Flauta.webp',alt:'Flauta de carrizo'},{id:'guitarra',label:'Guitarra',image:'Guitarra clásica de madera miel.webp',alt:'Guitarra clásica de madera'},{id:'violin',label:'Violín',image:'Violín de madera y arco realistas.webp',alt:'Violín de madera con arco'},{id:'tambor',label:'Tambor tradicional',image:'Tambor.png',alt:'Tambor tradicional'}] },
        { type:'image-single', title:'Reconoce la vestimenta tradicional', instruction:'Selecciona la imagen que representa la vestimenta tradicional de los tamborileros de Tabasco.', correct:['traje-tamborilero'], feedbackCorrect:'¡Correcto! Su vestimenta tradicional incluye prendas de manta blanca, paliacate rojo, sombrero chontal y huaraches.', feedbackIncorrect:'Recuerda las prendas blancas y los accesorios que caracterizan a los tamborileros tabasqueños.', options:[{id:'traje-tamborilero',image:'Traje Tamborilero.webp',alt:'Traje tradicional de tamborilero tabasqueño'},{id:'mariachi',image:'Mariachi.webp',alt:'Traje de mariachi'},{id:'ropa-casual',image:'Ropa casual.webp',alt:'Ropa casual'}] },
        { type:'multi-text', title:'Reconoce los municipios', instruction:'Selecciona los tres municipios que conociste durante la exploración del mapa.', correct:['Nacajuca','Centla','Macuspana'], feedbackCorrect:'¡Excelente! Has reconocido tres de los municipios presentados durante el recorrido.', feedbackIncorrect:'Algunos de los municipios seleccionados no estaban destacados en el mapa. Recuerda los lugares que exploraste e inténtalo nuevamente.', options:['Nacajuca','Centla','Cárdenas','Balancán','Macuspana','Tenosique'] },
        { type:'single-text', title:'Nuestro patrimonio cultural', instruction:'¿Qué reconocimiento recibió la música de los tamborileros de Tabasco?', correct:['A'], feedbackCorrect:'¡Correcto! Este reconocimiento contribuye a fortalecer la identidad y las raíces culturales de Tabasco.', feedbackIncorrect:'Recuerda que la música es una expresión cultural que se transmite de generación en generación.', options:[{id:'A',label:'Patrimonio Cultural Intangible del Estado de Tabasco'},{id:'B',label:'Patrimonio Natural del Estado de Tabasco'},{id:'C',label:'Patrimonio Cultural Tangible del Estado de Tabasco'}] }
      ];
      let reinforcementRecords = reinforcementData.map(() => ({ firstAttemptCorrect:false, incorrectAnswers:0, attempts:0, responseTime:0, completed:false, startedAt:null }));
      const reinforcementHistory = [];
      window.tamborilerosReinforcementEvaluation = reinforcementRecords;
      window.tamborilerosReinforcementHistory = reinforcementHistory;
      let reinforcementIndex = 0;

      const shuffle = items => [...items].sort(() => Math.random() - 0.5);
      const getOptions = activity => activity.options.map(option => typeof option === 'string' ? { id:option, label:option } : option);
      const optionMarkup = (activity, option) => {
        if (activity.type === 'multi-image' || activity.type === 'image-single') return `<button type="button" class="reinforcement-option reinforcement-image-option" data-value="${option.id}"><span class="reinforcement-image-wrap"><img src="${option.image}" alt="${option.alt}" data-fallback="Imagen pendiente"></span>${activity.type === 'multi-image' ? `<span class="reinforcement-option-name">${option.label}</span>` : ''}</button>`;
        return `<button type="button" class="reinforcement-option reinforcement-text-option" data-value="${option.id}">${activity.type === 'single-text' ? `${option.id}. ${option.label}` : option.label}</button>`;
      };

      function updateReinforcementControls() {
        const activity = reinforcementData[reinforcementIndex];
        const count = reinforcementActivity.querySelectorAll('.reinforcement-option.is-selected').length;
        const required = activity.type === 'multi-image' ? 2 : activity.type === 'multi-text' ? 3 : 1;
        const counter = reinforcementActivity.querySelector('.reinforcement-selection-count');
        const check = reinforcementActivity.querySelector('[data-reinforcement-check]');
        if (counter) counter.textContent = activity.type === 'multi-image' ? `${count} de 2 instrumentos seleccionados` : activity.type === 'multi-text' ? `${count} de 3 municipios seleccionados` : '';
        if (check) check.disabled = count !== required;
      }

      function showCompletion() {
        reinforcementActivity.classList.remove('is-changing');
        reinforcementSection?.classList.add('is-complete');
        reinforcementHeading?.toggleAttribute('hidden', true);
        reinforcementProgressContainer?.toggleAttribute('hidden', true);
        reinforcementActivity.innerHTML = '<div class="reinforcement-complete"><div class="reinforcement-complete-icon" aria-hidden="true">✓</div><h3>¡Excelente! Has completado la evaluación</h3><p>Ahora conoces los instrumentos, la vestimenta, algunos de los municipios y la importancia cultural de los tamborileros de Tabasco.</p><div class="reinforcement-complete-actions"><button type="button" class="reinforcement-return" data-reinforcement-return>Volver al contenido</button><button type="button" class="reinforcement-finish" data-reinforcement-finish>Finalizar</button></div></div>';
        reinforcementActivity.querySelector('[data-reinforcement-return]').addEventListener('click', () => showJourneyStage(0));
        reinforcementActivity.querySelector('[data-reinforcement-finish]').addEventListener('click', () => { discover(); window.location.assign('course.html#mapa'); });
        journeyState.evaluationFinished = true;
        completeJourneyStage(4);
        discover();
      }

      restartReinforcementEvaluation = () => {
        reinforcementSection?.classList.remove('is-complete');
        reinforcementHeading?.toggleAttribute('hidden', false);
        reinforcementProgressContainer?.toggleAttribute('hidden', false);
        reinforcementHistory.push(reinforcementRecords.map(record => ({ ...record })));
        reinforcementRecords = reinforcementData.map(() => ({ firstAttemptCorrect:false, incorrectAnswers:0, attempts:0, responseTime:0, completed:false, startedAt:null }));
        window.tamborilerosReinforcementEvaluation = reinforcementRecords;
        reinforcementIndex = 0;
        reinforcementActivity.classList.add('is-changing');
        window.setTimeout(renderReinforcement, 180);
      };

      function renderReinforcement() {
        if (reinforcementIndex >= reinforcementData.length) { showCompletion(); return; }
        const activity = reinforcementData[reinforcementIndex];
        const record = reinforcementRecords[reinforcementIndex];
        record.startedAt ??= Date.now();
        const options = shuffle(getOptions(activity));
        const isMulti = activity.type === 'multi-image' || activity.type === 'multi-text';
        reinforcementProgress.textContent = `Actividad ${reinforcementIndex + 1} de ${reinforcementData.length}`;
        reinforcementProgressFill.style.width = `${(reinforcementIndex / reinforcementData.length) * 100}%`;
        reinforcementActivity.classList.remove('is-changing');
        reinforcementActivity.innerHTML = `<div class="reinforcement-card"><div class="reinforcement-card-top"><span>Actividad ${reinforcementIndex + 1}</span><span class="reinforcement-card-tag">${isMulti ? 'Selección múltiple' : 'Selección única'}</span></div><h3>${activity.title}</h3><p class="reinforcement-instruction">${activity.instruction}</p><div class="reinforcement-options ${activity.type}" role="group" aria-label="Opciones de la actividad">${options.map(option => optionMarkup(activity, option)).join('')}</div><p class="reinforcement-selection-count" aria-live="polite"></p><p class="reinforcement-feedback" aria-live="polite"></p><div class="reinforcement-actions"><button type="button" class="reinforcement-check" data-reinforcement-check disabled>Comprobar</button><button type="button" class="reinforcement-next" data-reinforcement-next hidden>Siguiente</button></div></div>`;
        reinforcementActivity.querySelectorAll('img[data-fallback]').forEach(image => image.addEventListener('error', () => { image.classList.add('is-missing'); image.parentElement.dataset.fallback = image.dataset.fallback; }));
        reinforcementActivity.querySelectorAll('.reinforcement-option').forEach(option => option.addEventListener('click', () => {
          if (option.disabled) return;
          if (isMulti) {
            const max = activity.type === 'multi-image' ? 2 : 3;
            if (!option.classList.contains('is-selected') && reinforcementActivity.querySelectorAll('.reinforcement-option.is-selected').length >= max) return;
            option.classList.toggle('is-selected');
          } else {
            reinforcementActivity.querySelectorAll('.reinforcement-option').forEach(item => item.classList.remove('is-selected'));
            option.classList.add('is-selected');
          }
          updateReinforcementControls();
        }));
        reinforcementActivity.querySelector('[data-reinforcement-check]').addEventListener('click', checkReinforcement);
      }

      function checkReinforcement() {
        const activity = reinforcementData[reinforcementIndex];
        const record = reinforcementRecords[reinforcementIndex];
        const check = reinforcementActivity.querySelector('[data-reinforcement-check]');
        if (check.dataset.mode === 'retry') { record.startedAt = Date.now(); renderReinforcement(); return; }
        const selected = [...reinforcementActivity.querySelectorAll('.reinforcement-option.is-selected')].map(option => option.dataset.value);
        record.attempts += 1;
        record.responseTime += Date.now() - record.startedAt;
        const correct = selected.length === activity.correct.length && selected.every(value => activity.correct.includes(value));
        reinforcementActivity.querySelectorAll('.reinforcement-option').forEach(option => {
          const isCorrectOption = activity.correct.includes(option.dataset.value);
          option.disabled = true;
          option.classList.toggle('is-correct', isCorrectOption);
          option.classList.toggle('is-incorrect', selected.includes(option.dataset.value) && !isCorrectOption);
        });
        const feedback = reinforcementActivity.querySelector('.reinforcement-feedback');
        feedback.className = `reinforcement-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
        feedback.innerHTML = `<strong>${correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}</strong><span>${correct ? activity.feedbackCorrect : activity.feedbackIncorrect}</span>`;
        if (correct) {
          record.firstAttemptCorrect = record.attempts === 1;
          record.completed = true;
          reinforcementProgressFill.style.width = `${((reinforcementIndex + 1) / reinforcementData.length) * 100}%`;
          check.hidden = true;
          const next = reinforcementActivity.querySelector('[data-reinforcement-next]');
          next.hidden = false;
          next.addEventListener('click', () => { reinforcementIndex += 1; reinforcementActivity.classList.add('is-changing'); window.setTimeout(renderReinforcement, 180); });
        } else {
          record.incorrectAnswers += 1;
          check.dataset.mode = 'retry';
          check.textContent = 'Intentar nuevamente';
          check.disabled = false;
        }
      }
      renderReinforcement();
    }

    all('[data-culture-answer]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.cultureAnswer === 'people';
      $('#culture-feedback').textContent = correct ? 'Así es. Los objetos importan, y la tradición continúa cuando las personas comparten su música y sus saberes.' : 'Los instrumentos son una parte. Piensa también en quienes los elaboran, interpretan y enseñan a otras personas.';
      $('#culture-feedback').classList.toggle('success', correct);
      if (correct) discover();
    }));
  }

  if (module === 'instrumentos') {
    let instrument = 0;
    const instrumentJourneyState = { current:0, completed:new Set(), visited:{ 0:new Set(), 1:new Set() }, hotspots:{ 0:new Set(), 1:new Set() }, evaluationCompleted:0, evaluationActive:false, evaluationFinished:false };
    const instrumentJourneyButtons = all('[data-instrument-stage]');
    const instrumentLearningContent = $('#instrument-learning-content');
    const instrumentPrevButton = $('[data-instrument-prev]');
    const instrumentNextButton = $('[data-instrument-next]');

    function instrumentStageComplete(index) {
      if (index === 0) return instrumentJourneyState.visited[0].size >= 3 && instrumentJourneyState.hotspots[0].size >= 4;
      if (index === 1) return instrumentJourneyState.visited[1].size >= 3 && instrumentJourneyState.hotspots[1].size >= 4;
      return instrumentJourneyState.evaluationFinished;
    }

    function updateInstrumentJourney() {
      const fluteComplete = instrumentStageComplete(0);
      const drumComplete = instrumentStageComplete(1);
      if (fluteComplete) instrumentJourneyState.completed.add(0);
      if (drumComplete) instrumentJourneyState.completed.add(1);
      if (instrumentJourneyState.evaluationFinished) instrumentJourneyState.completed.add(2);
      const evaluationUnlocked = fluteComplete && drumComplete;
      const totalProgress = Math.min(19, instrumentJourneyState.visited[0].size + instrumentJourneyState.hotspots[0].size + instrumentJourneyState.visited[1].size + instrumentJourneyState.hotspots[1].size + instrumentJourneyState.evaluationCompleted);
      const percentage = Math.round((totalProgress / 19) * 100);
      const percentageLabel = $('[data-instrument-percentage]');
      const percentageFill = $('[data-instrument-progress-fill]');
      if (percentageLabel) percentageLabel.textContent = `${percentage}%`;
      if (percentageFill) percentageFill.style.width = `${percentage}%`;
      instrumentJourneyButtons.forEach((button, index) => {
        const unlocked = index === 0 || (index === 1 && fluteComplete) || (index === 2 && evaluationUnlocked);
        const current = index === instrumentJourneyState.current;
        const lockedByEvaluation = instrumentJourneyState.evaluationActive && !instrumentJourneyState.evaluationFinished && index !== 2;
        button.disabled = !unlocked || lockedByEvaluation;
        button.closest('li')?.classList.toggle('is-current', current);
        button.closest('li')?.classList.toggle('is-complete', instrumentJourneyState.completed.has(index));
        button.closest('li')?.classList.toggle('is-locked', !unlocked);
        button.setAttribute('aria-current', current ? 'step' : 'false');
        const icon = button.querySelector('.instrument-journey-icon');
        if (icon) icon.textContent = instrumentJourneyState.completed.has(index) ? '✓' : !unlocked ? '🔒' : String(index + 1);
      });
      const evaluationStart = $('#startInstrumentEvaluation');
      if (evaluationStart) evaluationStart.disabled = !evaluationUnlocked || instrumentJourneyState.evaluationActive;
      const evaluationLaunch = $('#instrumentEvaluationLaunch');
      if (evaluationLaunch && !evaluationUnlocked && !instrumentJourneyState.evaluationActive && !instrumentJourneyState.evaluationFinished) evaluationLaunch.hidden = true;
      if (instrumentPrevButton) instrumentPrevButton.hidden = instrumentJourneyState.current === 0 || (instrumentJourneyState.current === 2 && !instrumentJourneyState.evaluationFinished) || instrumentJourneyState.evaluationActive;
      if (instrumentNextButton) instrumentNextButton.hidden = !((instrumentJourneyState.current === 0 && fluteComplete) || (instrumentJourneyState.current === 1 && drumComplete)) || instrumentJourneyState.evaluationActive;
    }

    function showInstrumentStage(index) {
      const fluteComplete = instrumentStageComplete(0);
      const evaluationUnlocked = fluteComplete && instrumentStageComplete(1);
      if (index === 1 && !fluteComplete) return;
      if (index === 2 && !evaluationUnlocked) return;
      if (instrumentJourneyState.evaluationActive && !instrumentJourneyState.evaluationFinished && index !== 2) return;
      instrumentJourneyState.current = index;
      const launch = $('#instrumentEvaluationLaunch');
      const panel = $('#instrumentEvaluationPanel');
      if (index < 2) {
        instrument = index;
        instrumentJourneyState.visited[index].add(0);
        $('#instrument-image').src = instruments[instrument].image;
        $('#instrument-image').alt = instruments[instrument].name;
        instrumentLearningContent.hidden = false;
        if (typeof showDetail === 'function') showDetail(0);
        if (launch) launch.hidden = true;
        if (panel) panel.hidden = true;
      } else {
        instrumentLearningContent.hidden = true;
        if (launch) launch.hidden = false;
        if (panel) panel.hidden = !instrumentJourneyState.evaluationActive;
        const start = $('#startInstrumentEvaluation');
        if (start) start.textContent = instrumentJourneyState.evaluationFinished ? 'Repetir evaluación' : 'Comenzar evaluación';
      }
      updateInstrumentJourney();
    }

    instrumentJourneyButtons.forEach(button => button.addEventListener('click', () => showInstrumentStage(Number(button.dataset.instrumentStage))));
    instrumentPrevButton?.addEventListener('click', () => showInstrumentStage(instrumentJourneyState.current - 1));
    instrumentNextButton?.addEventListener('click', () => showInstrumentStage(instrumentJourneyState.current + 1));

    function markInstrumentPart(part) {
      instrumentJourneyState.visited[instrument].add(part);
      updateInstrumentJourney();
    }

    function markInstrumentHotspot(id) {
      instrumentJourneyState.hotspots[instrument].add(id);
      updateInstrumentJourney();
    }
    const instruments = [
      { name:'Flauta de carrizo', image:'Flauta.webp', overviewImage:'Flauta.webp', materialImage:'Carrizo Cera.png', partsImage:'Flauta de madera .webp', details:[['¿Qué es?','Instrumento de viento con seis agujeros en la parte superior y uno posterior.'],['Materiales','Carrizo: planta de tallo hueco, ligero y resistente, utilizado para fabricar el cuerpo de la flauta. Cera de abeja: material natural y moldeable utilizado en la elaboración de la embocadura.'],['Aire y orificios','El aire pone en vibración la columna de aire del interior. Al cubrir y descubrir los orificios, el intérprete cambia los sonidos.']], detailHtml:[null,'<strong>Carrizo:</strong> planta de tallo hueco, ligero y resistente, utilizado para fabricar el cuerpo de la flauta.<br><br><strong>Cera de abeja:</strong> material natural y moldeable utilizado en la elaboración de la embocadura.',null] },
      { name:'Tambor tradicional', image:'Tambor.png', overviewImage:'Tambor.png', materialImage:'material_Tambor.png', partsImage:'tambor grande.png', details:[['¿Qué es?','El tambor es uno de los instrumentos musicales más antiguos y se elabora de manera artesanal.'],['Materiales','La estructura usa madera de cedro. El cuero puede ser piel de borrego o de venado; se tensa con cuerdas y se toca con baquetas de palo.'],['Cuerpo, parche y sujeción','El parche vibra al recibir el golpe. El cuerpo y la tensión de la membrana intervienen en el sonido. Observa también cómo está sujeta la piel.']], detailHtml:[null,'<span class="material-entry"><strong>Madera de cedro:</strong> utilizada para fabricar el cuerpo del tambor.</span><span class="material-entry"><strong>Piel de borrego o venado:</strong> utilizada para elaborar los parches que producen el sonido al ser golpeados.</span><span class="material-entry"><strong>Cuerdas:</strong> permiten sujetar y tensar los parches del tambor.</span><span class="material-entry"><strong>Baquetas de madera:</strong> utilizadas para golpear los parches y ejecutar los diferentes ritmos tradicionales.</span>',null] }
    ];
    const partLabels = [['① ¿Qué es?','② El material','③ Las partes'],['① ¿Qué es?','② El material','③ Las partes']];
    const stage = $('.stage');
    const instrumentVisual = document.createElement('div');
    instrumentVisual.className = 'instrument-visual';
    stage.insertBefore(instrumentVisual, $('#instrument-image'));
    instrumentVisual.append($('#instrument-image'));
    const drumHotspots = document.createElement('div');
    drumHotspots.className = 'drum-parts-hotspots';
    drumHotspots.hidden = true;
    drumHotspots.setAttribute('aria-label', 'Partes interactivas del tambor');
    drumHotspots.innerHTML = '<button type="button" class="drum-hotspot hotspot-body" data-hotspot="body" aria-label="Ver información del cuerpo" aria-pressed="false"><span>Cuerpo</span></button><button type="button" class="drum-hotspot hotspot-parche" data-hotspot="parche" aria-label="Ver información del parche" aria-pressed="false"><span>Parche</span></button><button type="button" class="drum-hotspot hotspot-amarre" data-hotspot="amarre" aria-label="Ver información del amarre" aria-pressed="false"><span>Amarre</span></button><button type="button" class="drum-hotspot hotspot-baquetas" data-hotspot="baquetas" aria-label="Ver información de las baquetas" aria-pressed="false"><span>Baquetas</span></button>';
    instrumentVisual.append(drumHotspots);
    const fluteHotspots = document.createElement('div');
    fluteHotspots.className = 'flute-parts-hotspots';
    fluteHotspots.hidden = true;
    fluteHotspots.setAttribute('aria-label', 'Partes interactivas de la flauta');
    fluteHotspots.innerHTML = '<button type="button" class="flute-hotspot flute-embocadura" data-hotspot="embocadura" aria-label="Ver información de la embocadura" aria-pressed="false"><span>Embocadura</span></button><button type="button" class="flute-hotspot flute-orificios" data-hotspot="orificios" aria-label="Ver información de los orificios" aria-pressed="false"><span>Orificios</span></button><button type="button" class="flute-hotspot flute-carrizo" data-hotspot="carrizo" aria-label="Ver información del carrizo" aria-pressed="false"><span>Carrizo</span></button><button type="button" class="flute-hotspot flute-boquilla" data-hotspot="boquilla" aria-label="Ver información de la boquilla" aria-pressed="false"><span>Boquilla</span></button>';
    instrumentVisual.append(fluteHotspots);
    const hotspotDetails = {
      body: ['Cuerpo', 'Tronco hueco de madera de cedro que forma la estructura del tambor.'],
      parche: ['Parche', 'Piel de borrego o de venado tensada para producir el sonido.'],
      amarre: ['Amarre', 'Cuerdas que sujetan y mantienen tensos los parches.'],
      baquetas: ['Baquetas', 'Palos de madera usados para golpear el tambor.']
    };
    const fluteHotspotDetails = {
      embocadura: ['Embocadura', 'Abertura donde se sopla para introducir el aire en la flauta y producir la vibración.'],
      orificios: ['Orificios', 'Cuenta con seis orificios en la parte superior y uno en la parte posterior. Al cubrirlos y descubrirlos con los dedos, se producen diferentes notas musicales'],
      carrizo: ['Carrizo', 'Tallo hueco, ligero y resistente de una planta parecida a la caña, usado para fabricar la flauta.'],
      boquilla: ['Boquilla', 'Observa el extremo abierto de la flauta y la forma hueca del carrizo que permite el paso del aire.']
    };
    function showDetail(part) {
      const detail = instruments[instrument].details[part];
      $('#part-title').textContent = detail[0];
      const detailHtml = instruments[instrument].detailHtml?.[part];
      if (detailHtml) $('#part-text').innerHTML = detailHtml;
      else $('#part-text').textContent = detail[1];
      const materialPart = 1;
      $('.panel')?.classList.toggle('is-drum-material', instrument === 1 && part === materialPart);
      const overviewImage = part === 0 && instruments[instrument].overviewImage ? instruments[instrument].overviewImage : null;
      const detailImage = part === materialPart && instruments[instrument].materialImage ? instruments[instrument].materialImage : instruments[instrument].image;
      const partsImage = ((instrument === 0 && part === 2) || (instrument === 1 && part === 2)) && instruments[instrument].partsImage ? instruments[instrument].partsImage : detailImage;
      $('#instrument-image').src = partsImage;
      if (overviewImage) $('#instrument-image').src = overviewImage;
      $('#instrument-image').alt = part === 0 ? `${instruments[instrument].name}: ${detail[0]}` : instruments[instrument].name;
      stage?.classList.toggle('is-material', part === 0);
      stage?.classList.toggle('is-parts', instrument === 1 && part === 2);
      stage?.classList.toggle('is-flute-parts', instrument === 0 && part === 2);
      stage?.classList.toggle('is-flute-overview', instrument === 0 && part === 0);
      stage?.classList.toggle('is-drum', instrument === 1);
      all('[data-hotspot]').forEach(point => point.setAttribute('aria-pressed', 'false'));
      drumHotspots.hidden = !(instrument === 1 && part === 2);
      fluteHotspots.hidden = !(instrument === 0 && part === 2);
      const labels = partLabels[instrument];
      all('[data-part]').forEach((b,i) => { b.hidden = i >= labels.length; if (i < labels.length) { b.textContent = labels[i]; b.setAttribute('aria-pressed', String(i === part)); } });
    }
    all('[data-part]').forEach(button => button.addEventListener('click', () => { markInstrumentPart(Number(button.dataset.part)); showDetail(Number(button.dataset.part)); }));
    all('[data-hotspot]').forEach(button => button.addEventListener('click', () => {
      const detail = hotspotDetails[button.dataset.hotspot] || fluteHotspotDetails[button.dataset.hotspot];
      if (!detail) return;
      $('#part-title').textContent = detail[0]; $('#part-text').textContent = detail[1];
      all('[data-hotspot]').forEach(point => point.setAttribute('aria-pressed', String(point === button)));
      markInstrumentHotspot(button.dataset.hotspot);
    }));
    showDetail(0);
    $('#compare-open')?.addEventListener('click', () => $('#compare-dialog').showModal());
    $('#compare-close').addEventListener('click', () => $('#compare-dialog').close());
    all('[data-material]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.material === 'carrizo';
      $('#material-feedback').textContent = correct ? '¡Conexión encontrada! El carrizo forma el cuerpo de la flauta; la madera y la piel se relacionan con el tambor.' : 'Observa el cuerpo de la flauta. Es un tallo hueco; vuelve a explorar la ficha del material.';
      $('#material-feedback').classList.toggle('success', correct); if (correct) discover();
    }));

    const instrumentEvaluationLaunch = $('#instrumentEvaluationLaunch');
    const instrumentEvaluationPanel = $('#instrumentEvaluationPanel');
    const instrumentEvaluationActivity = $('#instrumentEvaluationActivity');
    const instrumentEvaluationProgress = $('#instrumentEvaluationProgress');
    const instrumentEvaluationProgressFill = $('#instrumentEvaluationProgressFill');
    const startInstrumentEvaluation = $('#startInstrumentEvaluation');
    if (instrumentEvaluationActivity && instrumentEvaluationPanel && startInstrumentEvaluation) {
      const evaluationData = [
        { type:'materials', title:'Identifica los materiales', instruction:'Selecciona los dos materiales utilizados para elaborar la flauta de carrizo.', correct:['carrizo','cera'], feedbackCorrect:'La flauta se elabora con carrizo y cera de abeja.', options:[{id:'carrizo',label:'Carrizo',image:'carrizo.webp',alt:'Carrizo'},{id:'piel',label:'Piel',image:'Piel.webp',alt:'Piel de venado'},{id:'cera',label:'Cera de abeja',image:'Cera.webp',alt:'Cera de abeja'},{id:'madera',label:'Madera de cedro',image:'Madera de cedro.webp',alt:'Madera de cedro'}] },
        { type:'classify', title:'Clasifica los instrumentos', instruction:'Identifica a qué familia musical pertenece cada instrumento.', feedbackCorrect:'La flauta pertenece a la familia de viento y el tambor a la familia de percusión.', items:[{id:'flauta',label:'Flauta de carrizo',image:'Flauta.webp',correct:'viento'},{id:'tambor',label:'Tambor tradicional',image:'Tambor.png',correct:'percusion'}], options:[{id:'viento',label:'Viento'},{id:'percusion',label:'Percusión'},{id:'cuerda',label:'Cuerda'}] },
        { type:'true-false', title:'Verdadero o falso', instruction:'Indica si las siguientes afirmaciones son verdaderas o falsas.', feedbackCorrect:'Has identificado correctamente las características de la flauta y el tambor.', items:[{id:'aire',text:'La flauta de carrizo produce sonido mediante el aire.',correct:'verdadero'},{id:'metal',text:'El tambor tradicional se fabrica principalmente con metal.',correct:'falso'},{id:'notas',text:'Al cubrir o descubrir los orificios de la flauta cambian las notas.',correct:'verdadero'}], options:[{id:'verdadero',label:'Verdadero'},{id:'falso',label:'Falso'}] },
        { type:'fill', title:'Completa la frase', instruction:'Selecciona la palabra que completa correctamente la frase.', correct:'parche', feedbackCorrect:'El parche vibra al ser golpeado por las baquetas y produce el sonido.', image:'Tambor.png', imageAlt:'Tambor tradicional', sentence:'Los golpes de las baquetas hacen vibrar el', options:[{id:'cuerpo',label:'Cuerpo'},{id:'parche',label:'Parche'},{id:'amarre',label:'Amarre'}] },
        { type:'match', title:'Cada parte tiene una función', instruction:'Arrastra cada parte del instrumento hacia la función que le corresponde', items:[{id:'parche',label:'Parche',function:'Vibra al ser golpeado.'},{id:'orificios',label:'Orificios',function:'Permiten cambiar las notas.'},{id:'amarre',label:'Amarre',function:'Mantiene tensos los parches.'},{id:'embocadura',label:'Embocadura',function:'Permite introducir el aire en la flauta.'},{id:'baquetas',label:'Baquetas',function:'Permiten golpear el tambor.'}], feedbackCorrect:'Has relacionado correctamente cada parte con su función.' }
      ];
      let evaluationIndex = 0;
      let evaluationCompleted = false;
      let matchAssignments = {};
      let selectedMatchPart = null;
      const shuffleEvaluation = items => [...items].sort(() => Math.random() - 0.5);
      const optionButton = option => `<button type="button" class="reinforcement-option reinforcement-image-option" data-value="${option.id}"><span class="reinforcement-image-wrap"><img src="${option.image}" alt="${option.alt}"></span><span class="reinforcement-option-name">${option.label}</span></button>`;
      const textButton = option => `<button type="button" class="reinforcement-option reinforcement-text-option" data-value="${option.id}">${option.label}</button>`;

      function updateInstrumentEvaluationControls() {
        const activity = evaluationData[evaluationIndex];
        let ready = false;
        if (activity.type === 'materials') ready = instrumentEvaluationActivity.querySelectorAll('.reinforcement-option.is-selected').length === 2;
        if (activity.type === 'classify' || activity.type === 'true-false') ready = [...instrumentEvaluationActivity.querySelectorAll('[data-answer-group]')].every(group => group.querySelector('.is-selected'));
        if (activity.type === 'fill') ready = Boolean(instrumentEvaluationActivity.querySelector('.reinforcement-option.is-selected'));
        if (activity.type === 'match') ready = Object.keys(matchAssignments).length === activity.items.length;
        const check = instrumentEvaluationActivity.querySelector('[data-instrument-evaluation-check]');
        if (check) check.disabled = !ready;
      }

      function renderInstrumentEvaluation() {
        const activity = evaluationData[evaluationIndex];
        instrumentEvaluationActivity.classList.remove('is-changing');
        matchAssignments = {};
        selectedMatchPart = null;
        instrumentEvaluationProgress.textContent = `Actividad ${evaluationIndex + 1} de ${evaluationData.length}`;
        instrumentEvaluationProgressFill.style.width = `${(evaluationIndex / evaluationData.length) * 100}%`;
        let body = '';
        if (activity.type === 'materials') body = `<div class="reinforcement-options multi-image instrument-evaluation-materials">${shuffleEvaluation(activity.options).map(optionButton).join('')}</div><p class="reinforcement-selection-count" aria-live="polite">Selecciona 2 materiales.</p>`;
        if (activity.type === 'classify') body = `<div class="instrument-classification-grid">${activity.items.map(item => `<div class="instrument-classification-row" data-answer-group="${item.id}"><div class="instrument-classification-heading"><img src="${item.image}" alt="${item.label}"><strong>${item.label}</strong></div><div class="instrument-classification-options">${shuffleEvaluation(activity.options).map(textButton).join('')}</div></div>`).join('')}</div>`;
        if (activity.type === 'true-false') body = `<div class="instrument-true-false-list">${activity.items.map(item => `<div class="instrument-true-false-row" data-answer-group="${item.id}"><p>${item.text}</p><div>${activity.options.map(textButton).join('')}</div></div>`).join('')}</div>`;
        if (activity.type === 'fill') body = `<div class="instrument-fill-layout"><span class="reinforcement-image-wrap"><img src="${activity.image}" alt="${activity.imageAlt}"></span><p class="instrument-fill-sentence">${activity.sentence} <span class="instrument-fill-blank" data-answer-slot aria-live="polite">________</span> del tambor.</p><div class="instrument-fill-options">${shuffleEvaluation(activity.options).map(textButton).join('')}</div></div>`;
        if (activity.type === 'match') body = `<div class="instrument-match-layout"><div class="instrument-match-column"><h4>Partes</h4><div class="instrument-match-parts">${shuffleEvaluation(activity.items).map(item => `<button type="button" class="instrument-match-card" draggable="true" data-match-part="${item.id}">${item.label}</button>`).join('')}</div></div><div class="instrument-match-column"><h4>Funciones</h4><div class="instrument-match-targets">${shuffleEvaluation(activity.items).map(item => `<div class="instrument-match-target" data-match-target="${item.id}" role="button" tabindex="0"><span>${item.function}</span><div class="instrument-match-slot" data-match-slot></div></div>`).join('')}</div></div></div>`;
        const nextLabel = activity.type === 'match' ? 'Finalizar evaluación' : 'Siguiente';
        const evaluationCardClass = activity.type === 'match' ? ' instrument-match-card-shell' : '';
        instrumentEvaluationActivity.innerHTML = `<div class="reinforcement-card instrument-evaluation-card${evaluationCardClass}"><div class="reinforcement-card-top"><span>Actividad ${evaluationIndex + 1}</span><span class="reinforcement-card-tag">Evaluación</span></div><h3>${activity.title}</h3><p class="reinforcement-instruction">${activity.instruction}</p>${body}<p class="reinforcement-feedback" aria-live="polite"></p><div class="reinforcement-actions"><button type="button" class="reinforcement-check" data-instrument-evaluation-check disabled>Comprobar</button><button type="button" class="reinforcement-next" data-instrument-evaluation-next hidden>${nextLabel}</button></div></div>`;
        instrumentEvaluationActivity.querySelectorAll('.reinforcement-option').forEach(option => option.addEventListener('click', () => {
          if (option.disabled) return;
          const group = option.closest('[data-answer-group]');
          if (activity.type === 'materials') {
            if (!option.classList.contains('is-selected') && instrumentEvaluationActivity.querySelectorAll('.reinforcement-option.is-selected').length >= 2) return;
            option.classList.toggle('is-selected');
          } else {
            group?.querySelectorAll('.reinforcement-option').forEach(item => item.classList.remove('is-selected'));
            option.classList.add('is-selected');
            const slot = instrumentEvaluationActivity.querySelector('[data-answer-slot]');
            if (slot && activity.type === 'fill') slot.textContent = option.textContent.trim();
          }
          updateInstrumentEvaluationControls();
        }));
        if (activity.type === 'match') {
          const partsContainer = instrumentEvaluationActivity.querySelector('.instrument-match-parts');
          const refreshMatchLayout = () => {
            instrumentEvaluationActivity.querySelectorAll('[data-match-target]').forEach(target => {
              const assigned = matchAssignments[target.dataset.matchTarget];
              const item = activity.items.find(entry => entry.id === assigned);
              const slot = target.querySelector('[data-match-slot]');
              target.classList.toggle('is-assigned', Boolean(item));
              if (slot) slot.querySelectorAll('[data-match-part]').forEach(card => { if (!item || card.dataset.matchPart !== item.id) partsContainer.append(card); });
              if (slot && item) {
                const assignedCard = instrumentEvaluationActivity.querySelector(`[data-match-part="${item.id}"]`);
                if (assignedCard && assignedCard.parentElement !== slot) slot.append(assignedCard);
              }
              if (slot && !item) slot.textContent = '';
            });
          };
          const removeMatch = partId => {
            Object.keys(matchAssignments).forEach(key => { if (matchAssignments[key] === partId) delete matchAssignments[key]; });
            const card = instrumentEvaluationActivity.querySelector(`[data-match-part="${partId}"]`);
            if (card) partsContainer.append(card);
            selectedMatchPart = null;
            refreshMatchLayout();
            updateInstrumentEvaluationControls();
          };
          const assignMatch = (partId, targetId) => {
            const target = instrumentEvaluationActivity.querySelector(`[data-match-target="${targetId}"]`);
            if (!target || target.dataset.locked === 'true') return;
            target.classList.remove('is-drag-over');
            const previousPart = matchAssignments[targetId];
            if (previousPart && previousPart !== partId) delete matchAssignments[targetId];
            Object.keys(matchAssignments).forEach(key => { if (matchAssignments[key] === partId) delete matchAssignments[key]; });
            matchAssignments[targetId] = partId;
            selectedMatchPart = null;
            refreshMatchLayout();
            updateInstrumentEvaluationControls();
          };
          instrumentEvaluationActivity.querySelectorAll('[data-match-part]').forEach(card => {
            card.addEventListener('dragstart', event => { selectedMatchPart = card.dataset.matchPart; event.dataTransfer?.setData('text/plain', selectedMatchPart); card.classList.add('is-selected'); });
            card.addEventListener('dragend', () => card.classList.remove('is-selected'));
            card.addEventListener('click', event => { event.stopPropagation(); if (card.parentElement !== partsContainer) { removeMatch(card.dataset.matchPart); return; } selectedMatchPart = card.dataset.matchPart; instrumentEvaluationActivity.querySelectorAll('[data-match-part]').forEach(item => item.classList.toggle('is-selected', item === card)); });
          });
          instrumentEvaluationActivity.querySelectorAll('[data-match-target]').forEach(target => {
            target.addEventListener('dragover', event => { event.preventDefault(); if (target.dataset.locked !== 'true') target.classList.add('is-drag-over'); });
            target.addEventListener('dragleave', () => target.classList.remove('is-drag-over'));
            target.addEventListener('drop', event => { event.preventDefault(); const partId = event.dataTransfer?.getData('text/plain') || selectedMatchPart; if (partId) assignMatch(partId, target.dataset.matchTarget); });
            target.addEventListener('click', () => { if (selectedMatchPart) assignMatch(selectedMatchPart, target.dataset.matchTarget); });
          });
          partsContainer.addEventListener('dragover', event => { event.preventDefault(); partsContainer.classList.add('is-drag-over'); });
          partsContainer.addEventListener('dragleave', () => partsContainer.classList.remove('is-drag-over'));
          partsContainer.addEventListener('drop', event => { event.preventDefault(); partsContainer.classList.remove('is-drag-over'); const partId = event.dataTransfer?.getData('text/plain') || selectedMatchPart; if (partId) removeMatch(partId); });
        }
        instrumentEvaluationActivity.querySelector('[data-instrument-evaluation-check]').addEventListener('click', checkInstrumentEvaluation);
      }

      function showInstrumentEvaluationCompletion() {
        evaluationCompleted = true;
        instrumentJourneyState.evaluationActive = false;
        instrumentJourneyState.evaluationFinished = true;
        instrumentJourneyState.evaluationCompleted = evaluationData.length;
        instrumentEvaluationPanel.classList.add('is-complete');
        instrumentEvaluationProgress.textContent = 'Evaluación completada';
        instrumentEvaluationProgressFill.style.width = '100%';
        instrumentEvaluationActivity.innerHTML = '<div class="reinforcement-complete"><div class="reinforcement-complete-icon" aria-hidden="true">✓</div><h3>¡Excelente! Has completado la evaluación.</h3><p>Ahora conoces los materiales, las características y el funcionamiento de los instrumentos tradicionales de los tamborileros de Tabasco.</p><div class="reinforcement-complete-actions"><button type="button" class="reinforcement-return" data-instrument-return>Volver al contenido</button><button type="button" class="reinforcement-finish" data-instrument-finish>Finalizar</button></div></div>';
        instrumentLearningContent.hidden = true;
        updateInstrumentJourney();
        instrumentEvaluationActivity.querySelector('[data-instrument-return]').addEventListener('click', () => showInstrumentStage(0));
        instrumentEvaluationActivity.querySelector('[data-instrument-finish]').addEventListener('click', () => { discover(); window.location.assign('course.html#mapa'); });
      }

      function checkInstrumentEvaluation() {
        const activity = evaluationData[evaluationIndex];
        const check = instrumentEvaluationActivity.querySelector('[data-instrument-evaluation-check]');
        if (check.dataset.mode === 'retry') { check.dataset.mode = ''; renderInstrumentEvaluation(); return; }
        const selected = [...instrumentEvaluationActivity.querySelectorAll('.reinforcement-option.is-selected')];
        let correct = false;
        if (activity.type === 'materials') correct = selected.length === 2 && selected.every(option => activity.correct.includes(option.dataset.value));
        if (activity.type === 'classify') correct = activity.items.every(item => instrumentEvaluationActivity.querySelector(`[data-answer-group="${item.id}"] .is-selected`)?.dataset.value === item.correct);
        if (activity.type === 'true-false') correct = activity.items.every(item => instrumentEvaluationActivity.querySelector(`[data-answer-group="${item.id}"] .is-selected`)?.dataset.value === item.correct);
        if (activity.type === 'fill') correct = selected[0]?.dataset.value === activity.correct;
        if (activity.type === 'match') correct = activity.items.every(item => matchAssignments[item.id] === item.id);
        instrumentEvaluationActivity.querySelectorAll('.reinforcement-option').forEach(option => {
          option.disabled = true;
          const group = option.closest('[data-answer-group]');
          const wasSelected = option.classList.contains('is-selected');
          let isCorrectOption = false;
          if (activity.type === 'materials') isCorrectOption = activity.correct.includes(option.dataset.value);
          if (activity.type === 'classify') isCorrectOption = activity.items.find(item => item.id === group?.dataset.answerGroup)?.correct === option.dataset.value;
          if (activity.type === 'true-false') isCorrectOption = activity.items.find(item => item.id === group?.dataset.answerGroup)?.correct === option.dataset.value;
          if (activity.type === 'fill') isCorrectOption = option.dataset.value === activity.correct;
          option.classList.toggle('is-correct', wasSelected && isCorrectOption);
          option.classList.toggle('is-incorrect', wasSelected && !isCorrectOption);
        });
        if (activity.type === 'match') {
          instrumentEvaluationActivity.querySelectorAll('[data-match-target]').forEach(target => {
            const targetId = target.dataset.matchTarget;
            const isCorrectTarget = matchAssignments[targetId] === targetId;
            target.classList.toggle('is-correct', isCorrectTarget);
            target.classList.toggle('is-incorrect', !isCorrectTarget);
            target.dataset.locked = 'true';
          });
          instrumentEvaluationActivity.querySelectorAll('[data-match-part]').forEach(card => {
            const targetId = Object.keys(matchAssignments).find(key => matchAssignments[key] === card.dataset.matchPart);
            card.draggable = false;
            card.classList.toggle('is-correct', targetId === card.dataset.matchPart);
            card.classList.toggle('is-incorrect', targetId !== card.dataset.matchPart);
          });
        }
        const feedback = instrumentEvaluationActivity.querySelector('.reinforcement-feedback');
        feedback.className = `reinforcement-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
        feedback.innerHTML = `<strong>${correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta'}</strong><span>${correct ? activity.feedbackCorrect : 'Revisa las opciones e inténtalo nuevamente.'}</span>`;
        if (correct) {
          instrumentJourneyState.evaluationCompleted = Math.max(instrumentJourneyState.evaluationCompleted, evaluationIndex + 1);
          updateInstrumentJourney();
          check.hidden = true;
          const next = instrumentEvaluationActivity.querySelector('[data-instrument-evaluation-next]');
          next.hidden = false;
          next.addEventListener('click', () => { evaluationIndex += 1; if (evaluationIndex >= evaluationData.length) showInstrumentEvaluationCompletion(); else { instrumentEvaluationActivity.classList.add('is-changing'); window.setTimeout(renderInstrumentEvaluation, 180); } });
        } else {
          check.textContent = 'Intentar nuevamente';
          check.disabled = false;
          check.dataset.mode = 'retry';
        }
      }

      startInstrumentEvaluation.addEventListener('click', () => {
        instrumentJourneyState.current = 2;
        instrumentJourneyState.evaluationActive = true;
        instrumentJourneyState.evaluationFinished = false;
        instrumentJourneyState.evaluationCompleted = 0;
        instrumentJourneyState.completed.delete(2);
        instrumentEvaluationPanel.classList.remove('is-complete');
        instrumentLearningContent.hidden = true;
        instrumentEvaluationLaunch.hidden = true;
        instrumentEvaluationPanel.hidden = false;
        evaluationIndex = 0;
        evaluationCompleted = false;
        updateInstrumentJourney();
        renderInstrumentEvaluation();
        instrumentEvaluationPanel.scrollIntoView({ behavior:'smooth', block:'start' });
      });
    }
    instrumentJourneyState.visited[0].add(0);
    updateInstrumentJourney();
  }

  if (module === 'sonidos') {
    all('.sound-option-card audio').forEach(audio => audio.addEventListener('play', () => {
      all('.sound-option-card audio').forEach(other => { if (other !== audio) other.pause(); });
      discover();
    }));
  }

  if (module === 'descubrimientos') {
    const questions = [
      { label:'La tradición', title:'¿Qué historia contarías?', choices:['Solo la apariencia de los instrumentos','La de las personas que comparten sus saberes'], correct:1, hint:'Piensa en lo que hace que una tradición continúe entre las personas.', piece:'La tradición vive en quienes la comparten.' },
      { label:'Los instrumentos', title:'¿Qué material relacionas con la flauta?', choices:['Carrizo','Piel'], correct:0, hint:'Recuerda el tallo hueco que forma el cuerpo de la flauta.', piece:'El carrizo se transforma en un instrumento de viento.' },
      { label:'La escucha', title:'¿Qué instrumento reconoces?', choices:['Tambor','Flauta de carrizo'], correct:0, hint:'Presta atención al inicio de los sonidos: escucharás golpes y su resonancia.', piece:'Escuchar con atención me permite reconocer el tambor.' }
    ];
    let stage = questions.findIndex((_,i) => !state.pieces.includes(i)), listened = false;
    const audio = $('#final-audio'); audio.addEventListener('playing', () => { listened = true; });
    $('#visual-alternative').addEventListener('click', () => { listened = true; $('#challenge-feedback').textContent = 'Usa la descripción visual para relacionar el sonido con el instrumento.'; });
    function postcard() {
      const list = $('#postcard-pieces'); list.replaceChildren();
      questions.forEach((q,i) => { if (state.pieces.includes(i)) { const item = document.createElement('li'); item.textContent = q.piece; list.append(item); } });
      $('#postcard-empty').hidden = state.pieces.length > 0;
    }
    function render() {
      postcard(); audio.pause();
      const complete = stage < 0 || stage >= questions.length;
      $('#final-audio-wrap').hidden = complete || stage !== 2; $('#challenge-answers').hidden = complete;
      $('#challenge-next').hidden = true; $('#restart-postcard').hidden = !complete; $('#print-postcard').hidden = !complete;
      all('.progress span').forEach((el,i) => el.classList.toggle('done', state.pieces.includes(i)));
      if (complete) {
        $('#challenge-label').textContent = 'Tu recorrido, reunido'; $('#challenge-title').textContent = 'Tres descubrimientos para compartir';
        $('#challenge-feedback').textContent = 'Tu postal está completa. Puedes volver a cualquiera de las experiencias y seguir explorando.';
        discover(); return;
      }
      const question = questions[stage];
      $('#challenge-label').textContent = `Pieza ${stage+1} de 3 · ${question.label}`; $('#challenge-title').textContent = question.title;
      all('[data-choice]').forEach((button,i) => { button.textContent = question.choices[i]; button.disabled = false; });
      $('#challenge-feedback').textContent = stage === 2 ? 'Reproduce la grabación antes de elegir.' : 'Elige una conexión para tu postal.';
    }
    all('[data-choice]').forEach(button => button.addEventListener('click', () => {
      if (stage < 0 || stage > 2) return;
      if (stage === 2 && !listened) { $('#challenge-feedback').textContent = 'Primero escucha la grabación. Puedes repetirla sin límite.'; return; }
      const question = questions[stage];
      if (Number(button.dataset.choice) !== question.correct) { $('#challenge-feedback').textContent = question.hint; return; }
      if (!state.pieces.includes(stage)) state.pieces.push(stage);
      persist(); postcard(); all('[data-choice]').forEach(b => b.disabled = true);
      all('.progress span').forEach((el,i) => el.classList.toggle('done', state.pieces.includes(i)));
      $('#challenge-feedback').textContent = question.piece;
      $('#challenge-next').hidden = false; $('#challenge-next').textContent = stage === 2 ? 'Ver mi postal completa ✓' : 'Añadir la siguiente pieza';
    }));
    $('#challenge-next').addEventListener('click', () => { stage = questions.findIndex((_,i) => !state.pieces.includes(i)); render(); });
    $('#restart-postcard').addEventListener('click', () => { state.pieces = []; state.discovered = state.discovered.filter(id => id !== module); persist(); status(); stage = 0; listened = false; render(); });
    $('#print-postcard').addEventListener('click', () => window.print());
    render();
  }
})();
