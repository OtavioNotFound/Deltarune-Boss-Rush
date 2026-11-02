from pathlib import Path
import json,re,subprocess
p=Path('dist')
entry=Path('index.html').read_text(encoding='utf-8')
assert 'url=./dist/' in entry and (p/'index.html').is_file()
assert 'peerjs.min.js' in (p/'index.html').read_text(encoding='utf-8') and (p/'peerjs.LICENSE.txt').is_file()
assert json.loads(Path('package.json').read_text(encoding='utf-8'))['devDependencies']['peerjs']=='1.5.5'
for chapter in range(1,6):
 html=(p/f'chapter{chapter}'/'index.html').read_text(encoding='utf-8')
 assert 'native-battle.js?v=6' in html and 'game-layout.js?v=4' in html
 assert f'location.origin + "/chapter{chapter}/' not in html and f"location.origin+'/chapter{chapter}/" not in html
for file in p.rglob('*.html'):
 assert 'terminal.local' not in file.read_text(encoding='utf-8'), file
 for script in re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script>',file.read_text(encoding='utf-8')):
  if script.strip():subprocess.run(['node','--check'],input=script,text=True,check=True,capture_output=True)
presets=json.loads((p/'presets.json').read_text(encoding='utf-8'))
party=json.loads((p/'party-native.json').read_text(encoding='utf-8'))
assert party.get('version')==2 and all(chapter in (1,2,3) for chapter in party.get('chapters',[]))
for chapter in party['chapters']:
 assert (p/f'chapter{chapter}'/'coop.patch.gz').is_file()
assert len(presets)==11
for boss in presets:
 assert f"filech{boss['ch']}_0" in boss['files']
 assert all(len(t.splitlines())>=3000 for t in boss['files'].values())
 assert (p/f"chapter{boss['ch']}"/'runner.wasm').is_file()
 folder=p/f"chapter{boss['ch']}"
 if boss['ch']==5:
  manifest=json.loads((folder/'battle.patch.json').read_text(encoding='utf-8'))
  assert all((folder/name).is_file() and (folder/name).stat().st_size<25*1024*1024 for name in manifest['parts'])
 else:assert (folder/'battle.patch.gz').is_file()
 assert isinstance(boss['battle']['encounter'],int)
 assert boss['battle']['encounter']>=0
print('Checked JavaScript syntax, 11 checkpoints and chapter runtimes.')

for script in list(p.glob('chapter*/index.js')) + list(p.glob('*.js')):
 subprocess.run(['node','--check',str(script)],check=True,capture_output=True)
