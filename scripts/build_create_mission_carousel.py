from pathlib import Path

from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/tutorials/organismes/creer-mission/images"
OUT = ROOT / "output/pdf/Clementplane_Tutoriel_Creer_Une_Mission.pdf"
LOGO = ROOT / "public/brand/clementplane-symbol-on-navy-1024.png"
W, H = 960, 540
NAVY, BLUE, GREEN, ORANGE = map(HexColor, ("#0B1F4B", "#2878E8", "#138A68", "#F59E0B"))
INK, MUTED, LIGHT, BORDER = map(HexColor, ("#172033", "#60708A", "#F5F7FB", "#DCE3EE"))
PALE_BLUE, PALE_GREEN, PALE_ORANGE = map(HexColor, ("#EAF2FF", "#E8F6F1", "#FFF4DB"))


def box(c, x, y, w, h, fill, stroke=None, radius=14):
    c.setFillColor(fill); c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=bool(stroke))


def txt(c, value, x, y, size=18, color=INK, font="Helvetica", width=None, leading=None):
    leading = leading or size * 1.24
    c.setFont(font, size); c.setFillColor(color)
    if not width:
        c.drawString(x, y, value); return y - leading
    rows, line = [], ""
    for word in value.split():
        trial = f"{line} {word}".strip()
        if stringWidth(trial, font, size) <= width: line = trial
        else: rows.append(line); line = word
    if line: rows.append(line)
    for row in rows:
        c.drawString(x, y, row); y -= leading
    return y


def header(c, label, page):
    c.setFillColor(NAVY); c.rect(0, H - 46, W, 46, fill=1, stroke=0)
    txt(c, label.upper(), 34, H - 29, 13, white, "Helvetica-Bold")
    c.setFont("Helvetica", 10); c.drawRightString(W - 34, H - 29, f"CLEMENTPLANE  •  {page}/7")


def footer(c):
    c.setStrokeColor(BORDER); c.line(34, 28, W - 34, 28)
    txt(c, "ORGANISME DE FORMATION", 34, 14, 8, MUTED, "Helvetica-Bold")
    c.setFont("Helvetica", 8); c.drawRightString(W - 34, 14, "Données de démonstration fictives")


