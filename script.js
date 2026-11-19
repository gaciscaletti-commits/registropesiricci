// Dati delle schede e archivio
let cards = [];
let archive = [];

// Elementi DOM
const cardsContainer = document.getElementById('cardsContainer');
const addCardButton = document.getElementById('addCardButton');
const removeCardButton = document.getElementById('removeCardButton');
const archiveButton = document.getElementById('archiveButton');
const addCardModal = document.getElementById('addCardModal');
const weightModal = document.getElementById('weightModal');
const actionModal = document.getElementById('actionModal');
const archiveModal = document.getElementById('archiveModal');

// Elementi modale nuova card
const cardNumberInput = document.getElementById('cardNumber');
const confirmCardBtn = document.getElementById('confirmCardBtn');
const cancelCardBtn = document.getElementById('cancelCardBtn');

// Elementi modale azione
const actionModalTitle = document.getElementById('actionModalTitle');
const actionOptions = document.getElementById('actionOptions');
const movedBtn = document.getElementById('movedBtn');
const moveSelector = document.getElementById('moveSelector');
const moveOptions = document.getElementById('moveOptions');
const idSelectorText = document.getElementById('idSelectorText');
const confirmActionBtn = document.getElementById('confirmActionBtn');
const cancelActionBtn = document.getElementById('cancelActionBtn');
const deleteBtn = document.getElementById('deleteBtn');

// Elementi modale archivio
const archiveFilter = document.getElementById('archiveFilter');
const archiveList = document.getElementById('archiveList');
const closeArchiveBtn = document.getElementById('closeArchiveBtn');

// Elementi modale pesi
const currentCardTitle = document.getElementById('modalCardTitle');
const cardNumbersDisplay = document.getElementById('cardNumbersDisplay');
const weightsTable = document.getElementById('weightsTable');
const weightsTableHead = document.getElementById('weightsTableHead');
const weightsTableBody = document.getElementById('weightsTableBody');
const emptyWeightsMsg = document.getElementById('emptyWeightsMsg');
const weightDateInput = document.getElementById('weightDate');
const weightInputsContainer = document.getElementById('weightInputsContainer');
const quickWeightsGroup = document.getElementById('quickWeightsGroup');
const quickWeightsInput = document.getElementById('quickWeightsInput');
const assignmentPreview = document.getElementById('assignmentPreview');
const stomachFullCheck = document.getElementById('stomachFullCheck');
const addWeightBtn = document.getElementById('addWeightBtn');
const cancelWeightBtn = document.getElementById('cancelWeightBtn');

// Variabile per il drag & drop e azione scheda
let draggedCard = null;
let currentActionCardId = null;
let selectedMoveId = null;
let currentFilter = 'all';
let lastClickedCardId = null;

// --- Persistenza dei dati ---
// Con il server attivo (mini PC) i dati stanno in dati.json sul server: una sola copia
// condivisa da tutti i dispositivi in LAN, e il backup è la copia di quel file.
// Se l'app viene aperta come file locale (senza server) usa il localStorage del browser.
const API_URL = '/api/data';

// Vero solo se all'avvio è stato trovato un server con l'API /api/data.
// Una pagina su hosting statico (es. GitHub Pages) NON è in modalità server:
// i dati restano nel localStorage del browser.
let useServer = false;

function serverMode() {
    return location.protocol === 'http:' || location.protocol === 'https:';
}

// Carica i dati: prova il server solo se l'API risponde davvero con JSON,
// altrimenti (file locale, GitHub Pages, hosting statico) usa il localStorage
async function loadData() {
    useServer = false;
    
    if (serverMode()) {
        try {
            const res = await fetch(API_URL);
            const contentType = res.headers.get('content-type') || '';
            if (res.ok && contentType.includes('application/json')) {
                const data = await res.json();
                cards = Array.isArray(data.cards) ? data.cards : [];
                archive = Array.isArray(data.archive) ? data.archive : [];
                useServer = true;
                return;
            }
        } catch (err) {
            // Nessun server raggiungibile: si prosegue in modalità locale
            console.warn('Server non disponibile, uso il localStorage:', err);
        }
    }
    
    const savedCards = localStorage.getItem('animalCards');
    const savedArchive = localStorage.getItem('animalArchive');
    if (savedCards) {
        cards = JSON.parse(savedCards);
    }
    if (savedArchive) {
        archive = JSON.parse(savedArchive);
    }
}

// Salva i dati sul server (solo se attivo) o, in assenza, nel localStorage
function saveData() {
    if (useServer) {
        fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cards, archive })
        }).catch(err => {
            console.error('Salvataggio sul server fallito:', err);
            alert('Salvataggio sul server fallito. Verifica che il server sia attivo, altrimenti la modifica andrà persa.');
        });
    } else {
        localStorage.setItem('animalCards', JSON.stringify(cards));
        localStorage.setItem('animalArchive', JSON.stringify(archive));
    }
}

// Crea una nuova card
function createCard(number) {
    const newCard = {
        id: Date.now().toString(),
        numbers: [number],
        weights: []
    };
    cards.push(newCard);
    saveData();
    renderCards();
    closeAddCardModal();
}

// Unisce due card in una singola
function mergeCards(card1Id, card2Id) {
    const card1Index = cards.findIndex(c => c.id === card1Id);
    const card2Index = cards.findIndex(c => c.id === card2Id);
    
    if (card1Index === -1 || card2Index === -1) return;
    
    const card1 = cards[card1Index];
    const card2 = cards[card2Index];
    
    // Unisce i numeri
    const mergedNumbers = [...new Set([...card1.numbers, ...card2.numbers])];
    
    // Unisce i pesi
    const mergedWeights = [];
    const allDates = new Set([...card1.weights.map(w => w.date), ...card2.weights.map(w => w.date)]);
    
    allDates.forEach(date => {
        const weight1 = card1.weights.find(w => w.date === date);
        const weight2 = card2.weights.find(w => w.date === date);
        
        const values = [];
        mergedNumbers.forEach(num => {
            if (card1.numbers.includes(num) && weight1) {
                const numIndex = card1.numbers.indexOf(num);
                values.push(weight1.values[numIndex] || null);
            } else if (card2.numbers.includes(num) && weight2) {
                const numIndex = card2.numbers.indexOf(num);
                values.push(weight2.values[numIndex] || null);
            } else {
                values.push(null);
            }
        });
        
        mergedWeights.push({ date, values });
    });
    
    // Crea la nuova card unita
    const mergedCard = {
        id: card1.id,
        numbers: mergedNumbers,
        weights: mergedWeights
    };
    
    // Conserva il nome della prima scheda, se presente
    if (card1.name) {
        mergedCard.name = card1.name;
    }
    
    // Rimuove le due card originali e aggiunge quella unita
    cards.splice(card1Index, 1);
    if (card2Index > card1Index) {
        cards.splice(card2Index - 1, 1);
    } else {
        cards.splice(card2Index, 1);
    }
    cards.push(mergedCard);
    
    saveData();
    renderCards();
}

// Calcola il trend del peso di una scheda confrontando le due registrazioni più recenti.
// Solo per schede con un singolo ID: per più ID la media non sarebbe significativa.
function getCardTrend(card) {
    if (!card.weights || card.weights.length < 2) return null;
    if (card.numbers.length > 1) return null;
    
    // Le pesate a stomaco pieno non contano per il trend
    const sorted = card.weights.filter(w => !w.full).sort((a, b) => new Date(a.date) - new Date(b.date));
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    
    const avg = (rec) => {
        const valid = rec.values.filter(v => v !== null && v !== undefined);
        return valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
    };
    
    const lastAvg = avg(last);
    const prevAvg = avg(prev);
    
    if (lastAvg === null || prevAvg === null || prevAvg === 0) return null;
    
    const pct = ((lastAvg - prevAvg) / prevAvg) * 100;
    
    return {
        pct,
        emoji: pct > 0 ? '📈' : (pct < 0 ? '📉' : '➖'),
        cls: pct > 0 ? 'up' : (pct < 0 ? 'down' : 'flat'),
        formatted: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
    };
}

