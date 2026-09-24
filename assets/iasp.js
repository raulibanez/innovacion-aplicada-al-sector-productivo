/* Motor común de las presentaciones de Innovación Aplicada a los Sectores Productivos.
 *
 *  1. Numera las diapositivas ("03 / 51").
 *  2. Quiz de opción múltiple:
 *       <div class="quiz" data-correct="1" data-ok="..." data-ko="...">
 *         <p class="quiz-fb">Selecciona una opción.</p>
 *         <div class="quiz-opts"> <button class="quiz-opt">…</button> … </div>
 *         <button class="btn btn-ghost quiz-reset">Reiniciar</button>
 *       </div>
 *  3. Panel que se revela (pregunta a la clase):
 *       <div class="revela"> <div class="revela-cuerpo">…</div> <button class="btn btn-primary revela-btn">Ver ideas</button> </div>
 *  4. Galería de fotos en el mismo hueco, con flechas y pie que cambia:
 *       <div class="galeria"> <figure class="foto" data-pie="Figura 1.2. …">…</figure> … </div>
 *     Un elemento de la misma diapositiva con data-ir="2" salta a la segunda foto.
 *  5. Ejercicios interactivos con casos en orden (sin repetir hasta dar la vuelta), todos con Comprobar, Pista, Resolver y Otro ejercicio:
 *       <div class="ej" data-tipo="clasificar"></div>   un caso y tres filas de tarjetas (área, impacto, objetivo)
 *       <div class="ej" data-tipo="emparejar"></div>    siete casos y las siete fuentes de oportunidad de Drucker
 *       <div class="ej" data-tipo="caso"></div>         caso breve, elegir la pauta de éxito o fracaso; respuesta razonada oculta
 *     El de clasificar admite otro banco y otros campos (UT2: tecnología, efecto y área de la empresa):
 *       <div class="ej" data-tipo="clasificar" data-banco="tecnologia" data-campos="tecnologia,efecto,areaEmpresa"
 *            data-enunciado="…" data-consejo="…"></div>
 *     Los bancos de casos están en IASP.bancos y los campos en IASP.campos; se amplían sin tocar el resto.
 *  6. Notas del profesor: cada sección lleva un <aside class="notas">…</aside> como primer hijo
 *     (HTML, oculto por CSS). La tecla N abre assets/notas.html en una ventana aparte con las
 *     notas de la diapositiva actual; se actualiza al cambiar de diapositiva.
 */
