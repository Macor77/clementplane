"""Private Unix socket service. No DB, Auth, Brevo or application credentials here."""

import asyncio
import os
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, Response

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
slots = asyncio.Semaphore(2)
MAX = 5 << 20


async def clamd(command, data=b""):
    path = os.getenv("CLAMD_SOCKET")
    if path:
        reader, writer = await asyncio.open_unix_connection(path)
    else:
        reader, writer = await asyncio.open_connection("127.0.0.1", 3310)
    try:
        writer.write(b"z" + command + b"\0")
        if command == b"INSTREAM":
            for offset in range(0, len(data), 65536):
                chunk = data[offset : offset + 65536]
                writer.write(struct.pack("!I", len(chunk)) + chunk)
                await writer.drain()
            writer.write(bytes(4))
        await writer.drain()
        return (await reader.readuntil(b"\0"))[:-1]
    finally:
        writer.close()
        await writer.wait_closed()


@app.post("/validate")
async def scan(req: Request, page: int = 0):
    if not 0 <= page <= 100:
        raise HTTPException(422)
    if slots.locked():
        raise HTTPException(503)
    async with slots:
        data = bytearray()
        async for chunk in req.stream():
            if len(chunk) + len(data) > MAX:
                raise HTTPException(413)
            data.extend(chunk)
        try:
            version = await asyncio.wait_for(clamd(b"VERSION"), 3)
            stamp = datetime.strptime(
                version.decode("ascii").split("/")[-1].strip(), "%a %b %d %H:%M:%S %Y"
            ).replace(tzinfo=timezone.utc)
            if (
                not 0
                <= (datetime.now(timezone.utc) - stamp).total_seconds()
                <= 48 * 3600
            ):
                raise ValueError()
            verdict = await asyncio.wait_for(clamd(b"INSTREAM", data), 15)
            if verdict.endswith(b" FOUND"):
                raise HTTPException(422)
            if verdict != b"stream: OK":
                raise ValueError()
            proc = await asyncio.create_subprocess_exec(
                sys.executable,
                "-I",
                str(Path(__file__).with_name("validator.py")),
                *([str(page)] if page else []),
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
                env={},
            )
            try:
                result, _ = await asyncio.wait_for(proc.communicate(data), 12)
            finally:
                if proc.returncode is None:
                    proc.kill()
                    await proc.wait()
            if proc.returncode:
                raise HTTPException(422)
            mime, content = result.split(b"\n", 1)
            return Response(
                content,
                media_type=mime.decode("ascii"),
                headers={"Cache-Control": "no-store"},
            )
        except (
            OSError,
            ValueError,
            IndexError,
            asyncio.TimeoutError,
            asyncio.IncompleteReadError,
        ):
            raise HTTPException(503) from None
