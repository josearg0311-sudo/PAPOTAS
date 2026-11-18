"""Lista (en grupos de 20) las sesiones de ElevenLabs lanzadas para un mapa cuyo resultado aún no está en los registros."""
import glob, json, re, sys
mapa = json.load(open(sys.argv[1]))
nodos = set()
for v in mapa.values():
    nodos |= {v.get('clip_img'), v.get('clip'), v.get('voz')} | {c[k] for c in v.get('capas', []) for k in ('fondo', 'pj', 'recorte')}
LOGS = glob.glob('/root/.claude/projects/-home-user-PAPOTAS/*.jsonl') + glob.glob('/root/.claude/projects/-home-user-PAPOTAS/*/tool-results/*.txt')
pat_run = re.compile(r'\\?"node_id\\?":\\?"([A-Za-z0-9]{20})\\?",\\?"session_id\\?":\\?"([A-Za-z0-9]{20})\\?"')
pat_url = re.compile(r'content_generation/([A-Za-z0-9]{20})/[A-Za-z0-9]{20}/content\.')
n2s, hechos = {}, set()
for f in LOGS:
    t = open(f, encoding='utf-8', errors='ignore').read()
    for n, s in pat_run.findall(t):
        if n in nodos: n2s[n] = s
    hechos |= set(pat_url.findall(t))
pend = [s for s in n2s.values() if s not in hechos]
print(len(pend), 'pendientes')
for i in range(0, len(pend), 20): print(json.dumps(pend[i:i + 20]))
