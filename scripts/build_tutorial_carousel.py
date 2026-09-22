from pathlib import Path

from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/tutorials/parcours-mission/images"
OUT = ROOT / "output/pdf/Clementplane_Tutoriel_Accepter_Proposition_Mission.pdf"
LOGO = ROOT / "public/brand/clementplane-symbol-on-navy-1024.png"

W, H = 960, 540
NAVY = HexColor("#0B1F4B")
BLUE = HexColor("#2878E8")
PALE_BLUE = HexColor("#EAF2FF")
GREEN = HexColor("#138A68")
PALE_GREEN = HexColor("#E8F6F1")
ORANGE = HexColor("#F59E0B")
PALE_ORANGE = HexColor("#FFF4DB")
INK = HexColor("#172033")
MUTED = HexColor("#60708A")
LIGHT = HexColor("#F5F7FB")
BORDER = HexColor("#DCE3EE")


def rounded(c, x, y, w, h, fill, radius=14, stroke=None, width=1):
    c.setFillColor(fill)
    c.setStrokeColor(stroke or fill)
    c.setLineWidth(width)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=bool(stroke))


def text(c, value, x, y, size=18, color=INK, font="Helvetica", max_width=None, leading=None):
    leading = leading or size * 1.25
    c.setFont(font, size)
    c.setFillColor(color)
    if max_width is None:
        c.drawString(x, y, value)
        return y - leading
    words, lines, line = value.split(), [], ""
    for word in words:
        trial = f"{line} {word}".strip()
        if stringWidth(trial, font, size) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    for row in lines:
        c.drawString(x, y, row)
        y -= leading
    return y


