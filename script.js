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
const confirmActionBtn = document.getElementById('confirmActionBtn');
const cancelActionBtn = document.getElementById('cancelActionBtn');

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
const addWeightBtn = document.getElementById('addWeightBtn');
const cancelWeightBtn = document.getElementById('cancelWeightBtn');

// Variabile per il drag & drop e azione scheda
let draggedCard = null;
let currentActionCardId = null;
let selectedMoveId = null;
let currentFilter = 'all';

// Carica i dati dal localStorage
function loadData() {
    const savedCards = localStorage.getItem('animalCards');
    const savedArchive = localStorage.getItem('animalArchive');
    
    if (savedCards) {
        cards = JSON.parse(savedCards);
    }
    if (savedArchive) {
        archive = JSON.parse(savedArchive);
    }
}

// Salva i dati nel localStorage
function saveData() {
    localStorage.setItem('animalCards', JSON.stringify(cards));
    localStorage.setItem('animalArchive', JSON.stringify(archive));
}

// Genera un numero casuale a 4 cifre
function generateRandomNumber() {
    return Math.floor(1000 + Math.random() * 9000);
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

// Renderizza tutte le card
function renderCards() {
    if (cards.length === 0) {
        cardsContainer.innerHTML = '<p class="empty-message">Nessuna scheda creata. Premi + per aggiungerne una.</p>';
        return;
    }

    cardsContainer.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.id = card.id;
        cardElement.draggable = true;
        
        // Formatta i numeri (se più di uno, separati da virgola)
        const numbersText = card.numbers.join(', ');
        const weightsCount = card.weights.length;
        
        cardElement.innerHTML = `
            <div class="card-numbers">${numbersText}</div>
            <div class="card-title">Scheda Animale</div>
            <div class="card-info">
                <span class="card-count">${weightsCount} registrazioni</span>
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
        
        cardElement.addEventListener('click', (e) => {
            openWeightModal(card);
        });
        
        cardsContainer.appendChild(cardElement);
    });
}

// Apre il modale per aggiungere una nuova card
function openAddCardModal() {
    cardNumberInput.value = generateRandomNumber();
    addCardModal.classList.add('active');
}

// Chiude il modale per aggiungere una nuova card
function closeAddCardModal() {
    addCardModal.classList.remove('active');
}

// Apre il modale azione per una card
function openActionModal(cardId) {
    currentActionCardId = cardId;
    const card = cards.find(c => c.id === cardId);
    
    if (!card) return;
    
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
    moveSelector.style.display = 'none';
    actionModal.classList.remove('active');
}

// Mostra il selettore per lo spostamento
function showMoveSelector() {
    const card = cards.find(c => c.id === currentActionCardId);
    if (!card || card.numbers.length <= 1) return;
    
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
        case 'deceased':
        case 'released':
            // Archivia la scheda
            const archivedCard = {
                ...card,
                status: action,
                archivedAt: new Date().toISOString().split('T')[0]
            };
            archive.push(archivedCard);
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
            
            // Copia i pesi per l'ID selezionato
            card.weights.forEach(w => {
                const numIndex = card.numbers.indexOf(selectedMoveId);
                if (numIndex !== -1 && w.values[numIndex] !== null && w.values[numIndex] !== undefined) {
                    newCard.weights.push({
                        date: w.date,
                        values: [w.values[numIndex]]
                    });
                }
            });
            
            // Rimuovi l'ID dalla scheda originale
            card.numbers = card.numbers.filter(n => n !== selectedMoveId);
            
            // Se la scheda originale ha ancora ID, aggiorna i pesi
            if (card.numbers.length > 0) {
                const updatedWeights = [];
                card.weights.forEach(w => {
                    const newValues = w.values.filter((_, i) => card.numbers.includes(card.numbers[i]));
                    if (newValues.some(v => v !== null && v !== undefined)) {
                        updatedWeights.push({
                            date: w.date,
                            values: newValues
                        });
                    }
                });
                card.weights = updatedWeights;
                cards[cardIndex] = card;
            } else {
                // Se non ci sono più ID, rimuovi la scheda
                cards.splice(cardIndex, 1);
            }
            
            // Aggiungi la nuova scheda
            cards.push(newCard);
            break;
    }
    
    saveData();
    renderCards();
    closeActionModal();
}

// Apre il modale archivio
function openArchiveModal() {
    renderArchive();
    archiveModal.classList.add('active');
}

// Chiude il modale archivio
function closeArchiveModal() {
    archiveModal.classList.remove('active');
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
        const statusText = item.status === 'deceduto' ? 'Deceduto' : 'Liberato';
        
        cardElement.innerHTML = `
            <div class="archive-card-header">
                <span class="archive-card-numbers">${numbersText}</span>
                <span class="archive-card-status ${item.status}">${statusText}</span>
            </div>
            <div class="archive-card-info">
                Archiviato il: ${formattedDate} | ${item.weights.length} registrazioni
            </div>
        `;
        
        archiveList.appendChild(cardElement);
    });
}

// Apre il modale dei pesi per una card
function openWeightModal(card) {
    // Aggiorna il titolo
    const numbersText = card.numbers.join(', ');
    currentCardTitle.textContent = `Scheda #${numbersText}`;
    cardNumbersDisplay.textContent = `ID: ${numbersText}`;
    
    // Crea le intestazioni della tabella
    weightsTableHead.innerHTML = `
        <tr>
            <th>Data</th>
            ${card.numbers.map(num => `<th>ID ${num}</th>`).join('')}
        </tr>
    `;
    
    // Ottieni tutte le date uniche
    const allDates = new Set();
    card.weights.forEach(w => allDates.add(w.date));
    
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));
    
    // Costruisci la tabella
    weightsTableBody.innerHTML = '';
    
    if (sortedDates.length === 0) {
        emptyWeightsMsg.classList.add('visible');
        weightsTable.style.display = 'none';
    } else {
        emptyWeightsMsg.classList.remove('visible');
        weightsTable.style.display = 'table';
        
        sortedDates.forEach(date => {
            const row = document.createElement('tr');
            const formattedDate = new Date(date).toLocaleDateString('it-IT');
            row.innerHTML = `<td>${formattedDate}</td>`;
            
            // Aggiungi i pesi per ogni ID
            const weightRecord = card.weights.find(w => w.date === date);
            if (weightRecord) {
                card.numbers.forEach((num, index) => {
                    const value = weightRecord.values[index];
                    const cellValue = value !== null && value !== undefined ? `${value} g` : '-';
                    row.innerHTML += `<td>${cellValue}</td>`;
                });
            } else {
                card.numbers.forEach(() => {
                    row.innerHTML += '<td>-</td>';
                });
            }
            
            weightsTableBody.appendChild(row);
        });
    }
    
    // Crea gli input per l'inserimento dei pesi
    weightInputsContainer.innerHTML = '';
    card.numbers.forEach(num => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'weight-input-group';
        inputGroup.innerHTML = `
            <label for="weight-${num}">ID ${num}:</label>
            <input type="number" id="weight-${num}" min="1" step="1" placeholder="Peso in grammi" required>
        `;
        weightInputsContainer.appendChild(inputGroup);
    });
    
    // Imposta la data di default a oggi (formato dd/mm/yyyy)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    weightDateInput.value = `${dd}/${mm}/${yyyy}`;
    
    // Salva il riferimento alla card corrente
    weightModal.dataset.currentCardId = card.id;
    
    weightModal.classList.add('active');
}