(function () {
  'use strict';

  const IASP = (window.IASP = window.IASP || {});

  /* ---------- utilidades ---------- */
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const baraja = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Recorre la lista en orden, sin repetir hasta llegar al final; entonces vuelve a empezar
  const cursores = new WeakMap();
  function eligeOtro(lista) {
    if (!lista.length) return null;
    const i = cursores.get(lista) || 0;
    cursores.set(lista, (i + 1) % lista.length);
    return lista[i];
  }

  /* ---------- bancos de casos ---------- */
  IASP.bancos = {};

  IASP.campos = {
    // UT1: tipos de innovación
    area: { etiqueta: 'Según el área', opciones: ['Producto o servicio', 'Proceso', 'Marketing y canal', 'Organización'] },
    impacto: { etiqueta: 'Según el impacto', opciones: ['Incremental', 'Radical', 'Disruptiva'] },
    objetivo: { etiqueta: 'Según el objetivo', opciones: ['Tecnológica', 'Social', 'Ambiental'] },
    // UT2: tecnología emergente, efecto principal y área de la empresa
    tecnologia: { etiqueta: 'Qué tecnología usa', opciones: ['Inteligencia artificial', 'Internet de las cosas', 'Computación en la nube', 'Big data y analítica', 'Robótica y cobots', 'Impresión 3D', 'Gemelos digitales', 'Realidad virtual y aumentada', 'Blockchain', '5G y redes privadas', 'Computación cuántica', 'Ciberseguridad'] },
    efecto: { etiqueta: 'Efecto principal', opciones: ['Eficiencia', 'Calidad', 'Sostenibilidad'] },
    areaEmpresa: { etiqueta: 'Área de la empresa', opciones: ['Dirección', 'Personas', 'Producción o atención', 'Ventas y clientes', 'Administración'] }
  };

  // UT2. Cada caso: texto, y por campo la lista de respuestas aceptadas (la primera es la principal) y una justificación.
  IASP.bancos.tecnologia = [
    { texto: 'Iveco instala 92 robots nuevos para soldar cabinas de camión en su planta de Valladolid y automatiza la nave de pintura (2026).',
      tecnologia: ['Robótica y cobots'], efecto: ['Eficiencia', 'Calidad'], areaEmpresa: ['Producción o atención'],
      por: 'Robots industriales en la fábrica: más cabinas con la misma plantilla y menos retrabajos. Cambia cómo se produce.' },
    { texto: 'Telefónica añade a su telefonía de empresa un servicio que transcribe y resume automáticamente las llamadas (2026).',
      tecnologia: ['Inteligencia artificial'], efecto: ['Calidad', 'Eficiencia'], areaEmpresa: ['Ventas y clientes'],
      por: 'La IA entiende el lenguaje de la llamada. El cliente recibe un servicio mejor y la empresa lo usa en la relación con sus clientes.' },
    { texto: 'Mercadona pone un programa que lee las facturas de sus proveedores y las registra sin que nadie las teclee (2025).',
      tecnologia: ['Inteligencia artificial'], efecto: ['Eficiencia'], areaEmpresa: ['Administración'],
      por: 'Leer documentos es una tarea de IA; se ahorra tiempo en una tarea administrativa.' },
    { texto: 'Un pulverizador agrícola con cámaras solo fumiga donde detecta mala hierba y gasta la mitad de herbicida (John Deere, 2025).',
      tecnologia: ['Internet de las cosas', 'Inteligencia artificial'], efecto: ['Sostenibilidad', 'Eficiencia'], areaEmpresa: ['Producción o atención'],
      por: 'Sensores y cámaras conectados en la máquina (también vale IA, que es la que reconoce la hierba). Menos producto químico: sostenibilidad, y también ahorro.' },
    { texto: 'La fábrica de motores Horse de Valladolid reúne los datos de todas sus líneas para decidir con ellos el mantenimiento y la producción (2024-2026).',
      tecnologia: ['Big data y analítica'], efecto: ['Eficiencia'], areaEmpresa: ['Producción o atención'],
      por: 'Decidir con grandes cantidades de datos es big data; el objetivo es producir más con menos paradas.' },
    { texto: 'Grupo Lince (Valladolid) abre un centro de impresión 3D donde trabajan personas con discapacidad (premio 2024).',
      tecnologia: ['Impresión 3D'], efecto: ['Sostenibilidad'], areaEmpresa: ['Personas', 'Producción o atención'],
      por: 'La tecnología es la fabricación aditiva; el efecto principal es social, que forma parte de la sostenibilidad; el área es la de las personas (también vale producción).' },
    { texto: 'BEONx (Salamanca) vende a los hoteles un programa que fija el precio de cada habitación según la demanda prevista.',
      tecnologia: ['Big data y analítica', 'Inteligencia artificial'], efecto: ['Eficiencia'], areaEmpresa: ['Ventas y clientes'],
      por: 'Predice la demanda con datos históricos (analítica, también vale IA) para vender mejor: área de ventas.' },
    { texto: 'Un grupo eólico proyecta en Torrelobatón (Valladolid) un centro de datos de 160 MW alimentado con renovables y refrigerado en circuito cerrado (2026).',
      tecnologia: ['Computación en la nube'], efecto: ['Sostenibilidad'], areaEmpresa: ['Dirección'],
      por: 'Un centro de datos es la base física de la nube. Lo que lo diferencia es cómo se alimenta y refrigera. Entrar en un negocio nuevo es una decisión de la dirección.' },
    { texto: 'Una tienda de informática pone en su web un asistente que responde de noche a las preguntas sobre pedidos y reparaciones.',
      tecnologia: ['Inteligencia artificial'], efecto: ['Calidad', 'Eficiencia'], areaEmpresa: ['Ventas y clientes'],
      por: 'Un chatbot es IA; el cliente recibe respuesta cuando la necesita (calidad) y la tienda ahorra llamadas.' },
    { texto: 'Una empresa apunta a toda su plantilla a un curso en línea para reconocer correos de phishing y contraseñas débiles.',
      tecnologia: ['Ciberseguridad'], efecto: ['Calidad'], areaEmpresa: ['Personas'],
      por: 'Formar a las personas es la medida de ciberseguridad más barata; reduce incidentes, que es calidad del servicio; área de personas.' },
    { texto: 'La teleasistencia avanzada de Castilla y León pone en casa de 58.000 personas mayores detectores de caídas, humo, gas e inactividad conectados a una central (2025).',
      tecnologia: ['Internet de las cosas'], efecto: ['Calidad'], areaEmpresa: ['Ventas y clientes', 'Producción o atención'],
      por: 'Sensores en casa conectados a una central: internet de las cosas. El servicio atiende mejor a la persona y a su familia (también vale atención directa).' },
    { texto: 'Las residencias públicas de la Junta incorporan robots sociales, Temi y Copito, que acompañan, recuerdan citas y proponen ejercicios (2025).',
      tecnologia: ['Robótica y cobots'], efecto: ['Calidad'], areaEmpresa: ['Producción o atención'],
      por: 'Robots que trabajan junto a las personas; mejoran la atención que reciben los residentes, que es el servicio que presta la residencia.' },
    { texto: 'Un servicio de ayuda a domicilio cambia los partes en papel por una app en el móvil de cada auxiliar, con los datos guardados en un servidor por internet.',
      tecnologia: ['Computación en la nube'], efecto: ['Eficiencia'], areaEmpresa: ['Personas', 'Producción o atención'],
      por: 'Los datos viven en la nube y se consultan desde cualquier móvil. Ahorra tiempo de papeleo a la plantilla (también vale atención directa).' },
    { texto: 'Una residencia ofrece a sus mayores sesiones con gafas de realidad virtual: paseos por su pueblo de origen y ejercicios de memoria.',
      tecnologia: ['Realidad virtual y aumentada'], efecto: ['Calidad'], areaEmpresa: ['Producción o atención'],
      por: 'Mundos simulados con gafas: realidad virtual. Mejora la atención que recibe la persona.' },
    { texto: 'Una fábrica monta una red 5G privada para que sus carretillas autónomas y sus robots móviles se comuniquen sin cables ni cortes.',
      tecnologia: ['5G y redes privadas'], efecto: ['Eficiencia'], areaEmpresa: ['Producción o atención'],
      por: 'Red 5G propia dentro de la planta; permite mover material sin paradas: eficiencia en producción.' },
    { texto: 'Una empresa de Palencia construye una copia virtual en 3D de una planta industrial para simular cambios antes de hacerlos en la real (Teicon, 2025).',
      tecnologia: ['Gemelos digitales'], efecto: ['Eficiencia'], areaEmpresa: ['Producción o atención'],
      por: 'Una copia virtual conectada con la instalación real es un gemelo digital; evita pruebas caras en la planta.' }
  ];

  // Cada caso: texto, y por campo la lista de respuestas aceptadas (la primera es la principal) y una justificación.
  IASP.bancos.clasificar = [
    { texto: 'Telefónica añade inteligencia artificial a la telefonía de empresa: transcripción y resumen automático de las llamadas (2026).',
      area: ['Producto o servicio'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'Lo que cambia es el servicio que recibe el cliente; el servicio ya existía y mejora; se apoya en tecnología nueva.' },
    { texto: 'Horse, la factoría de motores de Valladolid, invierte 45 millones de euros en una nueva línea de culatas para motores híbridos (2026).',
      area: ['Proceso'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'Cambia cómo se fabrica, no qué se vende; mejora una línea existente; es innovación técnica.' },
    { texto: 'Inditex invierte en una startup de robótica logística con inteligencia artificial y estrena un sistema de alarmado que permite recoger en tienda lo comprado en la web (2025).',
      area: ['Proceso', 'Marketing y canal'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'Cambia la logística (proceso) y la forma de entregar al cliente (canal); mejora lo que ya hacía; se apoya en robótica e IA.' },
    { texto: 'Rural Servicios Informáticos abre en Valladolid un centro de inteligencia artificial y automatización para captar talento fuera de Madrid (2026).',
      area: ['Organización'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'Cambia cómo se organiza la empresa y dónde trabaja su gente; no cambia el producto; el motivo es tecnológico.' },
    { texto: 'Mercadona pone inteligencia artificial a leer las facturas de sus proveedores y a planificar las vacaciones del personal (2025).',
      area: ['Proceso', 'Organización'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'Cambian tareas internas de administración; son mejoras paso a paso; el objetivo es técnico.' },
    { texto: 'El centro de HP en León desarrolla el programa interno (firmware) de las impresoras de gran formato de la marca (2025).',
      area: ['Producto o servicio'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'El firmware forma parte del producto que se vende; cada versión mejora la anterior; es innovación técnica.' },
    { texto: 'Humane lanza el AI Pin, un dispositivo con inteligencia artificial pensado para sustituir al móvil (2024). Deja de funcionar en 2025.',
      area: ['Producto o servicio'], impacto: ['Radical'], objetivo: ['Tecnológica'],
      por: 'Producto nuevo y distinto, un salto respecto al móvil: radical, aunque fracasara. No es disruptiva: disruptiva se sabe después, cuando el producto desplaza al anterior y otros lo copian, y el AI Pin no desplazó a nadie, nadie lo copió y era más caro y peor que el móvil.' },
    { texto: 'Google Stadia permite jugar a videojuegos en la nube sin consola ni ordenador potente (2019). Cierra en 2023.',
      area: ['Producto o servicio'], impacto: ['Disruptiva', 'Radical'], objetivo: ['Tecnológica'],
      por: 'Proponía un modelo distinto: jugar en la nube sin comprar consola ni ordenador potente. Tampoco tuvo éxito.' },
    { texto: 'Amazon empieza a alquilar por horas servidores en la nube en vez de que cada empresa compre los suyos (Amazon Web Services, 2006). Hoy Microsoft y Google hacen lo mismo.',
      area: ['Producto o servicio'], impacto: ['Disruptiva', 'Radical'], objetivo: ['Tecnológica'],
      por: 'Un servicio nuevo con un modelo de negocio distinto, pagar por uso, que desplazó la compra de servidores y que los competidores copiaron: por eso es disruptiva y no solo radical.' },
    { texto: 'Una tienda de informática de barrio empieza a vender por WhatsApp, con catálogo y pago dentro del chat.',
      area: ['Marketing y canal'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'El producto es el mismo; cambia cómo se vende y por dónde; es una mejora pequeña apoyada en tecnología.' },
    { texto: 'Un servicio técnico ofrece un diagnóstico automático del equipo, a distancia, antes de enviar al técnico.',
      area: ['Proceso'], impacto: ['Incremental'], objetivo: ['Tecnológica'],
      por: 'Cambia cómo se presta el servicio por dentro; ahorra visitas; se apoya en software de diagnóstico.' },
    { texto: 'Una farmacia de pueblo lleva a casa los medicamentos a los mayores que no pueden desplazarse y les avisa por WhatsApp cuando toca renovar la receta.',
      area: ['Marketing y canal', 'Proceso'], impacto: ['Incremental'], objetivo: ['Social'],
      por: 'El producto es el mismo; cambia cómo llega al cliente y cómo se le atiende; es una mejora pequeña; busca el bienestar de personas con dificultades.' },
    { texto: 'Una empresa reacondiciona ordenadores usados y los vende con garantía de dos años.',
      area: ['Producto o servicio', 'Proceso'], impacto: ['Incremental'], objetivo: ['Ambiental', 'Tecnológica'],
      por: 'Ofrece un producto nuevo (el reacondicionado) con un proceso propio; su objetivo principal es alargar la vida de los equipos.' },
    { texto: 'Una marca de ropa pone en cada prenda una etiqueta con código QR que cuenta dónde se fabricó y cuánta agua se gastó en hacerla.',
      area: ['Marketing y canal'], impacto: ['Incremental'], objetivo: ['Ambiental', 'Tecnológica'],
      por: 'La prenda es la misma; cambia cómo se comunica al cliente; es un añadido pequeño; el fin es dar valor a lo sostenible.' },
    { texto: 'John Deere vende un pulverizador con cámaras e inteligencia artificial que solo fumiga donde detecta mala hierba: la mitad de herbicida (2025).',
      area: ['Producto o servicio'], impacto: ['Incremental', 'Radical'], objetivo: ['Ambiental', 'Tecnológica'],
      por: 'Es una función nueva de un producto que ya existía, el pulverizador; para el agricultor cambia mucho, por eso vale radical; su objetivo principal es gastar menos herbicida.' },
    { texto: 'Un centro de salud permite hacer la consulta por videollamada en vez de ir presencialmente.',
      area: ['Producto o servicio', 'Proceso'], impacto: ['Incremental'], objetivo: ['Social', 'Tecnológica'],
      por: 'Cambia el servicio que recibe el paciente y cómo se organiza la consulta; busca el bienestar de las personas.' },
    { texto: 'Marsi Bionics, de Madrid, crea el primer exoesqueleto para niños con enfermedades neuromusculares, que les permite andar durante la rehabilitación (ATLAS 2030, 2021).',
      area: ['Producto o servicio'], impacto: ['Radical'], objetivo: ['Social', 'Tecnológica'],
      por: 'Un producto que no existía, un salto y no una mejora; su fin principal es la vida de esos niños, aunque se apoye en tecnología nueva.' },
    { texto: 'Buurtzorg, una empresa holandesa de cuidados a domicilio, quita los jefes: equipos de doce enfermeras se organizan solos y deciden sus turnos y sus pacientes (2006). Hoy son más de 10.000.',
      area: ['Organización'], impacto: ['Radical'], objetivo: ['Social'],
      por: 'Cambia cómo se organiza la gente, no el servicio; es un salto respecto a la empresa con jerarquía; busca cuidar mejor a las personas.' }
  ];

  IASP.fuentes = [
    'Sucesos inesperados', 'Incongruencias', 'Necesidades de un proceso', 'Cambios en la industria y el mercado',
    'Cambios demográficos', 'Cambios en la percepción', 'Nuevos conocimientos y tecnología'
  ];

  // Cada juego: siete casos, uno por fuente (índice de IASP.fuentes)
  IASP.bancos.emparejar = [
    [
      { fuente: 0, texto: 'Una app pensada para empresas se hace viral entre estudiantes; la empresa lanza una versión para ellos.' },
      { fuente: 1, texto: 'Los clientes dicen que quieren más funciones, pero los datos muestran que solo usan tres; alguien lanza una app minimalista.' },
      { fuente: 2, texto: 'Los técnicos pierden una hora al día rellenando partes en papel; una empresa crea una app de partes desde el móvil.' },
      { fuente: 3, texto: 'La llegada del streaming hunde la venta de DVD; los videoclubes que sobreviven se reconvierten.' },
      { fuente: 4, texto: 'En los pueblos hay cada vez más mayores de 65 años; una empresa ofrece asistencia informática a domicilio para mayores.' },
      { fuente: 5, texto: 'La gente pasa de ver la inteligencia artificial como ciencia ficción a usarla a diario; una academia ofrece cursos de IA para todos.' },
      { fuente: 6, texto: 'Un nuevo modelo de inteligencia artificial permite transcribir llamadas en tiempo real; una operadora lo incorpora a su telefonía de empresa.' }
    ],
    [
      { fuente: 0, texto: 'Un pegamento de laboratorio que no pegaba del todo acaba convertido en las notas adhesivas.' },
      { fuente: 1, texto: 'Los ordenadores se anunciaban como fáciles de usar, pero la gente no los entendía; nacen las ventanas y el ratón.' },
      { fuente: 2, texto: 'Pagar con tarjeta en un taxi era lento y a veces imposible; llegan los datáfonos por móvil y el pago con el teléfono.' },
      { fuente: 3, texto: 'La fotografía digital acaba con el carrete; los fabricantes que no cambian a tiempo desaparecen.' },
      { fuente: 4, texto: 'Hay más jubilados con tiempo y dinero; crece el turismo para mayores fuera de temporada.' },
      { fuente: 5, texto: 'Ir en bici al trabajo pasa de raro a normal; aparecen empresas de alquiler de bicis y patinetes.' },
      { fuente: 6, texto: 'Las baterías de litio se abaratan; llegan los patinetes eléctricos compartidos.' }
    ]
  ];

  IASP.pautas = [
    { grupo: 'Éxito', texto: 'Conexión con el mercado y con los clientes' },
    { grupo: 'Éxito', texto: 'Varias soluciones probadas antes de elegir' },
    { grupo: 'Éxito', texto: 'Talento y colaboración del equipo' },
    { grupo: 'Fracaso', texto: 'Poca orientación al mercado: no se entendió qué quería el cliente' },
    { grupo: 'Fracaso', texto: 'Sin evaluación económica y técnica antes de empezar' },
    { grupo: 'Fracaso', texto: 'Sin aprobaciones ni control durante el desarrollo' }
  ];

  // Cada caso: título, texto, pautas aceptadas (índices de IASP.pautas, la primera es la principal), pista, razón y fuente.
  IASP.bancos.caso = [
    { titulo: 'Google Stadia (2019-2023)', texto: 'Google lanza un servicio para jugar a videojuegos en la nube, sin consola. La tecnología funciona, pero el catálogo es corto y hay que volver a comprar los juegos. Cierra en enero de 2023 y devuelve el dinero de juegos y mandos.',
      pautas: [3, 4], pista: 'Fíjate en qué pasaba con el catálogo y con los juegos ya comprados.',
      razon: 'La tecnología era buena, pero no se entendió qué quería el jugador: un catálogo amplio y no pagar dos veces por lo mismo. Es un fracaso por poca orientación al mercado.', fuente: 'Xataka, enero de 2023.' },
    { titulo: 'El metaverso de Meta (2021-2026)', texto: 'Meta cambia de nombre y apuesta miles de millones por la realidad virtual y el metaverso. Su división Reality Labs pierde más de 19.000 millones de dólares solo en 2025. En 2026 recorta el proyecto y despide a 1.500 personas.',
      pautas: [4, 3], pista: 'Piensa en cuánto se invirtió antes de saber si alguien lo quería.',
      razon: 'Se invirtió a gran escala antes de comprobar que existiera demanda. Es un fracaso por falta de evaluación previa: la apuesta fue estratégica, no probada.', fuente: 'CNBC e Infobae, marzo de 2026.' },
    { titulo: 'Amazon Fire Phone (2014)', texto: 'Amazon lanza su propio móvil, pensado para comprar en Amazon con la cámara. Vende tan poco que en octubre de 2014 asume 170 millones de dólares en teléfonos sin vender y lo retira en menos de un año.',
      pautas: [3], pista: '¿Para quién estaba pensado el teléfono: para el usuario o para la tienda?',
      razon: 'El teléfono servía a Amazon más que a quien lo compraba. Fracaso por poca orientación al mercado.', fuente: 'Variety, 23 de octubre de 2014.' },
    { titulo: 'Los televisores 3D (2010-2014)', texto: 'Tras Avatar, los fabricantes lanzan televisores en 3D. Hacen falta gafas, dan dolor de cabeza, hay poco contenido y cuestan más. El público elige los televisores 2D y las smart TV.',
      pautas: [3], pista: 'Piensa en las gafas y en el contenido disponible.',
      razon: 'Se lanzó una tecnología sin resolver lo que molestaba al usuario ni asegurar contenido. Fracaso por poca orientación al mercado.', fuente: 'Elaboración propia a partir de la prensa de 2010-2014.' },
    { titulo: 'Humane AI Pin (2024-2025)', texto: 'Una startup lanza un aparato con inteligencia artificial que se lleva en la ropa y pretende sustituir al móvil. Cuesta 699 dólares. En febrero de 2025 vende sus activos a HP y los dispositivos dejan de funcionar.',
      pautas: [3, 4], pista: '¿Qué problema del usuario resolvía mejor que el móvil?',
      razon: 'Era una solución en busca de problema: no hacía nada mejor que el móvil que ya llevabas en el bolsillo. Fracaso por poca orientación al mercado.', fuente: 'TechCrunch y MuyComputerPro, febrero de 2025.' },
    { titulo: 'Netflix (1997-hoy)', texto: 'Empieza enviando DVD por correo, pasa al streaming cuando la conexión lo permite y después produce sus propias series a partir de lo que ve que gusta a sus usuarios.',
      pautas: [0, 1], pista: 'Fíjate en de dónde saca Netflix las decisiones sobre qué producir.',
      razon: 'Cada paso responde a lo que hacen y piden los clientes, medido con datos. Éxito por conexión con el mercado.', fuente: 'Netflix, historia de la empresa (about.netflix.com).' },
    { titulo: 'Inditex, logística y tienda (2025)', texto: 'Inditex invierte en una startup de robótica logística con inteligencia artificial y estrena un alarmado que permite recoger en tienda lo comprado en la web, integrando tienda física y venta online.',
      pautas: [0, 2], pista: 'Piensa en qué necesita el cliente que compra por internet y vive cerca de una tienda.',
      razon: 'La innovación sigue al cliente: comprar donde quiera y recoger donde le venga bien. Éxito por conexión con el mercado, apoyado en colaboración con una startup.', fuente: 'Inditex, resultados del primer semestre de 2025, 10 de septiembre de 2025.' }
  ];

  /* ---------- armazón común de los ejercicios ---------- */
  function armazon(el, enunciado) {
    el.innerHTML =
      '<p class="ej-enunciado">' + esc(enunciado) + '</p>' +
      '<div class="ej-cuerpo"></div>' +
      '<div class="ej-fila">' +
      '  <button class="btn btn-primary ej-comprobar">Comprobar</button>' +
      '  <button class="btn btn-ghost ej-pista">Pista</button>' +
      '  <button class="btn btn-ghost ej-resolver">Resolver</button>' +
      '  <button class="btn btn-ghost ej-otro">Otro ejercicio</button>' +
      '  <span class="ej-racha">Aciertos seguidos: <b>0</b></span>' +
      '</div>' +
      '<p class="ej-fb"></p>';
    const $ = (s) => el.querySelector(s);
    const st = { cuerpo: $('.ej-cuerpo'), fb: $('.ej-fb'), racha: $('.ej-racha b'), aciertos: 0, conPista: false, resuelto: false };
    st.mensaje = (t, clase) => { st.fb.textContent = t; st.fb.className = 'ej-fb' + (clase ? ' ' + clase : ''); };
    st.acierto = (t) => { if (!st.resuelto && !st.conPista) { st.aciertos++; st.racha.textContent = st.aciertos; } st.resuelto = true; st.mensaje(t, 'ok'); };
    st.fallo = (t) => { st.aciertos = 0; st.racha.textContent = '0'; st.mensaje(t, 'ko'); };
    st.ayuda = () => { st.conPista = true; st.aciertos = 0; st.racha.textContent = '0'; };
    st.nuevo = () => { st.conPista = false; st.resuelto = false; st.mensaje(''); };
    st.botones = { comprobar: $('.ej-comprobar'), pista: $('.ej-pista'), resolver: $('.ej-resolver'), otro: $('.ej-otro') };
    // Que las teclas dentro del ejercicio no cambien de diapositiva
    el.addEventListener('keydown', (e) => e.stopPropagation());
    return st;
  }

  function selectHtml(clase, opciones, vacio) {
    return '<select class="ej-select ' + clase + '"><option value="">' + esc(vacio || 'Elige…') + '</option>' +
      opciones.map((o, i) => '<option value="' + i + '">' + esc(o) + '</option>').join('') + '</select>';
  }

  /* ---------- 1. clasificar: un caso, una fila de tarjetas por campo ----------
     Por defecto usa el banco 'clasificar' y los campos área, impacto y objetivo (UT1).
     data-banco, data-campos (separados por comas), data-enunciado y data-consejo permiten otros. */
  function montaClasificar(el) {
    // Sin enunciado por defecto: la diapositiva ya explica el ejercicio en su columna izquierda
    const st = armazon(el, el.dataset.enunciado || '');
    const campos = (el.dataset.campos || 'area,impacto,objetivo').split(',').map((c) => c.trim()).filter((c) => IASP.campos[c]);
    const banco = IASP.bancos[el.dataset.banco || 'clasificar'] || [];
    const consejo = el.dataset.consejo || 'Piensa: qué cambia, cuánto cambia y para qué.';
    // Con muchas tarjetas (UT2: doce tecnologías) la tarjeta entera se compacta para que quepan las tres filas
    if (campos.some((c) => IASP.campos[c].opciones.length > 6)) el.classList.add('ej-compacta');
    let caso = null;

    function nuevo() {
      caso = eligeOtro(banco, caso);
      st.cuerpo.innerHTML =
        '<p class="ej-caso">' + esc(caso.texto) + '</p>' +
        '<div class="ej-campos ej-filas">' + campos.map((c) =>
          '<div class="ej-campo ej-grupo ' + c + '"><span>' + esc(IASP.campos[c].etiqueta) + '</span>' +
          '<div class="ej-opts" style="grid-template-columns:repeat(' + (IASP.campos[c].opciones.length > 6 ? 4 : IASP.campos[c].opciones.length) + ',1fr)">' +
          IASP.campos[c].opciones.map((o, i) => '<button type="button" class="ej-opt" data-i="' + i + '">' + esc(o) + '</button>').join('') +
          '</div></div>').join('') + '</div>';
      // Elegir una tarjeta: se marca ella sola y se limpia la corrección anterior de su fila
      st.cuerpo.querySelectorAll('.ej-opt').forEach((b) => b.addEventListener('click', () => {
        const g = b.closest('.ej-grupo');
        g.classList.remove('ko');
        g.querySelectorAll('.ej-opt').forEach((x) => x.classList.remove('sel', 'ok', 'ko', 'pista'));
        b.classList.add('sel');
      }));
      st.nuevo();
    }
    const grupo = (c) => st.cuerpo.querySelector('.ej-grupo.' + c);
    const elegida = (c) => grupo(c).querySelector('.ej-opt.sel');
    const valor = (c) => { const b = elegida(c); return b ? IASP.campos[c].opciones[+b.dataset.i] : null; };
    const marca = (c, ok) => {
      const g = grupo(c), b = elegida(c);
      g.classList.toggle('ko', !b);
      if (b) { b.classList.remove('ok', 'ko', 'pista'); b.classList.add(ok ? 'ok' : 'ko'); }
    };
    const pon = (c, txt, clase) => {
      const g = grupo(c); g.classList.remove('ko');
      g.querySelectorAll('.ej-opt').forEach((x) => x.classList.remove('sel', 'ok', 'ko', 'pista'));
      const b = g.querySelector('.ej-opt[data-i="' + IASP.campos[c].opciones.indexOf(txt) + '"]');
      if (b) b.classList.add('sel', clase);
    };

    function comprobar() {
      let mal = 0, vacios = 0;
      campos.forEach((c) => {
        const v = valor(c);
        if (v === null) { vacios++; marca(c, false); return; }
        const ok = caso[c].includes(v);
        marca(c, ok); if (!ok) mal++;
      });
      if (!mal && !vacios) st.acierto('Correcto. ' + caso.por);
      else st.fallo((vacios ? vacios + ' sin elegir. ' : '') + (mal ? mal + ' mal. ' : '') + consejo);
    }
    function pista() {
      const c = campos.find((k) => { const v = valor(k); return v === null || !caso[k].includes(v); });
      if (!c) { st.mensaje('Ya está todo bien.', 'ok'); return; }
      st.ayuda(); pon(c, caso[c][0], 'pista');
      st.mensaje(IASP.campos[c].etiqueta + ': ' + caso[c][0] + '. ' + caso.por);
    }
    function resolver() {
      st.ayuda(); st.resuelto = true;
      campos.forEach((c) => pon(c, caso[c][0], 'ok'));
      const alt = campos.filter((c) => caso[c].length > 1).map((c) => IASP.campos[c].etiqueta.toLowerCase() + ' también vale ' + caso[c].slice(1).join(' o ').toLowerCase());
      st.mensaje(caso.por + (alt.length ? ' (' + alt.join('; ') + ').' : ''));
    }
    st.botones.comprobar.addEventListener('click', comprobar);
    st.botones.pista.addEventListener('click', pista);
    st.botones.resolver.addEventListener('click', resolver);
    st.botones.otro.addEventListener('click', nuevo);
    nuevo();
  }

  /* ---------- 2. emparejar: siete casos con las siete fuentes ---------- */
  function montaEmparejar(el) {
    const st = armazon(el, 'Cada caso viene de una de las siete fuentes de oportunidad de Drucker. Elige la fuente de cada uno.');
    let juego = null, casos = [];

    function nuevo() {
      juego = eligeOtro(IASP.bancos.emparejar, juego);
      casos = baraja(juego);
      st.cuerpo.innerHTML = '<ol class="ej-pares">' + casos.map((c, i) =>
        '<li class="ej-par"><span class="ej-par-num">' + (i + 1) + '</span><span class="ej-par-texto">' + esc(c.texto) + '</span>' +
        selectHtml('f' + i, IASP.fuentes, 'Fuente…') + '</li>').join('') + '</ol>';
      st.nuevo();
    }
    const sel = (i) => st.cuerpo.querySelector('select.f' + i);
    const marca = (s, clase) => { s.classList.remove('ok', 'ko', 'pista'); s.classList.add(clase); };

    function comprobar() {
      let mal = 0, vacios = 0;
      casos.forEach((c, i) => {
        const s = sel(i);
        if (s.value === '') { vacios++; marca(s, 'ko'); return; }
        const ok = +s.value === c.fuente; marca(s, ok ? 'ok' : 'ko'); if (!ok) mal++;
      });
      if (!mal && !vacios) st.acierto('Correcto: las siete fuentes emparejadas.');
      else st.fallo((vacios ? vacios + ' sin elegir. ' : '') + (mal ? mal + ' mal. ' : '') + 'Pregúntate de dónde vino la oportunidad, no en qué consiste la innovación.');
    }
    function pista() {
      const i = casos.findIndex((c, k) => +sel(k).value !== c.fuente);
      if (i < 0) { st.mensaje('Ya está todo bien.', 'ok'); return; }
      st.ayuda(); const s = sel(i); s.value = String(casos[i].fuente); marca(s, 'pista');
      st.mensaje('Caso ' + (i + 1) + ': ' + IASP.fuentes[casos[i].fuente] + '.');
    }
    function resolver() {
      st.ayuda(); st.resuelto = true;
      casos.forEach((c, i) => { const s = sel(i); s.value = String(c.fuente); marca(s, 'ok'); });
      st.mensaje('Las cuatro primeras fuentes están dentro del sector; las tres últimas, en el entorno social.');
    }
    st.botones.comprobar.addEventListener('click', comprobar);
    st.botones.pista.addEventListener('click', pista);
    st.botones.resolver.addEventListener('click', resolver);
    st.botones.otro.addEventListener('click', nuevo);
    nuevo();
  }

  /* ---------- 3. caso: pauta de éxito o fracaso con respuesta razonada oculta ---------- */
  function montaCaso(el) {
    const st = armazon(el, 'Lee el caso y elige la pauta de éxito o de fracaso que mejor lo explica. Resolver muestra la respuesta razonada con su fuente.');
    let caso = null;
    const opciones = IASP.pautas.map((p) => p.grupo + ': ' + p.texto);

    function nuevo() {
      caso = eligeOtro(IASP.bancos.caso, caso);
      st.cuerpo.innerHTML =
        '<p class="ej-caso-titulo">' + esc(caso.titulo) + '</p>' +
        '<p class="ej-caso">' + esc(caso.texto) + '</p>' +
        '<div class="ej-campos ej-campos-1">' +
        '  <label class="ej-campo"><span>Pauta que se cumple</span>' + selectHtml('pauta', opciones, 'Elige una pauta…') + '</label>' +
        '</div>' +
        '<div class="ej-respuesta" hidden></div>';
      st.nuevo();
    }
    const sel = () => st.cuerpo.querySelector('select.pauta');
    const resp = () => st.cuerpo.querySelector('.ej-respuesta');
    const marca = (s, clase) => { s.classList.remove('ok', 'ko', 'pista'); s.classList.add(clase); };
    const muestraRespuesta = () => {
      const r = resp();
      r.innerHTML = '<b>' + esc(IASP.pautas[caso.pautas[0]].grupo + ': ' + IASP.pautas[caso.pautas[0]].texto) + '.</b> ' + esc(caso.razon) + ' <span class="ej-fuente">Fuente: ' + esc(caso.fuente) + '</span>';
      r.hidden = false;
    };

    function comprobar() {
      const s = sel();
      if (s.value === '') { marca(s, 'ko'); st.mensaje('Elige una pauta.'); return; }
      const ok = caso.pautas.includes(+s.value);
      marca(s, ok ? 'ok' : 'ko');
      if (ok) { st.acierto('Correcto. Lee la respuesta razonada y explícalo con tus palabras.'); muestraRespuesta(); }
      else st.fallo('Esa pauta no es la que mejor explica el caso. Pide una pista o vuelve a leerlo.');
    }
    function pista() { st.ayuda(); st.mensaje('Pista: ' + caso.pista); }
    function resolver() {
      st.ayuda(); st.resuelto = true;
      const s = sel(); s.value = String(caso.pautas[0]); marca(s, 'ok');
      muestraRespuesta(); st.mensaje('');
    }
    st.botones.comprobar.addEventListener('click', comprobar);
    st.botones.pista.addEventListener('click', pista);
    st.botones.resolver.addEventListener('click', resolver);
    st.botones.otro.addEventListener('click', nuevo);
    nuevo();
  }

  const montadores = { clasificar: montaClasificar, emparejar: montaEmparejar, caso: montaCaso };
  function montaEjercicio(el) {
    const m = montadores[el.dataset.tipo];
    if (!m) { el.textContent = 'Tipo de ejercicio desconocido: ' + el.dataset.tipo; return; }
    m(el);
  }

  /* ---------- quiz de opción múltiple ---------- */
  function montaQuiz(q) {
    const correcta = parseInt(q.dataset.correct, 10);
    const opts = [...q.querySelectorAll('.quiz-opt')];
    const fb = q.querySelector('.quiz-fb');
    const inicial = fb ? fb.textContent : '';
    const reset = () => {
      q.removeAttribute('data-answered');
      opts.forEach((o) => o.classList.remove('correct', 'wrong'));
      if (fb) fb.textContent = inicial;
    };
    opts.forEach((o, i) => o.addEventListener('click', () => {
      if (q.hasAttribute('data-answered')) return;
      q.setAttribute('data-answered', '');
      opts[correcta].classList.add('correct');
      if (i !== correcta) o.classList.add('wrong');
      if (fb) fb.textContent = i === correcta ? (q.dataset.ok || 'Correcto.') : (q.dataset.ko || 'Incorrecto.');
    }));
    const r = q.querySelector('.quiz-reset');
    if (r) r.addEventListener('click', reset);
  }

  /* ---------- panel que se revela (pregunta a la clase) ---------- */
  function montaRevela(r) {
    const btn = r.querySelector('.revela-btn');
    const textoVer = btn ? btn.textContent : 'Revelar';
    const pon = (v) => {
      r.toggleAttribute('data-revelado', v);
      if (btn) btn.textContent = v ? 'Ocultar' : textoVer;
    };
    if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); pon(!r.hasAttribute('data-revelado')); });
    r.addEventListener('click', () => { if (!r.hasAttribute('data-revelado')) pon(true); });
  }

  /* ---------- visor a pantalla completa para las fotos ---------- */
  function abreVisor(fig) {
    const img = fig.querySelector('img');
    const cred = fig.querySelector('.credito');
    const v = document.createElement('div');
    v.className = 'visor';
    v.innerHTML = '<img alt=""><div class="visor-pie"></div><button class="visor-cerrar" aria-label="Cerrar">×</button>';
    v.querySelector('img').src = img.dataset.grande || img.currentSrc || img.src;   // data-grande: versión completa distinta de la miniatura
    v.querySelector('img').alt = img.alt;
    const tarjeta = fig.classList.contains('tarjeta');
    if (tarjeta) v.classList.add('visor-tarjeta');
    // En una tarjeta la imagen grande ya lleva el texto: en el visor solo va el crédito (<small> del figcaption)
    const pie = cred ? (tarjeta ? (cred.querySelector('small') || cred).innerHTML : cred.innerHTML) : '';
    if (pie) v.querySelector('.visor-pie').innerHTML = pie; else v.querySelector('.visor-pie').remove();
    const cierra = () => { v.remove(); document.removeEventListener('keydown', tecla, true); };
    const tecla = (e) => { if (e.key === 'Escape') { e.stopPropagation(); cierra(); } };
    v.addEventListener('click', (e) => { if (!e.target.closest('a')) cierra(); });
    document.addEventListener('keydown', tecla, true);
    document.body.appendChild(v);
  }
  function montaFoto(fig) {
    const img = fig.querySelector('img');
    if (!img) return;
    img.addEventListener('click', (e) => { e.stopPropagation(); abreVisor(fig); });
  }

  /* ---------- galería: varias fotos en el mismo hueco ---------- */
  function montaGaleria(g) {
    const figs = [...g.querySelectorAll(':scope > .foto')];
    if (figs.length < 2) return;
    const marco = document.createElement('div');
    marco.className = 'galeria-marco';
    figs.forEach((f) => marco.appendChild(f));
    const abajo = document.createElement('div');
    abajo.className = 'galeria-abajo';
    abajo.innerHTML = '<p class="galeria-pie"></p><div class="galeria-nav"><button type="button" aria-label="Foto anterior">‹</button><span class="galeria-cont"></span><button type="button" aria-label="Foto siguiente">›</button></div>';
    g.append(marco, abajo);
    const pie = abajo.querySelector('.galeria-pie');
    const cont = abajo.querySelector('.galeria-cont');
    const [ant, sig] = abajo.querySelectorAll('button');
    const sec = g.closest('section');
    const saltos = sec ? [...sec.querySelectorAll('[data-ir]')] : [];
    let i = 0;
    const muestra = (n) => {
      i = (n + figs.length) % figs.length;
      figs.forEach((f, k) => f.classList.toggle('activa', k === i));
      pie.innerHTML = figs[i].dataset.pie || '';
      cont.textContent = (i + 1) + ' / ' + figs.length;
      saltos.forEach((s) => s.classList.toggle('activa', Number(s.dataset.ir) === i + 1));
    };
    ant.addEventListener('click', (e) => { e.stopPropagation(); muestra(i - 1); });
    sig.addEventListener('click', (e) => { e.stopPropagation(); muestra(i + 1); });
    saltos.forEach((s) => s.addEventListener('click', (e) => { e.stopPropagation(); muestra(Number(s.dataset.ir) - 1); }));
    muestra(0);
  }

  /* ---------- numeración ---------- */
  function numera(stage) {
    const secs = [...stage.querySelectorAll(':scope > section')];
    secs.forEach((s, i) => {
      if (s.querySelector('[data-slide-num]')) return;
      const n = document.createElement('span');
      n.setAttribute('data-slide-num', '');
      n.textContent = String(i + 1).padStart(2, '0') + ' / ' + secs.length;
      if (getComputedStyle(s).position === 'static') s.style.position = 'relative';
      s.appendChild(n);
    });
  }

  /* ---------- notas del profesor (tecla N) ----------
   * La ventana assets/notas.html se abre con window.open y habla con esta página por postMessage:
   *   ventana -> deck   {iasp:'hola'}           pide el estado (al abrir y cada segundo, por si el deck se recarga)
   *                     {iasp:'ir', index}      salta a una diapositiva
   *   deck -> ventana   {iasp:'estado', ...}    deck, título, índice actual y lista de diapositivas con sus notas
   *                     {iasp:'diapo', index}   ha cambiado la diapositiva actual
   */
  const URL_NOTAS = (document.currentScript && document.currentScript.src || '../assets/iasp.js').replace(/iasp\.js.*$/, 'notas.html');
  let ventanaNotas = null;

  function idDeck() {
    // /ut01/, /ut01/index.html o /ut01/otra.html -> 'ut01'
    return location.pathname.replace(/\/[^/]*\.html?$/, '').replace(/\/$/, '').split('/').pop() || 'deck';
  }

  function estadoNotas(stage) {
    const secs = [...stage.querySelectorAll(':scope > section')];
    return {
      iasp: 'estado',
      deck: idDeck(),
      titulo: document.title,
      index: stage.index || 0,
      diapos: secs.map((s, i) => {
        const aside = s.querySelector(':scope > aside.notas');
        return {
          n: i + 1,
          label: s.dataset.label || ('Diapositiva ' + (i + 1)),
          seccion: s.dataset.seccion || '',
          criterio: s.dataset.criterio || '',
          notas: aside ? aside.innerHTML.trim() : '',
        };
      }),
    };
  }

  function enviaNotas(msg) {
    if (!ventanaNotas || ventanaNotas.closed) return;
    try { ventanaNotas.postMessage(msg, '*'); } catch (e) {}
  }

  function abreNotas() {
    if (ventanaNotas && !ventanaNotas.closed) { ventanaNotas.focus(); return; }
    ventanaNotas = window.open(URL_NOTAS, 'iasp-notas', 'popup,width=980,height=760');
  }

  function montaNotas(stage) {
    window.addEventListener('keydown', (e) => {
      if ((e.key !== 'n' && e.key !== 'N') || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.composedPath ? e.composedPath()[0] : e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      abreNotas();
    });
    window.addEventListener('message', (e) => {
      const d = e.data;
      if (!d || typeof d !== 'object' || !d.iasp) return;
      if (d.iasp === 'hola') { ventanaNotas = e.source; enviaNotas(estadoNotas(stage)); }
      else if (d.iasp === 'ir' && typeof d.index === 'number') stage.goTo(d.index);
    });
    stage.addEventListener('slidechange', (e) => enviaNotas({ iasp: 'diapo', index: e.detail.index }));
  }
  IASP.abreNotas = abreNotas;

  /* ---------- volver: botón «Inicio» en la barra flotante del motor y pastilla de sección clicable ----------
   * La barra flotante (.overlay, dentro del shadow DOM de deck-stage) aparece al mover el ratón y se oculta en
   * presentación e impresión: ahí va un enlace a la página principal del módulo (../). La pastilla amarilla con
   * el número de sección (data-seccion, más data-practica si lo hay) pasa a ser un botón que salta al índice de
   * la unidad (la diapositiva cuya etiqueta empieza por «Índice»; si no hay, la segunda).
   */
  function montaVolver(stage) {
    const overlay = stage.shadowRoot && stage.shadowRoot.querySelector('.overlay');
    if (overlay && !overlay.querySelector('.inicio')) {
      const sep = document.createElement('span'); sep.className = 'divider';
      const a = document.createElement('a');
      a.className = 'btn inicio'; a.href = '../'; a.title = 'Volver al índice del módulo';
      a.textContent = 'Inicio';
      a.style.cssText = 'color:inherit;text-decoration:none;cursor:pointer;padding:0 10px';
      overlay.append(sep, a);
    }
    const secs = [...stage.querySelectorAll(':scope > section')];
    let idx = secs.findIndex((s) => /^índice/i.test(s.dataset.label || ''));
    if (idx < 0) idx = Math.min(1, secs.length - 1);
    secs.forEach((s) => {
      if (!s.dataset.seccion || s.querySelector(':scope > .seccion-pill')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'seccion-pill';
      b.textContent = s.dataset.practica ? s.dataset.seccion + ' · ' + s.dataset.practica : s.dataset.seccion;
      b.title = 'Ir al índice de la unidad';
      b.addEventListener('click', (e) => { e.stopPropagation(); stage.goTo(idx); });
      s.appendChild(b);
    });
  }

  /* ---------- buscador dentro de la unidad (tecla B y botón «Buscar» en la barra flotante) ----------
   * Busca solo en esta presentación: las diapositivas ya están en el DOM, así que no descarga nada y
   * funciona igual en GitHub Pages, en un servidor local o abriendo el archivo. El índice se construye
   * la primera vez que se abre el panel: por diapositiva, su rótulo (data-label), la sección y el texto
   * visible, sin las notas del profesor ni los ejercicios generados. Se compara sin tildes ni mayúsculas.
   */
  function normaliza(s) {
    // Carácter a carácter para que las posiciones coincidan con el texto original (los fragmentos resaltados)
    return s.split('').map((c) => {
      const d = c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      return d.length === 1 ? d : c;
    }).join('');
  }
  function escapaHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  // textContent pega las palabras de bloques contiguos («supervivenciaLas»): se añade un espacio al cerrar cada bloque
  const BLOQUES = /^(P|H[1-6]|LI|UL|OL|DIV|SECTION|ARTICLE|ASIDE|HEADER|FOOTER|FIGURE|FIGCAPTION|TABLE|TR|TD|TH|BR|BLOCKQUOTE|DT|DD)$/;
  function textoVisible(el) {
    let t = '';
    el.childNodes.forEach((n) => {
      if (n.nodeType === 3) t += n.textContent;
      else if (n.nodeType === 1) { t += textoVisible(n); if (BLOQUES.test(n.tagName)) t += ' '; }
    });
    return t;
  }
  function indiceBusqueda(stage) {
    return [...stage.querySelectorAll(':scope > section')].map((s, i) => {
      const c = s.cloneNode(true);
      c.querySelectorAll('aside.notas, .seccion-pill, [data-slide-num], .ej, script, style').forEach((n) => n.remove());
      const texto = textoVisible(c).replace(/\s+/g, ' ').trim();
      const label = (s.dataset.label || ('Diapositiva ' + (i + 1))).replace(/^\S+\s·\s/, '');
      return {
        i, label, texto,
        seccion: s.dataset.seccion || '',
        practica: s.dataset.practica || '',
        nLabel: normaliza(label),
        nTexto: normaliza(texto),
      };
    });
  }
  // Fragmento del texto alrededor del primer término, con todos los términos resaltados
  function fragmento(d, terminos) {
    const ANTES = 60, LARGO = 190;
    let pos = -1;
    for (const t of terminos) { const p = d.nTexto.indexOf(t); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
    if (pos < 0) return '';
    let ini = Math.max(0, pos - ANTES);
    if (ini > 0) { const sp = d.nTexto.lastIndexOf(' ', ini); ini = sp > 0 ? sp + 1 : ini; }
    let fin = Math.min(d.nTexto.length, ini + LARGO);
    if (fin < d.nTexto.length) { const sp = d.nTexto.indexOf(' ', fin); if (sp > 0 && sp - fin < 20) fin = sp; }
    const nTrozo = d.nTexto.slice(ini, fin), trozo = d.texto.slice(ini, fin);
    // Marcas por carácter de cada acierto, sin solapar
    const marcas = new Array(nTrozo.length + 1).fill(0);
    for (const t of terminos) {
      let p = nTrozo.indexOf(t);
      while (p >= 0) { for (let k = p; k < p + t.length; k++) marcas[k] = 1; p = nTrozo.indexOf(t, p + t.length); }
    }
    let html = '', dentro = false;
    for (let k = 0; k < trozo.length; k++) {
      if (marcas[k] && !dentro) { html += '<mark>'; dentro = true; }
      if (!marcas[k] && dentro) { html += '</mark>'; dentro = false; }
      html += escapaHtml(trozo[k]);
    }
    if (dentro) html += '</mark>';
    return (ini > 0 ? '… ' : '') + html + (fin < d.nTexto.length ? ' …' : '');
  }
  function buscaEn(indice, q) {
    const terminos = normaliza(q).split(/\s+/).filter(Boolean);
    if (!terminos.length) return [];
    const res = [];
    indice.forEach((d) => {
      let puntos = 0;
      for (const t of terminos) {
        const enLabel = d.nLabel.indexOf(t) >= 0, enTexto = d.nTexto.indexOf(t) >= 0;
        if (!enLabel && !enTexto) { puntos = -1; break; }
        puntos += enLabel ? 10 : 1;
      }
      if (puntos > 0) res.push({ d, puntos });
    });
    res.sort((a, b) => b.puntos - a.puntos || a.d.i - b.d.i);
    return res.slice(0, 40).map((r) => Object.assign({ frag: fragmento(r.d, terminos) }, r.d));
  }

  let panelBusqueda = null;
  function abreBuscador(stage) {
    if (panelBusqueda) { panelBusqueda.querySelector('input').focus(); return; }
    if (!stage.__indiceBusqueda) stage.__indiceBusqueda = indiceBusqueda(stage);
    const indice = stage.__indiceBusqueda;
    const p = document.createElement('div');
    p.className = 'buscador';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', 'Buscar en la unidad');
    p.innerHTML =
      '<div class="buscador-caja">' +
        '<div class="buscador-cabecera"><input type="text" autocomplete="off" spellcheck="false" placeholder="Buscar en esta unidad…" aria-label="Buscar en esta unidad">' +
        '<button type="button" class="buscador-cerrar" aria-label="Cerrar">×</button></div>' +
        '<ol class="buscador-lista" hidden></ol>' +
        '<p class="buscador-vacio"></p>' +
        '<div class="buscador-pie"><span><kbd>↑</kbd><kbd>↓</kbd>moverse</span><span><kbd>Enter</kbd>ir a la diapositiva</span><span><kbd>Esc</kbd>cerrar</span></div>' +
      '</div>';
    const input = p.querySelector('input'), lista = p.querySelector('.buscador-lista'), vacio = p.querySelector('.buscador-vacio');
    let resultados = [], sel = 0;
    const cierra = () => { p.remove(); panelBusqueda = null; };
    const marca = () => {
      [...lista.children].forEach((li, k) => li.toggleAttribute('data-sel', k === sel));
      const li = lista.children[sel];
      if (li && li.scrollIntoView) li.scrollIntoView({ block: 'nearest' });
    };
    const ve = (k) => { const r = resultados[k]; if (!r) return; cierra(); stage.goTo(r.i); };
    const pinta = () => {
      const q = input.value.trim();
      resultados = q ? buscaEn(indice, q) : [];
      sel = 0;
      lista.innerHTML = resultados.map((r) =>
        '<li><span class="b-num">' + String(r.i + 1).padStart(2, '0') + '</span>' +
        '<span class="b-titulo">' + (r.seccion ? '<span class="b-pill">' + escapaHtml(r.practica ? r.seccion + ' · ' + r.practica : r.seccion) + '</span>' : '') +
        escapaHtml(r.label) + '</span>' +
        (r.frag ? '<p class="b-frag">' + r.frag + '</p>' : '') + '</li>').join('');
      lista.hidden = !resultados.length;
      vacio.hidden = !!resultados.length;
      vacio.textContent = !q ? 'Escribe para buscar en las ' + indice.length + ' diapositivas de esta unidad.'
        : 'Nada en esta unidad para «' + q + '».';
      marca();
    };
    input.addEventListener('input', pinta);
    // Que las teclas del panel no lleguen al motor ni a los demás atajos (N, B)
    p.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); cierra(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (resultados.length) { sel = (sel + 1) % resultados.length; marca(); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (resultados.length) { sel = (sel - 1 + resultados.length) % resultados.length; marca(); } }
      else if (e.key === 'Enter') { e.preventDefault(); ve(sel); }
    });
    lista.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) ve([...lista.children].indexOf(li));
    });
    p.querySelector('.buscador-cerrar').addEventListener('click', cierra);
    p.addEventListener('click', (e) => { if (e.target === p) cierra(); });
    document.body.appendChild(p);
    panelBusqueda = p;
    pinta();
    input.focus();
  }

  function montaBuscador(stage) {
    const overlay = stage.shadowRoot && stage.shadowRoot.querySelector('.overlay');
    if (overlay && !overlay.querySelector('.buscar')) {
      const sep = document.createElement('span'); sep.className = 'divider';
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn buscar'; b.title = 'Buscar en esta unidad (B)';
      b.innerHTML = 'Buscar<span class="kbd" style="display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;margin-left:6px;padding:0 4px;border-radius:3px;background:rgba(255,255,255,.14);font-size:10px;font-weight:600">B</span>';
      b.addEventListener('click', () => abreBuscador(stage));
      overlay.append(sep, b);
    }
    window.addEventListener('keydown', (e) => {
      if ((e.key !== 'b' && e.key !== 'B') || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.composedPath ? e.composedPath()[0] : e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      abreBuscador(stage);
    });
  }
  IASP.abreBuscador = () => { const s = document.querySelector('deck-stage'); if (s) abreBuscador(s); };

  function init() {
    const stage = document.querySelector('deck-stage');
    if (!stage) return;
    numera(stage);
    document.querySelectorAll('.ej[data-tipo]').forEach(montaEjercicio);
    document.querySelectorAll('.quiz').forEach(montaQuiz);
    document.querySelectorAll('.revela').forEach(montaRevela);
    document.querySelectorAll('.galeria').forEach(montaGaleria);
    document.querySelectorAll('.foto').forEach(montaFoto);
    montaBuscador(stage);
    montaVolver(stage);
    montaNotas(stage);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
