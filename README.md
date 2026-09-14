# Innovación Aplicada al Sector Productivo (CL32)

Materiales del módulo en formato presentación 16:9 para web. Los alumnos siguen las presentaciones en clase y estudian desde ellas. El módulo se trabaja por proyectos: las presentaciones son el apoyo teórico de las prácticas que se hacen y se defienden en el aula.

## Estructura

```
index.html          Portada con las cuatro unidades de trabajo
assets/             Motor de diapositivas (deck-stage.js), estilos y ejercicios (iasp.css, iasp.js), iconos y manchas de color (SVG)
plantilla/          Tipos de diapositiva disponibles y ejercicios interactivos de prueba
herramientas/       Scripts de mantenimiento (aplica-notas.py vuelca las notas editadas en clase)
ut00/               Presentación del módulo (primera sesión)
ut01/ ... ut04/     Una presentación por unidad (index.html + img/)
```

## Cómo se construye una unidad

1. Se diseña primero la práctica de la unidad: qué producen los alumnos, con qué herramienta y cómo se evalúa en clase.
2. Se prepara y revisa un guion de la unidad con la teoría necesaria para esa práctica (material de trabajo, fuera del repositorio).
3. Con el guion aprobado se genera `utNN/index.html` usando los tipos de diapositiva de `plantilla/`.
4. Se añaden las imágenes a `utNN/img/`, cada una con su crédito.
5. Se publica en GitHub Pages y se enlaza desde `index.html`.

## Ejercicios interactivos

En `assets/iasp.js` están los generadores de ejercicios. Se insertan en una diapositiva con:

```html
<div class="ej" data-tipo="…"></div>
```

Cada ejercicio tiene los botones Comprobar, Pista, Resolver y Otro ejercicio, y cuenta los aciertos seguidos. Tipos disponibles:

- `clasificar`: un caso al azar y tres desplegables (según el área, el impacto y el objetivo). Con `data-banco` y `data-campos` se le dan otro banco y otros campos de `IASP.campos` (en la UT2: `data-banco="tecnologia" data-campos="tecnologia,efecto,areaEmpresa"`); `data-enunciado` y `data-consejo` cambian el enunciado y el consejo que se muestra al fallar.
- `emparejar`: siete casos y las siete fuentes de oportunidad de Drucker.
- `caso`: un caso breve, la pauta de éxito o fracaso que se cumple y una respuesta razonada que se revela.

Los bancos de casos están al principio de `assets/iasp.js` (`IASP.bancos`) y se amplían añadiendo entradas, sin tocar el resto del código. Los quiz de opción múltiple usan la clase `quiz` con `data-correct`.

## Pregunta a la clase

Diapositiva con una pregunta y un panel de ideas que se revela al pulsar (texto, imágenes o una sola imagen):

```html
<div class="revela">
  <div class="revela-cuerpo">… ideas del profesor …</div>
  <button class="btn btn-primary revela-btn">Ver ideas</button>
</div>
```

## Fotos con atribución

Toda foto ajena va dentro de una figura con su crédito. Si la imagen de la diapositiva es un recorte o una miniatura, `data-grande` en la `img` indica el archivo completo que se abre en el visor. La marca © es visible siempre, la ficha aparece al pasar el ratón (y al imprimir) y un clic abre la foto a pantalla completa (Esc o clic para cerrar). Si la figura lleva además la clase `tarjeta` (tarjetas del taller, imagen grande 16:9 con su texto grabado), el visor la muestra a pantalla completa y solo añade como etiqueta el crédito, que va en un `<small>` dentro del `figcaption`:

```html
<figure class="foto">
  <img src="img/foto.jpg" alt="…" title="Foto: autor · fuente · licencia">
  <figcaption class="credito">Descripción. Foto: autor, fuente, licencia <a href="…">CC BY-SA 4.0</a>. Sin modificaciones.</figcaption>
</figure>
```

## Galería de fotos

Varias fotos en el mismo hueco, con flechas para pasar y un pie que cambia con cada una. Cada foto lleva su crédito como siempre y se amplía con clic. Un elemento de la misma diapositiva con `data-ir="2"` salta a la segunda foto al pulsarlo (útil para enlazar cada paso de una lista con su imagen):

```html
<div class="galeria">
  <figure class="foto" data-pie="<b>Figura 1.2.</b> Lienzo de modelo de negocio…">…</figure>
  <figure class="foto" data-pie="<b>Figura 1.3.</b> Prototipo en papel…">…</figure>
</div>
```

Por defecto la galería ocupa toda la altura del hueco; con `style="--galeria-alto:560px;--galeria-flex:none"` se fija la altura del marco.

## Ver las presentaciones en local

Las miniaturas del carril lateral toman los estilos de `assets/iasp.css`; abriendo el HTML directamente desde disco (`file://`) el navegador no se los pasa y las miniaturas salen sin estilo. En GitHub Pages funciona sin más. Para verlo igual en local, sirve la carpeta con un servidor sencillo:

```
python -m http.server 8000
```

y abre `http://localhost:8000/`.

## Notas del profesor

Cada diapositiva lleva sus notas en un `<aside class="notas">` como primer hijo de la sección (admite HTML: negritas, listas, enlaces). No se ven en la diapositiva; la tecla **N** abre `assets/notas.html` en una ventana aparte, que muestra las notas de la diapositiva actual, la siguiente y un reloj, y se actualiza al cambiar de diapositiva. Desde esa ventana también se puede avanzar y retroceder.

La ventana tiene dos pestañas:

- **Guion**: las notas publicadas. Se pueden editar en clase; los cambios se guardan en el `localStorage` del navegador y se marcan como "Editado en este navegador".
- **Bitácora**: notas privadas de clase (qué cambiar, qué ha funcionado), por diapositiva y para toda la unidad. No se publican nunca.

Lo guardado vive solo en ese navegador y en ese ordenador: al acabar la clase, **Exportar** descarga un JSON con todo (`notas-utNN-fecha.json`); **Importar** fusiona un JSON en otro ordenador conservando la versión más reciente de cada nota. Al terminar la unidad, el script vuelca el JSON al repositorio:

```
python herramientas/aplica-notas.py notas-ut01-2026-10-15.json --ver   # muestra el antes y el después
python herramientas/aplica-notas.py notas-ut01-2026-10-15.json         # escribe en ut01/index.html
```

Las notas de guion cambiadas se escriben en su `<aside>` (localizado por `data-label`, que debe ser único en la unidad) y la bitácora se guarda como Markdown junto al JSON, fuera del repositorio.

## Navegación

Flechas o espacio para avanzar, Inicio y Fin para ir al principio o al final, R para volver a la primera. Ctrl+P imprime una página por diapositiva. N abre la ventana de notas del profesor.

## Licencia

- **Contenido** (diapositivas, textos, esquemas e imágenes propias): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es) — ver `LICENSE`. Se puede copiar, adaptar y reutilizar, incluso con fines comerciales, citando la autoría y compartiendo el resultado bajo la misma licencia.
- **Código** (`assets/deck-stage.js`, `assets/iasp.js`, `assets/iasp.css`): [MIT](LICENSE-CODE) — ver `LICENSE-CODE`.
- **Excepción: material de terceros.** Las fotografías e ilustraciones ajenas no están cubiertas por la licencia anterior. Cada una lleva su crédito y su licencia en el `figcaption` de la figura y se usan con fines educativos. Para reutilizarlas hay que acudir a la licencia original de cada una.

Autoría: Raúl Ibáñez, 2026. Atribución sugerida: «Raúl Ibáñez, *Innovación Aplicada al Sector Productivo (CL32)*, CC BY-SA 4.0».
