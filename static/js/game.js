// ===============================
//        GAME STATE
// ===============================
console.log("GAME JS LOADED");

let selectedCards = [];
const MAX_CARDS = 5;
const BEZOS_VALUE = 150; // billion

let lastPreviewCard = null;
let timeLeft = 40;
let previewPhase = true;

// ===============================
//        CARD DATA
// ===============================
const cardData = [
    { name: "Investor", value: 5 },
    { name: "Startup", value: 8 },
    { name: "Founder", value: 12 },
    { name: "VC", value: 15 },
    { name: "Tech CEO", value: 30 },
    { name: "Billionaire", value: 40 }
];

// Create 24 cards (duplicate + shuffle)
let cards = [];
while (cards.length < 24) {
    cards.push(cardData[Math.floor(Math.random() * cardData.length)]);
}
cards = shuffle(cards);

// ===============================
//        SHUFFLE
// ===============================
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ===============================
//        CARD HANDLING
// ===============================
const cardElements = document.querySelectorAll(".card");

cardElements.forEach((card, index) => {
    card.addEventListener("click", () => handleCardClick(card, index));
});

function handleCardClick(card, index) {

    const cardBack = card.querySelector(".card-back");

    // -------- PREVIEW PHASE --------
    if (previewPhase) {

        // Close previous preview card
        if (lastPreviewCard && lastPreviewCard !== card) {
            lastPreviewCard.classList.remove("flipped");
            lastPreviewCard.querySelector(".card-back").innerHTML = "";
        }

        // Flip current card
        card.classList.add("flipped");
        cardBack.innerHTML = `
            <strong>${cards[index].name}</strong><br>
            ${cards[index].value}B
        `;

        lastPreviewCard = card;
        return;
    }

    // -------- SELECTION PHASE --------
    if (selectedCards.length >= MAX_CARDS) return;

    if (!card.classList.contains("selected")) {
        card.classList.add("selected");
        selectedCards.push(cards[index].value);
    }

    // Auto finish after 5 picks
    if (selectedCards.length === MAX_CARDS) {
        calculateResult();
    }
}

// ===============================
//        TIMER
// ===============================
const timerElement = document.getElementById("timer");

const timer = setInterval(() => {
    timeLeft--;
    timerElement.innerText = timeLeft;

    if (timeLeft === 0) {
        clearInterval(timer);
        endPreviewPhase();
    }
}, 1000);

// ===============================
//        END PREVIEW
// ===============================
function endPreviewPhase() {
    previewPhase = false;

    cardElements.forEach(card => {
        card.classList.remove("flipped");
        card.querySelector(".card-back").innerHTML = "";
    });

    lastPreviewCard = null;

    const btn = document.getElementById("choose-btn");
    if (btn) btn.style.display = "inline-block";
}

// ===============================
//        RESULT
// ===============================
function calculateResult() {
    let total = selectedCards.reduce((a, b) => a + b, 0);
    let status = total >= BEZOS_VALUE ? "win" : "lose";

    fetch("/submit_score", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            score: total,
            status: status
        })
    })
    .then(res => res.json())
    .then(() => {
        window.location.href = "/result";
    });
}
