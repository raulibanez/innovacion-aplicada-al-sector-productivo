"""Genera la plantilla rellenable de la dinámica «Seis maneras de sacar ideas» (UT0, diapositiva 6).

Uso: python herramientas/plantilla-seis-maneras.py
Salida: ut00/plantillas/seis-maneras-de-sacar-ideas.pdf

Necesita reportlab. La primera vez descarga Plus Jakarta Sans (OFL) a la carpeta temporal.
"""
import tempfile
import urllib.request
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "ut00" / "plantillas" / "seis-maneras-de-sacar-ideas.pdf"

# Paleta de assets/iasp.css
NAVY = HexColor("#172433")
CORAL = HexColor("#FC6F6F")
YELLOW = HexColor("#FCC908")
BG = HexColor("#FFF7EE")
MUTED = HexColor("#5B6470")
LINE = HexColor("#EAD9C8")
WHITE = HexColor("#FFFFFF")
TEAL = HexColor("#53D2CE")
PINK = HexColor("#FC8D99")
ORANGE = HexColor("#FD9206")

W, H = A4
M = 40
CW = W - 2 * M
BORDE_INFERIOR = 48  # por encima del pie

# Tipografía
PESOS = ["Regular", "Medium", "SemiBold", "Bold", "ExtraBold", "Italic"]
FUENTES = Path(tempfile.gettempdir()) / "iasp-fuentes"


def carga_fuentes():
    FUENTES.mkdir(exist_ok=True)
    for peso in PESOS:
        ttf = FUENTES / f"PlusJakartaSans-{peso}.ttf"
        if not ttf.exists():
            url = f"https://raw.githubusercontent.com/tokotype/PlusJakartaSans/master/fonts/ttf/PlusJakartaSans-{peso}.ttf"
            urllib.request.urlretrieve(url, ttf)
        pdfmetrics.registerFont(TTFont(f"PJS-{peso}", str(ttf)))
    pdfmetrics.registerFontFamily("PJS", normal="PJS-Regular", bold="PJS-Bold",
                                  italic="PJS-Italic", boldItalic="PJS-Bold")


def texto(c, x, y, s, peso="Regular", tam=10, color=NAVY, espacio=0):
    # saveState: el espaciado entre letras (Tc) no debe pasar al texto siguiente
    c.saveState()
    c.setFillColor(color)
    t = c.beginText(x, y)
    t.setFont(f"PJS-{peso}", tam)
    t.setCharSpace(espacio)
    t.textOut(s)
    c.drawText(t)
    c.restoreState()
    return pdfmetrics.stringWidth(s, f"PJS-{peso}", tam) + espacio * len(s)


def _parrafo(c, html, ancho, tam, color, peso):
    estilo = ParagraphStyle("p", fontName=f"PJS-{peso}", fontSize=tam, leading=tam * 1.35, textColor=color)
    p = Paragraph(html, estilo)
    _, alto = p.wrapOn(c, ancho, 1000)
    return p, alto


def parrafo(c, html, x, y_top, ancho, tam=9.5, color=NAVY, peso="Regular"):
    """Dibuja un párrafo con <b> e <i> y devuelve su altura."""
    p, alto = _parrafo(c, html, ancho, tam, color, peso)
    p.drawOn(c, x, y_top - alto)
    return alto


def campo(c, nombre, x, y_top, ancho, alto, ayuda, varias_lineas=True):
    c.acroForm.textfield(
        name=nombre, tooltip=ayuda, x=x, y=y_top - alto, width=ancho, height=alto,
        fillColor=WHITE, borderColor=LINE, borderWidth=1, textColor=NAVY,
        fontName="Helvetica", fontSize=9.5 if varias_lineas else 10.5,
        fieldFlags="multiline" if varias_lineas else "", maxlen=None,
    )


def etiqueta(c, x, y, s, nota=None):
    ancho = texto(c, x, y, s, "SemiBold", 8.5, NAVY)
    if nota:
        texto(c, x + ancho + 6, y, nota, "Regular", 8, MUTED)


