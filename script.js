// Dati delle schede, gruppi e pesi
let cards = [];
let groups = [];

// Elementi DOM
const cardsContainer = document.getElementById('cardsContainer');
const addCardButton = document.getElementById('addCardButton');
const addCardModal = document.getElementById('addCardModal');
const weightModal = document.getElementById('weightModal');

// Elementi modale nuova card
const cardNumberInput = document.getElementById('cardNumber');
const confirmCardBtn = document.getElementById('confirmCardBtn');
const cancelCardBtn = document.getElementById('cancelCardBtn');

// Elementi modale pesi
const currentCardNumbersSpan = document.getElementById('currentCardNumbers');
const weightsTable = document.getElementById('weightsTable');
const weightsTableBody = document.getElementById('weightsTableBody');
const weightHeaders = document.getElementById('weightHeaders');
const emptyWeightsMsg = document.getElementById('emptyWeightsMsg');
const weightDateInput = document.getElementById('weightDate');
const weightInputsContainer = document.getElementById('weightInputsContainer');
const addWeightBtn = document.getElementById('addWeightBtn');
const cancelWeightBtn = document.getElementById('cancelWeightBtn');

// Variabile per il drag & drop
let draggedCard = null;

// Carica i dati dal localStorage
function loadData() {
    const savedCards = localStorage.getItem('animalCards');
    const savedGroups = localStorage.getItem('animalGroups');
    
    if (savedCards) {
        cards = JSON.parse(savedCards);
    }
    if (savedGroups) {
        groups = JSON.parse(savedGroups);
    }
}

// Salva i dati nel localStorage
function saveData() {
    localStorage.setItem('animalCards', JSON.stringify(cards));
    localStorage.setItem('animalGroups', JSON.stringify(groups));
}

// Genera un numero casuale a 4 cifre
function generateRandomNumber() {
    return Math.floor(1000 + Math.random() * 9000);
}

// Trova il gruppo di una card
function getCardGroup(cardId) {
    return groups.find(g => g.cardIds.includes(cardId));
}

// Crea una nuova card
function createCard(number) {
    const newCard = {
        id: Date.now().toString(),
        number: number,
        weights: []
    };
    cards.push(newCard);
    saveData();
    renderCards();
    closeAddCardModal();
}

// Unisce due card in un gruppo
function mergeCards(card1Id, card2Id) {
    const card1 = cards.find(c => c.id === card1Id);
    const card2 = cards.find(c => c.id === card2Id);
    
    if (!card1 || !card2) return;
    
    // Controlla se una delle due fa già parte di un gruppo
    const group1 = getCardGroup(card1Id);
    const group2 = getCardGroup(card2Id);
    
    if (group1 && group2 && group1.id !== group2.id) {
        // Unisce due gruppi esistenti
        const mergedGroup = {
            id: Date.now().toString(),
            cardIds: [...group1.cardIds, ...group2.cardIds]
        };
        groups = groups.filter(g => g.id !== group1.id && g.id !== group2.id);
        groups.push(mergedGroup);
    } else if (group1) {
        // Aggiunge card2 al gruppo di card1
        group1.cardIds.push(card2Id);
    } else if (group2) {
        // Aggiunge card1 al gruppo di card2
        group2.cardIds.push(card1Id);
    } else {
        // Crea un nuovo gruppo con entrambe le card
        const newGroup = {
            id: Date.now().toString(),
            cardIds: [card1Id, card2Id]
        };
        groups.push(newGroup);
    }
    
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
        
        const group = getCardGroup(card.id);
        const groupSize = group ? group.cardIds.length : 1;
        const weightsCount = card.weights.length;
        
        if (group) {
            cardElement.classList.add('in-group');
        }
        
        cardElement.innerHTML = `
            <div class="card-number">${card.number}</div>
            <div class="card-title">Scheda Animale</div>
            <div class="card-info">
                <span class="card-count">${weightsCount} registrazioni</span>
                <span class="card-arrow">→</span>
            </div>
            ${group && group.cardIds.length > 1 ? `
                <div class="card-group-badge">Gruppo (${group.cardIds.length})</div>
            ` : ''}
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
            if (!e.target.classList.contains('card-group-badge')) {
                openWeightModal(card);
            }
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

// Apre il modale dei pesi per una card specifica
function openWeightModal(card) {
    const group = getCardGroup(card.id);
    const groupCards = group ? group.cardIds.map(id => cards.find(c => c.id === id)).filter(c => c) : [card];
    
    // Aggiorna il titolo con tutti i numeri delle card nel gruppo
    const cardNumbers = groupCards.map(c => c.number).join(', ');
    currentCardNumbersSpan.textContent = cardNumbers;
    
    // Crea le intestazioni della tabella
    weightHeaders.innerHTML = groupCards.map(c => `<th>Scheda #${c.number}</th>`).join('');
    
    // Ottieni tutte le date uniche
    const allDates = new Set();
    groupCards.forEach(c => {
        c.weights.forEach(w => allDates.add(w.date));
    });
    
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
            
            groupCards.forEach(c => {
                const weightForDate = c.weights.find(w => w.date === date);
                const cellValue = weightForDate ? `${weightForDate.value} g` : '-';
                row.innerHTML += `<td>${cellValue}</td>`;
            });
            
            weightsTableBody.appendChild(row);
        });
    }
    
    // Crea gli input per l'inserimento dei pesi
    weightInputsContainer.innerHTML = '';
    groupCards.forEach(c => {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'weight-input-group';
        inputGroup.innerHTML = `
            <label for="weight-${c.id}">Scheda #${c.number}:</label>
            <input type="number" id="weight-${c.id}" min="1" step="1" placeholder="Peso in grammi" required>
        `;
        weightInputsContainer.appendChild(inputGroup);
    });
    
    // Imposta la data di default a oggi (formato dd/mm/yyyy)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    weightDateInput.value = `${dd}/${mm}/${yyyy}`;
    weightDateInput.placeholder = 'GG/MM/AAAA';
    
    // Salva il riferimento al gruppo corrente
    weightModal.dataset.currentCardId = card.id;
    weightModal.dataset.groupId = group ? group.id : '';
    
    weightModal.classList.add('active');
}

