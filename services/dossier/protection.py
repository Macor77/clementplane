"""Authenticated encryption for stored file bytes; keys live outside PostgreSQL."""

import base64
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def cipher(key_id):
    keys = json.loads(os.environ["DOSSIER_FILE_KEYS"])
    raw = base64.b64decode(keys[key_id], validate=True)
    if len(raw) != 32:
        raise ValueError("Invalid dossier key configuration")
    return AESGCM(raw)


def aad(doc, version, mime):
    return f"clementplane/dossier/v1/{doc}/{version}/{mime}".encode("ascii")


def seal(doc, version, mime, data):
    kid = os.environ["DOSSIER_CURRENT_KEY_ID"]
    nonce = os.urandom(12)
    return kid, nonce + cipher(kid).encrypt(nonce, data, aad(doc, version, mime))


def unseal(kid, doc, version, mime, envelope):
    return cipher(kid).decrypt(envelope[:12], envelope[12:], aad(doc, version, mime))