def header(c, label, page):
    c.setFillColor(NAVY)
    c.rect(0, H - 46, W, 46, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(34, H - 29, label.upper())
    c.setFont("Helvetica", 10)
    c.drawRightString(W - 34, H - 29, f"CLEMENTPLANE  •  {page}/10")


def footer(c, role="PARCOURS CROISÉ  •  FORMATEUR ↔ OF"):
    c.setStrokeColor(BORDER)
    c.line(34, 28, W - 34, 28)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(34, 14, role)
    c.setFont("Helvetica", 8)
    c.drawRightString(W - 34, 14, "Données de démonstration fictives")


def place_image(c, path, x, y, w, h, border=True):
    im = ImageReader(str(path))
    iw, ih = im.getSize()
    scale = min(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    dx, dy = x + (w - dw) / 2, y + (h - dh) / 2
    if border:
        rounded(c, x - 5, y - 5, w + 10, h + 10, white, 10, BORDER)
    c.drawImage(im, dx, dy, dw, dh, preserveAspectRatio=True, mask="auto")
    return dx, dy, dw, dh


def callout(c, n, title, body, x, y, w, color=BLUE, pale=PALE_BLUE):
    rounded(c, x, y, w, 82, pale, 14)
    c.setFillColor(color)
    c.circle(x + 29, y + 53, 17, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(x + 29, y + 48, str(n))
    text(c, title, x + 57, y + 59, 13, INK, "Helvetica-Bold", w - 74)
    text(c, body, x + 57, y + 37, 10.5, MUTED, "Helvetica", w - 74, 13)


def screenshot_page(c, page, step, label, title_value, body, img, callout_title, callout_body, color=BLUE, pale=PALE_BLUE, role=None):
    c.setFillColor(LIGHT)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    header(c, label, page)
    text(c, title_value, 34, 467, 25, NAVY, "Helvetica-Bold", 892, 30)
    text(c, body, 34, 430, 12, MUTED, "Helvetica", 892, 15)
    place_image(c, SRC / img, 34, 93, 612, 315)
    callout(c, step, callout_title, callout_body, 676, 266, 250, color, pale)
    rounded(c, 676, 122, 250, 117, white, 14, BORDER)
    text(c, "À RETENIR", 696, 212, 10, color, "Helvetica-Bold")
    if page == 3:
        note = "Ouvrez la proposition avant de décider : la liste seule ne montre pas tous les détails utiles."
    elif page == 4:
        note = "Accepter informe l’organisme, mais ne confirme pas encore définitivement la mission."
    elif page == 5:
        note = "Le statut reste en attente tant que l’OF n’a pas confirmé l’affectation."
    elif page == 7:
        note = "L’OF voit la réponse du formateur et sait qu’une action reste nécessaire."
    elif page == 8:
        note = "L’affectation est l’action qui transforme l’accord en mission confirmée."
    elif page == 9:
        note = "Côté OF, le statut « Affecté » confirme que l’opération est terminée."
    else:
        note = "Le formateur retrouve maintenant la mission confirmée dans son espace."
    text(c, note, 696, 188, 11, INK, "Helvetica", 210, 15)
    footer(c, role or "PARCOURS CROISÉ  •  FORMATEUR ↔ OF")
    c.showPage()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("Clementplane — Accepter une proposition de mission")
    c.setAuthor("Clementplane")
    c.setSubject("Tutoriel utilisateur pas-à-pas — parcours croisé Formateur et organisme de formation")

    # 1 — couverture
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.circle(855, 455, 160, fill=1, stroke=0)
    c.setFillColor(Color(1, 1, 1, alpha=0.10))
    c.circle(800, 95, 235, fill=1, stroke=0)
    c.drawImage(str(LOGO), 54, 455, width=36, height=36, preserveAspectRatio=True, mask="auto")
    text(c, "Clementplane", 100, 466, 17, white, "Helvetica-Bold")
    rounded(c, 54, 379, 245, 28, PALE_BLUE, 14)
    text(c, "TUTORIEL PAS-À-PAS  •  3 MIN", 72, 388, 10, BLUE, "Helvetica-Bold")
    text(c, "Accepter une proposition", 54, 320, 34, white, "Helvetica-Bold")
    text(c, "de mission", 54, 278, 34, white, "Helvetica-Bold")
    text(c, "Du clic du formateur à la confirmation finale par l’organisme de formation.", 54, 222, 16, HexColor("#D9E6FF"), "Helvetica", 560, 21)
    rounded(c, 54, 92, 552, 82, Color(1, 1, 1, alpha=0.10), 16, Color(1, 1, 1, alpha=0.18))
    text(c, "OBJECTIF", 76, 147, 10, HexColor("#9BC2FF"), "Helvetica-Bold")
    text(c, "Comprendre qui agit, ce que voit l’autre partie et à quel moment la mission est réellement confirmée.", 76, 125, 12, white, "Helvetica", 500, 17)
    text(c, "FORMATEUR", 710, 254, 15, white, "Helvetica-Bold")
    c.setStrokeColor(white); c.setLineWidth(3); c.line(760, 235, 840, 235)
    c.setFillColor(white); c.circle(846, 235, 6, fill=1, stroke=0)
    text(c, "ORGANISME", 722, 199, 15, white, "Helvetica-Bold")
    text(c, "DE FORMATION", 709, 179, 15, white, "Helvetica-Bold")
    c.setFont("Helvetica", 9); c.setFillColor(HexColor("#B9CAE9")); c.drawString(54, 35, "Captures réalisées dans la véritable interface Clementplane avec des données fictives.")
    c.showPage()

    # 2 — carte du parcours
    c.setFillColor(LIGHT); c.rect(0, 0, W, H, fill=1, stroke=0)
    header(c, "Avant de commencer", 2)
    text(c, "Le parcours en un coup d’œil", 34, 460, 28, NAVY, "Helvetica-Bold")
    text(c, "La mission n’est confirmée qu’après deux décisions successives.", 34, 424, 14, MUTED)
    items = [
        ("1", "Le formateur", "ouvre la proposition", BLUE, PALE_BLUE),
        ("2", "Le formateur", "accepte la proposition", BLUE, PALE_BLUE),
        ("3", "L’organisme", "voit la réponse", ORANGE, PALE_ORANGE),
        ("4", "L’organisme", "confirme l’affectation", ORANGE, PALE_ORANGE),
        ("5", "Les deux côtés", "voient la mission confirmée", GREEN, PALE_GREEN),
    ]
    for i, (n, who, action, color, pale) in enumerate(items):
        x = 34 + i * 181
        rounded(c, x, 214, 161, 156, white, 16, BORDER)
        c.setFillColor(color); c.circle(x + 28, 339, 16, fill=1, stroke=0)
        c.setFillColor(white); c.setFont("Helvetica-Bold", 13); c.drawCentredString(x + 28, 334, n)
        rounded(c, x + 17, 285, 127, 28, pale, 10)
        text(c, who.upper(), x + 29, 294, 8.5, color, "Helvetica-Bold")
        text(c, action, x + 17, 261, 12.5, INK, "Helvetica-Bold", 127, 16)
        if i < 4:
            c.setStrokeColor(BORDER); c.setLineWidth(2); c.line(x + 161, 292, x + 181, 292)
    rounded(c, 34, 99, 892, 76, PALE_ORANGE, 14)
    text(c, "POINT IMPORTANT", 56, 147, 10, ORANGE, "Helvetica-Bold")
    text(c, "L’acceptation du formateur ne suffit pas : l’organisme doit encore confirmer l’affectation.", 56, 122, 14, INK, "Helvetica-Bold", 840)
    footer(c); c.showPage()

    screenshot_page(c, 3, 1, "Côté formateur", "1. Ouvrez la proposition", "Dans « Mes propositions », repérez la mission à laquelle vous devez répondre.", "01-proposition-a-repondre.jpg", "Ouvrir", "Cliquez sur « Voir la proposition » pour afficher les dates, le lieu et les informations de la mission.", role="FORMATEUR")
    screenshot_page(c, 4, 2, "Côté formateur", "2. Vérifiez puis acceptez", "Lisez les détails de la proposition avant de transmettre votre décision.", "02-detail-proposition.jpg", "Accepter", "Si la mission vous convient, cliquez sur « Accepter ». Votre réponse devient immédiatement visible par l’OF.", color=GREEN, pale=PALE_GREEN, role="FORMATEUR")
    screenshot_page(c, 5, 3, "Côté formateur", "3. Votre réponse est enregistrée", "Clementplane confirme votre accord, mais l’organisme doit encore finaliser l’affectation.", "03-mission-acceptee-attente-of.jpg", "Attendre l’OF", "Aucune autre action n’est nécessaire pour l’instant. Le statut vous indique que la confirmation de l’OF est attendue.", color=ORANGE, pale=PALE_ORANGE, role="FORMATEUR")

    # 6 — transition
    c.setFillColor(NAVY); c.rect(0, 0, W, H, fill=1, stroke=0)
    rounded(c, 54, 393, 232, 29, PALE_ORANGE, 14)
    text(c, "LE PARCOURS CONTINUE", 73, 402, 10, ORANGE, "Helvetica-Bold")
    text(c, "Que se passe-t-il ensuite", 54, 326, 34, white, "Helvetica-Bold")
    text(c, "côté organisme de formation ?", 54, 283, 34, white, "Helvetica-Bold")
    text(c, "L’OF voit l’acceptation, ouvre la mission puis confirme l’affectation du formateur.", 54, 223, 16, HexColor("#D9E6FF"), "Helvetica", 620, 22)
    rounded(c, 54, 102, 600, 73, Color(1, 1, 1, alpha=0.10), 16, Color(1, 1, 1, alpha=0.18))
    text(c, "Cette dernière action rend la mission officiellement confirmée dans les deux espaces.", 78, 137, 14, white, "Helvetica-Bold", 552, 19)
    c.setFillColor(ORANGE); c.circle(798, 272, 90, fill=1, stroke=0)
    c.setFillColor(white); c.setLineWidth(7); c.circle(798, 291, 24, fill=0, stroke=1); c.line(798, 267, 798, 220); c.line(770, 236, 798, 220); c.line(826, 236, 798, 220)
    c.setFont("Helvetica-Bold", 10); c.drawCentredString(798, 156, "ORGANISME DE FORMATION")
    footer(c); c.showPage()

    screenshot_page(c, 7, 4, "Côté organisme", "4. Consultez la réponse reçue", "La mission signale que Camille Moreau a accepté et qu’une confirmation reste nécessaire.", "04-of-reponse-recue.jpg", "Voir la mission", "Ouvrez la mission concernée pour contrôler la réponse et accéder à l’action de confirmation.", color=ORANGE, pale=PALE_ORANGE, role="ORGANISME DE FORMATION")
    screenshot_page(c, 8, 5, "Côté organisme", "5. Confirmez l’affectation", "La fiche de mission affiche clairement l’action encore requise.", "05-of-affectation-a-confirmer.jpg", "Affecter", "Cliquez sur « Affecter » pour confirmer définitivement Camille Moreau sur cette mission.", color=GREEN, pale=PALE_GREEN, role="ORGANISME DE FORMATION")
    screenshot_page(c, 9, 6, "Côté organisme", "6. Vérifiez le statut final", "Le statut « Affecté » confirme que la mission est finalisée côté organisme.", "06-of-mission-affectee.jpg", "Mission affectée", "L’organisme n’a plus d’action à réaliser pour cette affectation.", color=GREEN, pale=PALE_GREEN, role="ORGANISME DE FORMATION")
    screenshot_page(c, 10, 7, "Résultat final", "7. La mission est confirmée pour le formateur", "Dans son espace, le formateur voit maintenant la mission avec le statut confirmé.", "07-formateur-mission-confirmee.jpg", "Parcours terminé", "Le formateur et l’OF disposent désormais du même résultat : la mission est officiellement confirmée.", color=GREEN, pale=PALE_GREEN)

    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
