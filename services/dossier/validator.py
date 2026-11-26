"""Standalone stdin/stdout validator. Run only in the unprivileged scanner container."""

import io
import os
import resource
import sys
import warnings

MAX = 5 * 1024 * 1024
resource.setrlimit(resource.RLIMIT_CPU, (8, 8))
resource.setrlimit(resource.RLIMIT_AS, (512 << 20, 512 << 20))
resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
from PIL import Image, ImageOps
import pikepdf

Image.MAX_IMAGE_PIXELS = 24_000_000
warnings.simplefilter("error", Image.DecompressionBombWarning)
BLOCKED = {
    "/JS",
    "/JavaScript",
    "/AA",
    "/OpenAction",
    "/EmbeddedFiles",
    "/EF",
    "/XFA",
    "/RichMediaContent",
    "/AcroForm",
    "/Launch",
    "/Collection",
    "/RichMediaSettings",
}
ACTIONS = {
    "/JavaScript",
    "/Launch",
    "/SubmitForm",
    "/ImportData",
    "/GoToR",
    "/GoToE",
    "/Rendition",
    "/Movie",
    "/Sound",
    "/URI",
    "/RichMedia",
    "/EmbeddedFile",
    "/FileAttachment",
    "/3D",
}


def check_objects(pdf):
    stack = list(pdf.objects)
    seen = set()
    budget = 120000
    while stack:
        obj = stack.pop()
        budget -= 1
        if budget < 0:
            raise ValueError()
        if isinstance(obj, pikepdf.Object) and obj.is_indirect:
            if obj.objgen in seen:
                continue
            seen.add(obj.objgen)
        if isinstance(obj, (pikepdf.Dictionary, pikepdf.Stream)):
            if BLOCKED.intersection(obj.keys()):
                raise ValueError()
            if any(
                str(obj.get(key, "")) in ACTIONS for key in ("/S", "/Type", "/Subtype")
            ):
                raise ValueError()
            stack.extend(v for _, v in obj.items())
        elif isinstance(obj, pikepdf.Array):
            stack.extend(obj)


def validate(data):
    if not 0 < len(data) <= MAX:
        raise ValueError()
    if data.startswith(b"%PDF-") and data.rstrip().endswith(b"%%EOF"):
        with pikepdf.open(io.BytesIO(data), attempt_recovery=False) as pdf:
            if (
                pdf.is_encrypted
                or not 1 <= len(pdf.pages) <= 100
                or pdf.check_pdf_syntax()
            ):
                raise ValueError()
            check_objects(pdf)
        return b"application/pdf", data
    with Image.open(io.BytesIO(data), formats=["JPEG", "PNG"]) as im:
        fmt = im.format
        if (
            getattr(im, "n_frames", 1) != 1
            or im.width * im.height > Image.MAX_IMAGE_PIXELS
        ):
            raise ValueError()
        im.load()
        image = ImageOps.exif_transpose(im).convert("RGB" if fmt == "JPEG" else "RGBA")
        image.info.clear()
        out = io.BytesIO()
        image.save(out, fmt)
        result = out.getvalue()
        if len(result) > MAX:
            raise ValueError()
        return (b"image/jpeg" if fmt == "JPEG" else b"image/png"), result


if __name__ == "__main__":
    try:
        data = sys.stdin.buffer.read(MAX + 1)
        if len(sys.argv) == 2:
            import pypdfium2 as pdfium

            doc = pdfium.PdfDocument(data)
            index = int(sys.argv[1]) - 1
            if not 0 <= index < len(doc) <= 100:
                raise ValueError()
            page = doc[index]
            w, h = page.get_size()
            if min(w, h) <= 0:
                raise ValueError()
            bitmap = page.render(scale=min(2, 1400 / max(w, h)))
            out = io.BytesIO()
            bitmap.to_pil().convert("RGB").save(out, "JPEG", quality=85)
            mime, content = (
                ("image/jpeg;pages=" + str(len(doc))).encode(),
                out.getvalue(),
            )
        else:
            mime, content = validate(data)
        sys.stdout.buffer.write(mime + b"\n" + content)
    except Exception:
        os._exit(2)