// Calcola il trend del peso di un singolo ID (schede multi-ID):
// confronta gli ultimi due pesi non nulli di quell'ID (in ordine di data)
function getIdTrend(card, idx) {
    if (card.numbers.length <= 1) return null;
    
    // Le pesate a stomaco pieno non contano per il trend
    const sorted = card.weights.filter(w => !w.full).sort((a, b) => new Date(a.date) - new Date(b.date));
    const vals = sorted.map(rec => rec.values[idx]).filter(v => v !== null && v !== undefined);
    
    if (vals.length < 2) return null;
    
    const last = vals[vals.length - 1];
    const prev = vals[vals.length - 2];
    
    if (prev === 0) return null;
    
    const pct = ((last - prev) / prev) * 100;
    
    return {
        pct,
        emoji: pct > 0 ? '📈' : (pct < 0 ? '📉' : '➖'),
        cls: pct > 0 ? 'up' : (pct < 0 ? 'down' : 'flat'),
        formatted: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`
    };
}

// Escapes HTML per i nomi inseriti dall'utente
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// --- Alert anomali peso ---
// Ricalcolati a ogni aggiornamento delle schede: nelle schede multi-ID,
// per ogni scheda va in alert al massimo UNO ID: quello più "outlier",
// cioè quello che, se rimosso, lascerebbe la distribuzione dei pesi più
// omogenea (quello più lontano dalla media dei pesi degli altri ID).
// L'alert scatta solo se quello scostamento supera il 20% (in più o in meno)
// ed è di almeno 20 g in assoluto.

const alertButton = document.getElementById('alertButton');
const alertBadge = document.getElementById('alertBadge');
const alertsModal = document.getElementById('alertsModal');
const alertsList = document.getElementById('alertsList');
const closeAlertsBtn = document.getElementById('closeAlertsBtn');

const ALERT_THRESHOLD = 0.20; // 20%
const ALERT_MIN_GRAMS = 20;   // oltre il 20%, serve anche uno scostamento assoluto di almeno 20 g

let alerts = [];

function computeAlerts() {
    alerts = [];
    
    cards.forEach(card => {
        // Solo schede con più di un ID
        if (!card.numbers || card.numbers.length <= 1) return;
        
        // Ultimi pesi noti di ogni ID (null = mai pesato)
        const lastWeights = getLastWeights(card);
        
        // Per ogni ID pesato: scostamento dalla media dei pesi degli ALTRI ID.
        // Più lo scostamento è grande, più la distribuzione diventerebbe
        // omogenea rimuovendo quell'ID.
        const entries = [];
        
        card.numbers.forEach((num, i) => {
            const w = lastWeights[i];
            if (w === null || w === undefined) return;
            
            const others = lastWeights.filter((v, j) => j !== i && v !== null && v !== undefined);
            if (others.length === 0) return;
            
            const avgOthers = others.reduce((s, v) => s + v, 0) / others.length;
            if (avgOthers === 0) return;
            
            const dev = (w - avgOthers) / avgOthers;
            const diffGrams = Math.abs(w - avgOthers);
            entries.push({ num, weight: w, avgOthers: Math.round(avgOthers), dev: dev, score: Math.abs(dev), diffGrams: diffGrams });
        });
        
        if (entries.length === 0) return;
        
        // Solo l'ID più outlier della scheda può andare in alert.
        // L'alert scatta solo se supera il 20% E lo scostamento assoluto
        // è di almeno 20 g (con pesi bassi, poche decine di grammi oltre
        // la media non sono un'anomalia reale).
        const worst = entries.reduce((a, b) => (b.score > a.score ? b : a));
        
        if (worst.score > ALERT_THRESHOLD && worst.diffGrams >= ALERT_MIN_GRAMS) {
            alerts.push({
                cardId: card.id,
                number: worst.num,
                weight: worst.weight,
                avgOthers: worst.avgOthers,
                dev: worst.dev
            });
        }
    });
    
    // Badge di notifica sul pulsante
    if (alerts.length > 0) {
        alertBadge.textContent = alerts.length;
        alertBadge.style.display = 'flex';
    } else {
        alertBadge.style.display = 'none';
    }
}

// Apre l'elenco degli alert
function openAlertsModal() {
    if (alerts.length === 0) {
        alertsList.innerHTML = '<p class="empty-archive">Nessun alert: nessun ID si scosta più del 20% e di almeno 20 g dalla media degli altri.</p>';
    } else {
        alertsList.innerHTML = alerts.map(a => {
            const card = cards.find(c => c.id === a.cardId);
            const cardLabel = card
                ? (card.name ? escapeHtml(card.name) + ' (' + card.numbers.join(', ') + ')' : card.numbers.join(', '))
                : '';
            const pct = (a.dev > 0 ? '+' : '') + (a.dev * 100).toFixed(1) + '%';
            const cls = a.dev > 0 ? 'up' : 'down';
            return `
                <div class="alert-item" data-card-id="${a.cardId}">
                    <div class="alert-item-header">
                        <span class="alert-item-id">ID ${a.number}</span>
                        <span class="card-trend ${cls}">${a.dev > 0 ? '📈' : '📉'} ${pct}</span>
                    </div>
                    <div class="alert-item-info">Scheda: ${cardLabel}</div>
                    <div class="alert-item-info">Peso: ${a.weight} g · Media altri ID: ${a.avgOthers} g</div>
                </div>
            `;
        }).join('');
        
        // Click su un alert: apri la scheda corrispondente
        alertsList.querySelectorAll('.alert-item').forEach(item => {
            item.addEventListener('click', () => {
                const card = cards.find(c => c.id === item.dataset.cardId);
                if (card) {
                    closeAlertsModal();
                    openWeightModal(card);
                }
            });
        });
    }
    
    alertsModal.classList.add('active');
}

function closeAlertsModal() {
    alertsModal.classList.remove('active');
}

alertButton.addEventListener('click', openAlertsModal);
closeAlertsBtn.addEventListener('click', closeAlertsModal);

alertsModal.addEventListener('click', (e) => {
    if (e.target === alertsModal) {
        closeAlertsModal();
    }
});

// Peso medio di una scheda: media degli ultimi pesi noti dei suoi ID,
// senza considerare le pesate a stomaco pieno (null se nessun peso)
function getCardAvgWeight(card) {
    const last = getLastWeights(card); // già esclude le pesate a stomaco pieno
    const valid = last.filter(w => w !== null && w !== undefined);
    if (valid.length === 0) return null;
    return valid.reduce((s, v) => s + v, 0) / valid.length;
}

// Gruppo alimentare di una scheda in base al peso medio
// (< 110 g: Baby; 110-250 g: 3 pasti latte; 250-300: 2 pasti latte;
// 300-400: 2 pasti; oltre 400: 1 pasto)
function getFeedingGroup(avg) {
    if (avg === null) return 'noweights';
    if (avg < 110) return 'baby';
    if (avg <= 250) return 'milk3';
    if (avg <= 300) return 'milk2';
    if (avg <= 400) return 'meals2';
    return 'meals1';
}

// Ordine e etichette dei gruppi della home
const FEEDING_GROUPS = [
    { key: 'noweights', label: 'Nessuna pesata', emoji: '❓' },
    { key: 'baby', label: 'Babyyy', emoji: '🦔' },
    { key: 'milk3', label: '3 pasti latte', emoji: '🍼' },
    { key: 'milk2', label: '2 pasti latte', emoji: '🍼' },
    { key: 'meals2', label: '2 pasti', emoji: '🥣' },
    { key: 'meals1', label: '1 pasto', emoji: '🥣' }
];

// Renderizza tutte le card, separate in sezioni per fabbisogno alimentare
function renderCards() {
    computeAlerts();
    
    if (cards.length === 0) {
        cardsContainer.innerHTML = '<p class="empty-message">Nessuna scheda creata. Premi + per aggiungerne una.</p>';
        return;
    }

    cardsContainer.innerHTML = '';
    
    // Raggruppa le schede in base al peso medio (ultimo peso noto di ogni ID,
    // escluse le pesate a stomaco pieno), ricalcolato a ogni aggiornamento
    const groups = {};
    cards.forEach(card => {
        const group = getFeedingGroup(getCardAvgWeight(card));
        if (!groups[group]) groups[group] = [];
        groups[group].push(card);
    });
    
    FEEDING_GROUPS.forEach(({ key, label, emoji }) => {
        const groupCards = groups[key];
        if (!groupCards || groupCards.length === 0) return;
        
        const section = document.createElement('section');
        section.className = 'cards-section';
        section.innerHTML = `<h2>${emoji} ${label}</h2>`;
        
        const grid = document.createElement('div');
        grid.className = 'cards-grid';
        
        groupCards.forEach(card => {
            grid.appendChild(createCardElement(card));
        });
        
        section.appendChild(grid);
        cardsContainer.appendChild(section);
    });
}

// Crea l'elemento DOM di una singola card
function createCardElement(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        cardElement.draggable = true;
        
        // Formatta i numeri (se più di uno, separati da virgola)
        const numbersText = card.numbers.join(', ');
        const weightsCount = card.weights.length;
        const isMultiId = card.numbers.length > 1;
        
        // Trend del peso (solo schede con un ID singolo)
        const trend = getCardTrend(card);
        const trendHtml = trend
            ? `<span class="card-trend ${trend.cls}">${trend.emoji} ${trend.formatted}</span>`
            : (weightsCount > 0 && card.numbers.length === 1 ? '<span class="card-trend flat">📊 —</span>' : '');
        
        // Nome della scheda: mostrato sopra gli ID solo se è stato assegnato
        const cardNameHtml = card.name
            ? `<div class="card-name">${escapeHtml(card.name)}</div>`
            : '';
        
        // Verdino chiaro se oggi è stata registrata almeno una pesata
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (card.weights.some(w => w.date === todayKey)) {
            cardElement.classList.add('card-today');
        }
        
        cardElement.innerHTML = `
            ${cardNameHtml}
            <div class="card-numbers">${numbersText}</div>
            <div class="card-title">Scheda Animale</div>
            <div class="card-info">
                <span class="card-count">${weightsCount} registrazioni</span>
                ${trendHtml}
                <span class="card-arrow">→</span>
            </div>
        `;
        
        // Event listeners per drag & drop
        cardElement.addEventListener('dragstart', (e) => {
            draggedCard = card.id;
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.id);
        });
        
        cardElement.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
        
        cardElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.target.classList.add('drag-over');
        });
        
        cardElement.addEventListener('dragleave', (e) => {
            e.target.classList.remove('drag-over');
        });
        
        cardElement.addEventListener('drop', (e) => {
            e.preventDefault();
            e.target.classList.remove('drag-over');
            
            if (draggedCard && draggedCard !== card.id) {
                mergeCards(draggedCard, card.id);
            }
        });
        
        // Click destro per aprire il menu azioni
        cardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // Salva l'ultima card cliccata
            lastClickedCardId = card.id;
            openActionModal(card.id);
        });
        
        return cardElement;
}

// Apre il modale per aggiungere una nuova card
function openAddCardModal() {
    cardNumberInput.value = '';
    addCardModal.classList.add('active');
    cardNumberInput.focus();
}

// Chiude il modale per aggiungere una nuova card
function closeAddCardModal() {
    addCardModal.classList.remove('active');
    lastClickedCardId = null;
}

// Apre il modale azione per una card
function openActionModal(cardId) {
    currentActionCardId = cardId;
    const card = cards.find(c => c.id === cardId);
    
    if (!card) return;
    
    // Reset della selezione precedente
    confirmActionBtn.dataset.action = '';
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    selectedMoveId = null;
    moveSelector.style.display = 'none';
    
    // Mostra/nascondi il pulsante "Spostato" in base al numero di ID
    if (card.numbers.length > 1) {
        movedBtn.style.display = 'block';
    } else {
        movedBtn.style.display = 'none';
    }
    
    actionModal.classList.add('active');
}

// Chiude il modale azione
function closeActionModal() {
    currentActionCardId = null;
    selectedMoveId = null;
    confirmActionBtn.dataset.action = '';
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.move-option').forEach(opt => opt.classList.remove('selected'));
    moveSelector.style.display = 'none';
    actionModal.classList.remove('active');
    lastClickedCardId = null;
}

// Mostra il selettore di ID (usato sia per "Spostato" che per "Deceduto" su schede multi-ID)
function showIdSelector(action) {
    const card = cards.find(c => c.id === currentActionCardId);
    if (!card || card.numbers.length <= 1) return;
    
    idSelectorText.textContent = action === 'moved'
        ? 'Seleziona l\'ID da spostare:'
        : 'Seleziona l\'ID deceduto:';
    
    moveOptions.innerHTML = '';
    card.numbers.forEach(num => {
        const option = document.createElement('button');
        option.className = 'move-option';
        option.textContent = num;
        option.dataset.number = num;
        option.addEventListener('click', () => {
            // Rimuovi la selezione precedente
            document.querySelectorAll('.move-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedMoveId = num;
        });
        moveOptions.appendChild(option);
    });
    
    moveSelector.style.display = 'block';
}

// Esegue l'azione selezionata
function executeAction(action) {
    if (!currentActionCardId) return;
    
    const cardIndex = cards.findIndex(c => c.id === currentActionCardId);
    if (cardIndex === -1) return;
    
    const card = cards[cardIndex];
    
    switch (action) {
        case 'deceased': {
            // Data locale di oggi (non UTC)
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            if (card.numbers.length > 1) {
                // Scheda multi-ID: deceda solo l'ID selezionato
                if (!selectedMoveId) {
                    alert('Seleziona quale ID è deceduto');
                    return;
                }
                
                const idx = card.numbers.indexOf(selectedMoveId);
                
                // Archivia una scheda con il solo ID deceduto e i suoi pesi
                const decWeights = [];
                card.weights.forEach(w => {
                    const v = w.values[idx];
                    if (v !== null && v !== undefined) {
                        decWeights.push({ date: w.date, values: [v] });
                    }
                });
                archive.push({
                    id: 'arch-' + Date.now().toString(),
                    numbers: [selectedMoveId],
                    weights: decWeights,
                    status: 'deceased',
                    archivedAt: todayKey
                });
                
                // Rimuove l'ID deceduto dalla scheda originale
                card.numbers = card.numbers.filter(n => n !== selectedMoveId);
                const remWeights = [];
                card.weights.forEach(w => {
                    const nv = w.values.filter((_, i) => i !== idx);
                    if (nv.some(v => v !== null && v !== undefined)) {
                        remWeights.push({ date: w.date, values: nv });
                    }
                });
                card.weights = remWeights;
                
                if (card.numbers.length === 0) {
                    cards.splice(cardIndex, 1);
                } else {
                    cards[cardIndex] = card;
                }
            } else {
                // Scheda singola: archivia tutta la scheda
                archive.push({
                    ...card,
                    status: action,
                    archivedAt: todayKey
                });
                cards.splice(cardIndex, 1);
            }
            break;
        }
        
        case 'released': {
            // Data locale di oggi (non UTC)
            const now = new Date();
            const archivedCard = {
                ...card,
                status: action,
                archivedAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
            };
            archive.push(archivedCard);
            cards.splice(cardIndex, 1);
            break;
        }
            
        case 'delete':
            if (!confirm('Eliminare definitivamente questa scheda? L\'operazione non è reversibile.')) {
                return;
            }
            cards.splice(cardIndex, 1);
            break;
            
        case 'moved':
            if (!selectedMoveId) {
                alert('Seleziona un ID da spostare');
                return;
            }
            
            // Crea una nuova scheda con l'ID selezionato
            const newCard = {
                id: Date.now().toString(),
                numbers: [selectedMoveId],
                weights: []
            };
            
            // Indice dell'ID spostato nella scheda originale (da calcolare PRIMA del filtro)
            const movedIndex = card.numbers.indexOf(selectedMoveId);
            
            // Copia i pesi per l'ID selezionato e rimuovili dalla scheda originale
            const updatedWeights = [];
            card.weights.forEach(w => {
                const movedValue = w.values[movedIndex];
                if (movedValue !== null && movedValue !== undefined) {
                    newCard.weights.push({
                        date: w.date,
                        values: [movedValue]
                    });
                }
                
                // Nuovi valori: tutti tranne quello all'indice spostato
                const newValues = w.values.filter((_, i) => i !== movedIndex);
                if (newValues.some(v => v !== null && v !== undefined)) {
                    updatedWeights.push({
                        date: w.date,
                        values: newValues
                    });
                }
            });
            card.weights = updatedWeights;
            
            // Rimuovi l'ID dalla scheda originale
            card.numbers = card.numbers.filter(n => n !== selectedMoveId);
            
            // Se la scheda originale ha ancora ID, aggiornala, altrimenti rimuovila
            if (card.numbers.length > 0) {
                cards[cardIndex] = card;
            } else {
                cards.splice(cardIndex, 1);
            }
            
            // Aggiungi la nuova scheda
            cards.push(newCard);
            break;
    }
    
    saveData();
    renderCards();
    
    // Memorizza l'ID prima che closeActionModal lo azzeri
    const actedCardId = currentActionCardId;
    closeActionModal();
    
    // Se il modale pesi è ancora aperto sotto, aggiornalo o chiudilo
    if (weightModal.classList.contains('active')) {
        const updatedCard = cards.find(c => c.id === actedCardId);
        if (updatedCard) {
            openWeightModal(updatedCard);
        } else {
            closeWeightModal();
        }
    }
}

// Apre il modale archivio
function openArchiveModal() {
    renderArchive();
    archiveModal.classList.add('active');
}

// Chiude il modale archivio
function closeArchiveModal() {
    archiveModal.classList.remove('active');
    lastClickedCardId = null;
}

// Filtra e renderizza l'archivio
function renderArchive(filter = 'all') {
    currentFilter = filter;
    
    // Aggiorna i pulsanti del filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === filter) {
            btn.classList.add('active');
        }
    });
    
    const filteredArchive = filter === 'all' 
        ? archive 
        : archive.filter(a => a.status === filter);
    
    if (filteredArchive.length === 0) {
        archiveList.innerHTML = '<p class="empty-archive">Nessuna scheda archiviata.</p>';
        return;
    }
    
    archiveList.innerHTML = '';
    
    filteredArchive.forEach(item => {
        const cardElement = document.createElement('div');
        cardElement.className = 'archive-card';
        
        const numbersText = item.numbers.join(', ');
        const formattedDate = new Date(item.archivedAt).toLocaleDateString('it-IT');
        const statusText = item.status === 'deceased' ? 'Deceduto' : 'Liberato';
        
        cardElement.innerHTML = `
            <div class="archive-card-header">
                <span class="archive-card-numbers">${numbersText}</span>
                <span class="archive-card-status ${item.status}">${statusText}</span>
                <button class="archive-delete-btn" title="Elimina definitivamente">🗑</button>
            </div>
            <div class="archive-card-info">
                Archiviato il: ${formattedDate} | ${item.weights.length} registrazioni
            </div>
        `;
        
        // Elimina la scheda dall'archivio
        cardElement.querySelector('.archive-delete-btn').addEventListener('click', () => {
            if (confirm(`Eliminare definitivamente dall'archivio la scheda ${numbersText}?`)) {
                archive.splice(archive.indexOf(item), 1);
                saveData();
                renderArchive(currentFilter);
            }
        });
        
        archiveList.appendChild(cardElement);
    });
}

