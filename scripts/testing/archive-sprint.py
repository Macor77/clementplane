"""Archive reproductible des sources d'un commit, sans secrets ni caches."""
import hashlib
import json
import pathlib
import subprocess
import sys
import zipfile

revision = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
commit = subprocess.check_output(['git', 'rev-parse', revision], text=True).strip()

def blob(name):
    return subprocess.check_output(['git', 'show', f'{commit}:{name}'])

version = json.loads(blob('package.json'))['version']
target = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else f'../Clementplane_v{version}_Sources.zip')
if target.exists():
    raise SystemExit('Refus de remplacer une archive existante.')
paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', commit], text=True).splitlines()
excluded_dirs = {'node_modules', 'dist', '.git', '.vercel', 'test-results', 'playwright-report', '__pycache__', '.cache'}
entries = {}
for name in paths:
    path = pathlib.PurePosixPath(name)
    if excluded_dirs.intersection(path.parts) or path.suffix.lower() in {'.zip', '.tar', '.gz', '.7z', '.log', '.pem', '.key', '.p12', '.pfx'}:
        continue
    if path.name.startswith('.env') and path.name not in {'.env.example', '.env.sample', '.env.template'}:
        continue
    entries['clementplane/' + name] = blob(name)
entries['SOURCE_COMMIT.txt'] = f'{commit}\nClementplane {version}\nArchive des sources ; état du sprint : docs/sprints/v{version}/CLOSURE.md\n'.encode()
manifest = '\n'.join(f'{hashlib.sha256(data).hexdigest()}  {name}' for name, data in sorted(entries.items())) + '\n'
entries['MANIFEST.sha256'] = manifest.encode()
with zipfile.ZipFile(target, 'w') as archive:
    for name, data in sorted(entries.items()):
        info = zipfile.ZipInfo(name, (2026, 10, 15, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, data)
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert archive.read('SOURCE_COMMIT.txt').decode().splitlines()[0] == commit
    assert json.loads(archive.read('clementplane/package.json'))['version'] == version
    for line in archive.read('MANIFEST.sha256').decode().splitlines():
        digest, name = line.split('  ', 1)
        assert hashlib.sha256(archive.read(name)).hexdigest() == digest
checksum = hashlib.sha256(target.read_bytes()).hexdigest()
target.with_suffix(target.suffix + '.sha256').write_text(f'{checksum}  {target.name}\n')
print(f'{target.resolve()}\nSHA-256 {checksum}\n{len(entries)} fichiers ; intégrité vérifiée')
