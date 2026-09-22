from pathlib import Path

from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
POOL = ROOT / "docs/tutorials/_capture-pool/of"
OUT = ROOT / "output/pdf"
LOGO = ROOT / "public/brand/clementplane-symbol-on-navy-1024.png"
W, H = 960, 540
NAVY, BLUE, GREEN, ORANGE = map(HexColor, ("#0B1F4B", "#2878E8", "#138A68", "#F59E0B"))
INK, MUTED, LIGHT, BORDER = map(HexColor, ("#172033", "#60708A", "#F5F7FB", "#DCE3EE"))
PALE_BLUE, PALE_GREEN, PALE_ORANGE = map(HexColor, ("#EAF2FF", "#E8F6F1", "#FFF4DB"))


TUTORIALS = [
    {
        "file": "Clementplane_Tutoriel_Rechercher_Consulter_Formateur.pdf",
        "title": "Rechercher et consulter un formateur",
        "subtitle": "Trouvez rapidement un profil de votre réseau et vérifiez les informations utiles avant de le solliciter.",
        "objective": "Utiliser les filtres, ouvrir la fiche d’un formateur et consulter ses compétences, son matériel et ses disponibilités.",
        "role": "ORGANISME DE FORMATION",
        "steps": [
            ("01-liste-formateurs.jpg", "Ouvrir « Formateurs »", "La liste affiche uniquement le réseau privé de votre organisme.", "La recherche et les filtres réduisent la liste sans rendre vos données visibles aux autres OF."),
            ("01-liste-formateurs.jpg", "Utiliser les critères utiles", "Recherchez par nom, ville, compétence, matériel, statut ou disponibilité.", "Vous identifiez plus rapidement les profils adaptés à votre besoin."),
            ("02-fiche-formateur.jpg", "Ouvrir la fiche", "Cliquez sur « Voir » pour consulter les informations professionnelles du formateur.", "La fiche regroupe ses données partagées et vos informations internes propres à votre organisme."),
            ("02-fiche-formateur.jpg", "Vérifier les disponibilités", "Consultez le calendrier et la date de dernière mise à jour avant de contacter le formateur.", "Vous travaillez à partir de l’information la plus récente disponible dans Clementplane."),
        ],
    },
    {
        "file": "Clementplane_Tutoriel_Consulter_Planning_OF.pdf",
        "title": "Consulter le planning des missions",
        "subtitle": "Visualisez les missions de votre organisme et repérez rapidement leur situation.",
        "objective": "Naviguer dans le calendrier, filtrer les missions et ouvrir une intervention depuis le planning.",
        "role": "ORGANISME DE FORMATION",
        "steps": [
            ("03-planning-of.jpg", "Ouvrir « Planning »", "Le calendrier affiche les missions du mois sélectionné.", "Les missions affectées et celles qui restent à affecter utilisent des statuts distincts."),
            ("03-planning-of.jpg", "Changer de période", "Utilisez les flèches ou « Aujourd’hui » pour vous déplacer dans le calendrier.", "Le planning se recharge sur la période choisie."),
            ("03-planning-of.jpg", "Filtrer l’affichage", "Les filtres « Formateurs » et « Statut » permettent de cibler ce que vous cherchez.", "Les filtres ne modifient aucune mission : ils changent uniquement l’affichage."),
            ("03-planning-of.jpg", "Ouvrir une mission", "Cliquez sur une mission pour accéder à son détail et à ses actions.", "Vous retrouvez le formateur, les dates et l’état d’avancement de la mission."),
        ],
    },
    {
        "file": "Clementplane_Tutoriel_Importer_Formateurs.pdf",
        "title": "Importer plusieurs formateurs",
        "subtitle": "Ajoutez un réseau existant à partir du modèle Excel ou d’un fichier CSV contrôlé.",
        "objective": "Télécharger le modèle, préparer les données, analyser le fichier et comprendre ce qui sera importé.",
        "role": "ORGANISME DE FORMATION",
        "steps": [
            ("05-import-formateurs.jpg", "Télécharger le modèle", "Utilisez le modèle Clementplane et conservez les intitulés des douze colonnes.", "Vous partez d’un fichier compatible avec l’outil d’analyse."),
            ("05-import-formateurs.jpg", "Compléter le fichier", "Le prénom et le nom sont obligatoires. Séparez les compétences et matériels par un point-virgule.", "Les valeurs inconnues seront signalées et ne créeront pas automatiquement de nouvelles références."),
            ("05-import-formateurs.jpg", "Choisir le fichier", "Déposez un fichier Excel .xlsx ou CSV dans la zone prévue.", "Le fichier est chargé pour contrôle, sans création immédiate dans votre réseau."),
            ("05-import-formateurs.jpg", "Analyser avant d’importer", "Cliquez sur « Analyser le fichier » puis examinez les lignes et anomalies signalées.", "Rien n’est enregistré tant que vous n’avez pas validé l’étape d’import finale."),
        ],
    },
    {
        "file": "Clementplane_Tutoriel_Gerer_Mon_Compte.pdf",
        "title": "Gérer mon compte Clementplane",
        "subtitle": "Mettez à jour vos informations personnelles et les préférences liées à votre compte.",
        "objective": "Modifier son identité affichée, vérifier son adresse de connexion et accéder aux réglages du compte.",
        "role": "LES DEUX PROFILS",
        "steps": [
            ("04-parametres-of.jpg", "Ouvrir « Paramètres »", "Le menu mène à la page « Mon compte ».", "Vous accédez aux informations rattachées à votre connexion Clementplane."),
            ("04-parametres-of.jpg", "Modifier prénom et nom", "Corrigez les informations affichées puis cliquez sur « Enregistrer ».", "Le nouveau nom sera utilisé dans votre espace et dans les historiques d’action."),
            ("04-parametres-of.jpg", "Vérifier l’adresse de connexion", "Votre adresse actuelle est affichée dans la section du compte.", "Un changement d’adresse peut nécessiter une confirmation de sécurité."),
            ("04-parametres-of.jpg", "Consulter les autres réglages", "Faites défiler la page pour accéder aux préférences disponibles.", "Les réglages enregistrés s’appliquent à votre compte, pas aux autres utilisateurs de l’organisme."),
        ],
    },
    {
        "file": "Clementplane_Tutoriel_Trouver_Aide_FAQ.pdf",
        "title": "Trouver de l’aide dans Clementplane",
        "subtitle": "Accédez aux explications, aux guides, à la FAQ et au formulaire de contact depuis l’application.",
        "objective": "Trouver une réponse rapidement et transmettre une demande avec le bon contexte si nécessaire.",
        "role": "LES DEUX PROFILS",
        "steps": [
            ("07-decouvrir-clementplane.jpg", "Ouvrir « Découvrir Clementplane »", "Le contenu s’adapte automatiquement à votre profil Formateur ou OF.", "Vous obtenez des explications correspondant à votre espace."),
            ("07-decouvrir-clementplane.jpg", "Consulter les guides", "Ouvrez le guide correspondant à l’action que vous souhaitez réaliser.", "Le guide présente les étapes et les conséquences importantes."),
            ("07-decouvrir-clementplane.jpg", "Rechercher dans la FAQ", "Saisissez un mot-clé ou parcourez les questions par thème.", "Vous pouvez vérifier les règles de confidentialité, de planning ou de mission."),
            ("07-decouvrir-clementplane.jpg", "Contacter Clementplane", "Choisissez une catégorie et décrivez précisément votre demande.", "Votre demande est enregistrée avec le contexte utile de votre compte pour faciliter le suivi."),
        ],
    },
]