// Apre il modale dei pesi per una card
function openWeightModal(card) {
    // Aggiorna il titolo
    const numbersText = card.numbers.join(', ');
    currentCardTitle.textContent = `${card.name ? card.name + ' · ' : ''}Scheda #${numbersText}`;
    cardNumbersDisplay.textContent = `ID: ${numbersText}`;
    
    // Crea le intestazioni della tabella.
    // Schede multiple: accanto a ogni ID, nella stessa casella, il trend del
    // peso di quel riccio (📈/📉 + percentuale tra gli ultimi due pesi non nulli)
    const headIdHtml = card.numbers.map((num, i) => {
        let trendHtml = '';
        if (card.numbers.length > 1) {
            const idTrend = getIdTrend(card, i);
            if (idTrend) {
                trendHtml = `<span class="card-trend ${idTrend.cls}">${idTrend.emoji} ${idTrend.formatted}</span>`;
            } else if (card.weights.some(w => w.values[i] !== null && w.values[i] !== undefined)) {
                trendHtml = '<span class="card-trend flat">📊 —</span>';
            }
        }
        return `<th>ID ${num}${trendHtml}</th>`;
    }).join('');
    
    weightsTableHead.innerHTML = `
        <tr>
            <th>Data</th>
            ${headIdHtml}
        </tr>
    `;
    
    // Costruisci la tabella: una riga per registrazione.
    // Stomaco vuoto e pieno lo stesso giorno = due righe distinte
    // (quella a stomaco pieno evidenziata in arancione).
    weightsTableBody.innerHTML = '';
    
    const sortedRecords = [...card.weights].sort((a, b) => {
        const d = new Date(b.date) - new Date(a.date);
        if (d !== 0) return d;
        // a parità di data, prima la pesata a stomaco vuoto
        return (a.full ? 1 : 0) - (b.full ? 1 : 0);
    });
    
    if (sortedRecords.length === 0) {
        emptyWeightsMsg.classList.add('visible');
        weightsTable.style.display = 'none';
    } else {
        emptyWeightsMsg.classList.remove('visible');
        weightsTable.style.display = 'table';
        
        sortedRecords.forEach(rec => {
            const row = document.createElement('tr');
            if (rec.full) row.className = 'full-stomach';
            const formattedDate = new Date(rec.date).toLocaleDateString('it-IT');
            const fullTag = rec.full ? ' <span class="full-tag">Pieno</span>' : '';
            row.innerHTML = `<td>${formattedDate}${fullTag}</td>`;
            
            card.numbers.forEach((num, index) => {
                const value = rec.values[index];
                const cellValue = value !== null && value !== undefined ? `${value} g` : '-';
                row.innerHTML += `<td>${cellValue}</td>`;
            });
            
            weightsTableBody.appendChild(row);
        });
    }
    
    // Crea gli input per l'inserimento dei pesi.
    // Schede con 1 solo ID: input singolo con suggerimento dell'ultimo peso.
    // Schede multi-ID: casella unica; l'app abbinerà i pesi agli ID più
    // statisticamente probabili (minimizza la somma degli scostamenti dagli
    // ultimi pesi noti, dato che i ricci cambiano peso in modo limitato).
    const isMultiId = card.numbers.length > 1;
    quickWeightsGroup.style.display = isMultiId ? 'block' : 'none';
    weightInputsContainer.style.display = isMultiId ? 'none' : 'flex';
    
    // Suggerisce in grigio l'ultimo peso registrato per ciascun ID
    // (preferibilmente a stomaco vuoto)
    const sortedWeights = [...card.weights].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastWeightFor = (num) => {
        const numIndex = card.numbers.indexOf(num);
        for (const rec of sortedWeights.filter(r => !r.full)) {
            const v = rec.values[numIndex];
            if (v !== null && v !== undefined) return v;
        }
        for (const rec of sortedWeights) {
            const v = rec.values[numIndex];
            if (v !== null && v !== undefined) return v;
        }
        return null;
    };
    
    weightInputsContainer.innerHTML = '';
    card.numbers.forEach(num => {
        const lastValue = lastWeightFor(num);
        const suggestion = lastValue !== null ? `Ultimo: ${lastValue} g` : 'Peso in grammi';
        const inputGroup = document.createElement('div');
        inputGroup.className = 'weight-input-group';
        inputGroup.innerHTML = `
            <label for="weight-${num}">ID ${num}:</label>
            <input type="number" id="weight-${num}" min="1" step="1" placeholder="${suggestion}" required>
        `;
        weightInputsContainer.appendChild(inputGroup);
    });
    
    if (isMultiId) {
        quickWeightsInput.value = '';
        assignmentPreview.innerHTML = `<p class="hint">Inserisci ${card.numbers.length} pesi: l'app li abbinerà automaticamente agli ID.</p>`;
    }
    
    // Imposta la data di default a oggi (formato dd/mm/yyyy)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    weightDateInput.value = `${dd}/${mm}/${yyyy}`;
    
    // Spunta "Stomaco Pieno" sempre deselezionata all'apertura
    stomachFullCheck.checked = false;
    
    // Salva il riferimento alla card corrente
    weightModal.dataset.currentCardId = card.id;
    
    weightModal.classList.add('active');
}

