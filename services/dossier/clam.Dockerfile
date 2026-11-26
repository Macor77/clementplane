FROM debian:trixie-slim
RUN apt-get update && apt-get install --no-install-recommends -y clamav-daemon clamav-freshclam ca-certificates && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/dossier && chown -R 10001:10001 /run/dossier /var/lib/clamav
COPY clamd.conf /etc/clamav/clamd.conf
COPY freshclam.conf /etc/clamav/freshclam.conf
USER 10001:10001
CMD ["clamd","--foreground=true","--config-file=/etc/clamav/clamd.conf"]
