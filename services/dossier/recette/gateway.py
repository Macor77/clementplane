"""Manage a time-limited public TLS endpoint for one guest-trial deployment."""
import argparse
import os
from pathlib import Path
import re
import socket
import subprocess

HERE = Path(__file__).resolve().parent
CERT_NAME = "clementplane-invite-cert"
EDGE_NAME = "clementplane-invite-https"


def docker(*args):
    subprocess.run(["docker", *map(str, args)], check=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("certificate", "open"))
    args = parser.parse_args()
    host = os.environ["DOSSIER_GUEST_HOST"]
    if not re.fullmatch(r"[a-z0-9.-]+", host):
        parser.error("Expected DNS hostname")
    directory = Path(os.environ["DOSSIER_TRIAL_DIR"]).resolve(strict=True)
    os.umask(0o077)
    data = directory / "tls"
    if args.action == "certificate":
        data.mkdir(mode=0o700, exist_ok=True)
        docker("run", "--detach", "--rm", "--name", CERT_NAME, "--publish", "443:443",
               "--env", "DOSSIER_GUEST_HOST", "--volume", f"{data}:/data",
               "--volume", f"{HERE}/acme.Caddyfile:/etc/caddy/Caddyfile:ro",
               "--entrypoint", "timeout", "caddy:2-alpine", "180", "caddy", "run",
               "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile")
        return
    certs = list(data.glob(f"caddy/certificates/*/{host}/{host}.crt"))
    if len(certs) != 1 or not certs[0].with_suffix(".key").is_file():
        raise SystemExit("The trial certificate and key are required.")
    site = (HERE.parents[2] / "dist").resolve(strict=True)
    if not (site / "dossier-invite.html").is_file() or (site / "index.html").exists():
        raise SystemExit("Build the guest-only bundle in dist before opening.")
    template = (HERE / "nginx-guest.conf.template").read_text()
    addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
    ipv6 = sorted({addr[0] for family, _, _, _, addr in addresses if family == socket.AF_INET6})
    extra_listeners = "\n    ".join(f"listen [{address}]:443 ssl;" for address in ipv6)
    settings = {"HTTPS_LISTEN": "443", "HTTPS_EXTRA_LISTEN": extra_listeners,
                "API_PORT": "18260", "GUEST_HOST": host,
                "TLS_CERT": "/trial/tls/server.crt", "TLS_KEY": "/trial/tls/server.key",
                "GUEST_ROOT": "/trial/site"}
    for key, value in settings.items():
        template = template.replace("${DOSSIER_" + key + "}", value)
    if "${DOSSIER_" in template:
        raise SystemExit("Unresolved gateway setting.")
    conf = directory / "guest.conf"
    conf.write_text(template)
    volumes = []
    for source, target in [(conf, "/etc/nginx/conf.d/default.conf"),
                           (site, "/trial/site"), (certs[0], settings["TLS_CERT"]),
                           (certs[0].with_suffix(".key"), settings["TLS_KEY"])]:
        volumes.extend(["--volume", f"{source}:{target}:ro"])
    options = ["--network", "host", "--read-only", "--tmpfs", "/var/run",
               "--tmpfs", "/var/cache/nginx", "--security-opt", "no-new-privileges",
               "--memory", "128m", *volumes]
    docker("run", "--rm", *options, "--entrypoint", "nginx", "nginx:stable-alpine", "-t")
    docker("run", "--detach", "--rm", "--name", EDGE_NAME, *options,
           "--entrypoint", "timeout", "nginx:stable-alpine", "3600", "nginx", "-g", "daemon off;")


if __name__ == "__main__":
    main()
