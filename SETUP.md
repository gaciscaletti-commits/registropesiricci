# Registro Pesi Ricci - setup su mini PC

## Requisiti
- Node.js (qualsiasi versione recente: `node -v` per verificare)
- Nient'altro: il server non ha dipendenze esterne, niente npm install.

## Installazione
```bash
git clone https://github.com/gaciscaletti-commits/registropesiricci.git
cd registropesiricci
node server.js
```
L'app è raggiungibile da qualsiasi dispositivo sulla stessa rete Wi-Fi/ethernet all'indirizzo `http://IP-DEL-MINI-PC:8080` (trovi l'IP con `hostname -I`).

## Come cambiano i dati
Con il server attivo le schede non sono più nel localStorage dei singoli browser: sono tutte in un unico file `dati.json` nella cartella dell'app, condiviso da tutti i dispositivi. Aprendo invece index.html come file (doppio click, senza server) l'app torna al vecchio comportamento localStorage, utile solo per prove.

## Avvio automatico al boot (systemd)
```bash
sudo nano /etc/systemd/system/registropesi.service
```
Contenuto (sostituisci utente e percorso):
```ini
[Unit]
Description=Registro Pesi Ricci
After=network.target

[Service]
User=tuoutente
WorkingDirectory=/home/tuoutente/registropesiricci
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```
Poi:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now registropesi
```

## Backup dei dati
Il backup è la copia di `dati.json`. Due modi:

Manuale:
```bash
./backup.sh /mnt/chiavetta-usb
```

Automatico ogni notte alle 3 (es. su USB montata in /mnt/backup):
```bash
crontab -e
```
e aggiungi:
```
0 3 * * * /home/tuoutente/registropesiricci/backup.sh /mnt/backup >> /home/tuoutente/registropesiricci/backup.log 2>&1
```
Ogni backup è un file `registro-pesi-AAAA-MM-GG_HHMM.json`; vengono conservati gli ultimi 30. Per ripristinare: copia il file scelto sopra l'app come `dati.json` e ricarica la pagina.

Per un backup fuori sede, monta il supporto su un cloud (rclone) oppure copia periodicamente la cartella `backups/` su un disco esterno.
