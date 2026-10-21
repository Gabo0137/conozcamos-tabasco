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
    const stories = [
      ['¿Quiénes son?', "Los tamborileros son una tradición musical del pueblo yoko t'an, también llamado chontal de Tabasco, y son parte central de su vida cultural. Su práctica se concentra en la región Biji Yoko t'an, donde vive la mayoría de las comunidades de este grupo étnico."],
      ['Integrantes', 'El grupo no tiene un número fijo de integrantes. Se describe como un conjunto con una cantidad variable de personas.'],
      ['Instrumentos', 'La flauta es de carrizo, de viento, y tiene siete orificios. Se conoce como pito o flauta de carrizo, y es el instrumento que lleva la melodía. Los tambores son de dos parches y tienen distintos tamaños.']
    ];
    all('[data-story]').forEach(button => button.addEventListener('click', () => {
      select('[data-story]', button);
      const story = stories[Number(button.dataset.story)];
      $('#story-title').textContent = story[0]; $('#story-text').textContent = story[1];
    }));
    all('[data-culture-answer]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.cultureAnswer === 'people';
      $('#culture-feedback').textContent = correct ? 'Así es. Los objetos importan, y la tradición continúa cuando las personas comparten su música y sus saberes.' : 'Los instrumentos son una parte. Piensa también en quienes los elaboran, interpretan y enseñan a otras personas.';
      $('#culture-feedback').classList.toggle('success', correct);
      if (correct) discover();
    }));
  }

  if (module === 'instrumentos') {
    let instrument = 0, step = 0;
    const instruments = [
      { name:'Flauta de carrizo', image:'Flauta01.png', details:[['El carrizo','Su cuerpo se elabora con carrizo: un tallo hueco que se transforma para construir el instrumento.'],['Aire y orificios','El aire pone en vibración la columna de aire del interior. Al cubrir y descubrir los orificios, el intérprete cambia los sonidos.'],['Un proceso artesanal','Explora el recorrido visual de elaboración. Es una descripción general; las técnicas pueden variar entre artesanos.']], steps:[['Selección del carrizo','Se selecciona el tallo que dará forma al instrumento.','Seleccion.png'],['Corte del material','Se corta el carrizo para preparar el cuerpo de la flauta.','Corte.jpg'],['Limpieza del interior','Se prepara el interior del tubo para permitir el paso del aire.','Flauta01.png'],['Perforación de orificios','Se realizan los orificios que el intérprete cubrirá y descubrirá.','Hueco.png'],['Prueba del sonido','Se escucha el resultado y se hacen los ajustes necesarios.','Tocar.jpg']] },
      { name:'Tambor tradicional', image:'Tambor.png', details:[['Madera y piel','Los tambores reúnen un cuerpo de madera y una membrana de piel. Los materiales y acabados pueden variar según el instrumento y su elaboración.'],['Cuerpo, parche y sujeción','El parche vibra al recibir el golpe. El cuerpo y la tensión de la membrana intervienen en el sonido. Observa también cómo está sujeta la piel.'],['Del cuerpo al sonido','Recorre tres momentos generales de su construcción. La imagen muestra el instrumento terminado; no representa cada paso del taller.']], steps:[['Preparar el cuerpo','La madera se trabaja para formar el cuerpo del tambor.','Tambor.png'],['Colocar la membrana','La piel se coloca y se sujeta sobre el cuerpo.','Tambor.png'],['Tensar y escuchar','Se ajusta la tensión de la membrana y se prueba el sonido.','Tambor.png']] }
    ];
    const partLabels = ['① El material','② Las partes','③ El proceso'];
    function renderStep() {
      const steps = instruments[instrument].steps;
      $('#process-title').textContent = steps[step][0]; $('#process-text').textContent = steps[step][1];
      $('#process-image').src = steps[step][2]; $('#process-image').alt = instrument ? 'Tambor terminado, como referencia del proceso' : steps[step][0];
      $('#process-position').textContent = `${step + 1} de ${steps.length}`;
      $('#process-prev').disabled = step === 0; $('#process-next').disabled = step === steps.length - 1;
    }
    function showDetail(part) {
      const detail = instruments[instrument].details[part];
      $('#part-title').textContent = detail[0]; $('#part-text').textContent = detail[1];
      $('#process').hidden = part !== 2;
      all('[data-part]').forEach((b,i) => { b.textContent = partLabels[i]; b.setAttribute('aria-pressed', String(i === part)); });
      if (part === 2) renderStep();
    }
    all('[data-instrument]').forEach(button => button.addEventListener('click', () => {
      instrument = Number(button.dataset.instrument); step = 0; select('[data-instrument]', button);
      $('#instrument-image').src = instruments[instrument].image; $('#instrument-image').alt = instruments[instrument].name;
      showDetail(0);
    }));
    all('[data-part]').forEach(button => button.addEventListener('click', () => showDetail(Number(button.dataset.part))));
    $('#process-prev').addEventListener('click', () => { if (step > 0) { step--; renderStep(); } });
    $('#process-next').addEventListener('click', () => { if (step < instruments[instrument].steps.length - 1) { step++; renderStep(); } });
    $('#compare-open').addEventListener('click', () => $('#compare-dialog').showModal());
    $('#compare-close').addEventListener('click', () => $('#compare-dialog').close());
    all('[data-material]').forEach(button => button.addEventListener('click', () => {
      const correct = button.dataset.material === 'carrizo';
      $('#material-feedback').textContent = correct ? '¡Conexión encontrada! El carrizo forma el cuerpo de la flauta; la madera y la piel se relacionan con el tambor.' : 'Observa el cuerpo de la flauta. Es un tallo hueco; vuelve a explorar la ficha del material.';
      $('#material-feedback').classList.toggle('success', correct); if (correct) discover();
    }));
  }

  if (module === 'sonidos') {
    const recordings = ['MusicaFlauta.mpeg','SonidoTambor.mpeg'];
    let mystery = Math.random() < .5 ? 0 : 1, listened = false;
    const mysteryAudio = $('#mystery-audio');
    mysteryAudio.src = recordings[mystery];
    mysteryAudio.addEventListener('playing', () => { listened = true; });
    all('[data-sound]').forEach(button => button.addEventListener('click', () => {
      const drum = button.dataset.sound === '1'; select('[data-sound]', button);
      const media = $('#explore-audio'); media.pause(); media.src = recordings[drum ? 1 : 0];
      $('#sound-image').src = drum ? 'Tambor.png' : 'Flauta01.png'; $('#sound-image').alt = drum ? 'Tambor tradicional' : 'Flauta de carrizo';
      $('#listening-guide').textContent = drum ? 'Escucha el comienzo de cada golpe y cómo se apaga su resonancia.' : 'Escucha cómo cambia la altura del sonido a lo largo de la melodía.';
      $('#audio-error').textContent = '';
    }));
    all('[data-sound-answer]').forEach(button => button.addEventListener('click', () => {
      if (!listened) { $('#sound-feedback').textContent = 'Primero reproduce la grabación misteriosa. Puedes repetirla cuantas veces quieras.'; return; }
      const correct = Number(button.dataset.soundAnswer) === mystery;
      $('#sound-feedback').textContent = correct ? `Lo reconociste: ${mystery ? 'tambor' : 'flauta de carrizo'}. Vuelve a escucharlo y relaciona su sonido con el instrumento.` : 'Vuelve a escuchar: ¿percibes golpes o una melodía sostenida por el aire? Puedes comparar con el reproductor de exploración.';
      $('#sound-feedback').classList.toggle('success', correct); if (correct) discover();
    }));
    $('#another-sound').addEventListener('click', () => { mysteryAudio.pause(); mystery = 1 - mystery; listened = false; mysteryAudio.src = recordings[mystery]; $('#sound-feedback').textContent = 'Hay una nueva grabación. Escucha antes de elegir.'; $('#mystery-error').textContent = ''; });

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
