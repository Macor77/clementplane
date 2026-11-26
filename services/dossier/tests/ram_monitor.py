"""Recette Monit isolée. Dépendances de test : monit et aiosmtpd."""
import os
import queue
import socket
import subprocess
import tempfile
from email import message_from_bytes
from pathlib import Path

from aiosmtpd.controller import Controller

SOURCE = Path(__file__).resolve().parents[1] / "monitoring"
MONIT = os.environ.get("MONIT", "monit")


class Mailbox:
    def __init__(self):
        self.messages = queue.Queue()

    async def handle_DATA(self, server, session, envelope):
        assert envelope.rcpt_tos == ["recette@example.invalid"]
        assert envelope.mail_from == "contact@clementplane.fr"
        self.messages.put(message_from_bytes(envelope.content).get_payload(decode=True).decode())
        return "250 Accepted"

    def expect(self, fragment, timeout=12):
        message = self.messages.get(timeout=timeout)
        assert fragment in message, message

    def expect_quiet(self, timeout):
        try:
            duplicate = self.messages.get(timeout=timeout)
        except queue.Empty:
            return
        raise AssertionError(duplicate)


def run(directory, port, mailbox):
    config = directory / "monitrc"
    fixture = directory / "sample"
    fixture.write_bytes(b"")
    template = (SOURCE / "monitrc").read_text()
    template = template.replace("/var/lib/monit", str(directory))
    template = template.replace("set log syslog", f'set pidfile {directory}/pid\nset log {directory}/log')
    template = template.replace("set daemon 60", "set daemon 1")
    template = template.replace("/etc/monit/clementplane/mail.conf", str(directory / "mail.conf"))
    config.write_text(template)
    config.chmod(0o600)

    # Valider aussi la syntaxe du vrai relais TLS, sans s'y connecter.
    mail_config = directory / "mail.conf"
    mail_config.write_text((SOURCE / "mail.conf.example").read_text())
    mail_config.chmod(0o600)
    args = [MONIT, "-c", str(config)]
    subprocess.run(args + ["-t"], check=True)
    mail_config.write_text(f"set mailserver 127.0.0.1 port {port}\n"
                           "set alert recette@example.invalid only on { resource, size }\n")
    # Mesure réelle de l'hôte de test. Toutes les destinations restent locales.
    config.write_text(template.replace("set daemon 1", "").replace("70%", "100%").replace("90%", "100%"))
    sample = subprocess.run(args + ["-v"], check=True, capture_output=True, text=True)
    assert "current mem usage" in sample.stdout + sample.stderr

    # Rejouer les seuils exacts sur un compteur en octets, sans saturer la machine.
    assert "check system clementplane-recette" in template
    simulation = template.replace("check system clementplane-recette", f"check file ram-fixture with path {fixture}")
    config.write_text(simulation.replace("memory usage", "size").replace("%", " B"))
    process = subprocess.Popen(args + ["-I"])
    try:
        fixture.write_bytes(bytes(70))
        mailbox.expect_quiet(3)
        mailbox.expect("70 B")
        fixture.write_bytes(bytes(90))
        mailbox.expect("90 B")
        mailbox.expect_quiet(5)
        fixture.write_bytes(bytes(80))
        mailbox.expect("succeeded [current size = 80 B]")
        fixture.write_bytes(bytes(60))
        mailbox.expect("succeeded [current size = 60 B]")
        mailbox.expect_quiet(3)
    finally:
        process.terminate()
        process.wait(timeout=12)


if __name__ == "__main__":
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
    mailbox = Mailbox()
    sink = Controller(mailbox, hostname="127.0.0.1", port=port)
    sink.start()
    try:
        with tempfile.TemporaryDirectory() as temp:
            run(Path(temp), port, mailbox)
    finally:
        sink.stop()
    print("OK · configuration TLS, mesure hôte, préalerte, urgence, stabilité et deux rétablissements")
