# Espera a que acaben los Shorts y monta: L01 (rehecho), L02, L03
cd "$(dirname "$0")/.."
while pgrep -f "fabricar" >/dev/null; do sleep 30; done
for l in L01 L02 L03; do echo "== $l $(date +%T)"; python3 herramientas/largo.py Largos/$l.json > "En proceso/log_$l.txt" 2>&1; echo "fin $l $?"; done
