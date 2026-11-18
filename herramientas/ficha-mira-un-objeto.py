# -*- coding: utf-8 -*-
"""Convierte la ficha «Mira un objeto» (UT2) exportada de Word a PDF en un PDF rellenable.

    python herramientas/ficha-mira-un-objeto.py [entrada.pdf] [salida.pdf]

Por defecto lee el PDF de «../Prácticas/UT2/» (fuera del repositorio) y escribe
«ut02/plantillas/mira-un-objeto.pdf». Necesita PyMuPDF (pip install pymupdf).

Qué hace, sobre el diseño original y sin rehacerlo:
  - quita los textos de ejemplo entre corchetes y pone un campo de texto en cada hueco
    (el ejemplo queda como ayuda emergente del campo);
  - cambia los «[ ]» de la lista de comprobación por casillas;
  - pone un botón de imagen en los tres recuadros de foto (antes, ahora y dibujo).

Los campos de texto y las casillas funcionan en cualquier visor (Chrome, Edge, Acrobat).
Insertar la imagen solo funciona en Adobe Acrobat Reader: el visor del navegador no lo admite.

Las coordenadas están tomadas del PDF de noviembre de 2026 (8 páginas A4). Si la compañera
cambia el Word y las tablas se mueven, hay que revisarlas: el script avisa si no encuentra
los textos que espera.
"""
import glob
import os
import sys

import fitz  # PyMuPDF

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TINTA = (0.09, 0.14, 0.20)        # azul marino del texto escrito
GRIS = (0.39, 0.45, 0.55)         # rótulos y avisos añadidos
MARINO = (0.118, 0.224, 0.373)    # #1e395f, el de las cabeceras del documento
BLANCO = (1, 1, 1)
avisos = []


def chars(page, clip):
    """Caracteres del recorte, en orden de lectura: (carácter, rect, inicio_de_línea)."""
    clip = fitz.Rect(clip)
    for b in page.get_text('rawdict', clip=clip)['blocks']:
        for l in b.get('lines', []):
            primero = True
            for s in l['spans']:
                for c in s['chars']:
                    r = fitz.Rect(c['bbox'])
                    centro = fitz.Point((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)
                    if clip.contains(centro):
                        yield c['c'], r, primero
                        primero = False


def tacha(page, rects):
    for r in rects:
        if r.width < 0.2:
            continue
        page.add_redact_annot(fitz.Rect(r.x0 + 0.15, r.y0 + 2.5, r.x1 - 0.15, r.y1 - 2.5), fill=False, cross_out=False)


def quita_todo(page, clip):
    """Borra todo el texto del recorte."""
    rs = [r for _, r, _ in chars(page, clip)]
    if not rs:
        avisos.append('pág. %d: no hay texto que quitar en %s' % (page.number + 1, [round(v) for v in clip]))
    tacha(page, rs)


def quita_corchetes(page, clip):
    """Borra cada «[ … ]» del recorte (puede ocupar varias líneas). Devuelve el rect de cada grupo."""
    grupos, dentro, actual, rs = [], False, None, []
    for c, r, _ in chars(page, clip):
        if not dentro and c == '[':
            dentro, actual = True, fitz.Rect(r)
        if dentro:
            rs.append(r)
            actual |= r
            if c == ']':
                dentro = False
                grupos.append(actual)
    if dentro:
        grupos.append(actual)
    if not grupos:
        avisos.append('pág. %d: no hay corchetes en %s' % (page.number + 1, [round(v) for v in clip]))
    tacha(page, rs)
    return grupos


def aplica(page):
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)


nombres = set()


def pon(page, w):
    """Añade el campo y devuelve su número de objeto, para retocar claves que PyMuPDF no expone."""
    r = page.add_widget(w)
    return getattr(r, 'xref', 0) or getattr(w, 'xref', 0) or [x.xref for x in page.widgets()][-1]


def campo(page, nombre, rect, ayuda, lineas=True, letra=10, fondo=None, centro=False):
    assert nombre not in nombres, nombre
    nombres.add(nombre)
    w = fitz.Widget()
    w.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w.field_name = nombre
    w.field_label = ayuda
    w.rect = fitz.Rect(rect)
    w.text_font = 'Helv'
    w.text_fontsize = letra
    w.text_color = TINTA
    w.fill_color = fondo
    w.border_width = 0
    w.field_flags = fitz.PDF_TX_FIELD_IS_MULTILINE if lineas else 0
    w.field_value = ''
    x = pon(page, w)
    if centro:
        page.parent.xref_set_key(x, 'Q', '1')
    return w