// Chiude il modale dei pesi
function closeWeightModal() {
    weightModal.classList.remove('active');
    weightModal.dataset.currentCardId = '';
    lastClickedCardId = null;
}

// --- Assegnazione statistica dei pesi (schede multi-ID) ---

// Ultimi pesi noti di una scheda, nell'ordine dei suoi ID (null = mai pesato).
// Le pesate a stomaco pieno non contano: escluse, così non finiscono né negli
// alert né tra i riferimenti per l'assegnazione automatica dei pesi.
function getLastWeights(card) {
    const sorted = card.weights.filter(w => !w.full).sort((a, b) => new Date(b.date) - new Date(a.date));
    return card.numbers.map((num, i) => {
        for (const rec of sorted) {
            const v = rec.values[i];
            if (v !== null && v !== undefined) return v;
        }
        return null;
    });
}

// Trova l'abbinamento pesi→ID che minimizza la somma degli scostamenti assoluti
// dagli ultimi pesi noti (i ricci cambiano peso di poco: l'abbinamento più
// probabile è quello che devia meno dallo storico). Per ID mai pesati usa la
// mediana dei pesi noti come pseudo-target. Restituisce, per ogni ID (in
// ordine card.numbers), l'indice del peso inserito da assegnargli.
function computeAssignment(values, targets) {
    const k = targets.length;
    const known = targets.filter(t => t !== null).sort((a, b) => a - b);
    const fill = known.length ? known[Math.floor(known.length / 2)] : 0;
    const t = targets.map(x => (x === null ? fill : x));
    
    if (k <= 8) {
        // Forza bruta sulle permutazioni (max 8! = 40320 casi): istantaneo
        let best = null;
        let bestCost = Infinity;
        const perm = values.map((_, i) => i);
        const swap = (a, i, j) => { const tmp = a[i]; a[i] = a[j]; a[j] = tmp; };
        const permute = (arr, n) => {
            if (n === 1) {
                let cost = 0;
                for (let i = 0; i < k; i++) cost += Math.abs(values[arr[i]] - t[i]);
                if (cost < bestCost) { bestCost = cost; best = arr.slice(); }
                return;
            }
            for (let i = 0; i < n; i++) {
                permute(arr, n - 1);
                swap(arr, n % 2 === 0 ? i : 0, n - 1);
            }
        };
        permute(perm, k);
        return best;
    }
    
    // Oltre 8 ID: approssimazione greedy per ordinamento
    const idOrder = t.map((_, i) => i).sort((a, b) => t[a] - t[b]);
    const valOrder = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
    const result = new Array(k);
    idOrder.forEach((idIdx, pos) => { result[idIdx] = valOrder[pos]; });
    return result;
}