// Chiude il modale dei pesi
function closeWeightModal() {
    weightModal.classList.remove('active');
    weightModal.dataset.currentCardId = '';
}

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
    if (isNaN(date.getTime())) {
        alert('Data non valida. Inserisci una data valida nel formato GG/MM/AAAA');
        return;
    }
    
    const dateKey = date.toISOString().split('T')[0];
    
    // Validazione pesi
    const values = [];
    for (const num of card.numbers) {
        const input = document.getElementById(`weight-${num}`);
        const value = parseInt(input.value);
        
        if (isNaN(value) || value <= 0) {
            alert(`Per favore, inserisci un peso valido maggiore di 0 per l'ID ${num}`);
            return;
        }
        values.push(value);
    }
    
    // Controlla se esiste già una registrazione per questa data
    const existingWeightIndex = card.weights.findIndex(w => w.date === dateKey);
    
    if (existingWeightIndex !== -1) {
        // Aggiorna i valori esistenti
        card.weights[existingWeightIndex].values = values;
    } else {
        // Aggiungi nuova registrazione
        card.weights.push({
            date: dateKey,
            values: values
        });
    }
    
    saveData();
    renderCards();
    openWeightModal(card);
}

// Event Listeners
addCardButton.addEventListener('click', openAddCardModal);
removeCardButton.addEventListener('click', () => {
    if (cards.length > 0) {
        openActionModal(null); // Apre il modale per selezionare la card
        // In realtà, dobbiamo chiedere all'utente di selezionare una card prima
        // Per ora, mostriamo un messaggio
        alert('Seleziona una card cliccandoci sopra, poi premi - per aprire le azioni');
    }
});
archiveButton.addEventListener('click', openArchiveModal);
confirmCardBtn.addEventListener('click', () => {
    const number = parseInt(cardNumberInput.value);
    if (isNaN(number) || number < 1000 || number > 9999) {
        alert('Per favore, inserisci un numero valido a 4 cifre');
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
movedBtn.addEventListener('click', showMoveSelector);
confirmActionBtn.addEventListener('click', () => {
    // Determina l'azione in base a quale pulsante è stato cliccato
    // Per semplicità, usiamo un dataset sull'azione selezionata
    executeAction(confirmActionBtn.dataset.action);
});
cancelActionBtn.addEventListener('click', closeActionModal);

// Aggiungi event listeners ai pulsanti azione
deceasedBtn.addEventListener('click', () => {
    confirmActionBtn.dataset.action = 'deceduto';
});
releasedBtn.addEventListener('click', () => {
    confirmActionBtn.dataset.action = 'liberato';
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
addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (addCardModal.classList.contains('active')) {
            closeAddCardModal();
        } else if (weightModal.classList.contains('active')) {
            closeWeightModal();
        } else if (actionModal.classList.contains('active')) {
            closeActionModal();
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
    const cardElement = e.target.closest('.card');
    if (cardElement) {
        const cardId = cardElement.dataset.id;
        
        // Se si clicca sul badge o si tiene premuto, apri il menu azione
        if (e.target.classList.contains('card-group-badge') || e.button === 2) {
            e.preventDefault();
            openActionModal(cardId);
        } else {
            openWeightModal(cards.find(c => c.id === cardId));
        }
    }
});

// Gestione lungo tap per mobile
cardsContainer.addEventListener('touchstart', (e) => {
    const cardElement = e.target.closest('.card');
    if (cardElement) {
        longPressTimer = setTimeout(() => {
            const cardId = cardElement.dataset.id;
            openActionModal(cardId);
        }, 1000);
    }
}, { passive: true });

cardsContainer.addEventListener('touchend', () => {
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
function init() {
    loadData();
    renderCards();
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);