def casilla(page, nombre, rect, ayuda):
    assert nombre not in nombres, nombre
    nombres.add(nombre)
    w = fitz.Widget()
    w.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
    w.field_name = nombre
    w.field_label = ayuda
    w.rect = fitz.Rect(rect)
    w.border_color = TINTA
    w.border_width = 0.8
    w.fill_color = BLANCO
    w.text_color = TINTA
    w.field_value = False
    pon(page, w)


def imagen(page, nombre, celda, ayuda):
    """Botón de imagen en una celda: aviso arriba y botón debajo. Solo importa la imagen Acrobat Reader."""
    assert nombre not in nombres, nombre
    nombres.add(nombre)
    c = fitz.Rect(celda)
    aviso = 'Insertar imagen: solo con Adobe Acrobat Reader'
    ancho = fitz.get_text_length(aviso, 'helv', 7)
    page.insert_text(((c.x0 + c.x1 - ancho) / 2, c.y0 + 11), aviso, fontname='helv', fontsize=7, color=GRIS)
    w = fitz.Widget()
    w.field_type = fitz.PDF_WIDGET_TYPE_BUTTON
    w.field_flags = fitz.PDF_BTN_FIELD_IS_PUSHBUTTON
    w.field_name = nombre
    w.field_label = ayuda
    w.rect = fitz.Rect(c.x0 + 5, c.y0 + 15, c.x1 - 5, c.y1 - 4)
    w.border_color = (0.58, 0.64, 0.72)
    w.border_width = 0.8
    w.border_dashes = [3, 3]
    w.fill_color = None
    w.button_caption = ''
    w.script = 'event.target.buttonImportIcon();'
    x = pon(page, w)
    doc = page.parent
    doc.xref_set_key(x, 'MK/TP', '1')                              # solo icono, sin texto
    doc.xref_set_key(x, 'MK/IF', '<</SW/A/S/P/A[0.5 0.5]>>')       # ajustada y centrada
    return w.rect


def filas(page, base, caja, rotulos, ayudas, ancho_rotulo=22, letra=10):
    """Caja con una lista: se vacía y se reparte en filas iguales, cada una con su rótulo y su campo."""
    c = fitz.Rect(caja)
    quita_todo(page, c)
    aplica(page)
    alto = (c.height - 6) / len(rotulos)
    for i, (rot, ayuda) in enumerate(zip(rotulos, ayudas)):
        y = c.y0 + 3 + i * alto
        page.insert_textbox(fitz.Rect(c.x0 + 6, y + 2, c.x0 + 6 + ancho_rotulo, y + alto - 1), rot,
                            fontname='hebo', fontsize=10, color=TINTA)
        campo(page, '%s_%d' % (base, i + 1), (c.x0 + 8 + ancho_rotulo, y + 1, c.x1 - 4, y + alto - 2), ayuda, letra=letra)
        if i:
            page.draw_line((c.x0 + 6, y - 0.5), (c.x1 - 6, y - 0.5), color=(0.89, 0.91, 0.94), width=0.5)


SEIS = ['¿Qué ha cambiado? Qué pieza, material o función es nueva respecto al modelo antiguo.',
        '¿Para qué sirve? La utilidad concreta de esta innovación.',
        '¿Qué mejora o qué problema resuelve? Qué fallo del modelo antiguo soluciona.',
        '¿Qué tecnología o material lo hace posible? Ej.: pantalla táctil OLED, sensores, batería de litio, fibra de carbono, Wi-Fi...',
        '¿A quién beneficia? Usuarios, personas con discapacidad, trabajadores, medio ambiente...',
        '¿Qué impacto tiene en el uso diario? Ahorro de tiempo, mayor comodidad, seguridad, menor consumo...']


