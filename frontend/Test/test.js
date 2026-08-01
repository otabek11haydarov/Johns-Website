const prevBtn = document.getElementById("prevBtn");
const clearBtn = document.getElementById("clearBtn");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
const questionText = document.getElementById("questionText");
const optionInputs = Array.from(document.querySelectorAll('input[name="answer"]'));
const optionBoxes = Array.from(document.querySelectorAll(".option-box"));

const currentQuestionNum = document.getElementById("currentQuestionNum");
const totalQuestionsNum = document.getElementById("totalQuestionsNum");
const answeredCount = document.getElementById("answeredCount");
const totalCount = document.getElementById("totalCount");
const questionNavPills = document.getElementById("questionNavPills");
const resultsOverlay = document.getElementById("resultsOverlay");
const resultsScore = document.getElementById("resultsScore");
const resultsPercentage = document.getElementById("resultsPercentage");
const restartBtn = document.getElementById("restartBtn");

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
  {
    text: "We have ____ living here since 2018.",
    options: ["be", "being", "been", "was"],
    answerIndex: 2,
  },
  {
    text: "If it rains tomorrow, we ____ at home.",
    options: ["will stay", "stayed", "stays", "would stay"],
    answerIndex: 0,
  },
];

let currentIndex = 0;
let userAnswers = Array(questions.length).fill(null);

const getSelectedInput = () => optionInputs.find((input) => input.checked);

const renderQuestion = () => {
  const currentQuestion = questions[currentIndex];

  if (questionText) {
    questionText.textContent = currentQuestion.text;
  }

  optionBoxes.forEach((box, index) => {
    box.textContent = currentQuestion.options[index];
  });

  const savedAnswerIndex = userAnswers[currentIndex];
  optionInputs.forEach((input, index) => {
    input.checked = savedAnswerIndex === index;
  });

  updateUI();
};

const updateUI = () => {
  const total = questions.length;
  const answered = userAnswers.filter((a) => a !== null).length;

  if (currentQuestionNum) currentQuestionNum.textContent = currentIndex + 1;
  if (totalQuestionsNum) totalQuestionsNum.textContent = total;
  if (answeredCount) answeredCount.textContent = answered;
  if (totalCount) totalCount.textContent = total;

  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex === total - 1;
  if (finishBtn) finishBtn.disabled = answered < total;

  if (questionNavPills) {
    questionNavPills.innerHTML = questions
      .map((_, i) => {
        const isActive = i === currentIndex ? "active" : "";
        const isAnswered = userAnswers[i] !== null ? "is-answered" : "";
        return `<button type="button" class="q-pill ${isActive} ${isAnswered}" data-index="${i}">${i + 1}</button>`;
      })
      .join("");

    questionNavPills.querySelectorAll(".q-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        const idx = parseInt(pill.dataset.index, 10);
        if (!isNaN(idx)) {
          currentIndex = idx;
          renderQuestion();
        }
      });
    });
  }
};

optionInputs.forEach((input, index) => {
  input.addEventListener("change", () => {
    if (input.checked) {
      userAnswers[currentIndex] = index;
    }
    updateUI();
  });
});

clearBtn?.addEventListener("click", () => {
  optionInputs.forEach((input) => (input.checked = false));
  userAnswers[currentIndex] = null;
  updateUI();
});

prevBtn?.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

nextBtn?.addEventListener("click", () => {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
});

finishBtn?.addEventListener("click", () => {
  const total = questions.length;
  let correct = 0;

  userAnswers.forEach((ans, i) => {
    if (ans === questions[i].answerIndex) {
      correct++;
    }
  });

  const percentage = Math.round((correct / total) * 100);

  if (resultsScore) resultsScore.textContent = `${correct} / ${total}`;
  if (resultsPercentage) resultsPercentage.textContent = `Aniqlik: ${percentage}%`;
  if (resultsOverlay) resultsOverlay.style.display = "flex";
});

restartBtn?.addEventListener("click", () => {
  userAnswers = Array(questions.length).fill(null);
  currentIndex = 0;
  if (resultsOverlay) resultsOverlay.style.display = "none";
  renderQuestion();
});

renderQuestion();