// Legge i pesi dalla casella unica (spazi, virgole, punti e virgola, a capo)
function parseQuickWeights() {
    const raw = quickWeightsInput.value.trim();
    if (!raw) return [];
    return raw.split(/[\s,;]+/).filter(Boolean).map(s => Math.round(Number(s)));
}

// Aggiorna l'anteprima dell'abbinamento mentre si digita
function updateAssignmentPreview() {
    const cardId = weightModal.dataset.currentCardId;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.numbers.length <= 1) return;
    
    const values = parseQuickWeights();
    if (values.length === 0) {
        assignmentPreview.innerHTML = `<p class="hint">Inserisci ${card.numbers.length} pesi: l'app li abbinerà automaticamente agli ID.</p>`;
        return;
    }
    if (values.some(v => isNaN(v) || v <= 0)) {
        assignmentPreview.innerHTML = '<p class="error">Alcuni valori non sono pesi validi (interi maggiori di 0).</p>';
        return;
    }
    if (values.length !== card.numbers.length) {
        assignmentPreview.innerHTML = `<p class="hint">Inseriti ${values.length} su ${card.numbers.length} pesi.</p>`;
        return;
    }
    
    const targets = getLastWeights(card);
    const assign = computeAssignment(values, targets);
    assignmentPreview.innerHTML = card.numbers.map((num, i) => {
        const last = targets[i] !== null ? ` <span class="last">(ultimo: ${targets[i]} g)</span>` : '';
        return `<div class="assignment-row">ID ${num} &larr; <strong>${values[assign[i]]} g</strong>${last}</div>`;
    }).join('');
}

quickWeightsInput.addEventListener('input', updateAssignmentPreview);

// Aggiunge un nuovo peso alla card corrente
function addWeight() {
    const cardId = weightModal.dataset.currentCardId;
    const card = cards.find(c => c.id === cardId);
    
    if (!card) return;
    
    // Validazione data (formato dd/mm/yyyy)
    const dateStr = weightDateInput.value.trim();
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const dateMatch = dateStr.match(dateRegex);
    
    if (!dateMatch) {
        alert('Per favore, inserisci la data nel formato GG/MM/AAAA');
        return;
    }
    
    const dd = parseInt(dateMatch[1]);
    const mm = parseInt(dateMatch[2]);
    const yyyy = parseInt(dateMatch[3]);
    
    // Validazione data
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
        alert('Data non valida. Inserisci una data valida nel formato GG/MM/AAAA');
        return;
    }
    
    const date = new Date(yyyy, mm - 1, dd);
    // Verifica che la data sia reale (es. 31/02 non valido)
    if (isNaN(date.getTime()) || date.getDate() !== dd || date.getMonth() !== mm - 1) {
        alert('Data non valida. Inserisci una data valida nel formato GG/MM/AAAA');
        return;
    }
    
    // Chiave data in formato locale (evita lo sfasamento UTC di toISOString)
    const dateKey = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    
    // Validazione pesi
    const values = [];
    if (card.numbers.length > 1) {
        // Scheda multi-ID: casella unica + assegnazione automatica
        const entered = parseQuickWeights();
        
        if (entered.length !== card.numbers.length) {
            alert(`Inserisci ${card.numbers.length} pesi (uno per ID), separati da spazio o virgola.`);
            return;
        }
        const invalid = entered.find(v => isNaN(v) || v <= 0);
        if (invalid !== undefined) {
            alert('Per favore, inserisci solo pesi validi (interi maggiori di 0).');
            return;
        }
        
        const assign = computeAssignment(entered, getLastWeights(card));
        card.numbers.forEach((_, i) => values.push(entered[assign[i]]));
    } else {
        for (const num of card.numbers) {
            const input = document.getElementById(`weight-${num}`);
            const value = parseInt(input.value);
            
            if (isNaN(value) || value <= 0) {
                alert(`Per favore, inserisci un peso valido maggiore di 0 per l'ID ${num}`);
                return;
            }
            values.push(value);
        }
    }
    
    // Spunta "Stomaco Pieno": la pesata non sovrascrive (e non è sovrascritta da)
    // una pesata a stomaco vuoto dello stesso giorno: sono registrazioni separate
    const fullStomach = stomachFullCheck.checked;
    const existingWeightIndex = card.weights.findIndex(w => w.date === dateKey && !!w.full === fullStomach);
    
    if (existingWeightIndex !== -1) {
        // Aggiorna i valori esistenti della stessa tipologia (pieno/vuoto)
        card.weights[existingWeightIndex].values = values;
    } else {
        // Aggiungi nuova registrazione
        const newRecord = {
            date: dateKey,
            values: values
        };
        if (fullStomach) newRecord.full = true;
        card.weights.push(newRecord);
    }
    
    saveData();
    renderCards();
    openWeightModal(card);
}

// Event Listeners
addCardButton.addEventListener('click', openAddCardModal);
removeCardButton.addEventListener('click', () => {
    if (weightModal.classList.contains('active')) {
        // Se siamo nel modale pesi, apri il menu azioni per la card corrente
        openActionModal(weightModal.dataset.currentCardId);
    } else if (lastClickedCardId) {
        openActionModal(lastClickedCardId);
    } else {
        alert('Seleziona una card cliccandoci sopra');
    }
});
archiveButton.addEventListener('click', openArchiveModal);
confirmCardBtn.addEventListener('click', () => {
    const number = parseInt(cardNumberInput.value);
    if (isNaN(number) || number < 1 || number > 9999) {
        alert('Per favore, inserisci un numero valido (max 4 cifre)');
        return;
    }
    
    const numberExists = cards.some(card => card.numbers.includes(number));
    if (numberExists) {
        alert('Esiste già una scheda con questo numero. Scegline un altro.');
        return;
    }
    
    createCard(number);
});

cancelCardBtn.addEventListener('click', closeAddCardModal);
addWeightBtn.addEventListener('click', addWeight);
cancelWeightBtn.addEventListener('click', closeWeightModal);

// Event listeners per il modale azione
movedBtn.addEventListener('click', () => {
    confirmActionBtn.dataset.action = 'moved';
    selectedMoveId = null;
    document.querySelectorAll('.move-option').forEach(opt => opt.classList.remove('selected'));
    showIdSelector('moved');
});
confirmActionBtn.addEventListener('click', () => {
    const action = confirmActionBtn.dataset.action;
    if (!action) {
        alert('Seleziona prima un\'azione');
        return;
    }
    executeAction(action);
});
cancelActionBtn.addEventListener('click', closeActionModal);

// Aggiungi event listeners ai pulsanti azione
deceasedBtn.addEventListener('click', () => {
    confirmActionBtn.dataset.action = 'deceased';
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    deceasedBtn.classList.add('selected');
    selectedMoveId = null;
    document.querySelectorAll('.move-option').forEach(opt => opt.classList.remove('selected'));
    
    // Su schede multi-ID chiedi quale ID è deceduto
    const card = cards.find(c => c.id === currentActionCardId);
    if (card && card.numbers.length > 1) {
        showIdSelector('deceased');
    } else {
        moveSelector.style.display = 'none';
    }
});
releasedBtn.addEventListener('click', () => {
    confirmActionBtn.dataset.action = 'released';
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    releasedBtn.classList.add('selected');
});
deleteBtn.addEventListener('click', () => {
    confirmActionBtn.dataset.action = 'delete';
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    deleteBtn.classList.add('selected');
});

// Event listeners per il modale archivio
closeArchiveBtn.addEventListener('click', closeArchiveModal);
archiveFilter.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        renderArchive(e.target.dataset.status);
    }
});

// Chiudi modale cliccando fuori
addCardModal.addEventListener('click', (e) => {
    if (e.target === addCardModal) {
        closeAddCardModal();
    }
});

weightModal.addEventListener('click', (e) => {
    if (e.target === weightModal) {
        closeWeightModal();
    }
});

actionModal.addEventListener('click', (e) => {
    if (e.target === actionModal) {
        closeActionModal();
    }
});

archiveModal.addEventListener('click', (e) => {
    if (e.target === archiveModal) {
        closeArchiveModal();
    }
});

