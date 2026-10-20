# Conozcamos Tabasco

Proyecto web educativo e interactivo sobre los tamborileros y los instrumentos tradicionales de Tabasco. Desarrollado con HTML, CSS y JavaScript, con una paleta de verde, crema y dorado.

## Estructura principal

- `index.html`: pantalla de entrada y redireccion al curso
- `course.html`: portada y recorrido con acceso libre a cuatro experiencias
- `tradicion.html`: personas, encuentros y saberes de los tamborileros
- `instrumentos.html`: materiales, partes, elaboración y comparación de flauta y tambor
- `sonidos.html`: grabaciones, reconocimiento auditivo y exploración rítmica opcional
- `descubrimientos.html`: actividad integradora y postal imprimible
- `recorrido.css`, `recorrido.js`: diseño e interacciones compartidas de las cuatro páginas
- `module1.html`, `module2.html`, `module3.html`: modulos del contenido
- `games.html`: actividades interactivas
- `resumen.html`: vista de resumen

## Uso local

Abre `index.html` en el navegador para iniciar el recorrido del proyecto.

También puedes servir esta carpeta con un servidor HTTP estático y abrir `course.html`.
Las páginas nuevas no necesitan dependencias ni un proceso de compilación.

El avance se guarda solo en el navegador bajo `conozcamos_tabasco_recorrido_v1`.
No utiliza las antiguas claves `module1_completed`, `module2_completed` ni
`module3_completed`. Si el almacenamiento no está disponible, el recorrido sigue
funcionando durante la visita. Ningún módulo requiere completar otro.

Los archivos `module1`, `module2`, `module3` y `resumen` se conservan como
material anterior. `games.html` contiene la zona de juegos, incluidos memorama,
relaciones, ordenamiento, reconocimiento de sonidos y memoria rítmica.
Los audios reales están separados de la percusión sintetizada.

## Archivos complementarios

- `cultural-design.css`: paleta y estilos del recorrido.
- `formulario-evaluacion/CrearFormulario.gs`: script para crear una encuesta de
  20 preguntas en Google Forms; se ejecuta manualmente en Google Apps Script.
- `formulario-evaluacion/INSTRUCCIONES.txt`: instrucciones y clave de análisis.
- Los archivos de imagen, audio y video se incluyen en el repositorio y se
  referencian mediante rutas relativas. Respeta las mayúsculas de sus nombres.

## Publicación y actualizaciones

El sitio es estático y no requiere instalación de paquetes ni compilación.
Para conectarlo a Vercel, importa este repositorio, selecciona el tipo de proyecto
`Other`, usa la raíz del repositorio como carpeta del proyecto y no configures
un comando de compilación. La página de entrada es `index.html`.

La rama principal es `main`. Una vez configurada la integración de alojamiento,
los cambios enviados a esa rama podrán publicarse automáticamente.
Guardar cambios locales no los envía a GitHub: debes confirmarlos con Git y
ejecutar `git push origin main`.

La configuración local de Vercel, los archivos `.env` y las dependencias locales
están excluidos mediante `.gitignore`.
