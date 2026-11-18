FROM python:3.12-slim-trixie AS base
WORKDIR /srv/dossier
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TZ=UTC
RUN groupadd -g 10001 dossier && useradd --no-log-init -u 10001 -g dossier dossier && install -d -o 10001 -g 10001 -m 0770 /run/dossier
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY core.py access.py api.py owner.py worker.py protection.py ./
USER 10001:10001
CMD ["python","-m","uvicorn","api:app","--host","0.0.0.0","--port","8000","--limit-concurrency","20","--no-access-log"]

FROM base AS validator
USER root
COPY requirements-validator.txt .
RUN pip install --no-cache-dir -r requirements-validator.txt
COPY scanner.py validator.py ./
USER 10001:10001
CMD ["python","-m","uvicorn","scanner:app","--uds","/run/dossier/validator.sock","--no-access-log"]