// Permetti di chiudere con il tasto ESC
// Ordina i modali dal più alto: menu azioni sta sopra la scheda pesi
addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (balanceModal.classList.contains('active')) {
            closeBalanceModal();
        } else if (alertsModal.classList.contains('active')) {
            closeAlertsModal();
        } else if (nameModal.classList.contains('active')) {
            closeNameModal();
        } else if (milkModal.classList.contains('active')) {
            closeMilkModal();
        } else if (actionModal.classList.contains('active')) {
            closeActionModal();
        } else if (addCardModal.classList.contains('active')) {
            closeAddCardModal();
        } else if (weightModal.classList.contains('active')) {
            closeWeightModal();
        } else if (archiveModal.classList.contains('active')) {
            closeArchiveModal();
        }
    }
});

// Previene il comportamento predefinito del drag & drop
addEventListener('dragover', (e) => {
    e.preventDefault();
});

addEventListener('drop', (e) => {
    e.preventDefault();
});

// Modifica il click sulla card: se si clicca con il tasto destro o si tiene premuto, apri il menu azione
// Per mobile: lungo tap
let longPressTimer = null;

cardsContainer.addEventListener('click', (e) => {
    // Se il menu azioni è già aperto (es. dopo un lungo tap), ignora il click successivo
    if (actionModal.classList.contains('active')) return;
    
    const cardElement = e.target.closest('.card');
    if (cardElement) {
        const cardId = cardElement.dataset.id;
        const card = cards.find(c => c.id === cardId);
        
        if (e.target.classList.contains('card-group-badge') || e.button === 2) {
            e.preventDefault();
            openActionModal(cardId);
        } else if (card) {
            openWeightModal(card);
        }
    }
});

// Gestione lungo tap per mobile
cardsContainer.addEventListener('touchstart', (e) => {
    const cardElement = e.target.closest('.card');
    if (cardElement) {
        const cardId = cardElement.dataset.id;
        longPressTimer = setTimeout(() => {
            openActionModal(cardId);
        }, 1000);
    }
}, { passive: true });

cardsContainer.addEventListener('touchend', (e) => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
});

cardsContainer.addEventListener('touchmove', () => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
});

// Inizializza l'applicazione
async function init() {
    await loadData();
    renderCards();
    lastClickedCardId = null;
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);


// --- Fabbisogno latte ---

// Elementi modale fabbisogno latte
const milkModal = document.getElementById('milkModal');
const milkCalcButton = document.getElementById('milkCalcButton');
const milkIdSelector = document.getElementById('milkIdSelector');
const milkIdOptions = document.getElementById('milkIdOptions');
const milkResult = document.getElementById('milkResult');
const milkSummary = document.getElementById('milkSummary');
const mealOptions = document.getElementById('mealOptions');
const mealResult = document.getElementById('mealResult');
const closeMilkBtn = document.getElementById('closeMilkBtn');

let milkDailyTotal = null;

// Formula del fabbisogno: N^0,75 x 70 x 2, con N = peso del riccio in kg
function calcMilkRequirement(weightGrams) {
    const kg = weightGrams / 1000;
    return 70 * Math.pow(kg, 0.75) * 2;
}

// Ultimo peso registrato (non nullo) per un ID della card.
// Preferisce le pesate a stomaco vuoto; usa quelle a stomaco pieno solo se
// non c'è altro.
function getLastWeightFor(card, num) {
    const idx = card.numbers.indexOf(num);
    if (idx === -1) return null;
    const sorted = [...card.weights].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const rec of sorted.filter(r => !r.full)) {
        const v = rec.values[idx];
        if (v !== null && v !== undefined) return v;
    }
    for (const rec of sorted) {
        const v = rec.values[idx];
        if (v !== null && v !== undefined) return v;
    }
    return null;
}

// Formatta un numero con separatore italiano, max 1 decimale
function fmtMilk(n) {
    return n.toLocaleString('it-IT', { maximumFractionDigits: 1 });
}

// Apre il modale fabbisogno latte dalla scheda aperta
function openMilkModal() {
    const cardId = weightModal.dataset.currentCardId;
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    milkDailyTotal = null;
    milkResult.style.display = 'none';
    mealResult.innerHTML = '';
    milkIdOptions.innerHTML = '';

    if (card.numbers.length > 1) {
        // Scheda multi-ID: chiedi quale riccio
        document.getElementById('milkIdSelectorText').textContent = 'Seleziona l\'ID del riccio:';
        card.numbers.forEach(num => {
            const option = document.createElement('button');
            option.className = 'move-option';
            option.textContent = num;
            option.addEventListener('click', () => {
                milkIdOptions.querySelectorAll('.move-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                showMilkResult(card, num);
            });
            milkIdOptions.appendChild(option);
        });
        milkIdSelector.style.display = 'block';
    } else {
        // Scheda singola: calcola direttamente
        milkIdSelector.style.display = 'none';
        showMilkResult(card, card.numbers[0]);
    }

    milkModal.classList.add('active');
}

// Mostra il fabbisogno giornaliero e i pulsanti per il numero di pasti
function showMilkResult(card, num) {
    const weight = getLastWeightFor(card, num);
    if (weight === null) {
        alert('Nessun peso registrato per l\'ID ' + num + '. Registra prima un peso.');
        return;
    }

    milkDailyTotal = calcMilkRequirement(weight);

    milkSummary.innerHTML = `
        <p class="milk-id">ID ${num}</p>
        <p class="milk-weight">Peso: ${weight} g</p>
        <p class="milk-formula">N<sup>0,75</sup> &times; 70 &times; 2 (N = peso in kg)</p>
        <p class="milk-total">Fabbisogno giornaliero: <strong>${fmtMilk(milkDailyTotal)}</strong></p>
    `;
    mealResult.innerHTML = '';
    mealOptions.innerHTML = '';

    // Opzioni numero pasti: da 3 a 8
    for (let n = 3; n <= 8; n++) {
        const btn = document.createElement('button');
        btn.className = 'meal-btn';
        btn.textContent = n;
        btn.addEventListener('click', () => {
            mealOptions.querySelectorAll('.meal-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const perMeal = milkDailyTotal / n;
            mealResult.innerHTML = `
                <p>Con <strong>${n} pasti</strong>: <strong>${fmtMilk(perMeal)}</strong> per pasto</p>
            `;
        });
        mealOptions.appendChild(btn);
    }

    milkIdSelector.style.display = 'none';
    milkResult.style.display = 'block';
}

// Chiude il modale fabbisogno latte
function closeMilkModal() {
    milkModal.classList.remove('active');
    milkDailyTotal = null;
    mealResult.innerHTML = '';
}

milkCalcButton.addEventListener('click', openMilkModal);
closeMilkBtn.addEventListener('click', closeMilkModal);

milkModal.addEventListener('click', (e) => {
    if (e.target === milkModal) {
        closeMilkModal();
    }
});

// --- Nome scheda ---

const nameModal = document.getElementById('nameModal');
const cardNameInput = document.getElementById('cardNameInput');
const confirmNameBtn = document.getElementById('confirmNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');

let currentNameCardId = null;

// Apre il modale per assegnare/modificare il nome di una scheda
function openNameModal(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    currentNameCardId = cardId;
    cardNameInput.value = card.name || '';
    nameModal.classList.add('active');
    setTimeout(() => cardNameInput.focus(), 50);
}

// Chiude il modale nome
function closeNameModal() {
    nameModal.classList.remove('active');
    currentNameCardId = null;
}

// Salva il nome (vuoto = nessun nome)
function confirmCardName() {
    const card = cards.find(c => c.id === currentNameCardId);
    if (!card) {
        closeNameModal();
        return;
    }
    
    const name = cardNameInput.value.trim();
    if (name) {
        card.name = name;
    } else {
        delete card.name;
    }
    
    saveData();
    renderCards();
    
    // Aggiorna il titolo se il modale pesi è aperto sulla stessa scheda
    if (weightModal.classList.contains('active') && weightModal.dataset.currentCardId === card.id) {
        const numbersText = card.numbers.join(', ');
        currentCardTitle.textContent = `${card.name ? card.name + ' · ' : ''}Scheda #${numbersText}`;
    }
    
    closeNameModal();
}

// Pulsante nome dentro la scheda (modale pesi)
const cardNameBtn = document.getElementById('cardNameBtn');
cardNameBtn.addEventListener('click', () => {
    const cardId = weightModal.dataset.currentCardId;
    if (cardId) {
        openNameModal(cardId);
    }
});

confirmNameBtn.addEventListener('click', confirmCardName);
cancelNameBtn.addEventListener('click', closeNameModal);

cardNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        confirmCardName();
    }
});

nameModal.addEventListener('click', (e) => {
    if (e.target === nameModal) {
        closeNameModal();
    }
});


