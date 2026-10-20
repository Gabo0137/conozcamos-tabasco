/**
 * Conozcamos Tabasco — formulario de evaluación.
 * Pega este archivo completo en https://script.google.com/
 * y ejecuta crearFormulario.
 * Crea un borrador sin publicar, sin nombres ni recopilación de correos.
 */
function crearFormulario() {
  const propiedades = PropertiesService.getUserProperties();
  const clave = 'FORMULARIO_TABASCO_EVALUACION_V1';
  const lock = LockService.getUserLock();
  lock.waitLock(30000);
  try {
    const id = propiedades.getProperty(clave);
    const formulario = id
      ? FormApp.openById(id)
      : FormApp.create('Evaluación de aprendizaje y uso de «Conozcamos Tabasco»', false);
    if (!id) propiedades.setProperty(clave, formulario.getId());
    if (propiedades.getProperty(clave + '_COMPLETO') === 'true') {
      console.log('El formulario ya existe. Editar: ' + formulario.getEditUrl());
      return formulario.getEditUrl();
    }
    formulario
      .setDescription('Queremos conocer tu experiencia para mejorar esta página educativa. Responde después de explorarla. No es un examen: si no recuerdas algo o no utilizaste alguna sección, indícalo. No solicitamos tu nombre ni recopilamos tu correo electrónico. Selecciona una sola opción en cada pregunta.')
      .setCollectEmail(false)
      .setIsQuiz(false)
      .setShuffleQuestions(false)
      .setConfirmationMessage('¡Gracias! Tus respuestas nos ayudarán a mejorar el aprendizaje, los contenidos y la navegación de Conozcamos Tabasco.');

    const preguntas = obtenerPreguntas();
    // Si hubo una interrupción, retoma el mismo borrador.
    // Tras completarlo, las siguientes ejecuciones solo devuelven su enlace.
    const existentes = formulario.getItems(FormApp.ItemType.MULTIPLE_CHOICE);
    preguntas.forEach(function(pregunta, indice) {
      const item = existentes[indice]
        ? existentes[indice].asMultipleChoiceItem()
        : formulario.addMultipleChoiceItem();
      item.setTitle((indice + 1) + '. ' + pregunta[0])
        .setChoiceValues(pregunta[1])
        .showOtherOption(false)
        .setRequired(true);
      let ayuda = '';
      if (indice === 0) ayuda = 'Conocimientos previos: piensa en lo que sabías antes de visitar la página.';
      if (indice >= 3 && indice <= 8) ayuda = 'Responde sin consultar nuevamente la página. Si no recuerdas la respuesta, indícalo.';
      if (indice === 12) ayuda = 'Navegación y presentación: considera tu experiencia al usar la página.';
      if (indice === 18) ayuda = 'Prioridades de mejora: elige el cambio que más te ayudaría.';
      item.setHelpText(ayuda);
    });
    propiedades.setProperty(clave + '_COMPLETO', 'true');
    console.log('Formulario creado con 20 preguntas. Editar: ' + formulario.getEditUrl());
    console.log('Abre ese enlace, revisa el formulario y publícalo desde Google Forms cuando esté listo.');
    return formulario.getEditUrl();
  } finally {
    lock.releaseLock();
  }
}

