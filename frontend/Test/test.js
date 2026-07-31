const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");
const nextBtn = document.getElementById("nextBtn");
const questionText = document.getElementById("questionText");
const optionInputs = Array.from(document.querySelectorAll('input[name="answer"]'));
const optionBoxes = Array.from(document.querySelectorAll(".option-box"));

const questions = [
  {
    text: "She ____ to school every day.",
    options: ["go", "goes", "going", "gone"],
    answerIndex: 1,
  },
  {
    text: "They ____ football on weekends.",
    options: ["plays", "play", "playing", "played"],
    answerIndex: 1,
  },
  {
    text: "He ____ a new book yesterday.",
    options: ["buy", "buys", "bought", "buying"],
    answerIndex: 2,
  },
];

let currentIndex = 0;

const renderQuestion = () => {
  const currentQuestion = questions[currentIndex];

  if (questionText) {
    questionText.textContent = currentQuestion.text;
  }

  optionBoxes.forEach((box, index) => {
    box.textContent = currentQuestion.options[index];
  });

  optionInputs.forEach((input) => {
    input.checked = false;
  });

  updateSubmitState();
};

const getSelectedInput = () => optionInputs.find((input) => input.checked);

const updateSubmitState = () => {
  if (!submitBtn) return;
  submitBtn.disabled = !getSelectedInput();
};

optionInputs.forEach((input) => {
  input.addEventListener("change", updateSubmitState);
});

clearBtn?.addEventListener("click", () => {
  optionInputs.forEach((input) => {
    input.checked = false;
  });
  updateSubmitState();
});

submitBtn?.addEventListener("click", () => {
  const selected = getSelectedInput();
  if (!selected) return;

  const currentQuestion = questions[currentIndex];
  const selectedIndex = optionInputs.indexOf(selected);
  const isCorrect = selectedIndex === currentQuestion.answerIndex;

  alert(isCorrect ? "Correct answer!" : "Wrong answer, try next question.");
});

nextBtn?.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % questions.length;
  renderQuestion();
});

renderQuestion();