// --- Pareggio schede ---
// Suggerisce come spostare ID tra schede ESISTENTI per bilanciare i pesi:
// 1) ogni ID con peso noto (escluse le pesate a stomaco pieno) deve stare
//    entro il 20% dalla media dei compagni della propria scheda;
// 2) capacità massima per scheda, decisa dalla MEDIA dei pesi della scheda:
//    media < 250 g -> max 4 | 250-400 g -> max 3 | > 400 g -> max 2;
// 3) minor numero di spostamenti possibile, poi minimizzare gli scarti;
// 4) si può unire una scheda con un singolo ID a un'altra (1 spostamento);
// 5) una scheda svuotata viene eliminata alla fine.

const balanceButton = document.getElementById('balanceButton');
const balanceModal = document.getElementById('balanceModal');
const balanceCloseBtn = document.getElementById('balanceCloseBtn');
const balanceCounter = document.getElementById('balanceCounter');
const balanceStep = document.getElementById('balanceStep');
const balanceNextBtn = document.getElementById('balanceNextBtn');

let balanceMoves = [];
let balanceIndex = 0;

const BALANCE_THRESHOLD = 0.20;
const BALANCE_EXACT_DEPTH = 3;     // profondità della ricerca esatta (min mosse)
const BALANCE_SEARCH_MS = 1500;    // tempo massimo del local search di scorta

// Capacità massima di una scheda in base alla media dei pesi degli ID pesati
function capacityLimit(avgWeight) {
    if (avgWeight >= 400) return 2;
    if (avgWeight >= 250) return 3;
    return 4;
}

// Calcola il piano di pareggiamento.
// Restituisce: array di spostamenti [{num, weight, fromId, toId}],
// [] se le schede sono già bilanciate, null se nessuna soluzione trovata
// (in questo caso balanceFailInfo contiene i dettagli del perché).
// Algoritmo in 3 fasi:
//   1) ricerca esatta fino a BALANCE_EXACT_DEPTH spostamenti: trova la
//      soluzione con il minor numero di mosse quando basta poco;
//   2) partizione ottima dei pesi ordinati in gruppi omogenei (DP): se i
//      gruppi staranno tutte nelle schede esistenti, costruisce il piano
//      assegnando ogni gruppo alla scheda che sposta meno ID;
//   3) local search di scorta per partizioni non contigue.
let balanceFailInfo = null;

// Un gruppo di pesi è compatibile se ogni riccio è entro il 20% dalla media
// degli altri del gruppo e la numerosità rispetta la capacità
function balanceGroupOk(weights) {
    const k = weights.length;
    if (k === 0) return false;
    if (k === 1) return true;
    const avg = weights.reduce((a, b) => a + b, 0) / k;
    if (k > capacityLimit(avg)) return false;
    for (let i = 0; i < k; i++) {
        const avgOthers = (weights.reduce((a, w, j) => a + (j === i ? 0 : w), 0)) / (k - 1);
        if (Math.abs(weights[i] - avgOthers) / avgOthers > BALANCE_THRESHOLD) return false;
    }
    return true;
}

// Minimo numero di gruppi compatibili in cui dividere i pesi ordinati
function balanceDpPartition(sortedWeights) {
    const n = sortedWeights.length;
    const INF = 1e9;
    const dp = new Array(n + 1).fill(INF);
    const choice = new Array(n + 1).fill(0);
    dp[0] = 0;
    for (let i = 1; i <= n; i++) {
        for (let j = 0; j < i; j++) {
            if (dp[j] === INF) continue;
            if (!balanceGroupOk(sortedWeights.slice(j, i))) continue;
            if (dp[j] + 1 < dp[i]) {
                dp[i] = dp[j] + 1;
                choice[i] = j;
            }
        }
    }
    return { minGroups: dp[n], choice };
}

function computeBalancing() {
    balanceFailInfo = null;
    const nSlots = cards.length;
    if (nSlots === 0) return [];
    
    // ID con peso noto (escluse pesate a stomaco pieno): spostabili.
    // ID mai pesati: restano fissi, ma contano nel numero della scheda.
    const fixedCount = new Array(nSlots).fill(0);
    const movable = [];
    cards.forEach((card, slotIdx) => {
        const last = getLastWeights(card);
        card.numbers.forEach((num, i) => {
            if (last[i] !== null && last[i] !== undefined) {
                movable.push({ num, weight: last[i], home: slotIdx });
            } else {
                fixedCount[slotIdx]++;
            }
        });
    });
    
    if (movable.length === 0) return [];
    
    const n = movable.length;
    const home = movable.map(m => m.home);
    
    // Valuta un'assegnazione: violazioni (capacità + ID oltre il 20%)
    // e scarto complessivo (somma dei quadrati degli scarti)
    function evaluate(assign) {
        const members = Array.from({ length: nSlots }, () => []);
        for (let i = 0; i < n; i++) members[assign[i]].push(i);
        
        let violations = 0;
        let dev = 0;
        
        members.forEach((mem, s) => {
            const total = mem.length + fixedCount[s];
            if (mem.length === 0) {
                if (total > capacityLimit(0)) violations++;
                return;
            }
            
            const weights = mem.map(i => movable[i].weight);
            const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
            
            if (total > capacityLimit(avg)) violations++;
            
            if (mem.length >= 2) {
                mem.forEach(i => {
                    const w = movable[i].weight;
                    let sum = 0;
                    for (const j of mem) if (j !== i) sum += movable[j].weight;
                    const avgOthers = sum / (mem.length - 1);
                    if (Math.abs(w - avgOthers) / avgOthers > BALANCE_THRESHOLD) violations++;
                    dev += (w - avgOthers) * (w - avgOthers);
                });
            }
        });
        
        return { violations, dev };
    }
    
    const startAssign = home.slice();
    if (evaluate(startAssign).violations === 0) return [];
    
    function movesFrom(assign) {
        const moves = [];
        for (let i = 0; i < n; i++) {
            if (assign[i] !== home[i]) {
                moves.push({
                    num: movable[i].num,
                    weight: movable[i].weight,
                    fromId: cards[home[i]].id,
                    toId: cards[assign[i]].id
                });
            }
        }
        return moves;
    }
    
    // ---- FASE 1: ricerca esatta fino a BALANCE_EXACT_DEPTH spostamenti ----
    let level = [startAssign];
    const visited = new Set([startAssign.join(',')]);
    for (let depth = 1; depth <= BALANCE_EXACT_DEPTH; depth++) {
        const nextLevel = [];
        const levelKeys = new Set();
        
        for (const st of level) {
            for (let i = 0; i < n; i++) {
                if (st[i] !== home[i]) continue;
                for (let s = 0; s < nSlots; s++) {
                    if (s === home[i]) continue;
                    const ns = st.slice();
                    ns[i] = s;
                    const key = ns.join(',');
                    if (visited.has(key) || levelKeys.has(key)) continue;
                    levelKeys.add(key);
                    visited.add(key);
                    nextLevel.push(ns);
                }
            }
        }
        
        if (nextLevel.length === 0) break;
        
        let best = null;
        for (const st of nextLevel) {
            const ev = evaluate(st);
            if (ev.violations === 0 && (best === null || ev.dev < best.ev.dev)) {
                best = { st, ev };
            }
        }
        if (best) return movesFrom(best.st);
        
        level = nextLevel;
    }
    
    // ---- FASE 2: partizione dei pesi ordinati in gruppi omogenei (DP) ----
    const sorted = movable.map((m, i) => ({ i, w: m.weight })).sort((a, b) => a.w - b.w);
    const { minGroups, choice } = balanceDpPartition(sorted.map(x => x.w));
    
    if (minGroups < 1e9) {
        if (minGroups > nSlots) {
            // Servono più gruppi di quante schede esistono: davvero impossibile
            balanceFailInfo = { minGroups, nSlots };
            return null;
        }
        
        // Ricostruisci i gruppi della partizione
        const groups = [];
        let pos = n;
        while (pos > 0) {
            const gStart = choice[pos];
            groups.unshift(sorted.slice(gStart, pos).map(x => x.i));
            pos = gStart;
        }
        while (groups.length < nSlots) groups.push([]);
        
        const groupAvg = g => g.length ? g.reduce((s, i) => s + movable[i].weight, 0) / g.length : 0;
        
        // Assegna i gruppi alle schede cercando di muovere il meno possibile
        function tryAssign(order) {
            const freeSlots = [...Array(nSlots).keys()];
            const todo = order.slice();
            const assign = new Array(n).fill(-1);
            
            while (todo.length) {
                let pick = null;
                for (const gi of todo) {
                    const g = groups[gi];
                    const cap = capacityLimit(groupAvg(g));
                    for (const s of freeSlots) {
                        if (g.length + fixedCount[s] > cap) continue;
                        const stay = g.filter(i => movable[i].home === s).length;
                        if (!pick || stay > pick.stay) pick = { gi, s, stay };
                    }
                }
                if (!pick) return null;   // nessuna scheda valida per un gruppo
                groups[pick.gi].forEach(i => assign[i] = pick.s);
                todo.splice(todo.indexOf(pick.gi), 1);
                freeSlots.splice(freeSlots.indexOf(pick.s), 1);
            }
            return assign;
        }
        
        // Prova vari ordini di assegnazione e tieni quella con meno spostamenti
        const baseOrder = [...Array(groups.length).keys()];
        const orders = [baseOrder, baseOrder.slice().reverse()];
        for (let rep = 0; rep < 8; rep++) {
            const o = baseOrder.slice();
            for (let i = o.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [o[i], o[j]] = [o[j], o[i]];
            }
            orders.push(o);
        }
        
        let bestAssign = null;
        let bestMovesCount = Infinity;
        for (const o of orders) {
            const assign = tryAssign(o);
            if (!assign || assign.includes(-1)) continue;
            if (evaluate(assign).violations !== 0) continue;
            const movesCount = assign.reduce((s, v, idx) => s + (v === home[idx] ? 0 : 1), 0);
            if (movesCount < bestMovesCount) {
                bestMovesCount = movesCount;
                bestAssign = assign.slice();
            }
        }
        
        if (bestAssign) return movesFrom(bestAssign);
    }
    
    // ---- FASE 3: local search di scorta (partizioni non contigue) ----
    const t0 = Date.now();
    let cur = startAssign.slice();
    let curEv = evaluate(cur);
    let best = { st: cur.slice(), ev: curEv };
    const randInt = k => Math.floor(Math.random() * k);
    
    while (Date.now() - t0 < BALANCE_SEARCH_MS) {
        let improved = false;
        
        // Cerca una mossa singola che migliori (violazioni prima, poi scarti)
        for (let tries = 0, i = randInt(n); tries < n * nSlots && !improved; tries++) {
            i = (i + 1) % n;
            const s = randInt(nSlots);
            if (s === cur[i]) continue;
            const old = cur[i];
            cur[i] = s;
            const ev = evaluate(cur);
            if (ev.violations < curEv.violations || (ev.violations === curEv.violations && ev.dev < curEv.dev)) {
                curEv = ev;
                improved = true;
                if (ev.violations < best.ev.violations || (ev.violations === best.ev.violations && ev.dev < best.ev.dev)) {
                    best = { st: cur.slice(), ev };
                }
            } else {
                cur[i] = old;
            }
        }
        
        if (best.ev.violations === 0) break;
        
        if (!improved) {
            // Bloccato: riparte dal migliore con una perturbazione
            cur = best.st.slice();
            for (let k = 0; k < 2; k++) cur[randInt(n)] = randInt(nSlots);
            curEv = evaluate(cur);
        }
    }
    
    if (best.ev.violations > 0) {
        balanceFailInfo = minGroups > nSlots ? { minGroups, nSlots } : null;
        return null;
    }
    
    // Riduci gli spostamenti finché resta tutto fattibile
    let assign = best.st.slice();
    let changed = true;
    while (changed) {
        changed = false;
        for (let i = 0; i < n; i++) {
            if (assign[i] === home[i]) continue;
            const old = assign[i];
            assign[i] = home[i];
            if (evaluate(assign).violations === 0) {
                changed = true;
            } else {
                assign[i] = old;
            }
        }
    }
    return movesFrom(assign);
}

