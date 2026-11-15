// Server Registro Pesi Ricci - nessuna dipendenza esterna, richiede solo Node.js
// Avvio: node server.js   (oppure PORT=8080 node server.js)
// Servisce l'app in LAN (0.0.0.0) e salva tutte le schede in dati.json.
// Il backup dei dati è la copia di dati.json (vedi backup.sh e SETUP.md).

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'dati.json');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

function readData() {
    try {
        return fs.readFileSync(DATA_FILE, 'utf8');
    } catch (e) {
        return JSON.stringify({ cards: [], archive: [] });
    }
}

function sendJSON(res, status, obj) {
    const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
}

const server = http.createServer((req, res) => {
    const url = req.url.split('?')[0];

    // API: lettura di tutte le schede
    if (url === '/api/data' && req.method === 'GET') {
        sendJSON(res, 200, readData());
        return;
    }

    // API: salvataggio di tutte le schede (scrittura atomica: prima .tmp poi rename)
    if (url === '/api/data' && (req.method === 'PUT' || req.method === 'POST')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (!Array.isArray(data.cards) || !Array.isArray(data.archive)) {
                    throw new Error('formato non valido');
                }
                const tmp = DATA_FILE + '.tmp';
                fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
                fs.renameSync(tmp, DATA_FILE);
                sendJSON(res, 200, { ok: true });
            } catch (e) {
                sendJSON(res, 400, { ok: false, error: 'Dati non validi' });
            }
        });
        return;
    }

    // File statici dell'app
    let filePath = url === '/' ? '/index.html' : url;
    filePath = path.normalize(filePath).replace(/^([.][.][/\\])+/, '');
    const full = path.join(ROOT, filePath);
    if (!full.startsWith(ROOT)) {
        res.writeHead(403); res.end(); return;
    }
    // dati.json non è servito come file statico
    if (path.basename(full) === 'dati.json') {
        res.writeHead(404); res.end(); return;
    }
    fs.readFile(full, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('File non trovato');
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
        res.end(content);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('Registro Pesi Ricci in ascolto su http://0.0.0.0:' + PORT);
    console.log('Dati salvati in: ' + DATA_FILE);
});
