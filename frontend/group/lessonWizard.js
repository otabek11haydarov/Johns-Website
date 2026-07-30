/**
 * Enterprise Lesson Creation Wizard Logic
 */

class GrammarBuilder {
    constructor(rootElementId) {
        this.rootElementId = rootElementId;
        this.questions = [];
        this.activeIndex = 0;
        
        // Add a default first question
        this.addQuestion();
    }

    addQuestion() {
        this.questions.push({
            questionText: '',
            explanation: '',
            options: [
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false }
            ]
        });
        this.activeIndex = this.questions.length - 1;
    }

    deleteQuestion(index) {
        if (this.questions.length <= 1) {
            alert('A grammar test must have at least 1 question.');
            return;
        }
        this.questions.splice(index, 1);
        if (this.activeIndex >= this.questions.length) {
            this.activeIndex = this.questions.length - 1;
        }
        this.render();
    }

    duplicateQuestion(index) {
        if (this.questions.length >= 50) {
            alert('A grammar test can have a maximum of 50 questions.');
            return;
        }
        const toCopy = JSON.parse(JSON.stringify(this.questions[index]));
        this.questions.splice(index + 1, 0, toCopy);
        this.activeIndex = index + 1;
        this.render();
    }

    setActive(index) {
        this.saveCurrentState(); // Save before switching
        this.activeIndex = index;
        this.render();
    }

    saveCurrentState() {
        const root = document.getElementById(this.rootElementId);
        if (!root) return;
        
        const currentQ = this.questions[this.activeIndex];
        const qText = root.querySelector('.grammar-q-text')?.value || '';
        const expText = root.querySelector('.grammar-q-exp')?.value || '';
        
        currentQ.questionText = qText;
        currentQ.explanation = expText;
        
        const optionInputs = root.querySelectorAll('.grammar-opt-text');
        const radioInputs = root.querySelectorAll('.grammar-opt-radio');
        
        for (let i = 0; i < 4; i++) {
            if (currentQ.options[i]) {
                currentQ.options[i].optionText = optionInputs[i]?.value || '';
                currentQ.options[i].isCorrect = radioInputs[i]?.checked || false;
            }
        }
    }

    validate() {
        this.saveCurrentState();
        
        if (this.questions.length < 10) {
            alert('Grammar tests must contain between 10 and 50 questions. You currently have ' + this.questions.length);
            return false;
        }
        if (this.questions.length > 50) {
            alert('Grammar tests must contain between 10 and 50 questions. You currently have ' + this.questions.length);
            return false;
        }

        // Validate each question
        for (let i = 0; i < this.questions.length; i++) {
            const q = this.questions[i];
            if (!q.questionText.trim()) {
                alert(`Question ${i + 1} is missing the question text.`);
                this.setActive(i);
                return false;
            }
            
            let hasCorrect = false;
            for (let j = 0; j < 4; j++) {
                if (!q.options[j].optionText.trim()) {
                    alert(`Question ${i + 1}, Option ${String.fromCharCode(65 + j)} is empty.`);
                    this.setActive(i);
                    return false;
                }
                if (q.options[j].isCorrect) {
                    hasCorrect = true;
                }
            }

            if (!hasCorrect) {
                alert(`Question ${i + 1} must have exactly one correct answer selected.`);
                this.setActive(i);
                return false;
            }
        }

        return true;
    }

    getQuestions() {
        this.saveCurrentState();
        return this.questions;
    }

    render() {
        const root = document.getElementById(this.rootElementId);
        if (!root) return;
        
        const q = this.questions[this.activeIndex];
        
        // Validation status for sidebar
        const getStatus = (question) => {
            if (!question.questionText.trim()) return '⚠';
            let hasCorrect = false;
            for (let j = 0; j < 4; j++) {
                if (!question.options[j].optionText.trim()) return '⚠';
                if (question.options[j].isCorrect) hasCorrect = true;
            }
            return hasCorrect ? '✔' : '⚠';
        };

        const sidebarHtml = this.questions.map((question, i) => {
            const status = getStatus(question);
            const statusClass = status === '✔' ? 'text-success' : 'text-warning';
            const activeClass = i === this.activeIndex ? 'active' : '';
            return `
                <div class="grammar-sidebar-item ${activeClass}" onclick="window.grammarBuilder.setActive(${i})">
                    <span>Q${i + 1}</span>
                    <span class="${statusClass}">${status}</span>
                </div>
            `;
        }).join('');

        const optionsHtml = q.options.map((opt, j) => {
            const letter = String.fromCharCode(65 + j);
            return `
                <div class="d-flex align-items-center mb-2">
                    <div class="form-check me-3">
                        <input class="form-check-input grammar-opt-radio" type="radio" name="correctOption_${this.activeIndex}" ${opt.isCorrect ? 'checked' : ''}>
                    </div>
                    <span class="me-2 fw-bold">${letter})</span>
                    <input type="text" class="form-control grammar-opt-text" value="${opt.optionText.replace(/"/g, '&quot;')}" placeholder="Option ${letter}">
                </div>
            `;
        }).join('');

        root.innerHTML = `
            <div class="grammar-builder-container">
                <div class="grammar-sidebar">
                    ${sidebarHtml}
                    <button type="button" class="btn btn-outline-primary btn-sm mt-3 w-100" onclick="
                        window.grammarBuilder.saveCurrentState();
                        if(window.grammarBuilder.questions.length >= 50) {
                            alert('Maximum 50 questions reached.');
                        } else {
                            window.grammarBuilder.addQuestion();
                            window.grammarBuilder.render();
                        }
                    ">+ Add Question</button>
                    <button type="button" class="btn btn-outline-secondary btn-sm mt-2 w-100" onclick="window.bulkImportManager.openModal()">Bulk Import</button>
                    
                    <div class="mt-4 pt-3 border-top text-center text-muted small">
                        ${this.questions.length}/50 Questions
                    </div>
                </div>
                
                <div class="grammar-editor">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="m-0">Question ${this.activeIndex + 1} of ${this.questions.length}</h5>
                        <div>
                            <button type="button" class="btn btn-sm btn-outline-secondary me-2" onclick="window.grammarBuilder.duplicateQuestion(${this.activeIndex})">Duplicate</button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.grammarBuilder.deleteQuestion(${this.activeIndex})">Delete</button>
                        </div>
                    </div>
                    
                    <div class="form-group mb-3">
                        <label>Sentence / Question Text</label>
                        <textarea class="form-control grammar-q-text" rows="2" placeholder="e.g. She ____ to school every day.">${q.questionText}</textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label class="mb-2">Options (Select the correct one)</label>
                        ${optionsHtml}
                    </div>
                    
                    <div class="form-group mb-4">
                        <label>Explanation (Optional)</label>
                        <textarea class="form-control grammar-q-exp" rows="2" placeholder="Explain why the answer is correct...">${q.explanation}</textarea>
                    </div>
                    
                    <div class="d-flex justify-content-between border-top pt-3">
                        <button type="button" class="btn btn-outline-secondary" ${this.activeIndex === 0 ? 'disabled' : ''} onclick="window.grammarBuilder.setActive(${this.activeIndex - 1})">Previous Question</button>
                        <button type="button" class="btn btn-primary" ${this.activeIndex === this.questions.length - 1 ? 'disabled' : ''} onclick="window.grammarBuilder.setActive(${this.activeIndex + 1})">Next Question</button>
                    </div>
                </div>
            </div>
        `;
    }
}

class BulkImportManager {
    constructor() {
        this.parsedQuestions = [];
    }

    openModal() {
        this.parsedQuestions = [];
        document.getElementById('bulkTextQuestions').value = '';
        document.getElementById('bulkTextAnswers').value = '';
        document.getElementById('excelFileInput').value = '';
        document.getElementById('excelFileName').classList.add('d-none');
        document.getElementById('bulkTextPreview').innerHTML = '<div class="text-muted text-center pt-5">Awaiting parse...</div>';
        document.getElementById('bulkExcelPreview').innerHTML = '<div class="text-muted text-center pt-5">Upload a file to preview...</div>';
        document.getElementById('btnConfirmBulkImport').disabled = true;

        const modal = new bootstrap.Modal(document.getElementById('bulkImportModal'));
        modal.show();
    }

