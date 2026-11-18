#!/bin/bash
# Uso: bash "En proceso/fabricar_lote.sh" S12 S13 ...
cd "$(dirname "$0")/.."
for id in "$@"; do
  g=$(ls Guiones/${id}_*.md | head -1)
  echo "== $id $(date +%T)"
  python3 herramientas/fabricar.py "$g" > "En proceso/log_fab_$id.txt" 2>&1 && \
  python3 herramientas/tiktok.py "$id" >> "En proceso/log_fab_$id.txt" 2>&1
  echo "fin $id $?"
done