def tarjeta(c, x, y_top, ancho, alto, color=None, radio=10, fondo=BG, franja=5):
    c.saveState()
    trazo = c.beginPath()
    trazo.roundRect(x, y_top - alto, ancho, alto, radio)
    c.clipPath(trazo, stroke=0, fill=0)
    c.setFillColor(fondo)
    c.rect(x, y_top - alto, ancho, alto, stroke=0, fill=1)
    if color is not None:
        c.setFillColor(color)
        c.rect(x, y_top - franja, ancho, franja, stroke=0, fill=1)
    c.restoreState()


def paso(c, y, n, titulo):
    """Pastilla amarilla «PASO n» y título; devuelve la y de debajo."""
    rotulo = f"PASO {n}"
    ancho = pdfmetrics.stringWidth(rotulo, "PJS-Bold", 8) + len(rotulo) * 0.6 + 16
    c.setFillColor(YELLOW)
    c.roundRect(M, y - 4, ancho, 16, 8, stroke=0, fill=1)
    texto(c, M + 8, y + 1, rotulo, "Bold", 8, NAVY, 0.6)
    texto(c, M + ancho + 10, y, titulo, "Bold", 13.5, NAVY)
    return y - 20


def antetitulo(c, s):
    c.setFillColor(CORAL)
    c.circle(M + 3.5, H - M - 2.5, 3.5, stroke=0, fill=1)
    texto(c, M + 13, H - M - 5.5, s.upper(), "SemiBold", 8.5, NAVY, 0.7)


def pie(c, pagina):
    c.setStrokeColor(LINE)
    c.setLineWidth(1)
    c.line(M, 34, W - M, 34)
    texto(c, M, 22, "Innovación Aplicada a los Sectores Productivos · Seis maneras de sacar ideas",
          "Regular", 7.5, MUTED)
    c.setFillColor(MUTED)
    c.setFont("PJS-Regular", 7.5)
    c.drawRightString(W - M, 22, f"{pagina} / 2")


def comprueba(y, pagina):
    assert y >= BORDE_INFERIOR, f"La página {pagina} se sale por abajo (y = {y:.0f})"


def manchas(c):
    c.setFillColor(YELLOW)
    c.circle(W - 18, H - 8, 78, stroke=0, fill=1)
    c.setFillColor(CORAL)
    c.circle(W - 112, H - 30, 14, stroke=0, fill=1)


TECNICAS = [
    ("Ampliar", "Pensar a lo grande", CORAL,
     "¿Y si llevamos la solución a mucha más gente, a muchos sitios o a muchas situaciones?"),
    ("Reducir", "Simplificar al máximo", TEAL,
     "¿Y si solucionamos solo una parte concreta del problema?"),
    ("Combinar", "Mezclar ideas", YELLOW,
     "¿Y si unimos el problema con tecnología, juego, organización, premios, aprendizaje…?"),
    ("Cambiar de contexto", "Mirar otro sector", PINK,
     "¿Qué solución que funciona en otro sitio podríamos adaptar a nuestro problema?"),
    ("Invertir", "Hacer lo contrario", ORANGE,
     "¿Qué pasaría si hacemos justo lo contrario de lo habitual?"),
    ("Mejorar", "Evolucionar lo que existe", NAVY,
     "¿Cómo podríamos mejorar lo que ya se hace hoy con este problema?"),
]


