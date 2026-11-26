"""Qualify the existing Clementplane antivirus using a disposable, offline PostgreSQL fixture."""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Event, Thread
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[3]
TESTS = "services/dossier/tests/acceptance.py"
PROJECT = "clementplane-antivirus"
CRITICAL = 90


def docker(*args, timeout=30):
    return subprocess.check_output(["docker", *args], text=True, timeout=timeout).strip()


def service(name):
    ids = docker("ps", "-q", "--filter", "label=com.docker.compose.project=" + PROJECT,
                 "--filter", "label=com.docker.compose.service=" + name).splitlines()
    if len(ids) != 1:
        raise RuntimeError(f"Service {name} indisponible ou ambigu ({len(ids)} conteneurs).")
    return json.loads(docker("inspect", ids[0]))[0]


def memory():
    data = {line.split(":")[0]: int(line.split()[1]) for line in Path("/proc/meminfo").read_text().splitlines()}
    return data["MemTotal"], data["MemAvailable"], data["SwapTotal"] - data["SwapFree"]


def oom_kills(container):
    pid = container["State"]["Pid"]
    for line in Path(f"/proc/{pid}/cgroup").read_text().splitlines():
        if line.startswith("0::"):
            group = Path("/sys/fs/cgroup") / line[3:].lstrip("/")
            return int(dict(row.split() for row in (group / "memory.events").read_text().splitlines())["oom_kill"])
    raise RuntimeError("Compteur OOM cgroup v2 indisponible.")


def log_times(container, since):
    output = subprocess.run(["docker", "logs", "--timestamps", "--since", since, container],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                            timeout=10, check=True).stdout
    start = finish = None
    for line in output.splitlines():
        stamp, _, message = line.partition(" ")
        if "Reading databases from" in message and start is None:
            start = datetime.fromisoformat(stamp.replace("Z", "+00:00")).timestamp()
        if start is not None and "Database correctly reloaded" in message:
            finish = datetime.fromisoformat(stamp.replace("Z", "+00:00")).timestamp()
            break
    return start, finish


def wait_until(check, seconds, message):
    until = time.monotonic() + seconds
    while time.monotonic() < until:
        value = check()
        if value:
            return value
        time.sleep(0.25)
    raise RuntimeError(message)


