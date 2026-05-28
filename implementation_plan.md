# Implementación del Módulo 2: Caparazón de Tortuga

Este plan detalla la creación de la página para el Módulo 2 ("Caparazón de Tortuga"), siguiendo la estructura de diseño visual y la navegabilidad paso a paso previamente implementada en el Módulo 1 (Flauta de Carrizo), pero adaptándola a las nuevas actividades solicitadas.

## User Review Required

> [!IMPORTANT]
> Revisa la estructura propuesta para confirmar que los textos y las 5 actividades reflejen exactamente lo que deseas para este módulo.

## Open Questions

1. **Recursos de Imagen y Audio:** Al igual que en el módulo 1, ¿generaremos sonidos simulados (sintetizados con Web Audio API) para el "Caparazón de Tortuga" y el "Tambor", o cuentas con los archivos `.mp3` reales? (Asumiré que usaremos sonidos simulados o *placeholders* si no hay audios).
2. **Imagen Principal:** ¿Tienes una imagen `Caparazon.png` para usar en la introducción y en la imagen interactiva? En caso negativo, puedo utilizar un *placeholder* interactivo.

## Proposed Changes

A continuación se agrupan los archivos que serán creados y modificados:

### Navegación del Curso

#### [MODIFY] [course.js](file:///c:/Users/Gabriel%20L%C3%B3pez/Desktop/Developer/Instrumentos/course.js)
- Agregar la redirección para el botón `btnModule2` hacia `module2.html`.

### Nuevos Archivos del Módulo 2

#### [NEW] [module2.html](file:///c:/Users/Gabriel%20L%C3%B3pez/Desktop/Developer/Instrumentos/module2.html)
- Copiar la estructura general (toolbar de 5 pasos, fondo animado global).
- **Actividad 1 (Intro):** Texto "El caparazón de tortuga ha sido utilizado como instrumento de percusión..." y un botón "Escuchar percusión".
- **Actividad 2 (Explora el instrumento):** Imagen con 4 puntos interactivos (Caparazón, Zona de golpeo, Baquetas o astas, Resonancia).
- **Actividad 3 (Comparador de Sonidos):** Tres botones para escuchar sonidos (Flauta, Caparazón, Tambor) y opciones para seleccionar cuál es el caparazón.
- **Actividad 4 (Microhistoria Cultural):** Carrusel de 3 pantallas con el texto narrativo provisto.
- **Actividad 5 (Relaciona sonido y función):** Actividad interactiva de "Drag and Drop" para unir conceptos (Percusión, Ritual, Resonancia, Ritmo) con sus definiciones.

#### [NEW] [module2.css](file:///c:/Users/Gabriel%20L%C3%B3pez/Desktop/Developer/Instrumentos/module2.css)
- Reutilizar clases base de la plataforma.
- Añadir estilos específicos para la actividad de "Comparador de Sonidos" y el diseño de la actividad de relacionar columnas (Match/Drag & Drop).

#### [NEW] [module2.js](file:///c:/Users/Gabriel%20L%C3%B3pez/Desktop/Developer/Instrumentos/module2.js)
- Manejo de navegación entre los 5 pasos del Módulo 2.
- Lógica para los hotspots del caparazón.
- Lógica de reproducción de los 3 sonidos (simulados) y validación de respuesta en el comparador.
- Lógica de carrusel para la microhistoria.
- Sistema de "Drag and Drop" para emparejar conceptos.
- Activación de confeti al completar el módulo y redirección al curso.

## Verification Plan

### Manual Verification
- Ingresar al "Curso" y hacer clic en el Módulo 2 (Caparazón de Tortuga).
- Validar la visibilidad de los fondos animados y que el progreso funcione.
- Hacer clic en los 4 hotspots del instrumento.
- Reproducir los 3 sonidos, seleccionar la opción correcta y avanzar.
- Navegar por el carrusel de la historia cultural.
- Completar la unión de conceptos arrastrando y soltando correctamente.
- Validar confeti final.
