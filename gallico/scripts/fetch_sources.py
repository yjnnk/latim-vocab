"""Download the version-pinned LASLA sources with curl (no Python dependencies)."""
import json,subprocess,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'data/sources.json').read_text())
for entry in manifest['files']:
 p=ROOT/entry['path']; p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=entry['sha256']:
  subprocess.run(['curl','--fail','--location','--silent','--show-error',entry['url'],'--output',str(p)],check=True)
 if hashlib.sha256(p.read_bytes()).hexdigest()!=entry['sha256']:raise SystemExit(f'Hash incorreto: {p}')
 print(f'OK: livro {entry["book"]}')