// Chiude il modale dei pesi
function closeWeightModal() {
    weightModal.classList.remove('active');
    weightModal.dataset.currentCardId = '';
    weightModal.dataset.groupId = '';
}

// Aggiunge un nuovo peso alla card/gruppo corrente
function addWeight() {
    const cardId = weightModal.dataset.currentCardId;
    const groupId = weightModal.dataset.groupId;
    
    const currentCard = cards.find(c => c.id === cardId);
    if (!currentCard) return;
    
    const group = groups.find(g => g.id === groupId);
    const groupCards = group ? group.cardIds.map(id => cards.find(c => c.id === id)).filter(c => c) : [currentCard];
    
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
    const weights = [];
    for (const c of groupCards) {
        const input = document.getElementById(`weight-${c.id}`);
        const value = parseInt(input.value);
        
        if (isNaN(value) || value <= 0) {
            alert(`Per favore, inserisci un peso valido maggiore di 0 per la scheda #${c.number}`);
            return;
        }
        weights.push({ cardId: c.id, value });
    }
    
    // Aggiungi i pesi a ogni card
    for (const w of weights) {
        const card = cards.find(c => c.id === w.cardId);
        if (card) {
            card.weights.push({
                date: dateKey,
                value: w.value
            });
        }
    }
    
    saveData();
    renderCards();
    openWeightModal(currentCard);
}

// Event Listeners
addCardButton.addEventListener('click', openAddCardModal);
confirmCardBtn.addEventListener('click', () => {
    const number = parseInt(cardNumberInput.value);
    if (isNaN(number) || number < 1000 || number > 9999) {
        alert('Per favore, inserisci un numero valido a 4 cifre');
        return;
    }
    
    const numberExists = cards.some(card => card.number === number);
    if (numberExists) {
        alert('Esiste già una scheda con questo numero. Scegline un altro.');
        return;
    }
    
    createCard(number);
});

cancelCardBtn.addEventListener('click', closeAddCardModal);
addWeightBtn.addEventListener('click', addWeight);
cancelWeightBtn.addEventListener('click', closeWeightModal);

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

// Permetti di chiudere con il tasto ESC
addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (addCardModal.classList.contains('active')) {
            closeAddCardModal();
        } else if (weightModal.classList.contains('active')) {
            closeWeightModal();
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

// Inizializza l'applicazione
function init() {
    loadData();
    renderCards();
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);