function obtenerPreguntas() {
  return [
    ['Antes de explorar la página, ¿cuánto conocías sobre los tamborileros de Tabasco?', [
      'No conocía esta tradición.',
      'Había escuchado de ella, pero no conocía sus características.',
      'Conocía algunos instrumentos y características.',
      'Conocía bastante sobre esta tradición.'
    ]],
    ['¿Sabías que la música de los tamborileros fue declarada patrimonio cultural intangible del Estado de Tabasco?', [
      'Sí, conocía ese reconocimiento.',
      'Había escuchado algo, pero no sabía con certeza.',
      'No, lo descubrí en la página.',
      'No recuerdo haber visto ese dato en la página.'
    ]],
    ['Antes de visitar la página, ¿cuánto conocías sobre los materiales y las partes de estos instrumentos?', [
      'No conocía sus materiales ni sus partes.',
      'Conocía algunos materiales, pero no sus partes.',
      'Conocía algunos materiales y partes.',
      'Podía identificar sus principales materiales y partes.'
    ]],
    ['¿Qué función cumple la flauta de carrizo en el conjunto?', [
      'Interpretar la melodía.',
      'Producir el acompañamiento rítmico mediante golpes.',
      'Marcar los pasos de los bailarines sin producir sonidos.',
      'No lo recuerdo.'
    ]],
    ['¿Qué función cumplen los tambores en el conjunto?', [
      'Producir sonidos mediante el aire.',
      'Proporcionar el acompañamiento rítmico.',
      'Producir sonidos mediante cuerdas.',
      'No lo recuerdo.'
    ]],
    ['¿De qué material se elabora el cuerpo de la flauta presentada?', [
      'Metal.', 'Carrizo.', 'Piel.', 'No lo recuerdo.'
    ]],
    ['¿Qué parte del tambor vibra al recibir un golpe y produce el sonido?', [
      'La membrana o parche.', 'Los orificios.', 'La boquilla.', 'No lo recuerdo.'
    ]],
    ['¿Para qué sirven los orificios de la flauta?', [
      'Para sujetar la piel.',
      'Para decorar el instrumento.',
      'Para cambiar los sonidos al cubrirlos y descubrirlos.',
      'No lo recuerdo.'
    ]],
    ['¿Qué permite que la tradición de los tamborileros continúe?', [
      'Conservar los instrumentos sin utilizarlos.',
      'Compartir la música y los saberes entre las personas.',
      'Guardar únicamente fotografías de las presentaciones.',
      'No lo recuerdo.'
    ]],
    ['Después de escuchar las grabaciones, ¿qué tan fácil te resultó distinguir la flauta del tambor?', [
      'Muy fácil.', 'Algo fácil.', 'Algo difícil.', 'Muy difícil.', 'No escuché las grabaciones.'
    ]],
    ['¿Qué recurso te ayudó más a comprender la información?', [
      'Los textos.', 'Las imágenes y tarjetas interactivas.', 'El video.',
      'Las grabaciones de audio.', 'Las preguntas y actividades.', 'Los juegos.',
      'Ninguno me ayudó a comprenderla.'
    ]],
    ['¿Qué tema necesita una explicación más clara?', [
      'La tradición y su importancia cultural.',
      'Los materiales de los instrumentos.',
      'Las partes de los instrumentos y sus funciones.',
      'El proceso de elaboración.',
      'Cómo se produce y distingue cada sonido.',
      'Ninguno; los temas que revisé fueron claros.',
      'No exploré suficiente contenido para responder.'
    ]],
    ['¿Qué tan fácil fue encontrar las secciones que querías visitar?', [
      'Muy fácil.', 'Algo fácil.', 'Algo difícil.', 'Muy difícil.'
    ]],
    ['¿Qué tan claro fue para qué servían los botones?', [
      'Todos los botones que utilicé fueron claros.',
      'La mayoría fueron claros.',
      'Varios me causaron confusión.',
      'No entendí para qué servían.',
      'No utilicé los botones.'
    ]],
    ['¿Te resultó claro cómo interactuar con las tarjetas de los instrumentos?', [
      'Sí, lo entendí de inmediato.',
      'Sí, después de probar.',
      'Necesité ayuda para entenderlo.',
      'No descubrí cómo utilizarlas.',
      'No vi esas tarjetas.'
    ]],
    ['¿Cómo te resultó la cantidad de información presentada?', [
      'Insuficiente; necesitaba más explicación.',
      'Adecuada para comprender los temas.',
      'Excesiva; me costó mantener la atención.',
      'No revisé suficiente contenido para responder.'
    ]],
    ['¿Cómo se veían los textos y las imágenes en tu dispositivo?', [
      'Ambos se veían claramente.',
      'Los textos eran difíciles de leer.',
      'Las imágenes eran difíciles de apreciar.',
      'Tanto los textos como las imágenes eran difíciles de ver.'
    ]],
    ['¿Cuál fue el principal problema que encontraste al usar la página?', [
      'No encontré problemas.',
      'Algún botón no respondió.',
      'Un audio o video no se reprodujo.',
      'Las imágenes o secciones tardaron en cargar.',
      'El contenido se cortaba o se encimaba.',
      'Me costó regresar o cambiar de sección.'
    ]],
    ['¿Qué cambio te ayudaría más a aprender con esta página?', [
      'Explicaciones más sencillas.',
      'Más imágenes con las partes de los instrumentos señaladas.',
      'Más ejemplos de los sonidos.',
      'Más demostraciones del uso y elaboración de los instrumentos.',
      'Más actividades para practicar y comprobar lo aprendido.',
      'Indicaciones más claras para navegar.',
      'No considero necesarios cambios.'
    ]],
    ['¿Desde qué dispositivo exploraste la página?', [
      'Teléfono celular.', 'Tableta.', 'Computadora portátil.', 'Computadora de escritorio.'
    ]]
  ];
}
