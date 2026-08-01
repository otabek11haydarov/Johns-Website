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

let currentIndex = 0;
let isFlipped = false;
let selectedChoice = null;

const wordEl = document.getElementById("flashcardWord");
const descriptionEl = document.getElementById("flashcardDescription");
const exampleEl = document.getElementById("flashcardExample");

const renderCard = () => {
  const current = words[currentIndex];

  if (wordEl) wordEl.textContent = current.word;
  if (descriptionEl) descriptionEl.textContent = current.description;
  if (exampleEl) exampleEl.textContent = current.example;
  if (cardCounter) cardCounter.textContent = `${currentIndex + 1} / ${words.length}`;
};

const updateCardState = () => {
  flashcard?.classList.toggle("is-flipped", isFlipped);
  knowButton?.classList.toggle("is-selected", selectedChoice === "know");
  dontKnowButton?.classList.toggle("is-selected", selectedChoice === "dontKnow");

  if (prevWordBtn) prevWordBtn.disabled = currentIndex === 0;
  if (nextWordBtn) nextWordBtn.disabled = currentIndex === words.length - 1;
};

const chooseWord = (choice) => {
  selectedChoice = choice;
  updateCardState();
};

knowButton?.addEventListener("click", () => chooseWord("know"));
dontKnowButton?.addEventListener("click", () => chooseWord("dontKnow"));

rotatebtn?.addEventListener("click", () => {
  isFlipped = !isFlipped;
  updateCardState();
});

const switchWord = (newIndex) => {
  if (newIndex < 0 || newIndex >= words.length) return;
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
