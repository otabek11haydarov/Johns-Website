const flashcard = document.getElementById("flashcard");
const knowButton = document.getElementById("knowButton");
const dontKnowButton = document.getElementById("dontKnowButton");
const routeButton = document.getElementById("routeButton");
const nextButton = document.getElementById("nextButton");

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
let hasChoice = false;

const wordEl = document.getElementById("flashcardWord");
const backWordEl = document.getElementById("flashcardBackWord");
const descriptionEl = document.getElementById("flashcardDescription");
const exampleEl = document.getElementById("flashcardExample");
const hintEl = document.querySelector(".flashcard-hint");

const renderCard = () => {
  const current = words[currentIndex];

  if (wordEl) wordEl.textContent = current.word;
  if (backWordEl) backWordEl.textContent = current.word;
  if (descriptionEl) descriptionEl.textContent = current.description;
  if (exampleEl) exampleEl.textContent = current.example;
  if (hintEl) hintEl.textContent = "Choose if you know the word or want the meaning.";
};

const updateCardState = () => {
  flashcard?.classList.toggle("is-flipped", isFlipped);
  if (nextButton) {
    nextButton.disabled = !hasChoice;
  }
};

const resetForNextWord = () => {
  hasChoice = false;
  isFlipped = false;
  renderCard();
  updateCardState();
};

const chooseWord = () => {
  hasChoice = true;
  isFlipped = false;
  updateCardState();
};

knowButton?.addEventListener("click", chooseWord);
dontKnowButton?.addEventListener("click", chooseWord);

routeButton?.addEventListener("click", () => {
  isFlipped = !isFlipped;
  updateCardState();
});

nextButton?.addEventListener("click", () => {
  if (nextButton.disabled) return;
  flashcard?.classList.add("is-advancing");
  currentIndex = (currentIndex + 1) % words.length;
  window.setTimeout(() => {
    flashcard?.classList.remove("is-advancing");
    resetForNextWord();
  }, 220);
});

renderCard();
updateCardState();
