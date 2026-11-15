#!/bin/bash
# Backup del registro: copia dati.json con data nel nome e tiene gli ultimi 30 backup.
# Uso manuale:  ./backup.sh /percorso/destinazione   (default: cartella backups/ accanto all'app)
# Uso automatico: riga crontab (vedi SETUP.md)

DEST="${1:-$(dirname "$0")/backups}"
SRC="$(dirname "$0")/dati.json"
STAMP=$(date +%F_%H%M)

mkdir -p "$DEST"
cp "$SRC" "$DEST/registro-pesi-$STAMP.json" || { echo "Backup fallito: $SRC non trovato"; exit 1; }
echo "Backup creato: $DEST/registro-pesi-$STAMP.json"

# Elimina i backup più vecchi, tenendo gli ultimi 30
ls -1t "$DEST"/registro-pesi-*.json 2>/dev/null | tail -n +31 | xargs -r rm -f
