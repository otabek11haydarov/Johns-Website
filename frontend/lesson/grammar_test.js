document.addEventListener('DOMContentLoaded', () => {
    // Get taskId from URL query parameters (e.g., ?taskId=123)
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('taskId');
    const studentId = localStorage.getItem('userId');

    // DOM Elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const questionContainer = document.getElementById('questionContainer');
    const resultContainer = document.getElementById('resultContainer');
    const testMain = document.getElementById('testMain');
    const questionCard = document.getElementById('questionCard');
    
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnConfirmSubmit = document.getElementById('btnConfirmSubmit');
    
    const testFooter = document.getElementById('testFooter');
    const resultFooter = document.getElementById('resultFooter');
    
    // State
    let questions = [];
    let currentQuestionIndex = 0;
    let selectedAnswers = {}; // { questionId: selectedOptionId }

    async function loadTest() {
        if (!taskId) {
            alert("No task ID provided.");
            return;
        }

        try {
            const res = await fetch(`${window.BASE_URL || ''}/api/grammar-tests/${taskId}`);
            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Failed to load test.");
            }

            questions = json.data.questions || [];
            
            if (questions.length === 0) {
                alert("No questions found for this test.");
                return;
            }

            loadingSpinner.classList.add('d-none');
            questionContainer.classList.remove('d-none');
            
            renderQuestion();
        } catch (error) {
            alert(error.message);
            loadingSpinner.classList.add('d-none');
        }
    }

    function renderQuestion() {
        // Trigger animation reflow
        questionCard.style.animation = 'none';
        void questionCard.offsetWidth;
        questionCard.style.animation = null;

        const q = questions[currentQuestionIndex];
        
        // Update Progress
        const percent = ((currentQuestionIndex) / questions.length) * 100;
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;

        // Update Question Text
        questionText.textContent = q.questionText;

        // Render Options
        optionsContainer.innerHTML = '';
        
        q.options.forEach((opt, index) => {
            const letter = String.fromCharCode(65 + index);
            const isSelected = selectedAnswers[q.id] === opt.id;
            
            const optDiv = document.createElement('div');
            optDiv.className = `option-item ${isSelected ? 'selected' : ''}`;
            optDiv.innerHTML = `
                <div class="option-radio"></div>
                <span class="option-text fw-bold me-2">${letter})</span>
                <span class="option-text">${opt.optionText}</span>
            `;
            
            optDiv.addEventListener('click', () => {
                selectedAnswers[q.id] = opt.id;
                renderQuestion(); // re-render to update UI (lazy, but fine for small DOM)
            });
            
            optionsContainer.appendChild(optDiv);
        });

        // Update Buttons
        btnPrev.disabled = currentQuestionIndex === 0;
        
        if (currentQuestionIndex === questions.length - 1) {
            btnNext.classList.add('d-none');
            btnSubmit.classList.remove('d-none');
        } else {
            btnNext.classList.remove('d-none');
            btnSubmit.classList.add('d-none');
        }
        
        // Ensure an answer is selected to go next (optional strict validation)
        // btnNext.disabled = !selectedAnswers[q.id];
        // btnSubmit.disabled = !selectedAnswers[q.id];
    }

    // Navigation Events
    btnPrev.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    });

    btnNext.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion();
        }
    });

    btnSubmit.addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('submitConfirmModal'));
        modal.show();
    });

    btnConfirmSubmit.addEventListener('click', async () => {
        const modalEl = document.getElementById('submitConfirmModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        await submitTest();
    });

    async function submitTest() {
        loadingSpinner.classList.remove('d-none');
        questionContainer.classList.add('d-none');
        testFooter.classList.add('d-none');

        try {
            const res = await fetch(`${window.BASE_URL || ''}/api/grammar-tests/${taskId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentId || 'anonymous',
                    answers: selectedAnswers
                })
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Failed to submit test.");
            }

            renderResults(json.data);

        } catch (error) {
            alert(error.message);
            loadingSpinner.classList.add('d-none');
            questionContainer.classList.remove('d-none');
            testFooter.classList.remove('d-none');
        }
    }

    function renderResults(data) {
        loadingSpinner.classList.add('d-none');
        resultContainer.classList.remove('d-none');
        resultFooter.classList.remove('d-none');
        progressBar.style.width = `100%`;

        document.getElementById('resultScore').textContent = `Score: ${Math.round(data.percentage)}%`;
        document.getElementById('resultText').textContent = `You got ${data.score} out of ${data.totalQuestions} correct.`;

        const feedbackList = document.getElementById('feedbackList');
        feedbackList.innerHTML = '';

        data.gradedAnswers.forEach((ans, index) => {
            const q = questions.find(qu => qu.id === ans.questionId);
            const serverQ = data.questions.find(qu => qu.id === ans.questionId);
            
            const isCorrect = ans.isCorrect;
            
            let html = `
                <div class="feedback-item">
                    <div class="feedback-header">
                        <span class="feedback-status ${isCorrect ? 'correct' : 'incorrect'}">
                            <i class="bi ${isCorrect ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i> 
                            Question ${index + 1}
                        </span>
                    </div>
                    <div class="feedback-question mb-3">${q.questionText}</div>
                    <div class="options-container">
            `;
            
            q.options.forEach(opt => {
                let optClass = 'option-item';
                let iconHtml = '<div class="option-radio"></div>';
                
                // Readonly states
                if (opt.id === serverQ.correctOptionId) {
                    optClass += ' correct';
                    iconHtml = '<i class="bi bi-check text-white me-3 fs-5"></i>';
                } else if (opt.id === ans.selectedOptionId && !isCorrect) {
                    optClass += ' incorrect';
                    iconHtml = '<i class="bi bi-x text-white me-3 fs-5"></i>';
                }
                
                // Show user choice if it wasn't correct (already handled above) but if they didn't choose anything?
                // Just dim unselected if we want
                
                html += `
                    <div class="${optClass} pe-none">
                        ${iconHtml}
                        <span class="option-text">${opt.optionText}</span>
                    </div>
                `;
            });
            
            html += `</div>`;
            
            if (serverQ.explanation) {
                html += `
                    <div class="feedback-explanation">
                        <strong>Explanation:</strong> ${serverQ.explanation}
                    </div>
                `;
            }
            
            html += `</div>`;
            feedbackList.innerHTML += html;
        });
    }

    // Start
    loadTest();
});
