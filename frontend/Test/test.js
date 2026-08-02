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
  { text: "1. I _____ from Uzbekistan.", options: ["am", "is", "are", "be"], answerIndex: 0 },
  { text: "2. This is my friend. _____ name is Tom.", options: ["Her", "He", "His", "She"], answerIndex: 2 },
  { text: "3. She _____ a car.", options: ["don't have", "doesn't have", "doesn't has", "haven't"], answerIndex: 1 },
  { text: "4. _____ you like tea?", options: ["Are", "Does", "Is", "Do"], answerIndex: 3 },
  { text: "5. We play football _____ Sunday.", options: ["in", "on", "at", "to"], answerIndex: 1 },
  { text: "6. They _____ at home yesterday.", options: ["was", "are", "were", "is"], answerIndex: 2 },
  { text: "7. _____ is your favorite color?", options: ["Who", "Where", "What", "How"], answerIndex: 2 },
  { text: "8. There is _____ milk in the fridge.", options: ["some", "any", "a", "many"], answerIndex: 0 },
  { text: "9. Look at _____ dogs over there!", options: ["this", "that", "these", "those"], answerIndex: 3 },
  { text: "10. Can you _____ me with my homework?", options: ["helps", "to help", "help", "helping"], answerIndex: 2 },
];

const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get('lessonId') || 'default';
const storageKey = `grammar_test_answers_${lessonId}`;
const submittedKey = `grammar_test_submitted_${lessonId}`;

let isSubmitted = localStorage.getItem(submittedKey) === 'true';
let savedAnswers = null;
try { savedAnswers = JSON.parse(localStorage.getItem(storageKey)); } catch(e) {}

let userAnswers = Array.isArray(savedAnswers) && savedAnswers.length === questions.length 
  ? savedAnswers 
  : Array(questions.length).fill(null);

let currentIndex = 0;

// Timer Logic (45 minutes)
let timerSeconds = 45 * 60;
const timerDisplay = document.getElementById("timerDisplay");
const timerBadge = document.getElementById("timerBadge");

const timerInterval = setInterval(() => {
  if (timerSeconds > 0) {
    timerSeconds--;
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const s = (timerSeconds % 60).toString().padStart(2, '0');
    if (timerDisplay) timerDisplay.textContent = `${m}:${s}`;

    if (timerSeconds <= 300 && timerBadge) {
      timerBadge.className = 'timer-badge-pill danger';
    } else if (timerSeconds <= 600 && timerBadge) {
      timerBadge.className = 'timer-badge-pill warning';
    }
  } else {
    clearInterval(timerInterval);
    finishTest();
  }
}, 1000);



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

  notifyParent();
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

const notifyParent = (autoAdvance = false) => {
  const answered = userAnswers.filter((a) => a !== null).length;
  const total = questions.length;

  localStorage.setItem(storageKey, JSON.stringify(userAnswers));
  if (isSubmitted) localStorage.setItem(submittedKey, 'true');

  window.parent.postMessage({
    type: 'GRAMMAR_TEST_PROGRESS',
    answered,
    total,
    isSubmitted,
    autoAdvance,
    userAnswers,
    lessonId
  }, '*');
};

function finishTest() {
  isSubmitted = true;
  if (resultsOverlay) resultsOverlay.style.display = "none";
  notifyParent(true); // Auto advance to next task in parent frame!
}

finishBtn?.addEventListener("click", finishTest);

restartBtn?.addEventListener("click", () => {
  isSubmitted = false;
  userAnswers = Array(questions.length).fill(null);
  currentIndex = 0;
  if (resultsOverlay) resultsOverlay.style.display = "none";
  renderQuestion();
});

// Initial load
renderQuestion();
notifyParent();
