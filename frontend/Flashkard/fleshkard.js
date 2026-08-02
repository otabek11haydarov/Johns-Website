const flashcard = document.getElementById("flashcard");
const knowButton = document.getElementById("knowButton");
const dontKnowButton = document.getElementById("dontKnowButton");
const rotatebtn = document.getElementById("rotatebtn");
const prevWordBtn = document.getElementById("prevWordBtn");
const nextWordBtn = document.getElementById("nextWordBtn");
const cardCounter = document.getElementById("cardCounter");

const words = [
  {
    word: "Beautiful",
    description: "Very attractive or pleasing to look at.",
    example: "She wore a beautiful dress to the party.",
  },
  {
    word: "Brave",
    description: "Showing courage and not being afraid.",
    example: "The brave firefighter saved the child.",
  },
  {
    word: "Quiet",
    description: "Making very little noise.",
    example: "The library was quiet during the exam.",
  },
];

const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get("lessonId") || "default";

let currentDeck = [...words];
let dontKnowWords = [];
let isReviewRound = false;
let currentIndex = 0;
let isFlipped = false;
let selectedChoice = null;

const wordEl = document.getElementById("flashcardWord");
const descriptionEl = document.getElementById("flashcardDescription");
const exampleEl = document.getElementById("flashcardExample");
const reviewBanner = document.getElementById("reviewBanner");

const renderCard = () => {
  if (!currentDeck || !currentDeck.length) return;
  const current = currentDeck[currentIndex];

  if (wordEl) wordEl.textContent = current.word;
  if (descriptionEl) descriptionEl.textContent = current.description;
  if (exampleEl) exampleEl.textContent = current.example;
  if (cardCounter) cardCounter.textContent = `${currentIndex + 1} / ${currentDeck.length}${isReviewRound ? ' (Review)' : ''}`;
};

const updateCardState = () => {
  flashcard?.classList.toggle("is-flipped", isFlipped);
  knowButton?.classList.toggle("is-selected", selectedChoice === "know");
  dontKnowButton?.classList.toggle("is-selected", selectedChoice === "dontKnow");

  if (prevWordBtn) prevWordBtn.disabled = currentIndex === 0;
  if (nextWordBtn) nextWordBtn.disabled = false;
};

const notifyParent = () => {
  localStorage.setItem(`flashcard_dont_know_${lessonId}`, JSON.stringify(dontKnowWords));
  window.parent.postMessage({
    type: 'FLASHCARD_DONT_KNOW_UPDATE',
    dontKnowCount: dontKnowWords.length,
    dontKnowWords,
    lessonId
  }, '*');
};

const chooseWord = (choice) => {
  selectedChoice = choice;
  const currentObj = currentDeck[currentIndex];

  if (choice === "dontKnow") {
    if (currentObj && !dontKnowWords.some(w => w.word === currentObj.word)) {
      dontKnowWords.push(currentObj);
    }
  } else if (choice === "know") {
    if (currentObj) {
      dontKnowWords = dontKnowWords.filter(w => w.word !== currentObj.word);
    }
  }

  notifyParent();
  updateCardState();
};

knowButton?.addEventListener("click", () => chooseWord("know"));
dontKnowButton?.addEventListener("click", () => chooseWord("dontKnow"));

rotatebtn?.addEventListener("click", () => {
  isFlipped = !isFlipped;
  updateCardState();
});

const switchWord = (newIndex) => {
  // Reached the end of the deck
  if (newIndex >= currentDeck.length) {
    if (dontKnowWords.length > 0 && !isReviewRound) {
      // Enter Review Round for "I don't know" words!
      isReviewRound = true;
      currentDeck = [...dontKnowWords];
      currentIndex = 0;
      if (reviewBanner) {
        reviewBanner.textContent = `🔄 Takrorlash bosqichi: Siz "I don't know" deb belgilagan ${dontKnowWords.length} ta so'z qayta ko'rsatilmoqda!`;
        reviewBanner.style.display = "block";
      }
      renderCard();
      updateCardState();
      return;
    } else if (isReviewRound && dontKnowWords.length > 0) {
      // Repeat review deck until mastered
      currentDeck = [...dontKnowWords];
      currentIndex = 0;
      renderCard();
      updateCardState();
      return;
    } else if (isReviewRound && dontKnowWords.length === 0) {
      if (reviewBanner) {
        reviewBanner.textContent = `🎉 Ajoyib! Barcha qiyin so'zlarni muvaffaqiyatli o'rgandingiz!`;
        reviewBanner.className = "alert alert-success py-2 px-3 mt-2 text-center small fw-bold";
      }
      return;
    }
    return;
  }

  if (newIndex < 0) return;

  flashcard?.classList.add("is-advancing");
  currentIndex = newIndex;
  isFlipped = false;
  selectedChoice = null;

  window.setTimeout(() => {
    flashcard?.classList.remove("is-advancing");
    renderCard();
    updateCardState();
  }, 200);
};

prevWordBtn?.addEventListener("click", () => switchWord(currentIndex - 1));
nextWordBtn?.addEventListener("click", () => switchWord(currentIndex + 1));

renderCard();
updateCardState();

// --- TIMER LOGIC (Max 25 min, Min 3 min) ---
const timeRemainingEl = document.getElementById("timeRemaining");
const minTimeStatusEl = document.getElementById("minTimeStatus");

let totalSeconds = 25 * 60; // 25 minutes max
const requiredSeconds = 3 * 60; // 3 minutes minimum
const thresholdSeconds = totalSeconds - requiredSeconds; // 22:00 mark (3 minutes elapsed)

function updateTimerUI() {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  if (timeRemainingEl) timeRemainingEl.textContent = `${m}:${s}`;

  if (minTimeStatusEl) {
    if (totalSeconds <= thresholdSeconds && totalSeconds > 0) {
      minTimeStatusEl.textContent = "✅ Keyingi darsga o'tish mumkin";
      minTimeStatusEl.className = "text-success fw-bold";
    } else if (totalSeconds <= 0) {
      minTimeStatusEl.textContent = "⏱️ 25 daqiqalik vaqt tugadi! Keyingi vazifaga o'tishingiz mumkin.";
      minTimeStatusEl.className = "text-warning fw-bold";
    } else {
      minTimeStatusEl.textContent = "⏱️ Kamida 3 daqiqa ko'rib chiqishingiz kerak";
      minTimeStatusEl.className = "text-muted small";
    }
  }
}

const timerInterval = setInterval(() => {
  if (totalSeconds > 0) {
    totalSeconds--;
    updateTimerUI();
  } else {
    clearInterval(timerInterval);
  }
}, 1000);

updateTimerUI();
