cd "$(dirname "$0")/.."
while pgrep -f "cola_largos.sh" >/dev/null; do sleep 30; done
python3 herramientas/recopilatorio.py S10 S07 S08 S11 S06 S09 S01 --vertical --id=L01; echo "fin RL01 $?"
python3 herramientas/recopilatorio.py S16 S13 S15 S12 S18 S14 S17 --vertical --id=L02; echo "fin RL02 $?"
python3 herramientas/recopilatorio.py S22 S25 S20 S23 S24 S21 S32 --vertical --id=L03; echo "fin RL03 $?"