def qualify(work):
    validator, clam = service("validator"), service("clamd")
    sockets = next((m for m in validator["Mounts"] if m["Destination"] == "/run/dossier" and m["Type"] == "volume"), None)
    if not sockets or not any(m.get("Name") == sockets["Name"] for m in clam["Mounts"]):
        raise RuntimeError("Le validateur et ClamAV ne partagent pas le volume de sockets attendu.")
    clamd_socket = Path(sockets["Source"]) / "clamd.sock"
    if not clamd_socket.is_socket() or not (clamd_socket.parent / "validator.sock").is_socket():
        raise RuntimeError("Les deux sockets du service doivent être disponibles.")
    initial = memory()
    print(f"Mémoire initiale disponible : {initial[1]//1024} Mio sur {initial[0]//1024} Mio.", flush=True)
    if initial[1] < 2 * 1024**2 or shutil.disk_usage(work).free < 768 * 1024**2:
        raise RuntimeError("Marge insuffisante pour démarrer la recette temporaire.")
    prior = [(item["Id"], item["RestartCount"], oom_kills(item)) for item in (validator, clam)]
    wheels, control = work / "wheels", work / "control"
    for path in (wheels, control):
        path.mkdir()
        os.chown(path, 10001, 10001)
    # Download only fixture dependencies. This container has no scanner socket or application files.
    docker("run", "--rm", "--read-only", "--tmpfs", "/tmp", "--user", "10001:10001",
           "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "-v", f"{wheels}:/wheels",
           validator["Image"], "python", "-m", "pip", "--isolated", "download", "--no-cache-dir",
           "--only-binary=:all:", "--index-url", "https://pypi.org/simple", "--dest", "/wheels",
           "pgserver==0.1.4", timeout=180)
    name = "cp-qualification-" + uuid4().hex[:12]
    # Each invocation uses a private PG cluster, ephemeral keys and a disabled mail transport.
    run_cases = (
        'set -eu; export PYTHONPATH=/tmp/pgtool; '
        'python -m pip --isolated install --no-index --no-cache-dir --find-links=/wheels '
        '--target /tmp/pgtool pgserver==0.1.4 >/dev/null; '
        f'python /checkout/{TESTS} DossierTest.test_local_backup_restore_and_delete; '
        'echo "Restauration vérifiée : PDF identique avec la clé témoin et accès révoqué toujours refusé."; '
        f'exec python /checkout/{TESTS} DossierTest.test_two_large_documents_survive_parallel_uploads'
    )
    job = subprocess.Popen(
        ["docker", "run", "--rm", "--name", name, "--network", "none", "--read-only",
         "--user", "10001:10001", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
         "--memory", "1g", "--memory-swap", "1g", "--tmpfs", "/tmp:rw,exec,nosuid,nodev,size=650m,mode=1777",
         "-v", f"{ROOT}:/checkout:ro", "-v", f"{wheels}:/wheels:ro", "-v", f"{control}:/control",
         "-v", sockets["Name"] + ":/run/dossier:ro", "-e", "HOME=/tmp", "-e", "DOSSIER_REAL_SCANNER=1",
         "-e", "DOSSIER_SCANNER_SOCKET=/run/dossier/validator.sock", "-e", "DOSSIER_VPS_PROBE_DIR=/control",
         validator["Image"], "sh", "-c", run_cases],
        stdin=subprocess.DEVNULL,
    )
    stop = Event()
    samples = []

    def sample():
        while not stop.is_set():
            samples.append((time.time(), *memory()))
            stop.wait(0.2)

    meter = Thread(target=sample, daemon=True)

    def ready():
        if job.poll() is not None:
            raise RuntimeError("La recette s’est arrêtée avant les dépôts. Voir le résultat PostgreSQL ci-dessus.")
        return (control / "ready").exists()

    try:
        wait_until(ready, 180, "Initialisation de la recette trop longue.")
        meter.start()
        if memory()[1] < 2 * 1024**2:
            raise RuntimeError("La marge mémoire disponible avant le rechargement est inférieure à 2 Gio.")
        since = datetime.now(timezone.utc).isoformat()
        with socket.socket(socket.AF_UNIX) as sock:
            sock.settimeout(5)
            sock.connect(str(clamd_socket))
            sock.sendall(b"zRELOAD\0")
            answer = bytearray()
            while not answer.endswith(b"\0") and len(answer) < 128:
                chunk = sock.recv(128)
                if not chunk:
                    break
                answer.extend(chunk)
            if bytes(answer).rstrip(b"\0\n") != b"RELOADING":
                raise RuntimeError("ClamAV n’a pas accepté le rechargement.")
        print("Rechargement demandé. Mesure de la mémoire du VPS en cours.", flush=True)
        start = wait_until(lambda: log_times(clam["Id"], since)[0], 40, "Début de rechargement non confirmé.")
        (control / "go").touch()
        finish = wait_until(lambda: log_times(clam["Id"], since)[1], 180, "Fin de rechargement non confirmée.")
        (control / "reloaded").touch()
        if job.wait(timeout=90) != 0:
            raise RuntimeError("Les deux dépôts ou la vérification de leurs contenus ont échoué.")
        samples.append((time.time(), *memory()))
        evidence = json.loads((control / "uploads.json").read_text())
        intervals = evidence["intervals"]
        overlap = min(finish, *(b for _, b in intervals)) - max(start, *(a for a, _ in intervals))
        peak = max(100 * (total - available) / total for _, total, available, _ in samples)
        remaining = min(available for _, _, available, _ in samples) // 1024
        swap_growth = max(0, max(s[3] for s in samples) - samples[0][3]) // 1024
        print(f"Deux PDF de {evidence['bytes']} octets téléchargés à l’identique. "
              f"Chevauchement avec le rechargement : {max(0, overlap):.2f} s.")
        print(f"Pic RAM échantillonné : {peak:.1f} %. Minimum disponible : {remaining} Mio. "
              f"Hausse maximale de la swap : {swap_growth} Mio. Rechargement : {finish-start:.1f} s.")
        if overlap <= 0:
            raise RuntimeError("Les deux dépôts et le rechargement ne se sont pas recouverts de façon vérifiable.")
        if not any(start <= s[0] <= finish for s in samples):
            raise RuntimeError("Aucune mesure de mémoire dans la fenêtre du rechargement.")
        after = [service("validator"), service("clamd")]
        if prior != [(item["Id"], item["RestartCount"], oom_kills(item)) for item in after]:
            raise RuntimeError("Arrêt mémoire, redémarrage ou changement de conteneur observé.")
        if peak >= CRITICAL:
            raise RuntimeError("Le seuil critique de 90 % de mémoire utilisée a été atteint.")
        print("VALIDÉ SUR LE VPS — restauration, deux dépôts pendant le rechargement et marge mémoire.")
    finally:
        stop.set()
        if meter.is_alive():
            meter.join()
        if job.poll() is None:
            # Remove only the uniquely named fixture created by this invocation.
            subprocess.run(["docker", "rm", "-f", name], stdout=subprocess.DEVNULL, check=False)
            job.wait(timeout=20)


if __name__ == "__main__":
    if socket.gethostname().split(".")[0] != "vps-103849" or os.geteuid() != 0:
        sys.exit("À exécuter sur le VPS vps-103849, depuis la session SSH de Vincent.")
    try:
        with tempfile.TemporaryDirectory(prefix="cp-qualification-") as tmp:
            qualify(Path(tmp))
    except (OSError, RuntimeError, subprocess.SubprocessError, ValueError) as exc:
        sys.exit(f"CONTRÔLE INCOMPLET — {exc}")
