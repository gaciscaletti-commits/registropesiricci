// Dati delle schede e dei pesi
let cards = [];

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
const currentCardNumberSpan = document.getElementById('currentCardNumber');
const weightsList = document.getElementById('weightsList');
const weightDateInput = document.getElementById('weightDate');
const weightValueInput = document.getElementById('weightValue');
const addWeightBtn = document.getElementById('addWeightBtn');
const cancelWeightBtn = document.getElementById('cancelWeightBtn');

// Carica i dati dal localStorage
function loadData() {
    const savedCards = localStorage.getItem('animalCards');
    if (savedCards) {
        cards = JSON.parse(savedCards);
    }
}

// Salva i dati nel localStorage
function saveData() {
    localStorage.setItem('animalCards', JSON.stringify(cards));
}

// Genera un numero casuale a 4 cifre
function generateRandomNumber() {
    return Math.floor(1000 + Math.random() * 9000);
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
        
        const weightsCount = card.weights.length;
        const lastWeight = weightsCount > 0 ? card.weights[weightsCount - 1].value : 'N/A';
        
        cardElement.innerHTML = `
            <div class="card-number">${card.number}</div>
            <div class="card-title">Scheda Animale</div>
            <div class="card-info">
                <span class="card-count">${weightsCount} registrazioni</span>
                <span class="card-arrow">→</span>
            </div>
        `;
        
        cardElement.addEventListener('click', () => openWeightModal(card));
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
    const currentCard = cards.find(c => c.id === card.id);
    if (!currentCard) return;

    currentCardNumberSpan.textContent = currentCard.number;
    
    // Renderizza la lista dei pesi
    if (currentCard.weights.length === 0) {
        weightsList.innerHTML = '<p class="empty-weights">Nessun peso registrato. Aggiungine uno!</p>';
    } else {
        weightsList.innerHTML = '';
        currentCard.weights.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        currentCard.weights.forEach(weight => {
            const weightItem = document.createElement('div');
            weightItem.className = 'weight-item';
            
            const formattedDate = new Date(weight.date).toLocaleDateString('it-IT');
            
            weightItem.innerHTML = `
                <span class="weight-date">${formattedDate}</span>
                <span class="weight-value">${weight.value} g</span>
            `;
            weightsList.appendChild(weightItem);
        });
    }
    
    // Imposta la data di default a oggi
    weightDateInput.value = new Date().toISOString().split('T')[0];
    weightValueInput.value = '';
    weightValueInput.focus();
    
    // Salva il riferimento alla card corrente
    weightModal.dataset.currentCardId = currentCard.id;
    
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
    const currentCard = cards.find(c => c.id === cardId);
    if (!currentCard) return;

    const date = weightDateInput.value;
    const value = parseInt(weightValueInput.value);

    if (!date || isNaN(value) || value <= 0) {
        alert('Per favore, inserisci una data valida e un peso maggiore di 0');
        return;
    }

    currentCard.weights.push({
        date: date,
        value: value
    });
    
    saveData();
    renderCards();
    openWeightModal(currentCard); // Reapri il modale per vedere il nuovo peso
}

// Event Listeners
addCardButton.addEventListener('click', openAddCardModal);
confirmCardBtn.addEventListener('click', () => {
    const number = parseInt(cardNumberInput.value);
    if (isNaN(number) || number < 1000 || number > 9999) {
        alert('Per favore, inserisci un numero valido a 4 cifre');
        return;
    }
    
    // Verifica che il numero non esista già
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

// Inizializza l'applicazione
function init() {
    loadData();
    renderCards();
}

// Avvia l'applicazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', init);