def box(c, x, y, w, h, fill, stroke=None, radius=14):
    c.setFillColor(fill); c.setStrokeColor(stroke or fill)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=bool(stroke))


def txt(c, value, x, y, size=18, color=INK, font="Helvetica", width=None, leading=None):
    leading = leading or size * 1.24; c.setFont(font, size); c.setFillColor(color)
    if not width: c.drawString(x, y, value); return y-leading
    rows=[]; line=""
    for word in value.split():
        trial=f"{line} {word}".strip()
        if stringWidth(trial,font,size)<=width: line=trial
        else: rows.append(line); line=word
    if line: rows.append(line)
    for row in rows: c.drawString(x,y,row); y-=leading
    return y


def draw_image(c, path, x=34, y=91, w=615, h=320):
    im=ImageReader(str(path)); iw,ih=im.getSize(); s=min(w/iw,h/ih); dw,dh=iw*s,ih*s
    box(c,x-5,y-5,w+10,h+10,white,BORDER,10)
    c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh,preserveAspectRatio=True,mask="auto")


def header(c, title, page, pages):
    c.setFillColor(NAVY); c.rect(0,H-46,W,46,fill=1,stroke=0)
    txt(c,title.upper(),34,H-29,12,white,"Helvetica-Bold")
    c.setFont("Helvetica",10); c.drawRightString(W-34,H-29,f"CLEMENTPLANE  •  {page}/{pages}")


def footer(c, role):
    c.setStrokeColor(BORDER); c.line(34,28,W-34,28)
    txt(c,role,34,14,8,MUTED,"Helvetica-Bold")
    c.setFont("Helvetica",8); c.drawRightString(W-34,14,"Données de démonstration fictives")


