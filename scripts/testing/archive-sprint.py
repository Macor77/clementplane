"""Archive source déterministe d'un commit, sans archives historiques ni secrets locaux."""
import pathlib
import subprocess
import sys
import zipfile

revision = sys.argv[1] if len(sys.argv) > 1 else 'HEAD'
target = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else '../Clementplane_v1.1.0_Sprint_Closure.zip')
commit = subprocess.check_output(['git', 'rev-parse', revision], text=True).strip()
paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', commit], text=True).splitlines()
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in paths:
        if name.lower().endswith('.zip') or pathlib.PurePosixPath(name).name.startswith('.env'):
            continue
        data = subprocess.check_output(['git', 'show', f'{commit}:{name}'])
        info = zipfile.ZipInfo('clementplane/' + name, (2026, 10, 6, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, data)
    archive.writestr('SOURCE_COMMIT.txt', commit + '\nClôture V1.1 (1.1.0), rectification de v0.21.1 : production livrée le 6 octobre 2026. Voir docs/sprints/v0.21.1/CLOSURE.md.\n')
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
print(str(target.resolve()))