def pagina_1(c):
    manchas(c)
    antetitulo(c, "Dinámica · Lluvia de ideas")
    texto(c, M, H - M - 40, "Seis maneras de sacar ideas", "ExtraBold", 26, NAVY, -0.3)
    texto(c, M, H - M - 60, "De un problema cotidiano a una idea innovadora", "Medium", 12, MUTED)

    # Equipo
    y = H - M - 86
    etiqueta(c, M, y, "Equipo")
    etiqueta(c, M + 182, y, "Integrantes")
    campo(c, "equipo", M, y - 6, 170, 22, "Nombre o número del equipo", False)
    campo(c, "integrantes", M + 182, y - 6, CW - 182, 22, "Nombres de los integrantes", False)
    y -= 6 + 22 + 14

    # Reto
    reto = ("<b>Reto.</b> Elegid algo que os moleste en el día a día y buscadle soluciones con seis "
            "técnicas distintas. Primero sacamos muchas ideas; después elegimos la más potente.")
    alto = _parrafo(c, reto, CW - 34, 10, NAVY, "Regular")[1] + 22
    tarjeta(c, M, y, CW, alto)
    c.setFillColor(YELLOW)
    c.rect(M, y - alto, 5, alto, stroke=0, fill=1)
    parrafo(c, reto, M + 20, y - 11, CW - 34, 10)
    y -= alto + 24

    # Paso 1
    y = paso(c, y, 1, "Definimos el problema")
    y -= 4
    etiqueta(c, M, y, "Problema elegido",
             "Por ejemplo: el móvil en clase, el transporte, cuidar de alguien, el ordenador que va lento…")
    campo(c, "problema", M, y - 6, CW, 22, "Problema elegido", False)
    y -= 6 + 22 + 16
    columnas = ["¿Qué ocurre exactamente?", "¿A quién afecta?", "¿Por qué es un problema?"]
    ancho = (CW - 2 * 12) / 3
    for i, pregunta in enumerate(columnas):
        x = M + i * (ancho + 12)
        etiqueta(c, x, y, pregunta)
        campo(c, f"problema_{i + 1}", x, y - 6, ancho, 50, pregunta)
    y -= 6 + 50 + 24

    # Paso 2
    y = paso(c, y, 2, "Seis maneras de mirar el problema")
    alto = parrafo(c, "Una idea por nota adhesiva, sin juzgarlas todavía: importa sacar muchas. "
                      "Después pasad aquí las mejores de cada técnica.", M, y, CW, 9, MUTED)
    y -= alto + 10

    hueco = 12
    ancho = (CW - hueco) / 2
    alto = (y - BORDE_INFERIOR - 2 * hueco) / 3
    for i, (nombre, lema, color, pregunta) in enumerate(TECNICAS):
        x = M + (i % 2) * (ancho + hueco)
        y_top = y - (i // 2) * (alto + hueco)
        tarjeta(c, x, y_top, ancho, alto, color)
        titulo = f"{i + 1}. {nombre}"
        ancho_titulo = texto(c, x + 12, y_top - 21, titulo, "Bold", 10.5, NAVY)
        texto(c, x + 12 + ancho_titulo, y_top - 21, f" · {lema}", "Medium", 9, MUTED)
        alto_p = parrafo(c, pregunta, x + 12, y_top - 28, ancho - 24, 8.5, NAVY)
        arriba = y_top - 34 - alto_p
        campo(c, f"tecnica_{i + 1}", x + 10, arriba, ancho - 20, arriba - (y_top - alto) - 10,
              f"Ideas con la técnica {nombre}")
    pie(c, 1)


def pagina_2(c):
    antetitulo(c, "Seis maneras de sacar ideas")
    y = H - M - 40

    # Paso 3
    y = paso(c, y, 3, "Elegimos la idea más potente")
    alto = parrafo(c, "Juntad todas las notas. Cada miembro marca las dos ideas que más le gusten y el equipo "
                      "se queda con una.", M, y, CW, 9, MUTED)
    y -= alto + 12

    # La tarjeta se dibuja al final, cuando se conoce su altura
    interior = CW - 32
    x0 = M + 16
    yy = y - 26
    elementos = []

    def diferido(f, *a, **k):
        elementos.append((f, a, k))

    diferido(texto, c, x0, yy, "Idea elegida", "Bold", 12, NAVY)
    yy -= 20
    diferido(etiqueta, c, x0, yy, "Nombre de la idea")
    diferido(campo, c, "idea_nombre", x0, yy - 6, interior, 22, "Nombre de la idea", False)
    yy -= 6 + 22 + 16

    diferido(etiqueta, c, x0, yy, "¿Con qué técnica surgió?")
    yy -= 18
    ancho = interior / 3
    for i, (nombre, *_resto) in enumerate(TECNICAS):
        x = x0 + (i % 3) * ancho
        fila = yy - (i // 3) * 18
        diferido(c.acroForm.radio, name="idea_tecnica", value=f"t{i + 1}", selected=False, x=x, y=fila - 2.5,
                 size=11, buttonStyle="circle", shape="circle", borderColor=MUTED, fillColor=WHITE,
                 textColor=NAVY, borderWidth=1, fieldFlags="noToggleToOff radio", tooltip=f"Técnica: {nombre}")
        diferido(texto, c, x + 16, fila, f"{i + 1}. {nombre}", "Regular", 9, NAVY)
    yy -= 18 + 26

    preguntas = ["¿Qué problema resuelve?", "¿A quién ayuda?", "¿En qué consiste?", "¿Qué tiene de diferente?"]
    ancho = (interior - 12) / 2
    for i, pregunta in enumerate(preguntas):
        x = x0 + (i % 2) * (ancho + 12)
        fila = yy - (i // 2) * 72
        diferido(etiqueta, c, x, fila, pregunta)
        diferido(campo, c, f"idea_{i + 1}", x, fila - 6, ancho, 50, pregunta)
    yy -= 72 + 6 + 50 + 22

    diferido(etiqueta, c, x0, yy, "Una idea es potente si…", "Marcad lo que cumpla la vuestra.")
    criterios = ["Resuelve un problema real.", "Puede ser útil para alguien.", "Aporta algo diferente.",
                 "Se podría llevar a la práctica.", "Podría convertirse en un producto, un servicio o una solución."]
    yy -= 20
    for i, criterio in enumerate(criterios):
        x = x0 + (i % 2) * (ancho + 12)
        fila = yy - (i // 2) * 18
        diferido(c.acroForm.checkbox, name=f"criterio_{i + 1}", tooltip=criterio, x=x, y=fila - 2.5, size=11,
                 buttonStyle="check", borderColor=MUTED, fillColor=WHITE, textColor=NAVY, borderWidth=1,
                 fieldFlags="")
        diferido(texto, c, x + 16, fila, criterio, "Regular", 9, NAVY)
    yy -= 2 * 18 + 16

    tarjeta(c, M, y, CW, y - yy, CORAL)
    for f, a, k in elementos:
        f(*a, **k)
    y = yy - 26

    # Paso 4
    y = paso(c, y, 4, "Preparamos la presentación")
    alto = parrafo(c, "Presentaréis la idea al resto de la clase en dos minutos como máximo. Contad cuatro cosas:",
                   M, y, CW, 9, MUTED)
    y -= alto + 10
    puntos = [("El problema", "¿Qué nos molesta?"), ("La idea", "¿Qué proponemos?"),
              ("La técnica", "¿Cuál nos ayudó a encontrarla?"), ("La utilidad", "¿A quién ayudaría y cómo?")]
    hueco = 10
    ancho = (CW - 3 * hueco) / 4
    for i, (nombre, pregunta) in enumerate(puntos):
        x = M + i * (ancho + hueco)
        tarjeta(c, x, y, ancho, 58)
        texto(c, x + 12, y - 24, str(i + 1), "ExtraBold", 17, CORAL)
        texto(c, x + 29, y - 23, nombre, "Bold", 10, NAVY)
        parrafo(c, pregunta, x + 12, y - 32, ancho - 24, 8.5, MUTED)
    y -= 58 + 14
    alto = parrafo(c, "<b>Podéis empezar así:</b> <i>«Nuestro equipo detectó que… Para buscar soluciones usamos… "
                      "Al final elegimos… Nuestra idea consiste en…»</i>", M, y, CW, 9.5, NAVY)
    y -= alto + 14

    # Recordad
    recordad = ("No buscamos una idea perfecta a la primera. El objetivo es aprender a mirar un mismo "
                "problema desde seis puntos de vista distintos.")
    alto = _parrafo(c, recordad, CW - 40, 11, WHITE, "SemiBold")[1] + 46
    tarjeta(c, M, y, CW, alto, fondo=NAVY)
    texto(c, M + 20, y - 22, "RECORDAD", "Bold", 8.5, YELLOW, 0.8)
    parrafo(c, recordad, M + 20, y - 30, CW - 40, 11, WHITE, "SemiBold")
    y -= alto + 14
    y -= parrafo(c, "<b>Entrega.</b> Un documento por equipo. Rellenadlo en el ordenador, guardad el PDF y "
                    "subidlo a Classroom; si lo hacéis en papel, entregad la hoja.", M, y, CW, 8.5, MUTED)
    comprueba(y, 2)
    pie(c, 2)


def main():
    carga_fuentes()
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(SALIDA), pagesize=A4)
    c.setTitle("Seis maneras de sacar ideas")
    c.setSubject("Plantilla rellenable de la dinámica de lluvia de ideas (UT0)")
    c.setAuthor("Innovación Aplicada a los Sectores Productivos")
    pagina_1(c)
    c.showPage()
    pagina_2(c)
    c.showPage()
    c.save()
    print(SALIDA)


if __name__ == "__main__":
    main()