def build_one(item):
    path=OUT/item["file"]; pages=len(item["steps"])+2
    c=canvas.Canvas(str(path),pagesize=(W,H),pageCompression=1)
    c.setTitle(f'Clementplane — {item["title"]}'); c.setAuthor("Clementplane")
    c.setSubject("Tutoriel utilisateur pas-à-pas")
    c.setFillColor(NAVY); c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(BLUE); c.circle(850,450,165,fill=1,stroke=0)
    c.setFillColor(Color(1,1,1,alpha=.1)); c.circle(805,90,235,fill=1,stroke=0)
    c.drawImage(str(LOGO),54,455,36,36,preserveAspectRatio=True,mask="auto")
    txt(c,"Clementplane",100,466,17,white,"Helvetica-Bold")
    box(c,54,379,230,28,PALE_BLUE,radius=14); txt(c,"TUTORIEL PAS-À-PAS",72,388,10,BLUE,"Helvetica-Bold")
    txt(c,item["title"],54,320,34,white,"Helvetica-Bold",610,41)
    txt(c,item["subtitle"],54,240,16,HexColor("#D9E6FF"),width=590,leading=21)
    box(c,54,104,590,84,Color(1,1,1,alpha=.10),Color(1,1,1,alpha=.18))
    txt(c,"OBJECTIF",76,159,10,HexColor("#9BC2FF"),"Helvetica-Bold")
    txt(c,item["objective"],76,135,12,white,width=540,leading=17)
    c.setFillColor(GREEN); c.circle(800,272,90,fill=1,stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold",15); c.drawCentredString(800,278,"GUIDE"); c.setFont("Helvetica",12); c.drawCentredString(800,255,"CLEMENTPLANE")
    c.showPage()

    c.setFillColor(LIGHT); c.rect(0,0,W,H,fill=1,stroke=0); header(c,"Avant de commencer",2,pages)
    txt(c,"Le parcours en un coup d’œil",34,460,28,NAVY,"Helvetica-Bold")
    txt(c,"Chaque étape correspond à une action concrète dans la version actuellement déployée.",34,423,14,MUTED)
    for i,(_,title,body,_) in enumerate(item["steps"]):
        x=42+i*224; box(c,x,218,202,164,white,BORDER)
        col=[BLUE,BLUE,ORANGE,GREEN][min(i,3)]; pale=[PALE_BLUE,PALE_BLUE,PALE_ORANGE,PALE_GREEN][min(i,3)]
        c.setFillColor(col); c.circle(x+30,348,17,fill=1,stroke=0); c.setFillColor(white); c.setFont("Helvetica-Bold",14); c.drawCentredString(x+30,343,str(i+1))
        box(c,x+18,293,166,28,pale,radius=10); txt(c,title.upper(),x+29,302,8.5,col,"Helvetica-Bold",145,11)
        txt(c,body,x+18,270,11,INK,"Helvetica",166,15)
    box(c,42,103,874,76,PALE_ORANGE); txt(c,"BON À SAVOIR",64,151,10,ORANGE,"Helvetica-Bold")
    txt(c,"Les captures utilisent exclusivement des comptes et informations fictifs, dans la véritable interface Clementplane.",64,126,14,INK,"Helvetica-Bold",820,18)
    footer(c,item["role"]); c.showPage()

    for idx,(img,title,body,after) in enumerate(item["steps"],1):
        page=idx+2; col=GREEN if idx==len(item["steps"]) else (ORANGE if idx==3 else BLUE); pale=PALE_GREEN if col==GREEN else (PALE_ORANGE if col==ORANGE else PALE_BLUE)
        c.setFillColor(LIGHT); c.rect(0,0,W,H,fill=1,stroke=0); header(c,item["title"],page,pages)
        txt(c,f"{idx}. {title}",34,466,25,NAVY,"Helvetica-Bold",892,30); txt(c,body,34,430,12,MUTED,width=892,leading=15)
        draw_image(c,POOL/img)
        box(c,676,277,250,92,pale); c.setFillColor(col); c.circle(705,337,17,fill=1,stroke=0); c.setFillColor(white); c.setFont("Helvetica-Bold",14); c.drawCentredString(705,332,str(idx))
        txt(c,title,733,343,13,INK,"Helvetica-Bold",175,16)
        box(c,676,119,250,132,white,BORDER); txt(c,"CE QUI SE PASSE ENSUITE",696,222,9.5,col,"Helvetica-Bold")
        txt(c,after,696,196,11,INK,width=210,leading=15); footer(c,item["role"]); c.showPage()
    c.save(); return path


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for item in TUTORIALS: print(build_one(item))


if __name__=="__main__": main()