def image(c, name, x=34, y=91, w=615, h=320):
    im = ImageReader(str(SRC / name)); iw, ih = im.getSize(); scale = min(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale; dx, dy = x + (w-dw)/2, y + (h-dh)/2
    box(c, x-5, y-5, w+10, h+10, white, BORDER, 10)
    c.drawImage(im, dx, dy, dw, dh, preserveAspectRatio=True, mask="auto")


def step(c, page, n, title, intro, screenshot, action, consequence, color=BLUE, pale=PALE_BLUE):
    c.setFillColor(LIGHT); c.rect(0, 0, W, H, fill=1, stroke=0)
    header(c, "Créer une mission", page)
    txt(c, title, 34, 466, 25, NAVY, "Helvetica-Bold", 892, 30)
    txt(c, intro, 34, 430, 12, MUTED, width=892, leading=15)
    image(c, screenshot)
    box(c, 676, 277, 250, 92, pale)
    c.setFillColor(color); c.circle(705, 337, 17, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 14); c.drawCentredString(705, 332, str(n))
    txt(c, action, 733, 343, 13, INK, "Helvetica-Bold", 175, 16)
    box(c, 676, 119, 250, 132, white, BORDER)
    txt(c, "CE QUI SE PASSE ENSUITE", 696, 222, 9.5, color, "Helvetica-Bold")
    txt(c, consequence, 696, 196, 11, INK, width=210, leading=15)
    footer(c); c.showPage()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("Clementplane — Créer une mission")
    c.setAuthor("Clementplane")
    c.setSubject("Tutoriel utilisateur pas-à-pas pour les organismes de formation")

    c.setFillColor(NAVY); c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(BLUE); c.circle(850, 450, 165, fill=1, stroke=0)
    c.setFillColor(Color(1,1,1,alpha=.1)); c.circle(805, 90, 235, fill=1, stroke=0)
    c.drawImage(str(LOGO), 54, 455, 36, 36, preserveAspectRatio=True, mask="auto")
    txt(c, "Clementplane", 100, 466, 17, white, "Helvetica-Bold")
    box(c, 54, 379, 230, 28, PALE_BLUE, radius=14)
    txt(c, "TUTORIEL PAS-À-PAS  •  3 MIN", 72, 388, 10, BLUE, "Helvetica-Bold")
    txt(c, "Créer une mission", 54, 310, 38, white, "Helvetica-Bold")
    txt(c, "Enregistrez une nouvelle intervention puis préparez la recherche du formateur adapté.", 54, 250, 17, HexColor("#D9E6FF"), width=570, leading=22)
    box(c, 54, 104, 570, 84, Color(1,1,1,alpha=.10), Color(1,1,1,alpha=.18))
    txt(c, "OBJECTIF", 76, 159, 10, HexColor("#9BC2FF"), "Helvetica-Bold")
    txt(c, "Saisir les informations utiles, les dates et le lieu, puis comprendre ce que Clementplane prépare après la création.", 76, 135, 12, white, width=520, leading=17)
    c.setFillColor(GREEN); c.circle(798, 275, 91, fill=1, stroke=0)
    c.setFillColor(white); c.setLineWidth(6); c.rect(766, 240, 64, 66, fill=0, stroke=1); c.line(782, 318, 814, 318); c.line(798, 334, 798, 302); c.line(782, 318, 814, 318)
    c.setFont("Helvetica-Bold", 10); c.drawCentredString(798, 157, "ORGANISME DE FORMATION")
    c.showPage()

    c.setFillColor(LIGHT); c.rect(0, 0, W, H, fill=1, stroke=0); header(c, "Avant de commencer", 2)
    txt(c, "Ce que vous allez faire", 34, 460, 28, NAVY, "Helvetica-Bold")
    txt(c, "La création enregistre la mission. Elle n’envoie encore aucune proposition à un formateur.", 34, 422, 14, MUTED)
    items=[("1","Ouvrir","le formulaire",BLUE,PALE_BLUE),("2","Renseigner","la mission",BLUE,PALE_BLUE),("3","Ajouter","lieu et dates",ORANGE,PALE_ORANGE),("4","Créer","la mission",GREEN,PALE_GREEN)]
    for i,(n,a,b,col,pale) in enumerate(items):
        x=55+i*220; box(c,x,225,190,150,white,BORDER)
        c.setFillColor(col); c.circle(x+30,342,17,fill=1,stroke=0); c.setFillColor(white); c.setFont("Helvetica-Bold",14); c.drawCentredString(x+30,337,n)
        box(c,x+18,286,154,28,pale,radius=10); txt(c,a.upper(),x+32,295,9,col,"Helvetica-Bold")
        txt(c,b,x+18,260,14,INK,"Helvetica-Bold",154,18)
    box(c,55,105,850,76,PALE_ORANGE)
    txt(c,"À RETENIR",76,153,10,ORANGE,"Helvetica-Bold")
    txt(c,"Après la création, la mission reste « À pourvoir » : vous pourrez ensuite rechercher, sélectionner et contacter un formateur.",76,127,14,INK,"Helvetica-Bold",800,18)
    footer(c); c.showPage()

    step(c,3,1,"1. Ouvrez le formulaire","Depuis « Missions », cliquez sur « Créer une mission ».","01-formulaire-vide.jpg","Commencer","Le formulaire s’ouvre. Aucun formateur n’est contacté à ce stade.")
    step(c,4,2,"2. Renseignez les informations générales","Indiquez le client, votre référence interne, la formation et les besoins matériels.","02-informations-generales.jpg","Décrire la mission","Ces informations serviront ensuite à identifier la mission et à rechercher les profils adaptés.")
    step(c,5,3,"3. Ajoutez le lieu, la date et les horaires","Le code postal et la ville sont obligatoires. L’adresse exacte reste facultative.","02-formulaire-renseigne.jpg","Planifier","Clementplane utilisera le lieu et les dates pour calculer la proximité et vérifier les disponibilités.",ORANGE,PALE_ORANGE)
    step(c,6,4,"4. Cliquez sur « Créer la mission »","Relisez les informations puis validez en bas du formulaire.","02-formulaire-renseigne.jpg","Créer","La mission est enregistrée dans votre espace, sans envoi automatique à un formateur.",GREEN,PALE_GREEN)
    step(c,7,5,"5. Retrouvez la mission créée","La fiche récapitule les informations saisies et affiche l’action encore nécessaire.","03-mission-creee.jpg","Mission à pourvoir","Vous pouvez maintenant rechercher un formateur, le sélectionner puis lui proposer la mission.",GREEN,PALE_GREEN)

    c.save(); print(OUT)


if __name__ == "__main__": build()