def innovacion(page, n, cabecera, cortes, desde=0, nombre=True):
    """Tabla de una innovación: campo del nombre en la cabecera y un campo por fila (columna derecha)."""
    y0, y1 = cabecera
    quita_corchetes(page, (150, y0, 545, y1))
    for a, b in zip(cortes, cortes[1:]):
        quita_corchetes(page, (232.5, a, 545, b))
    aplica(page)
    if nombre:
        campo(page, 'innovacion%d_nombre' % n, (157, y0 + 0.5, 540, y1 - 0.5), 'Nombre de la innovación %d' % n, lineas=False, letra=10.5, fondo=BLANCO)
    else:
        page.insert_text((157, y1 - 5), '(continuación)', fontname='heit', fontsize=10.5, color=(0.8, 0.98, 0.95))
    for k, (a, b) in enumerate(zip(cortes, cortes[1:])):
        q = desde + k
        campo(page, 'innovacion%d_pregunta%d' % (n, q + 1), (235, a + 1.5, 542, b - 1.5), SEIS[q], letra=9.5)


def convierte(entrada, salida):
    doc = fitz.open(entrada)
    if len(doc) != 8:
        avisos.append('el PDF tiene %d páginas y se esperaban 8' % len(doc))

    # ---- página 1: equipo ----
    p = doc[0]
    for x0, x1 in ((144.7, 207.0), (207.0, 450.8)):      # la fila de datos, en blanco y más alta para que quepan todos
        p.draw_rect((x0, 672.8, x1, 752), color=MARINO, fill=BLANCO, width=0.8)
    campo(p, 'equipo_numero', (147, 675, 205, 750), 'Número de vuestro equipo', lineas=False, letra=18, centro=True)
    campo(p, 'equipo_integrantes', (210, 675, 448.5, 750), 'Nombre y apellidos de cada integrante, uno por línea', letra=10.5)

    # ---- página 2: objeto elegido y antes ----
    p = doc[1]
    quita_corchetes(p, (51.4, 75, 544.5, 149.2))
    quita_corchetes(p, (51.4, 505, 544.5, 649.2))
    aplica(p)
    campo(p, 'objeto_y_motivo', (55.5, 78, 541, 146.5), 'Nombre del objeto elegido y, en 2 o 3 líneas, por qué os parece interesante investigar su evolución', letra=10.5)
    imagen(p, 'foto_antes', (51.4, 505, 243.9, 604), 'Fotografía del objeto antiguo (hace 15-20 años)')
    campo(p, 'antes_marca_modelo_anio', (56, 622, 239.5, 646), 'Marca, modelo y año aproximado del objeto antiguo', lineas=False, centro=True)
    campo(p, 'antes_como_era', (248, 543, 541, 593), '¿Cómo era físicamente? Materiales, peso, tamaño, diseño.')
    campo(p, 'antes_para_que', (248, 610.5, 541, 646.5), '¿Para qué servía y cómo se utilizaba hace 15-20 años?')

    # ---- página 3: problemas de antes, modelo actual e innovación 1 (preguntas 1 y 2) ----
    p = doc[2]
    filas(p, 'antes_problema', (54.2, 92, 544.5, 211), ['1.', '2.', '3.'],
          ['Problema 1 del objeto antiguo. Ej.: pesaba demasiado, necesitaba estar siempre enchufado, se rompía con facilidad...',
           'Problema 2 del objeto antiguo', 'Problema 3 del objeto antiguo'])
    quita_todo(p, (54.2, 533, 260.8, 653))
    g = quita_corchetes(p, (262, 553, 544.5, 652))
    aplica(p)
    imagen(p, 'foto_ahora', (54.2, 533, 260.8, 653), 'Fotografía del objeto actual')
    if len(g) == 3:
        campo(p, 'ahora_marca_modelo', (g[0].x0, 556.5, 537.5, 572), 'Marca y modelo actual', lineas=False)
        campo(p, 'ahora_anio', (g[1].x0, 576.5, 537.5, 592), 'Año de lanzamiento', lineas=False)
        campo(p, 'ahora_resumen', (268, 612, 537.5, 650.5), 'Resumen general de cómo es hoy: su aspecto y sus funciones principales')
    else:
        avisos.append('pág. 3: no encuentro los tres datos del modelo actual')
    innovacion(p, 1, (678.8, 694.7), [699.5, 736.8, 757.5])

    # ---- página 4: resto de la innovación 1 e innovaciones 2 y 3 ----
    p = doc[3]
    innovacion(p, 1, (55.2, 71.2), [76.0, 113.2, 151.0, 189.3, 225.8], desde=2, nombre=False)
    innovacion(p, 2, (251.4, 267.4), [272.2, 309.4, 331.4, 369.5, 407.3, 445.5, 482.2])
    innovacion(p, 3, (507.8, 523.6), [528.5, 565.8, 587.6, 625.9, 663.6, 701.9, 738.5])

    # ---- página 5: análisis ----
    p = doc[4]
    filas(p, 'trabajo', (51.3, 187.2, 544.4, 309), ['A quienes lo\nfabrican:', 'A quienes lo venden\no distribuyen:', 'A quienes lo utilizan\no lo reparan:'],
          ['A quienes lo fabrican. Ej.: ahora intervienen robots, ingenieros de software o nuevos materiales...',
           'A quienes lo venden o distribuyen', 'A quienes lo utilizan en su profesión o lo reparan o reciclan'], ancho_rotulo=112)
    quita_corchetes(p, (51.3, 386, 544.4, 460.2))
    aplica(p)
    campo(p, 'por_que_ha_cambiado', (55.5, 389, 541, 457.5), 'Explicad de forma razonada los motivos principales que han impulsado estos cambios', letra=10.5)
    filas(p, 'ahora_problema', (51.3, 553.2, 544.4, 674.9), ['1.', '2.', '3.'],
          ['Problema actual 1. Ej.: la batería dura poco, es muy caro, genera residuos difíciles de reciclar, es frágil...',
           'Problema actual 2', 'Problema actual 3 (opcional)'])

    # ---- página 6: dentro de 5 años ----
    p = doc[5]
    quita_corchetes(p, (51.5, 330.5, 544.6, 366))
    quita_todo(p, (51.5, 409.1, 297.7, 638.6))
    quita_corchetes(p, (297.7, 409.1, 544.6, 638.6))
    aplica(p)
    campo(p, 'paso5_redacta', (331, 333.2, 541, 349.8), 'Nombre y apellidos de quien toma el teclado en el paso 5', lineas=False, letra=10.5, fondo=BLANCO)
    imagen(p, 'dibujo_futuro', (51.5, 409.1, 297.7, 638.6), 'Vuestro dibujo del objeto dentro de 5 años (a mano y fotografiado, o digital)')
    campo(p, 'futuro_tecnologia', (302, 432, 541, 498), 'Tecnología elegida: qué tecnología incorpora el nuevo diseño')
    campo(p, 'futuro_problema', (302, 531.5, 541, 581.5), '¿Qué problema actual soluciona (del paso 4.3)? Explicad cómo resuelve ese fallo.')
    campo(p, 'futuro_mejoras', (302, 598.5, 541, 635.5), '¿Qué mejoras aportará en 5 años? Ventajas de uso, seguridad, sostenibilidad o comodidad.')

    # ---- página 7: fuentes y lista de comprobación ----
    p = doc[6]
    filas(p, 'fuente', (51.5, 354, 544.6, 491.7), ['1.', '2.', '3.', '4.'],
          ['Fuente de la fotografía del objeto antiguo, en formato APA 7', 'Fuente de la fotografía del objeto actual, en formato APA 7',
           'Fuente de información sobre innovaciones o tecnologías futuras, en formato APA 7', 'Otras fuentes consultadas (opcional)'], letra=9.5)
    g = quita_corchetes(p, (56, 552, 544.6, 758))
    aplica(p)
    if len(g) != 7:
        avisos.append('pág. 7: hay %d marcas «[ ]» y se esperaban 7' % len(g))
    for i, r in enumerate(g):
        casilla(p, 'comprobado_%d' % (i + 1), (r.x0 + 1, r.y0 + 1.3, r.x0 + 12, r.y0 + 12.3), 'Marcad la casilla cuando esté hecho')

    doc.set_metadata({'title': 'Mira un objeto. Antes, ahora y dentro de 5 años (ficha rellenable)', 'subject': 'UT2 · Innovación Aplicada a los Sectores Productivos'})
    doc.save(salida, garbage=3, deflate=True)
    return len(nombres)


if __name__ == '__main__':
    entrada = sys.argv[1] if len(sys.argv) > 1 else None
    if not entrada:
        cand = glob.glob(os.path.join(RAIZ, '..', 'Prácticas', 'UT2', '*.pdf'))
        if not cand:
            sys.exit('No encuentro el PDF de partida en ../Prácticas/UT2/. Pásalo como primer argumento.')
        entrada = cand[0]
    salida = sys.argv[2] if len(sys.argv) > 2 else os.path.join(RAIZ, 'ut02', 'plantillas', 'mira-un-objeto.pdf')
    n = convierte(entrada, salida)
    print('%d campos en %s' % (n, salida))
    for a in avisos:
        print('AVISO:', a)