// Sposta un ID da una scheda a un'altra, con tutto il suo storico pesi
function moveIdToCard(srcCard, dstCard, num) {
    const idx = srcCard.numbers.indexOf(num);
    if (idx === -1) return;
    
    // Storico pesi dell'ID spostato
    const movedRecords = [];
    const newSrcWeights = [];
    srcCard.weights.forEach(w => {
        const v = w.values[idx];
        if (v !== null && v !== undefined) {
            movedRecords.push({ date: w.date, values: [v] });
        }
        const nv = w.values.filter((_, i) => i !== idx);
        if (nv.some(x => x !== null && x !== undefined)) {
            newSrcWeights.push({ date: w.date, values: nv });
        }
    });
    
    // Inserisce l'ID alla fine della scheda di destinazione
    dstCard.numbers.push(num);
    const newDstWeights = [];
    const allDates = new Set([...dstCard.weights.map(w => w.date), ...movedRecords.map(r => r.date)]);
    allDates.forEach(date => {
        const d = dstCard.weights.find(w => w.date === date);
        const r = movedRecords.find(x => x.date === date);
        const values = d ? d.values.slice() : dstCard.numbers.slice(0, -1).map(() => null);
        values.push(r ? r.values[0] : null);
        newDstWeights.push({ date, values });
    });
    dstCard.weights = newDstWeights;
    
    // Aggiorna la scheda di provenienza
    srcCard.numbers = srcCard.numbers.filter(x => x !== num);
    srcCard.weights = newSrcWeights;
}

// Applica tutti gli spostamenti suggeriti, poi salva e riordina le schede
function applyBalancing(moves) {
    moves.forEach(m => {
        const src = cards.find(c => c.id === m.fromId);
        const dst = cards.find(c => c.id === m.toId);
        if (src && dst && src !== dst) {
            moveIdToCard(src, dst, m.num);
        }
    });
    
    // Le schede svuotate vengono eliminate
    cards = cards.filter(c => c.numbers.length > 0);
    
    saveData();
    renderCards();
}

// Mostra lo spostamento corrente
function renderBalanceStep() {
    const m = balanceMoves[balanceIndex];
    const from = cards.find(c => c.id === m.fromId);
    const to = cards.find(c => c.id === m.toId);
    
    balanceCounter.textContent = `Spostamento ${balanceIndex + 1} di ${balanceMoves.length}`;
    
    balanceStep.innerHTML = `
        <div class="balance-move-id">ID ${m.num}</div>
        <div class="balance-move-weight">${m.weight} g</div>
        <div class="balance-move-from">dalla scheda: ${from ? from.numbers.join(', ') : '—'}</div>
        <div class="balance-move-arrow">→</div>
        <div class="balance-move-to">alla scheda: ${to ? to.numbers.join(', ') : '—'}</div>
    `;
    
    balanceNextBtn.textContent = (balanceIndex === balanceMoves.length - 1) ? 'Fatto!' : 'Next';
}

function openBalanceModal() {
    balanceModal.classList.add('active');
}

function closeBalanceModal() {
    balanceModal.classList.remove('active');
    balanceMoves = [];
    balanceIndex = 0;
}

balanceButton.addEventListener('click', () => {
    const result = computeBalancing();
    
    if (result === null) {
        balanceCounter.textContent = 'Pareggio schede';
        let msg;
        if (balanceFailInfo && balanceFailInfo.minGroups > balanceFailInfo.nSlots) {
            msg = `Impossibile pareggiare: servono almeno <strong>${balanceFailInfo.minGroups}</strong> gruppi di ricci con pesi omogenei, ma esistono solo <strong>${balanceFailInfo.nSlots}</strong> schede. Crea altre schede (tasto +) e riprova, oppure sposta qualche ID manualmente.`;
        } else {
            msg = 'Non sono riuscito a trovare un piano di pareggiamento con i vincoli attuali. Prova a spostare qualche ID manualmente e riprova.';
        }
        balanceStep.innerHTML = `<p class="balance-msg">${msg}</p>`;
        balanceNextBtn.style.display = 'none';
        openBalanceModal();
        return;
    }
    
    if (result.length === 0) {
        balanceCounter.textContent = 'Pareggio schede';
        balanceStep.innerHTML = '<p class="balance-msg">Tutte le schede sono già bilanciate: nessuno spostamento necessario 🎉</p>';
        balanceNextBtn.style.display = 'none';
        openBalanceModal();
        return;
    }
    
    balanceMoves = result;
    balanceIndex = 0;
    balanceNextBtn.style.display = 'inline-block';
    renderBalanceStep();
    openBalanceModal();
});

balanceNextBtn.addEventListener('click', () => {
    if (balanceIndex < balanceMoves.length - 1) {
        balanceIndex++;
        renderBalanceStep();
    } else {
        const n = balanceMoves.length;
        balanceCloseBtn.dataset.pending = '1';
        if (confirm(`Applicare i ${n} spostamenti suggeriti?`)) {
            applyBalancing(balanceMoves);
            closeBalanceModal();
        }
        delete balanceCloseBtn.dataset.pending;
    }
});

balanceCloseBtn.addEventListener('click', closeBalanceModal);

balanceModal.addEventListener('click', (e) => {
    if (e.target === balanceModal) {
        closeBalanceModal();
    }
});