    parseText() {
        const textQ = document.getElementById('bulkTextQuestions').value.trim();
        const textA = document.getElementById('bulkTextAnswers').value.trim();

        if (!textQ) {
            alert('Please paste the questions.');
            return;
        }

        // ── Parse correct answers ──────────────────────────────────────────────
        let answersArray = [];
        if (textA) {
            // Support "1. B", "1) B", "B\n", "B, B, A" — grab every standalone A-D letter
            const ansMatches = textA.match(/\b([A-D])\b/gi);
            if (ansMatches) {
                answersArray = ansMatches.map(m => m.toUpperCase());
            }
        }

        // ── Normalize compact single-line text ─────────────────────────────────
        // Teachers often paste from Word/ChatGPT where everything is on one line.
        // We insert newlines to make the state machine work correctly.
        // Strategy:
        //   1. Insert \n before option markers like " A) " " B) " preceded by a space
        //   2. Insert \n before question numbers like "2." "3)" that follow a letter/punct
        //      (handles "Am2." → "Am\n2." where 2. starts the next question)
        const normalizeText = (raw) => {
            let t = raw;
            // Step 1 — insert newline before " A) " style options (space + single letter + paren + space)
            t = t.replace(/ (?=\b[A-D]\) )/g, '\n');
            t = t.replace(/ (?=\b[A-D]\. )/g, '\n');
            // Step 2 — insert newline before "2." "3)" etc. that follow a word char/punct
            // e.g. "Am2.They" → "Am\n2.They", "have3.Where" → "have\n3.Where"
            t = t.replace(/([a-zA-Z?!.;,])(\d+[\.\)])(?!\d)/g, '$1\n$2');
            return t;
        };

        const normalizedText = normalizeText(textQ);

        // ── Line-by-line state machine parser ─────────────────────────────────
        // Unlike regex split(), this cannot mis-fire on option text that happens
        // to contain letters like A/B/C/D or embedded numbers like "Am2."
        const lines = normalizedText.split(/\r?\n/);

        // Matches the START of a new question: "1.", "2)", "Q3.", "Question 4"
        const questionStartRe = /^\s*(?:\d+[\.)][\s]*|Q\d+\.?\s*|Question\s*\d+\.?\s*)/i;
        // Matches an option AT THE VERY START of a line: "A.", "A)", "(A)"
        const optionLineRe = /^\s*\(?([A-D])\)?[\.)][\s]+/i;

        this.parsedQuestions = [];
        let currentQ = null;   // { lines[], A, B, C, D }
        let optionKey = null;  // null | 'A' | 'B' | 'C' | 'D'

        const finalizeQ = () => {
            if (!currentQ) return;
            const qText = currentQ.lines.join(' ').trim();
            const options = [
                { optionText: (currentQ.A || '').trim(), isCorrect: false },
                { optionText: (currentQ.B || '').trim(), isCorrect: false },
                { optionText: (currentQ.C || '').trim(), isCorrect: false },
                { optionText: (currentQ.D || '').trim(), isCorrect: false },
            ];
            this.parsedQuestions.push({ questionText: qText, explanation: '', options });
        };

        for (const rawLine of lines) {
            // ① Is this the start of a new question?
            const qMatch = rawLine.match(questionStartRe);
            if (qMatch) {
                finalizeQ();
                currentQ = { lines: [], A: '', B: '', C: '', D: '' };
                optionKey = null;
                const remainder = rawLine.slice(qMatch[0].length).trim();
                if (remainder) currentQ.lines.push(remainder);
                continue;
            }

            // Skip lines before the first question is found
            if (!currentQ) continue;

            // ② Is this an option line (A./B./C./D. at LINE START)?
            const optMatch = rawLine.match(optionLineRe);
            if (optMatch) {
                const letter = optMatch[1].toUpperCase();
                const remainder = rawLine.slice(optMatch[0].length).trim();
                optionKey = letter;
                currentQ[letter] = remainder;
                continue;
            }

            // ③ Continuation — append to whatever we are currently building
            const trimmed = rawLine.trim();
            if (!trimmed) continue;  // skip blank lines
            if (optionKey) {
                currentQ[optionKey] += ' ' + trimmed;
            } else {
                currentQ.lines.push(trimmed);
            }
        }

        finalizeQ();  // commit the last question

        console.log(`[Bulk Import] Parsed ${this.parsedQuestions.length} questions from text.`);

        // ── Assign correct answers ─────────────────────────────────────────────
        this.parsedQuestions.forEach((q, index) => {
            if (answersArray[index]) {
                const correctIndex = answersArray[index].charCodeAt(0) - 65; // A=0, B=1…
                if (correctIndex >= 0 && correctIndex < 4) {
                    q.options[correctIndex].isCorrect = true;
                }
            }
        });

        this.renderPreview('bulkTextPreview');
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        document.getElementById('excelFileName').textContent = `Selected: ${file.name}`;
        document.getElementById('excelFileName').classList.remove('d-none');

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            // xlsx library is from CDN
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }); // array of arrays

            if (jsonData.length < 2) {
                document.getElementById('bulkExcelPreview').innerHTML = '<div class="text-danger text-center pt-5">File is empty or invalid format.</div>';
                return;
            }

            // Find column indices
            const headers = jsonData[0].map(h => String(h).toLowerCase());
            const qIdx = headers.findIndex(h => h.includes('question'));
            const optAIdx = headers.findIndex(h => h.includes('option a') || h === 'a');
            const optBIdx = headers.findIndex(h => h.includes('option b') || h === 'b');
            const optCIdx = headers.findIndex(h => h.includes('option c') || h === 'c');
            const optDIdx = headers.findIndex(h => h.includes('option d') || h === 'd');
            const ansIdx = headers.findIndex(h => h.includes('correct') || h.includes('answer'));
            const expIdx = headers.findIndex(h => h.includes('explanation'));

            if (qIdx === -1 || optAIdx === -1 || ansIdx === -1) {
                document.getElementById('bulkExcelPreview').innerHTML = '<div class="text-danger text-center pt-5">Missing required columns (Question, Option A, Correct Answer).</div>';
                return;
            }

            this.parsedQuestions = [];

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || !row[qIdx]) continue; // Skip empty rows

                const qText = row[qIdx];
                const optA = row[optAIdx] || '';
                const optB = row[optBIdx] || '';
                const optC = row[optCIdx] || '';
                const optD = row[optDIdx] || '';
                const correctAns = String(row[ansIdx] || '').trim().toUpperCase();
                const exp = expIdx !== -1 ? (row[expIdx] || '') : '';

                const options = [
                    { optionText: String(optA), isCorrect: correctAns === 'A' },
                    { optionText: String(optB), isCorrect: correctAns === 'B' },
                    { optionText: String(optC), isCorrect: correctAns === 'C' },
                    { optionText: String(optD), isCorrect: correctAns === 'D' }
                ];

                this.parsedQuestions.push({
                    questionText: String(qText),
                    explanation: String(exp),
                    options: options
                });
            }

            this.renderPreview('bulkExcelPreview');
        };
        reader.readAsArrayBuffer(file);
    }

    renderPreview(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (this.parsedQuestions.length === 0) {
            container.innerHTML = '<div class="text-muted text-center pt-5">No questions parsed.</div>';
            document.getElementById('btnConfirmBulkImport').disabled = true;
            return;
        }

        let hasBlocker = false;

        this.parsedQuestions.forEach((q, idx) => {
            let errors = [];   // blockers (red)
            let warnings = []; // soft warnings (yellow)

            // BLOCKER: question text must not be empty
            if (!q.questionText.trim()) errors.push("Missing question text");

            // Count how many options have text
            const filledOpts = q.options.filter(o => o.optionText.trim()).length;
            
            // BLOCKER: must have at least 2 options (A and B minimum)
            if (filledOpts < 2) {
                errors.push(`Only ${filledOpts} option(s) found — minimum 2 required`);
            }

            // WARNING only (not a blocker): correct answer not set yet
            const hasCorrect = q.options.some(o => o.isCorrect);
            if (!hasCorrect) {
                warnings.push("No correct answer pre-selected — you can set it after import");
            }

            const isValid = errors.length === 0;
            if (!isValid) hasBlocker = true;

            const div = document.createElement('div');
            div.className = `preview-item ${isValid ? 'valid' : 'invalid'}`;

            let html = `<div class="preview-item-title">Question ${idx + 1}</div>`;
            if (errors.length === 0 && warnings.length === 0) {
                html += `<div class="preview-item-success">✔ Parsed successfully</div>`;
            } else {
                errors.forEach(err => {
                    html += `<div class="preview-item-error">✖ ${err}</div>`;
                });
                warnings.forEach(w => {
                    html += `<div class="preview-item-warning">⚠ ${w}</div>`;
                });
            }
            div.innerHTML = html;
            container.appendChild(div);
        });

        // Add summary
        const summary = document.createElement('div');
        summary.className = "mt-3 pt-3 border-top border-secondary text-center";
        let summaryHtml = `<strong>Total Questions: ${this.parsedQuestions.length}</strong>`;
        
        if (this.parsedQuestions.length > 50) {
            summaryHtml += `<div class="text-danger mt-1">Error: Maximum 50 questions allowed.</div>`;
            hasBlocker = true;
        } else if (!hasBlocker) {
            summaryHtml += `<div class="text-success mt-1">✔ Ready to import</div>`;
        }
        summary.innerHTML = summaryHtml;
        container.appendChild(summary);

        document.getElementById('btnConfirmBulkImport').disabled = hasBlocker;
    }

    commitImport() {
        if (!window.grammarBuilder) return;
        
        let existing = window.grammarBuilder.questions || [];
        
        // If the current builder only has 1 completely empty question, we replace it. Otherwise, append.
        if (existing.length === 1 && !existing[0].questionText.trim() && !existing[0].options.some(o => o.optionText.trim())) {
            existing = [];
        }

        window.grammarBuilder.questions = [...existing, ...this.parsedQuestions];
        
        // Ensure we don't exceed 50 questions in state
        if (window.grammarBuilder.questions.length > 50) {
            window.grammarBuilder.questions = window.grammarBuilder.questions.slice(0, 50);
            alert("Warning: Only the first 50 questions were kept due to the maximum limit.");
        }

        console.log(`[Bulk Import] Re-rendering grammar builder with ${window.grammarBuilder.questions.length} questions.`);
        
        // Switch to the first newly imported question
        window.grammarBuilder.activeIndex = existing.length; 
        if (window.grammarBuilder.activeIndex >= window.grammarBuilder.questions.length) {
            window.grammarBuilder.activeIndex = 0;
        }

        window.grammarBuilder.render();

        const modalEl = document.getElementById('bulkImportModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.bulkImportManager = new BulkImportManager();
    
    // Bind Bulk Import Modal events
    const btnParseText = document.getElementById('btnParseText');
    if (btnParseText) {
        btnParseText.addEventListener('click', () => window.bulkImportManager.parseText());
    }

    const excelFileInput = document.getElementById('excelFileInput');
    if (excelFileInput) {
        excelFileInput.addEventListener('change', (e) => window.bulkImportManager.handleFileUpload(e));
    }
    
    const excelDropzone = document.getElementById('excelDropzone');
    if (excelDropzone) {
        excelDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            excelDropzone.classList.add('dragover');
        });
        excelDropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            excelDropzone.classList.remove('dragover');
        });
        excelDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            excelDropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                excelFileInput.files = e.dataTransfer.files;
                excelFileInput.dispatchEvent(new Event('change'));
            }
        });
    }

    const btnConfirmBulkImport = document.getElementById('btnConfirmBulkImport');
    if (btnConfirmBulkImport) {
        btnConfirmBulkImport.addEventListener('click', () => window.bulkImportManager.commitImport());
    }

    // Ensure this script only runs on pages with the wizard modal
    const modalElement = document.getElementById('lessonWizardModal');
    if (!modalElement) return;

    // --- State Management ---
    const _initUrlParams = new URLSearchParams(window.location.search);
    const _initUrlLevel = _initUrlParams.get('level');
    let wizardEditingLessonId = null; // null = creating, string = editing
    let wizardState = {
        lessonInfo: {
            title: '',
            description: '',
            groupLevel: (window.TaskManagerPage && window.TaskManagerPage.currentGroup)
                || (window.TaskManagerPage && window.TaskManagerPage.resolveGroup && window.TaskManagerPage.resolveGroup(_initUrlLevel))
                || _initUrlLevel
                || 'A1'
        },
        selectedTasks: [], // Array of task types e.g. ['VIDEO', 'VOCABULARY']
        taskConfigs: {}    // e.g. { VIDEO: { videoUrl: '', duration: 0 } }
    };

    let AVAILABLE_TASKS = [];

    const API_BASE = window.API_BASE_URL || 'http://localhost:5000/api';

    async function loadTaskTypes() {
        try {
            const res = await fetch(`${API_BASE}/task-types`);
            if (!res.ok) throw new Error('Failed to load task types');
            const data = await res.json();
            
            AVAILABLE_TASKS = data.map(t => ({
                id: t.code,
                label: t.name,
                icon: t.icon,
                desc: t.description || '',
                color: t.color || '#6b7280'
            }));
        } catch (err) {
            console.error('[LessonWizard] Error loading task types:', err);
            if (window.showToast) {
                window.showToast('Could not connect to server. Please reload the page.', 'danger');
            } else {
                alert('Could not load task types from server. Please check if the backend is running and reload the page.');
            }
        }
    }

    // Wizard Flow Steps
    let currentStepIndex = 0;
    // Step IDs: 'lessonInfo', 'selectTasks', ...dynamicTaskSteps, 'preview'
    let stepsFlow = ['lessonInfo', 'selectTasks', 'preview'];

    // DOM Elements
    const btnNext = document.getElementById('wizardBtnNext');
    const btnBack = document.getElementById('wizardBtnBack');
    const btnFinish = document.getElementById('wizardBtnFinish');
    const stepperContainer = document.getElementById('wizardStepper');
    const dynamicStepsContainer = document.getElementById('wizardDynamicStepsContainer');
    
    const inputLessonTitle = document.getElementById('wizardLessonTitle');
    const inputLessonDesc = document.getElementById('wizardLessonDesc');
    
    // Step 2 Elements
    const taskSelectionGrid = document.getElementById('wizardTaskSelectionGrid');
    const selectedTasksList = document.getElementById('wizardSelectedTasksList');
    const noTasksEmptyState = document.getElementById('wizardNoTasksEmptyState');
    const btnOpenTaskPicker = document.getElementById('btnOpenTaskPicker');
    const taskPickerModalEl = document.getElementById('taskPickerModal');
    let taskPickerModal = null;
    
    if (taskPickerModalEl) {
        taskPickerModal = new bootstrap.Modal(taskPickerModalEl);
    }
    
    if (btnOpenTaskPicker) {
        btnOpenTaskPicker.addEventListener('click', () => {
            if (taskPickerModal) taskPickerModal.show();
        });
    }

    // Init function
    async function initWizard() {
        await loadTaskTypes();
        renderTaskSelectionGrid();
        updateWizardFlow();
        renderStepper();
        showCurrentStep();
    }

    // --- Event Listeners ---
    
    // Trigger initialization when modal opens
    modalElement.addEventListener('show.bs.modal', () => {
        // Get group level from URL params first, then from TaskManagerPage
        const urlParams = new URLSearchParams(window.location.search);
        const urlLevel = urlParams.get('level');
        const resolvedGroup = (window.TaskManagerPage && window.TaskManagerPage.currentGroup)
            || (window.TaskManagerPage && window.TaskManagerPage.resolveGroup && window.TaskManagerPage.resolveGroup(urlLevel))
            || urlLevel
            || 'A1';
        if (!wizardEditingLessonId) {
            wizardState.lessonInfo.groupLevel = resolvedGroup;
        }
        // Update modal title
        const modalTitleEl = modalElement.querySelector('.modal-title');
        if (modalTitleEl) {
            modalTitleEl.textContent = wizardEditingLessonId ? 'Edit Lesson' : 'Create New Lesson';
        }
        currentStepIndex = 0;
        updateWizardFlow();
        renderStepper();
        showCurrentStep();

        // Pre-populate form inputs if editing
        if (wizardEditingLessonId) {
            // Use a short delay so the DOM is ready after showCurrentStep
            setTimeout(() => {
                if (inputLessonTitle) inputLessonTitle.value = wizardState.lessonInfo.title;
                if (inputLessonDesc)  inputLessonDesc.value  = wizardState.lessonInfo.description;
                renderTaskSelectionGrid();
            }, 200);
        } else {
            // Reset form inputs for new lesson
            if (inputLessonTitle) inputLessonTitle.value = '';
            if (inputLessonDesc)  inputLessonDesc.value  = '';
            wizardState.selectedTasks = [];
            wizardState.taskConfigs   = {};
            updateWizardFlow();
            renderTaskSelectionGrid();
        }
    });


    modalElement.addEventListener('hidden.bs.modal', () => {
        // Reset editing state when wizard is closed
        wizardEditingLessonId = null;
    });

    btnNext.addEventListener('click', () => {
        if (validateCurrentStep()) {
            saveCurrentStepData();
            if (currentStepIndex < stepsFlow.length - 1) {
                currentStepIndex++;
                if (stepsFlow[currentStepIndex] === 'preview') {
                    renderPreview();
                }
                showCurrentStep();
                renderStepper();
            }
        }
    });

    btnBack.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            saveCurrentStepData();
            currentStepIndex--;
            showCurrentStep();
            renderStepper();
        }
    });

    btnFinish.addEventListener('click', async () => {
        // Submit to API — create or update
        btnFinish.disabled = true;
        btnFinish.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

        try {
            let response, data;

            if (wizardEditingLessonId) {
                // ── UPDATE existing lesson (title, description, status, task order) ──
                const payload = {
                    title: wizardState.lessonInfo.title,
                    description: wizardState.lessonInfo.description,
                    tasks: wizardState.selectedTasks.map((taskId, index) => {
                        return {
                            type: taskId,
                            order: index + 1,
                            config: wizardState.taskConfigs[taskId] || {}
                        };
                    })
                };
                response = await fetch(`${API_BASE}/lessons/${wizardEditingLessonId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                data = await response.json();

                if (response.ok) {
                    const bsModal = bootstrap.Modal.getInstance(modalElement);
                    bsModal.hide();
                    if (window.LessonLibrary && typeof window.LessonLibrary.refresh === 'function') {
                        window.LessonLibrary.refresh();
                    }
                    // Show success toast if available
                    const container = document.getElementById('toastContainer');
                    if (container) {
                        const el = document.createElement('div');
                        el.className = 'toast align-items-center text-bg-success border-0 show';
                        el.setAttribute('role', 'alert');
                        el.innerHTML = '<div class="d-flex"><div class="toast-body">Lesson updated successfully!</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
                        container.appendChild(el);
                        setTimeout(() => el.remove(), 3500);
                    }
                } else {
                    alert('Error updating lesson: ' + (data.error || data.message));
                }
            } else {
                // ── CREATE new lesson via wizard ──
                const payload = {
                    title: wizardState.lessonInfo.title,
                    description: wizardState.lessonInfo.description,
                    groupLevel: wizardState.lessonInfo.groupLevel,
                    tasks: wizardState.selectedTasks.map((taskId, index) => {
                        return {
                            type: taskId,
                            order: index + 1,
                            config: wizardState.taskConfigs[taskId] || {}
                        };
                    })
                };

                response = await fetch(`${API_BASE}/lessons/wizard`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                data = await response.json();

                if (response.ok) {
                    const bsModal = bootstrap.Modal.getInstance(modalElement);
                    bsModal.hide();
                    if (window.LessonLibrary && typeof window.LessonLibrary.refresh === 'function') {
                        window.LessonLibrary.refresh();
                    } else if (window.TaskManagerPage && window.TaskManagerPage.loadTasks) {
                        window.TaskManagerPage.loadTasks();
                    }
                    const container = document.getElementById('toastContainer');
                    if (container) {
                        const el = document.createElement('div');
                        el.className = 'toast align-items-center text-bg-success border-0 show';
                        el.setAttribute('role', 'alert');
                        el.innerHTML = '<div class="d-flex"><div class="toast-body">Lesson created successfully!</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
                        container.appendChild(el);
                        setTimeout(() => el.remove(), 3500);
                    }
                } else {
                    alert('Error creating lesson: ' + (data.error || data.message));
                }
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to the server.');
        } finally {
            btnFinish.disabled = false;
            btnFinish.innerHTML = wizardEditingLessonId ? 'Save Changes' : 'Finish & Save Lesson';
        }
    });

    // --- Core Logic ---

    function updateWizardFlow() {
        // Base flow
        stepsFlow = ['lessonInfo', 'selectTasks'];
        
        // Add dynamic steps based on selected tasks order
        wizardState.selectedTasks.forEach(taskId => {
            stepsFlow.push(`taskConfig_${taskId}`);
        });
        
        // Final step
        stepsFlow.push('preview');
    }

    function showCurrentStep() {
        const currentStepId = stepsFlow[currentStepIndex];
        let nextStepEl;
        
        if (currentStepId.startsWith('taskConfig_')) {
            nextStepEl = document.getElementById(`wizardStep-${currentStepId}`);
            if (!nextStepEl) {
                nextStepEl = generateDynamicTaskStep(currentStepId);
            }
        } else {
            nextStepEl = document.getElementById(`wizardStep-${currentStepId}`);
        }

        const activeSteps = document.querySelectorAll('.wizard-step:not(.d-none)');
        
        activeSteps.forEach(el => {
            el.classList.remove('fade-in');
            el.classList.add('fade-out');
        });

        // Delay to allow fade-out animation
        setTimeout(() => {
            activeSteps.forEach(el => {
                el.classList.add('d-none');
                el.classList.remove('fade-out');
            });
            
            nextStepEl.classList.remove('d-none');
            // Trigger reflow to ensure animation runs
            void nextStepEl.offsetWidth;
            nextStepEl.classList.add('fade-in');

            // Update Buttons
            btnBack.style.display = currentStepIndex === 0 ? 'none' : 'block';
            
            if (currentStepIndex === stepsFlow.length - 1) {
                btnNext.style.display = 'none';
                btnFinish.style.display = 'block';
            } else {
                btnNext.style.display = 'block';
                btnFinish.style.display = 'none';
            }
        }, 150);
    }

    function renderStepper() {
        stepperContainer.innerHTML = '';
        
        const displaySteps = [];
        displaySteps.push({ id: 'lessonInfo', label: 'Lesson Info' });
        displaySteps.push({ id: 'selectTasks', label: 'Select Tasks' });
        
        wizardState.selectedTasks.forEach(taskId => {
            const taskDef = AVAILABLE_TASKS.find(t => t.id === taskId);
            displaySteps.push({ 
                id: `taskConfig_${taskId}`, 
                label: taskDef ? taskDef.label : taskId 
            });
        });
        
        displaySteps.push({ id: 'preview', label: 'Preview' });

        displaySteps.forEach((step, index) => {
            let statusClass = '';
            if (index < currentStepIndex) statusClass = 'completed';
            else if (index === currentStepIndex) statusClass = 'active';

            const indicator = document.createElement('div');
            indicator.className = `wizard-step-item ${statusClass}`;
            
            let badgeContent = index < currentStepIndex ? '<i class="bi bi-check-lg"></i>' : (index + 1);
            
            indicator.innerHTML = `
                <span class="wizard-step-item-label">${index + 1}. ${step.label}</span>
                <span class="wizard-step-item-badge">${badgeContent}</span>
            `;

            indicator.addEventListener('click', () => {
                if (index <= currentStepIndex || validateCurrentStep()) {
                    saveCurrentStepData();
                    currentStepIndex = index;
                    if (stepsFlow[currentStepIndex] === 'preview') {
                        renderPreview();
                    }
                    showCurrentStep();
                    renderStepper();
                }
            });
            
            stepperContainer.appendChild(indicator);
        });

        const subTitleEl = document.getElementById('wizardHeaderSubtitle');
        if (subTitleEl) {
            subTitleEl.textContent = `Step ${currentStepIndex + 1} of ${displaySteps.length} — ${displaySteps[currentStepIndex]?.label || ''}`;
        }
    }

    function validateCurrentStep() {
        const currentStepId = stepsFlow[currentStepIndex];
        
        if (currentStepId === 'lessonInfo') {
            if (!inputLessonTitle.value.trim()) {
                inputLessonTitle.classList.add('is-invalid');
                return false;
            }
            inputLessonTitle.classList.remove('is-invalid');
            return true;
        }
        
        if (currentStepId === 'selectTasks') {
            if (wizardState.selectedTasks.length === 0) {
                alert('Please select at least one task to continue.');
                return false;
            }
            return true;
        }

        if (currentStepId.startsWith('taskConfig_')) {
            const taskId = currentStepId.replace('taskConfig_', '');
            if (taskId === 'GRAMMAR') {
                if (window.grammarBuilder) {
                    return window.grammarBuilder.validate();
                }
            }
            return true;
        }

        return true;
    }

    function renderCardRowHtml(stepId, index, card = {}) {
        const isWarning = card.warning || card.found === false;
        const pos = card.partOfSpeech || card.pos || "";
        const pronunciation = card.pronunciation || "";
        const def = card.def || card.definition || "";
        const ex = card.ex || card.example || card.exampleSentence || "";
        const hasNoExample = !ex && card.word && !isWarning;

        return `
            <div class="flashcard-card-row ${isWarning ? 'has-warning' : ''}" id="cardRow-${stepId}-${index}">
                <div class="flashcard-card-row-title">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                        <span class="fw-bold">Card ${index + 1}</span>
                        ${pos ? `<span class="badge badge-pos">${escapeHtml(pos)}</span>` : ''}
                        ${pronunciation ? `<span class="badge badge-ipa">${escapeHtml(pronunciation)}</span>` : ''}
                        ${isWarning ? `<span class="warning-card-pill"><i class="bi bi-exclamation-triangle-fill"></i> No definition found</span>` : ''}
                        ${hasNoExample ? `<span class="badge-no-example"><i class="bi bi-info-circle"></i> No example provided by Oxford.</span>` : ''}
                    </div>
                    <div class="d-flex gap-2">
                        <button type="button" class="flashcard-remove-card-btn text-info" onclick="duplicateFlashcardRow('${stepId}', ${index})" title="Duplicate Card"><i class="bi bi-copy"></i> Duplicate</button>
                        ${index > 0 ? `<button type="button" class="flashcard-remove-card-btn" onclick="removeFlashcardRow('${stepId}', ${index})" title="Remove Card"><i class="bi bi-trash"></i> Remove</button>` : ''}
                    </div>
                </div>
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label small text-muted m-0">Word</label>
                        <input type="text" class="form-control dark-input fc-input-word" data-index="${index}" value="${escapeHtml(card.word || '')}" placeholder="Enter word" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-muted m-0">Pronunciation (IPA)</label>
                        <input type="text" class="form-control dark-input fc-input-pronunciation" data-index="${index}" value="${escapeHtml(pronunciation)}" placeholder="/IPA/">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-muted m-0">Part of Speech</label>
                        <input type="text" class="form-control dark-input fc-input-pos" data-index="${index}" value="${escapeHtml(pos)}" placeholder="noun / verb / etc.">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-muted m-0">Definition</label>
                        <input type="text" class="form-control dark-input fc-input-def" data-index="${index}" value="${escapeHtml(def)}" placeholder="Enter definition">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-muted m-0">Example Sentence</label>
                        <input type="text" class="form-control dark-input fc-input-ex" data-index="${index}" value="${escapeHtml(ex)}" placeholder="Enter an example sentence">
                    </div>
                </div>
            </div>
        `;
    }

    window.parseWordList = function(text) {
        if (!text || typeof text !== 'string') return [];
        const lines = text.split(/[\r\n,;]+/);
        const words = [];
        const seen = new Set();

        for (let line of lines) {
            // Strip numbering like 1., 2), 3 - etc.
            let clean = line.trim().replace(/^[0-9]+[\.\)\-]\s*/, '').replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim();
            if (!clean) continue;

            // Handle space-separated tokens if pasted plain text
            const subWords = clean.split(/\s+/);
            for (let w of subWords) {
                let finalWord = w.trim().replace(/^[^\w\s]+|[^\w\s]+$/g, '').trim();
                if (finalWord && !seen.has(finalWord.toLowerCase())) {
                    seen.add(finalWord.toLowerCase());
                    words.push(finalWord);
                }
            }
        }

        return words;
    };

    window.onBulkTextareaInput = function(stepId) {
        const textarea = document.getElementById(`bulkTextarea-${stepId}`);
        const badge = document.getElementById(`bulkWordCountBadge-${stepId}`);
        if (!textarea || !badge) return;

        const words = parseWordList(textarea.value);
        badge.textContent = `Imported Words: ${words.length}`;
    };

    window.duplicateFlashcardRow = function(stepId, index) {
        const row = document.getElementById(`cardRow-${stepId}-${index}`);
        if (!row) return;

        const card = {
            word: row.querySelector('.fc-input-word')?.value || '',
            pronunciation: row.querySelector('.fc-input-pronunciation')?.value || '',
            partOfSpeech: row.querySelector('.fc-input-pos')?.value || '',
            def: row.querySelector('.fc-input-def')?.value || '',
            ex: row.querySelector('.fc-input-ex')?.value || ''
        };

        const container = document.getElementById(`cardsListContainer-${stepId}`);
        if (!container) return;

        const currentCount = container.querySelectorAll('.flashcard-card-row').length;
        const newRowHtml = renderCardRowHtml(stepId, currentCount, card);
        container.insertAdjacentHTML('beforeend', newRowHtml);

        const badge = document.getElementById(`cardCountBadge-${stepId}`);
        if (badge) badge.textContent = `${currentCount + 1} Cards`;

        const tabCount = document.getElementById(`tabCardCount-${stepId}`);
        if (tabCount) tabCount.textContent = `${currentCount + 1}`;
    };

    window.removeFlashcardRow = function(stepId, index) {
        const row = document.getElementById(`cardRow-${stepId}-${index}`);
        if (row) row.remove();
        const container = document.getElementById(`cardsListContainer-${stepId}`);
        if (container) {
            const remaining = container.querySelectorAll('.flashcard-card-row').length;
            const badge = document.getElementById(`cardCountBadge-${stepId}`);
            if (badge) badge.textContent = `${remaining} Cards`;
            const tabCount = document.getElementById(`tabCardCount-${stepId}`);
            if (tabCount) tabCount.textContent = `${remaining}`;
        }
    };

    window.addFlashcardRow = function(stepId) {
        const container = document.getElementById(`cardsListContainer-${stepId}`);
        if (!container) return;
        const currentCount = container.querySelectorAll('.flashcard-card-row').length;
        const newRowHtml = renderCardRowHtml(stepId, currentCount, { word: '', def: '', ex: '', pronunciation: '', partOfSpeech: '' });
        container.insertAdjacentHTML('beforeend', newRowHtml);
        const badge = document.getElementById(`cardCountBadge-${stepId}`);
        if (badge) badge.textContent = `${currentCount + 1} Cards`;
        const tabCount = document.getElementById(`tabCardCount-${stepId}`);
        if (tabCount) tabCount.textContent = `${currentCount + 1}`;
    };

    window.bulkGenerateFlashcards = async function(stepId) {
        const textarea = document.getElementById(`bulkTextarea-${stepId}`);
        if (!textarea) return;

        const words = parseWordList(textarea.value);
        if (words.length === 0) {
            alert("Please paste or type at least one word to generate flashcards.");
            return;
        }

        const btnGenerate = document.getElementById(`btnGenerateBulk-${stepId}`);
        const progressWrapper = document.getElementById(`bulkProgressWrapper-${stepId}`);
        const countText = document.getElementById(`progressCountText-${stepId}`);
        const currentWordText = document.getElementById(`progressCurrentWord-${stepId}`);
        const barFill = document.getElementById(`progressBarFill-${stepId}`);
        const estTimeText = document.getElementById(`progressEstTime-${stepId}`);
        const summaryStats = document.getElementById(`bulkSummaryStats-${stepId}`);

        if (btnGenerate) btnGenerate.disabled = true;
        if (progressWrapper) progressWrapper.classList.remove('d-none');
        if (summaryStats) summaryStats.classList.add('d-none');

        // Simulate progress updates for smooth UX
        let completedCount = 0;
        const totalWords = words.length;
        if (countText) countText.textContent = `0 / ${totalWords}`;
        if (barFill) barFill.style.width = '5%';

        const startTime = Date.now();
        const interval = setInterval(() => {
            if (completedCount < totalWords) {
                completedCount = Math.min(completedCount + Math.ceil(totalWords / 8), totalWords - 1);
                const currentWord = words[completedCount] || words[0];
                const pct = Math.round((completedCount / totalWords) * 90);
                if (barFill) barFill.style.width = `${pct}%`;
                if (countText) countText.textContent = `${completedCount} / ${totalWords}`;
                if (currentWordText) currentWordText.textContent = `Current: ${currentWord}`;

                const elapsedSec = (Date.now() - startTime) / 1000;
                const remSec = Math.max(1, Math.round((elapsedSec / (completedCount || 1)) * (totalWords - completedCount)));
                if (estTimeText) estTimeText.textContent = `Est. remaining: ~${remSec}s`;
            }
        }, 220);

        try {
            const API_URL = window.API_BASE_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/dictionary/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ words })
            });

            clearInterval(interval);
            if (barFill) barFill.style.width = '100%';
            if (countText) countText.textContent = `${totalWords} / ${totalWords}`;
            if (currentWordText) currentWordText.textContent = 'Completed!';
            if (estTimeText) estTimeText.textContent = 'Est. remaining: 0s';

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate definitions');
            }

            const cards = data.cards || [];
            const container = document.getElementById(`cardsListContainer-${stepId}`);

            if (container && cards.length > 0) {
                container.innerHTML = cards.map((c, idx) => renderCardRowHtml(stepId, idx, {
                    word: c.word,
                    def: c.definition,
                    ex: c.example,
                    pronunciation: c.pronunciation,
                    partOfSpeech: c.partOfSpeech,
                    warning: c.warning,
                    found: c.found
                })).join('');

                const badge = document.getElementById(`cardCountBadge-${stepId}`);
                if (badge) badge.textContent = `${cards.length} Cards`;
                const tabCount = document.getElementById(`tabCardCount-${stepId}`);
                if (tabCount) tabCount.textContent = `${cards.length}`;
            }

            // Show UX Summary Stats
            if (summaryStats) {
                summaryStats.classList.remove('d-none');
                document.getElementById(`statImported-${stepId}`).textContent = data.total || words.length;
                document.getElementById(`statGenerated-${stepId}`).textContent = data.generated || 0;
                document.getElementById(`statFailed-${stepId}`).textContent = data.failed || 0;
            }

            // Auto switch tab to Cards Editor after 800ms
            setTimeout(() => {
                const editorTabBtn = document.getElementById(`tab-editor-${stepId}`);
                if (editorTabBtn) {
                    const tab = new bootstrap.Tab(editorTabBtn);
                    tab.show();
                }
                if (progressWrapper) progressWrapper.classList.add('d-none');
            }, 800);

        } catch (err) {
            clearInterval(interval);
            console.error('[Bulk Generate] Error:', err);
            alert(err.message || 'Failed to connect to Oxford Dictionary backend.');
            if (progressWrapper) progressWrapper.classList.add('d-none');
        } finally {
            if (btnGenerate) btnGenerate.disabled = false;
        }
    };

    function saveCurrentStepData() {
        const currentStepId = stepsFlow[currentStepIndex];
        
        if (currentStepId === 'lessonInfo') {
            wizardState.lessonInfo.title = inputLessonTitle.value.trim();
            wizardState.lessonInfo.description = inputLessonDesc.value.trim();
        }
        
        if (currentStepId.startsWith('taskConfig_')) {
            const taskId = currentStepId.replace('taskConfig_', '');
            
            if (!wizardState.taskConfigs[taskId]) {
                wizardState.taskConfigs[taskId] = {};
            }
            
            if (taskId === 'GRAMMAR') {
                if (window.grammarBuilder) {
                    wizardState.taskConfigs[taskId].questions = window.grammarBuilder.getQuestions();
                }
            } else if (taskId === 'FLASHCARD' || taskId === 'VOCABULARY') {
                const stepForm = document.getElementById(`form-${currentStepId}`);
                if (stepForm) {
                    const deckNameInput = stepForm.querySelector('input[name="deckName"]');
                    const cards = [];
                    const rowEls = stepForm.querySelectorAll('.flashcard-card-row');
                    rowEls.forEach(row => {
                        const word = row.querySelector('.fc-input-word')?.value.trim() || '';
                        const pronunciation = row.querySelector('.fc-input-pronunciation')?.value.trim() || '';
                        const partOfSpeech = row.querySelector('.fc-input-pos')?.value.trim() || '';
                        const def = row.querySelector('.fc-input-def')?.value.trim() || '';
                        const ex = row.querySelector('.fc-input-ex')?.value.trim() || '';
                        if (word || def || ex) {
                            cards.push({ word, pronunciation, partOfSpeech, def, ex });
                        }
                    });
                    wizardState.taskConfigs[taskId] = {
                        deckName: deckNameInput?.value.trim() || 'Vocabulary Deck',
                        cards: cards.length ? cards : [{ word: '', pronunciation: '', partOfSpeech: '', def: '', ex: '' }]
                    };
                }
            } else {
                const form = document.getElementById(`form-${currentStepId}`);
                if (form) {
                    const formData = new FormData(form);
                    for (let [key, value] of formData.entries()) {
                        wizardState.taskConfigs[taskId][key] = value;
                    }
                }
            }
        }
    }

    // --- Step 2: Task Selection Logic ---

    function renderTaskSelectionGrid() {
        taskSelectionGrid.innerHTML = '';
        
        AVAILABLE_TASKS.forEach(task => {
            const isSelected = wizardState.selectedTasks.includes(task.id);
            
            const card = document.createElement('div');
            card.className = `wizard-task-card ${isSelected ? 'selected' : ''}`;
            card.dataset.taskId = task.id;
            
            card.innerHTML = `
                <i class="bi ${task.icon} wizard-task-card-icon"></i>
                <h5 class="wizard-task-card-title">${task.label}</h5>
                <div class="wizard-task-card-check"><i class="bi bi-check"></i></div>
            `;
            
            card.addEventListener('click', () => toggleTaskSelection(task.id));
            taskSelectionGrid.appendChild(card);
        });
        
        renderSelectedTasksList();
    }

    function toggleTaskSelection(taskId) {
        const index = wizardState.selectedTasks.indexOf(taskId);
        if (index > -1) {
            // Remove
            wizardState.selectedTasks.splice(index, 1);
            // Also clean up config
            delete wizardState.taskConfigs[taskId];
            // Remove generated step element
            const stepEl = document.getElementById(`wizardStep-taskConfig_${taskId}`);
            if (stepEl) stepEl.remove();
        } else {
            // Add
            wizardState.selectedTasks.push(taskId);
        }
        
        updateWizardFlow();
        renderTaskSelectionGrid();
    }

    function renderSelectedTasksList() {
        if (!selectedTasksList) return;
        selectedTasksList.innerHTML = '';
        
        if (wizardState.selectedTasks.length === 0) {
            if (noTasksEmptyState) noTasksEmptyState.style.display = 'block';
            return;
        } else {
            if (noTasksEmptyState) noTasksEmptyState.style.display = 'none';
        }
        
        wizardState.selectedTasks.forEach((taskId, index) => {
            const taskDef = AVAILABLE_TASKS.find(t => t.id === taskId);
            
            const item = document.createElement('div');
            item.className = 'selected-task-item';
            
            item.innerHTML = `
                <div class="selected-task-drag-handle" data-index="${index}">
                    <i class="bi bi-grip-vertical"></i>
                </div>
                <div class="selected-task-order">${index + 1}</div>
                <div class="selected-task-name">${taskDef ? taskDef.label : taskId}</div>
                <div class="selected-task-actions">
                    <button type="button" class="selected-task-action-btn move-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
                        <i class="bi bi-arrow-up"></i>
                    </button>
                    <button type="button" class="selected-task-action-btn move-down" data-index="${index}" ${index === wizardState.selectedTasks.length - 1 ? 'disabled' : ''}>
                        <i class="bi bi-arrow-down"></i>
                    </button>
                    <button type="button" class="selected-task-action-btn text-danger ms-2 remove-task" data-task-id="${taskId}">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            `;
            
            selectedTasksList.appendChild(item);
        });

        // Add reorder listeners
        document.querySelectorAll('.move-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                if (idx > 0) {
                    swapTasks(idx, idx - 1);
                }
            });
        });
        
        document.querySelectorAll('.move-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                if (idx < wizardState.selectedTasks.length - 1) {
                    swapTasks(idx, idx + 1);
                }
            });
        });

        document.querySelectorAll('.remove-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.taskId;
                toggleTaskSelection(id);
            });
        });
    }

    function swapTasks(idx1, idx2) {
        const temp = wizardState.selectedTasks[idx1];
        wizardState.selectedTasks[idx1] = wizardState.selectedTasks[idx2];
        wizardState.selectedTasks[idx2] = temp;
        
        updateWizardFlow();
        renderTaskSelectionGrid();
    }

    // --- Dynamic Steps Logic ---

    function generateDynamicTaskStep(stepId) {
        const taskId = stepId.replace('taskConfig_', '');
        const taskDef = AVAILABLE_TASKS.find(t => t.id === taskId);
        const label = taskDef ? taskDef.label : taskId;
        
        const stepDiv = document.createElement('div');
        stepDiv.id = `wizardStep-${stepId}`;
        stepDiv.className = 'wizard-step wizard-dynamic-step d-none';
        
        // Base structure
        let html = `
            <h4 class="mb-4">Configure ${label} Task</h4>
            <form id="form-${stepId}">
        `;

        // Render fields based on task type
        // In a real app, these schemas would be more robust.
        switch(taskId) {
            case 'VIDEO':
                html += `
                    <div class="form-group mb-3">
                        <label>Video URL <span class="text-danger">*</span></label>
                        <input type="url" class="form-control" name="videoUrl" placeholder="https://youtube.com/..." required>
                    </div>
                    <div class="form-group mb-3">
                        <label>Duration (minutes)</label>
                        <input type="number" class="form-control" name="duration" min="1">
                    </div>
                `;
                break;
            case 'FLASHCARD':
            case 'VOCABULARY':
                const existingConfig = wizardState.taskConfigs[taskId] || {};
                const existingCards = Array.isArray(existingConfig.cards) && existingConfig.cards.length > 0
                    ? existingConfig.cards
                    : [{ word: '', def: '', ex: '', pronunciation: '', partOfSpeech: '' }];
                const deckNameVal = existingConfig.deckName || '';

                html += `
                    <div class="form-group mb-4">
                        <label class="form-label text-light fw-bold mb-2">Deck Name <span class="text-danger">*</span></label>
                        <input type="text" class="form-control dark-input" name="deckName" value="${escapeHtml(deckNameVal)}" placeholder="e.g. Unit 1 Vocabulary" required>
                    </div>

                    <!-- Mode Nav Tabs -->
                    <ul class="nav nav-tabs custom-tabs mb-4" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active fw-bold text-light" id="tab-bulk-${stepId}" data-bs-toggle="tab" data-bs-target="#panel-bulk-${stepId}" type="button" role="tab">
                                🚀 Bulk Import & Auto-Generate (Oxford)
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link text-light" id="tab-editor-${stepId}" data-bs-toggle="tab" data-bs-target="#panel-editor-${stepId}" type="button" role="tab">
                                ✍️ Cards Editor (<span id="tabCardCount-${stepId}">${existingCards.length}</span>)
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content">
                        <!-- Panel 1: Bulk Import & Auto-Generate -->
                        <div class="tab-pane fade show active" id="panel-bulk-${stepId}" role="tabpanel">
                            <div class="bulk-import-container">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label text-white fw-bold m-0">Paste Words List</label>
                                    <span class="badge badge-oxford rounded-pill px-3 py-1" id="bulkWordCountBadge-${stepId}">
                                        Imported Words: 0
                                    </span>
                                </div>
                                <p class="text-muted small mb-3">
                                    Paste words copied from Oxford/Cambridge word lists, PDFs, Word, or Excel. Numbers (e.g. <code>1. achievement</code>), duplicates, and extra whitespace will be automatically cleaned!
                                </p>

                                <textarea class="bulk-textarea" id="bulkTextarea-${stepId}" placeholder="achievement&#10;ability&#10;abroad&#10;accept&#10;...or paste numbered lists (e.g. 1. achievement)" oninput="onBulkTextareaInput('${stepId}')"></textarea>

                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <span class="text-muted small"><i class="bi bi-shield-check text-warning"></i> Powered by Oxford Dictionary API & Fallback Engine</span>
                                    <button type="button" class="btn btn-primary btn-shine px-4 py-2" id="btnGenerateBulk-${stepId}" onclick="bulkGenerateFlashcards('${stepId}')">
                                        ✨ Generate Flashcards
                                    </button>
                                </div>

                                <!-- Progress Bar Wrapper (Initially Hidden) -->
                                <div class="bulk-progress-wrapper d-none" id="bulkProgressWrapper-${stepId}">
                                    <div class="d-flex justify-content-between align-items-center small text-white fw-bold">
                                        <span>Generating Flashcards... <span id="progressCountText-${stepId}" class="badge bg-warning text-dark ms-2">0 / 0</span></span>
                                        <span id="progressCurrentWord-${stepId}" class="text-warning">Current: -</span>
                                    </div>
                                    <div class="bulk-progress-bar-track">
                                        <div class="bulk-progress-bar-fill" id="progressBarFill-${stepId}"></div>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center small text-muted">
                                        <span><i class="bi bi-cpu"></i> Max 5 concurrent requests active</span>
                                        <span id="progressEstTime-${stepId}">Est. remaining: calc...</span>
                                    </div>
                                </div>

                                <!-- UX Generation Stats Summary -->
                                <div class="bulk-stats-bar mt-3 d-none" id="bulkSummaryStats-${stepId}">
                                    <span class="text-white small"><strong>Imported:</strong> <span id="statImported-${stepId}">0</span></span>
                                    <span class="text-success small"><strong>Generated:</strong> <span id="statGenerated-${stepId}">0</span></span>
                                    <span class="text-warning small"><strong>Failed / Warnings:</strong> <span id="statFailed-${stepId}">0</span></span>
                                </div>
                            </div>
                        </div>

                        <!-- Panel 2: Cards Editor List -->
                        <div class="tab-pane fade" id="panel-editor-${stepId}" role="tabpanel">
                            <div class="flashcards-block-container mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <h5 class="m-0 text-white fw-bold">Flashcards Block</h5>
                                    <span class="badge rounded-pill bg-warning text-dark px-3 py-2" id="cardCountBadge-${stepId}">${existingCards.length} Cards</span>
                                </div>
                                <div id="cardsListContainer-${stepId}">
                                    ${existingCards.map((card, idx) => renderCardRowHtml(stepId, idx, card)).join('')}
                                </div>
                                <button type="button" class="btn-add-another-card mt-3" onclick="addFlashcardRow('${stepId}')">
                                    <i class="bi bi-plus-lg"></i> Add another card
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 'SPEAKING':
                html += `
                    <div class="form-group mb-3">
                        <label>Speaking Text / Prompt</label>
                        <p class="text-muted small mb-2">Paste the text the student needs to read, or the speaking topic.</p>
                        <textarea class="form-control" name="prompt" rows="8" placeholder="Paste text here..." required></textarea>
                    </div>
                `;
                break;
            case 'WRITING':
                html += `
                    <div class="form-group mb-3">
                        <label>Prompt / Question</label>
                        <textarea class="form-control" name="prompt" rows="3" required></textarea>
                    </div>
                    <div class="form-group mb-3">
                        <label>Word Limit</label>
                        <input type="number" class="form-control" name="limit" placeholder="e.g. 250">
                    </div>
                `;
                break;
            case 'READING':
                html += `
                    <div class="form-group mb-3">
                        <label>Text Content</label>
                        <textarea class="form-control" name="text" rows="5" required></textarea>
                    </div>
                `;
                break;
            case 'LISTENING':
                html += `
                    <div class="form-group mb-3">
                        <label>Audio URL</label>
                        <input type="url" class="form-control" name="audioUrl" required>
                    </div>
                `;
                break;
            case 'GRAMMAR':
                html += `
                    <div id="grammar-builder-root"></div>
                `;
                break;
            default:
                // Generic fallback (TEST, etc.)
                html += `
                    <div class="form-group mb-3">
                        <label>Task Description / Instructions</label>
                        <textarea class="form-control" name="description" rows="3"></textarea>
                    </div>
                    <p class="text-muted small">Detailed questions can be added later.</p>
                `;
        }
        
        html += `</form>`;
        stepDiv.innerHTML = html;
        
        dynamicStepsContainer.appendChild(stepDiv);

        // Initialize GrammarBuilder if this is a GRAMMAR task
        if (taskId === 'GRAMMAR') {
            window.grammarBuilder = new GrammarBuilder('grammar-builder-root');
            window.grammarBuilder.render();
        }

        return stepDiv;
    }

    // --- Preview Step ---
    function renderPreview() {
        document.getElementById('previewLessonTitle').textContent = wizardState.lessonInfo.title;
        document.getElementById('previewLessonDesc').textContent = wizardState.lessonInfo.description || 'No description provided.';

        const taskFlowContainer = document.getElementById('previewTaskFlow');
        taskFlowContainer.innerHTML = '';
        
        if (wizardState.selectedTasks.length === 0) {
            taskFlowContainer.innerHTML = '<p class="text-muted">No tasks selected.</p>';
            return;
        }

        const taskColors = {
            'VIDEO':      '#3b82f6',
            'VOCABULARY': '#8b5cf6',
            'FLASHCARD':  '#ec4899',
            'READING':    '#10b981',
            'LISTENING':  '#f59e0b',
            'WRITING':    '#ef4444',
            'SPEAKING':   '#14b8a6',
            'GRAMMAR':    '#f97316',
        };
        
        wizardState.selectedTasks.forEach((taskId, index) => {
            const taskDef = AVAILABLE_TASKS.find(t => t.id === taskId);
            const config = wizardState.taskConfigs[taskId] || {};
            const color = taskColors[taskId] || '#6b7280';

            // ── Build a human-readable summary per task type ──────────────
            let detailLines = [];
            if (taskId === 'GRAMMAR') {
                const qs = Array.isArray(config.questions) ? config.questions : [];
                const answered = qs.filter(q => q.options && q.options.some(o => o.isCorrect)).length;
                detailLines.push(`<span>${qs.length} question${qs.length !== 1 ? 's' : ''} created</span>`);
                if (qs.length > 0) {
                    detailLines.push(`<span>${answered} / ${qs.length} with correct answer set</span>`);
                }
            } else if (taskId === 'VIDEO') {
                if (config.videoUrl) detailLines.push(`<span>🎬 ${config.videoUrl}</span>`);
                if (config.duration) detailLines.push(`<span>⏱ ${config.duration} min</span>`);
            } else if (taskId === 'VOCABULARY' || taskId === 'FLASHCARD') {
                if (config.deckName) detailLines.push(`<span>📦 Deck: ${config.deckName}</span>`);
                if (Array.isArray(config.cards)) detailLines.push(`<span>🎴 ${config.cards.length} card(s) added</span>`);
            } else if (taskId === 'SPEAKING' || taskId === 'WRITING') {
                if (config.prompt) detailLines.push(`<span>💬 ${config.prompt.substring(0, 80)}${config.prompt.length > 80 ? '...' : ''}</span>`);
                if (config.limit) detailLines.push(`<span>⏱ Limit: ${config.limit}</span>`);
            } else if (taskId === 'READING') {
                if (config.text) detailLines.push(`<span>📖 ${config.text.substring(0, 80)}${config.text.length > 80 ? '...' : ''}</span>`);
            } else if (taskId === 'LISTENING') {
                if (config.audioUrl) detailLines.push(`<span>🎧 ${config.audioUrl}</span>`);
            }

            if (detailLines.length === 0) detailLines.push('<span class="text-muted">No configuration yet</span>');

            const item = document.createElement('div');
            item.className = 'preview-task-item';
            item.style.cssText = `border-left: 4px solid ${color};`;
            
            item.innerHTML = `
                <div class="preview-task-number" style="background: ${color}">${index + 1}</div>
                <div class="preview-task-content">
                    <div class="preview-task-header">
                        <h6 class="preview-task-type">
                            <i class="bi ${taskDef ? taskDef.icon : ''} me-2" style="color: ${color}"></i>
                            ${taskDef ? taskDef.label : taskId}
                        </h6>
                        <button class="preview-task-edit-btn" onclick="jumpToStep('taskConfig_${taskId}')">✎ Edit</button>
                    </div>
                    <div class="preview-task-details">${detailLines.join('<br>')}</div>
                </div>
            `;
            
            taskFlowContainer.appendChild(item);
        });
    }

    // Expose jump function to window for the onclick handler in preview
    window.jumpToStep = function(stepId) {
        const index = stepsFlow.indexOf(stepId);
        if (index > -1) {
            currentStepIndex = index;
            showCurrentStep();
            renderStepper();
        }
    };

    // Expose openForEdit to window so LessonLibrary can call it
    window.LessonWizard = {
        openForEdit: function(lesson) {
            // Pre-fill wizard state with existing lesson data
            wizardEditingLessonId = lesson.id;
            wizardState.lessonInfo.title       = lesson.title       || '';
            wizardState.lessonInfo.description = lesson.description || '';
            wizardState.lessonInfo.groupLevel  = lesson.groupLevel  || currentGroup;
            wizardState.lessonInfo.status      = lesson.status      || 'DRAFT';

            // Map task types from existing lesson tasks
            if (Array.isArray(lesson.tasks) && lesson.tasks.length > 0) {
                const sorted = [...lesson.tasks].sort((a, b) => a.order - b.order);
                wizardState.selectedTasks = sorted.map(t => t.type);
            } else {
                wizardState.selectedTasks = [];
            }
            wizardState.taskConfigs = {};

            // Open the wizard modal
            bootstrap.Modal.getOrCreateInstance(modalElement).show();
        }
    };

    // Run init
    initWizard();
});
