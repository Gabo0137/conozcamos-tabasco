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

    function renderMunicipality(id) {
      const municipality = municipalityData[id];
      if (!municipality) return;
      selectedMunicipality = id;
      all('#tabascoMap svg path').forEach(path => path.classList.toggle('is-selected', path.id === id));
      all('.tabasco-map-marker').forEach(marker => {
        const selected = marker.dataset.municipality === id;
        marker.classList.toggle('is-selected', selected);
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
          marker.addEventListener('click', () => renderMunicipality(id));
          marker.style.left = `${((bounds.x + bounds.width / 2 - viewBoxX) / viewBoxWidth) * 100}%`;
          marker.style.top = `${((bounds.y + bounds.height / 2 - viewBoxY) / viewBoxHeight) * 100}%`;
          mapHost.append(marker);
          path.addEventListener('click', () => renderMunicipality(id));
          path.setAttribute('tabindex', '0');
          path.setAttribute('aria-label', municipality.title);
        });
        renderMunicipality(selectedMunicipality);
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
      const reinforcementData = [
      { type:'multi-image', title:'Identifica los instrumentos', instruction:'Selecciona los dos instrumentos que utilizan tradicionalmente los tamborileros.', correct:['flauta','tambor'], feedbackCorrect:'¡Excelente! La flauta de carrizo interpreta la melodía y los tambores acompañan con sus ritmos.', feedbackIncorrect:'Recuerda que los tamborileros utilizan instrumentos de viento y percusión.', options:[{id:'flauta',label:'Flauta de carrizo',image:'Flautis carizo.png',alt:'Flauta de carrizo'},{id:'guitarra',label:'Guitarra',image:'Guitarra clásica de madera miel.webp',alt:'Guitarra clásica de madera'},{id:'violin',label:'Violín',image:'Violín de madera y arco realistas.webp',alt:'Violín de madera con arco'},{id:'tambor',label:'Tambor tradicional',image:'Tambor.png',alt:'Tambor tradicional'}] },
        { type:'image-single', title:'Reconoce la vestimenta tradicional', instruction:'Selecciona la imagen que representa la vestimenta tradicional de los tamborileros de Tabasco.', correct:['B'], feedbackCorrect:'¡Correcto! Su vestimenta tradicional incluye prendas de manta blanca, paliacate rojo, sombrero chontal y huaraches.', feedbackIncorrect:'Recuerda las prendas blancas y los accesorios que caracterizan a los tamborileros tabasqueños.', options:[{id:'A',image:'assets/evaluacion/vestimenta-charro.webp',alt:'Vestimenta de charro'},{id:'B',image:'Tocando tambor.png',alt:'Vestimenta del tamborilero tabasqueño'},{id:'C',image:'assets/evaluacion/vestimenta-mariachi.webp',alt:'Vestimenta de mariachi'}] },
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
        if (activity.type === 'multi-image' || activity.type === 'image-single') return `<button type="button" class="reinforcement-option reinforcement-image-option" data-value="${option.id}"><span class="reinforcement-image-wrap"><img src="${option.image}" alt="${option.alt}" data-fallback="Imagen pendiente"></span>${activity.type === 'image-single' ? `<span class="reinforcement-option-letter">${option.id}</span>` : `<span class="reinforcement-option-name">${option.label}</span>`}</button>`;
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
        reinforcementProgress.textContent = 'Evaluación completada';
        reinforcementProgressFill.style.width = '100%';
        reinforcementActivity.innerHTML = '<div class="reinforcement-complete"><div class="reinforcement-complete-icon" aria-hidden="true">✓</div><h3>¡Excelente! Has completado la evaluación</h3><p>Ahora conoces los instrumentos, la vestimenta, algunos de los municipios y la importancia cultural de los tamborileros de Tabasco.</p><button type="button" class="reinforcement-retry" data-reinforcement-retry>Reintentar evaluación</button></div>';
        reinforcementActivity.querySelector('[data-reinforcement-retry]').addEventListener('click', () => {
          reinforcementHistory.push(reinforcementRecords.map(record => ({ ...record })));
          reinforcementRecords = reinforcementData.map(() => ({ firstAttemptCorrect:false, incorrectAnswers:0, attempts:0, responseTime:0, completed:false, startedAt:null }));
          window.tamborilerosReinforcementEvaluation = reinforcementRecords;
          reinforcementIndex = 0;
          reinforcementActivity.classList.add('is-changing');
          window.setTimeout(renderReinforcement, 180);
        });
        discover();
      }

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
    const instruments = [
      { name:'Flauta de carrizo', image:'Flautis carizo.png', overviewImage:'Flautis carizo.png', materialImage:'Carrizo Cera.png', partsImage:'Flautis carizo.png', details:[['¿Qué es?','Instrumento de viento con seis agujeros en la parte superior y uno posterior.'],['Materiales','Carrizo: planta de tallo hueco, ligero y resistente, utilizado para fabricar el cuerpo de la flauta. Cera de abeja: material natural y moldeable utilizado en la elaboración de la embocadura.'],['Aire y orificios','El aire pone en vibración la columna de aire del interior. Al cubrir y descubrir los orificios, el intérprete cambia los sonidos.']], detailHtml:[null,'<strong>Carrizo:</strong> planta de tallo hueco, ligero y resistente, utilizado para fabricar el cuerpo de la flauta.<br><br><strong>Cera de abeja:</strong> material natural y moldeable utilizado en la elaboración de la embocadura.',null] },
      { name:'Tambor tradicional', image:'Tambor.png', materialImage:'material_Tambor.png', partsImage:'tambor grande.png', details:[['Materiales','La estructura usa madera de cedro. El cuero puede ser piel de borrego o de venado; se tensa con cuerdas y se toca con baquetas de palo.'],['Cuerpo, parche y sujeción','El parche vibra al recibir el golpe. El cuerpo y la tensión de la membrana intervienen en el sonido. Observa también cómo está sujeta la piel.']], detailHtml:['<span class="material-entry"><strong>Madera de cedro:</strong> utilizada para fabricar el cuerpo del tambor.</span><span class="material-entry"><strong>Piel de borrego o venado:</strong> utilizada para elaborar los parches que producen el sonido al ser golpeados.</span><span class="material-entry"><strong>Cuerdas:</strong> permiten sujetar y tensar los parches del tambor.</span><span class="material-entry"><strong>Baquetas de madera:</strong> utilizadas para golpear los parches y ejecutar los diferentes ritmos tradicionales.</span>',null] }
    ];
    const partLabels = [['① ¿Qué es?','② El material','③ Las partes'],['① El material','② Las partes']];
    const stage = $('.stage');
    const instrumentVisual = document.createElement('div');
    instrumentVisual.className = 'instrument-visual';
    stage.insertBefore(instrumentVisual, $('#instrument-image'));
    instrumentVisual.append($('#instrument-image'));
    const drumHotspots = document.createElement('div');
    drumHotspots.className = 'drum-parts-hotspots';
    drumHotspots.hidden = true;
    drumHotspots.setAttribute('aria-label', 'Partes interactivas del tambor');
    drumHotspots.innerHTML = '<button type="button" class="drum-hotspot hotspot-body" data-hotspot="body" aria-label="Ver información del cuerpo"></button><button type="button" class="drum-hotspot hotspot-parche" data-hotspot="parche" aria-label="Ver información del parche"></button><button type="button" class="drum-hotspot hotspot-amarre" data-hotspot="amarre" aria-label="Ver información del amarre"></button><button type="button" class="drum-hotspot hotspot-baquetas" data-hotspot="baquetas" aria-label="Ver información de las baquetas"></button>';
    stage?.insertBefore(drumHotspots, $('.hotspots'));
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
      orificios: ['Orificios', 'Agujeros del cuerpo que se tapan y destapan con los dedos para cambiar las notas.'],
      carrizo: ['Carrizo', 'Tallo hueco, ligero y resistente de una planta parecida a la caña, usado para fabricar la flauta.'],
      boquilla: ['Boquilla', 'Observa el extremo abierto de la flauta y la forma hueca del carrizo que permite el paso del aire.']
    };
    function showDetail(part) {
      const detail = instruments[instrument].details[part];
      $('#part-title').textContent = detail[0];
      const detailHtml = instruments[instrument].detailHtml?.[part];
      if (detailHtml) $('#part-text').innerHTML = detailHtml;
      else $('#part-text').textContent = detail[1];
      $('.panel')?.classList.toggle('is-drum-material', instrument === 1 && part === 0);
      const overviewImage = part === 0 && instruments[instrument].overviewImage ? instruments[instrument].overviewImage : null;
      const materialPart = instrument === 0 ? 1 : 0;
      const detailImage = part === materialPart && instruments[instrument].materialImage ? instruments[instrument].materialImage : instruments[instrument].image;
      const partsImage = ((instrument === 0 && part === 2) || (instrument === 1 && part === 1)) && instruments[instrument].partsImage ? instruments[instrument].partsImage : detailImage;
      $('#instrument-image').src = partsImage;
      if (overviewImage) $('#instrument-image').src = overviewImage;
      $('#instrument-image').alt = part === 0 ? `${instruments[instrument].name}: ${detail[0]}` : instruments[instrument].name;
      stage?.classList.toggle('is-material', part === 0);
      stage?.classList.toggle('is-parts', instrument === 1 && part === 1);
      stage?.classList.toggle('is-flute-parts', instrument === 0 && part === 2);
      stage?.classList.toggle('is-flute-overview', instrument === 0 && part === 0);
      stage?.classList.toggle('is-drum', instrument === 1);
      all('[data-hotspot]').forEach(point => point.setAttribute('aria-pressed', 'false'));
      drumHotspots.hidden = !(instrument === 1 && part === 1);
      fluteHotspots.hidden = !(instrument === 0 && part === 2);
      const labels = partLabels[instrument];
      all('[data-part]').forEach((b,i) => { b.hidden = i >= labels.length; if (i < labels.length) { b.textContent = labels[i]; b.setAttribute('aria-pressed', String(i === part)); } });
    }
    all('[data-instrument]').forEach(button => button.addEventListener('click', () => {
      instrument = Number(button.dataset.instrument); select('[data-instrument]', button);
      $('#instrument-image').src = instruments[instrument].image; $('#instrument-image').alt = instruments[instrument].name;
      showDetail(0);
    }));
    all('[data-part]').forEach(button => button.addEventListener('click', () => showDetail(Number(button.dataset.part))));
    all('[data-hotspot]').forEach(button => button.addEventListener('click', () => {
      const detail = hotspotDetails[button.dataset.hotspot] || fluteHotspotDetails[button.dataset.hotspot];
      if (!detail) return;
      $('#part-title').textContent = detail[0]; $('#part-text').textContent = detail[1];
      all('[data-hotspot]').forEach(point => point.setAttribute('aria-pressed', String(point === button)));
    }));
    showDetail(0);
    $('#compare-open')?.addEventListener('click', () => $('#compare-dialog').showModal());
    $('#compare-close').addEventListener('click', () => $('#compare-dialog').close());
    all('[data-material]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.material === 'carrizo';
      $('#material-feedback').textContent = correct ? '¡Conexión encontrada! El carrizo forma el cuerpo de la flauta; la madera y la piel se relacionan con el tambor.' : 'Observa el cuerpo de la flauta. Es un tallo hueco; vuelve a explorar la ficha del material.';
      $('#material-feedback').classList.toggle('success', correct); if (correct) discover();
    }));
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
