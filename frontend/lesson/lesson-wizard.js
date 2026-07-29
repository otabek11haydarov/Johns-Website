document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // INITIALIZATION & STATE
    // ----------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const lessonGroup = urlParams.get('level') || 'A1';
    const editId = urlParams.get('editId');
    const STORAGE_KEY = `johns-lessons:${lessonGroup}`;

    let lessonDraft = {
        id: editId || `${lessonGroup.toLowerCase()}-lesson-${Date.now()}`,
        group: lessonGroup,
        title: "",
        description: "",
        status: "Draft",
        taskIds: [] // Will contain generated task IDs
    };

    let tasksData = {
        video: { url: "", duration: "" },
        flashcards: [],
        grammar: []
    };

    const STEPS = [
        { id: "info", label: "Lesson Information", icon: "1" },
        { id: "video", label: "Video Lesson", icon: "2" },
        { id: "flashcards", label: "Flashcards", icon: "3" },
        { id: "grammar", label: "Grammar Quiz", icon: "4" },
        { id: "preview", label: "Review & Publish", icon: "✓" }
    ];

    let currentStepIndex = 0;

    // ----------------------------------------------------
    // DOM ELEMENTS
    // ----------------------------------------------------
    const stepperContainer = document.getElementById("wizardStepper");
    const sections = document.querySelectorAll(".workspace-content");
    const mobilePrevBtn = document.getElementById("mobilePrevBtn");
    const mobileNextBtn = document.getElementById("mobileNextBtn");
    
    // Form Elements
    const elTitle = document.getElementById("lessonTitle");
    const elDesc = document.getElementById("lessonDesc");
    const elVideoUrl = document.getElementById("videoUrl");
    const elVideoDur = document.getElementById("videoDuration");

    // Flashcard Builder
    const fcSidebarList = document.getElementById("fcSidebarList");
    const fcAddBtn = document.getElementById("fcAddBtn");
    const fcEditorEmpty = document.getElementById("fcEditorEmpty");
    const fcEditorForm = document.getElementById("fcEditorForm");
    const fcEditWord = document.getElementById("fcEditWord");
    const fcEditDesc = document.getElementById("fcEditDesc");
    const fcEditEx = document.getElementById("fcEditEx");
    const fcDupBtn = document.getElementById("fcDupBtn");
    const fcDelBtn = document.getElementById("fcDelBtn");
    
    let activeFcIndex = -1;
    let dragFcIndex = null;

    const grammarList = document.getElementById("grammarList");
    const addGrammarBtn = document.getElementById("addGrammarBtn");
    const grammarTemplate = document.getElementById("grammarTemplate");

    // Preview Elements
    const previewTitle = document.getElementById("previewTitle");
    const previewTaskCount = document.getElementById("previewTaskCount");
    const previewTime = document.getElementById("previewTime");
    const previewTasksList = document.getElementById("previewTasksList");


    // ----------------------------------------------------
    // DATA BINDING & EDIT MODE
    // ----------------------------------------------------
    function loadExistingLesson() {
        if (!editId) return;
        
        const savedLessons = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const existing = savedLessons.find(l => l.id === editId);
        if (existing) {
            lessonDraft = { ...existing };
            elTitle.value = lessonDraft.title;
            elDesc.value = lessonDraft.description || "";
            // Mocking loaded tasks (In reality, you'd pull full task objects from another DB table)
            // For this wizard, we assume the user is just setting it up or we leave it empty if we don't have a complex mock backend.
        }
    }


    // ----------------------------------------------------
    // NAVIGATION LOGIC
    // ----------------------------------------------------
    function renderStepper() {
        stepperContainer.innerHTML = STEPS.map((step, idx) => {
            let className = "wizard-step";
            if (idx === currentStepIndex) className += " active";
            else if (idx < currentStepIndex) className += " completed";
            
            return `
                <div class="${className}" data-index="${idx}">
                    <span class="step-icon">${idx < currentStepIndex ? '<i class="bi bi-check"></i>' : step.icon}</span>
                    <span>${step.label}</span>
                </div>
            `;
        }).join("");

        // Attach clicks
        document.querySelectorAll(".wizard-step").forEach(el => {
            el.addEventListener("click", () => {
                const idx = parseInt(el.getAttribute("data-index"));
                if (idx <= currentStepIndex || validateCurrentStep()) {
                    saveCurrentStepData();
                    currentStepIndex = idx;
                    updateWorkspace();
                }
            });
        });
    }

    function updateWorkspace() {
        renderStepper();
        
        // Update Sections
        sections.forEach(sec => sec.classList.remove("active"));
        document.getElementById(`step-${STEPS[currentStepIndex].id}`).classList.add("active");

        // Mobile Buttons
        if (currentStepIndex === 0) {
            mobilePrevBtn.style.visibility = "hidden";
        } else {
            mobilePrevBtn.style.visibility = "visible";
        }

        if (currentStepIndex === STEPS.length - 1) {
            mobileNextBtn.textContent = "Publish Lesson";
            mobileNextBtn.classList.remove("btn-wizard-outline");
            mobileNextBtn.classList.add("btn-wizard-primary");
            generatePreview();
        } else {
            mobileNextBtn.textContent = "Next Step";
        }
    }

    function validateCurrentStep() {
        if (currentStepIndex === 0) {
            if (!elTitle.value.trim()) {
                alert("Please enter a lesson title.");
                elTitle.focus();
                return false;
            }
        } else if (currentStepIndex === 2) {
            if (tasksData.flashcards.length === 0) {
                alert("Please add at least one flashcard.");
                return false;
            }
            for (let i = 0; i < tasksData.flashcards.length; i++) {
                const fc = tasksData.flashcards[i];
                if (!fc.word.trim() || !fc.def.trim() || !fc.ex.trim()) {
                    alert(`Flashcard ${i + 1} is incomplete. Word, Description, and Example Sentence are required.`);
                    activeFcIndex = i;
                    renderFcWorkspace();
                    return false;
                }
            }
        }
        return true;
    }

    function saveCurrentStepData() {
        if (currentStepIndex === 0) {
            lessonDraft.title = elTitle.value.trim();
            lessonDraft.description = elDesc.value.trim();
        } else if (currentStepIndex === 1) {
            tasksData.video.url = elVideoUrl.value.trim();
            tasksData.video.duration = elVideoDur.value.trim();
        } else if (currentStepIndex === 3) {
            // Grammar
            tasksData.grammar = [];
            grammarList.querySelectorAll(".wiz-list-item").forEach(item => {
                const q = item.querySelector(".g-qtext").value.trim();
                if (q) {
                    tasksData.grammar.push({ question: q });
                }
            });
        }
    }

    // ----------------------------------------------------
    // FLASHCARD BUILDER LOGIC
    // ----------------------------------------------------
    function renderFcWorkspace() {
        fcSidebarList.innerHTML = "";
        
        tasksData.flashcards.forEach((fc, idx) => {
            const isComplete = fc.word.trim() && fc.def.trim() && fc.ex.trim();
            const el = document.createElement("div");
            el.className = `fc-sidebar-item ${idx === activeFcIndex ? "active" : ""}`;
            el.draggable = true;
            el.dataset.index = idx;
            
            el.innerHTML = `
                <div class="fc-status ${isComplete ? "complete" : ""}"></div>
                <div class="fc-sidebar-item-text">${fc.word || "<em>Untitled Card</em>"}</div>
            `;
            
            el.addEventListener("click", () => {
                activeFcIndex = idx;
                renderFcWorkspace();
            });
            
            // Drag and Drop
            el.addEventListener("dragstart", (e) => {
                dragFcIndex = idx;
                e.currentTarget.classList.add("dragging");
            });
            
            el.addEventListener("dragend", (e) => {
                e.currentTarget.classList.remove("dragging");
            });
            
            el.addEventListener("dragover", (e) => {
                e.preventDefault();
            });
            
            el.addEventListener("drop", (e) => {
                e.preventDefault();
                if (dragFcIndex === null || dragFcIndex === idx) return;
                
                // Swap in array
                const draggedItem = tasksData.flashcards.splice(dragFcIndex, 1)[0];
                tasksData.flashcards.splice(idx, 0, draggedItem);
                
                // Update active index if it moved
                if (activeFcIndex === dragFcIndex) {
                    activeFcIndex = idx;
                } else if (activeFcIndex !== -1) {
                    // It might have shifted, but let's just reset or recalculate. 
                    // Simple approach: reset selection to the dropped item
                    activeFcIndex = idx;
                }
                
                renderFcWorkspace();
            });

            fcSidebarList.appendChild(el);
        });

        // Editor
        if (activeFcIndex >= 0 && activeFcIndex < tasksData.flashcards.length) {
            fcEditorEmpty.style.display = "none";
            fcEditorForm.style.display = "flex";
            const fc = tasksData.flashcards[activeFcIndex];
            fcEditWord.value = fc.word;
            fcEditDesc.value = fc.def;
            fcEditEx.value = fc.ex;
        } else {
            fcEditorEmpty.style.display = "flex";
            fcEditorForm.style.display = "none";
        }
    }

    fcAddBtn.addEventListener("click", () => {
        tasksData.flashcards.push({ word: "", def: "", ex: "" });
        activeFcIndex = tasksData.flashcards.length - 1;
        renderFcWorkspace();
        fcEditWord.focus();
    });

    fcDelBtn.addEventListener("click", () => {
        if (activeFcIndex >= 0) {
            tasksData.flashcards.splice(activeFcIndex, 1);
            activeFcIndex = Math.min(activeFcIndex, tasksData.flashcards.length - 1);
            renderFcWorkspace();
        }
    });

    fcDupBtn.addEventListener("click", () => {
        if (activeFcIndex >= 0) {
            const current = tasksData.flashcards[activeFcIndex];
            tasksData.flashcards.splice(activeFcIndex + 1, 0, { ...current });
            activeFcIndex++;
            renderFcWorkspace();
        }
    });

    function handleFcInput() {
        if (activeFcIndex >= 0 && activeFcIndex < tasksData.flashcards.length) {
            tasksData.flashcards[activeFcIndex] = {
                word: fcEditWord.value,
                def: fcEditDesc.value,
                ex: fcEditEx.value
            };
            
            // Fast update of the sidebar item to avoid full re-render on every keystroke
            const activeEl = fcSidebarList.children[activeFcIndex];
            if (activeEl) {
                const textEl = activeEl.querySelector(".fc-sidebar-item-text");
                const statusEl = activeEl.querySelector(".fc-status");
                textEl.innerHTML = fcEditWord.value || "<em>Untitled Card</em>";
                
                const isComplete = fcEditWord.value.trim() && fcEditDesc.value.trim() && fcEditEx.value.trim();
                statusEl.className = `fc-status ${isComplete ? "complete" : ""}`;
            }
        }
    }

    fcEditWord.addEventListener("input", handleFcInput);
    fcEditDesc.addEventListener("input", handleFcInput);
    fcEditEx.addEventListener("input", handleFcInput);

    // ----------------------------------------------------
    // DYNAMIC FORMS (Grammar)
    // ----------------------------------------------------

    function addGrammar() {
        const frag = grammarTemplate.content.cloneNode(true);
        const item = frag.querySelector(".wiz-list-item");
        
        item.querySelector(".wiz-remove-btn").addEventListener("click", () => {
            item.remove();
            updateGrammarNumbers();
        });
        
        grammarList.appendChild(item);
        updateGrammarNumbers();
    }

    function updateGrammarNumbers() {
        grammarList.querySelectorAll(".q-num").forEach((el, idx) => {
            el.textContent = idx + 1;
        });
    }

    // ----------------------------------------------------
    // PREVIEW & PUBLISH
    // ----------------------------------------------------
    function generatePreview() {
        saveCurrentStepData();

        previewTitle.textContent = lessonDraft.title;
        
        let taskCount = 0;
        let html = "";
        
        if (tasksData.video.url) {
            taskCount++;
            html += `
                <div class="preview-task">
                    <div class="preview-task-icon"><i class="bi bi-play-circle"></i></div>
                    <div class="preview-task-copy">
                        <h4>Video Lesson</h4>
                        <p>${tasksData.video.duration || 0} mins</p>
                    </div>
                </div>
            `;
        }
        
        if (tasksData.flashcards.length > 0) {
            taskCount++;
            html += `
                <div class="preview-task">
                    <div class="preview-task-icon"><i class="bi bi-card-text"></i></div>
                    <div class="preview-task-copy">
                        <h4>Vocabulary Flashcards</h4>
                        <p>${tasksData.flashcards.length} cards</p>
                    </div>
                </div>
            `;
        }

        if (tasksData.grammar.length > 0) {
            taskCount++;
            html += `
                <div class="preview-task">
                    <div class="preview-task-icon"><i class="bi bi-spellcheck"></i></div>
                    <div class="preview-task-copy">
                        <h4>Grammar Quiz</h4>
                        <p>${tasksData.grammar.length} questions</p>
                    </div>
                </div>
            `;
        }

        previewTaskCount.textContent = taskCount;
        previewTime.textContent = (parseInt(tasksData.video.duration) || 0) + (tasksData.flashcards.length * 2) + (tasksData.grammar.length * 2) + " min";
        previewTasksList.innerHTML = html || "<p class='wiz-muted'>No tasks added yet.</p>";
    }

    function publishLesson() {
        saveCurrentStepData();
        lessonDraft.status = "Active";
        
        // Mock pushing new tasks into `taskIds` based on filled data
        lessonDraft.taskIds = []; // In a real app, you'd generate IDs and save tasks to another DB table.
        // For frontend mockup, we just push dummy IDs so the main dashboard shows count correctly.
        if (tasksData.video.url) lessonDraft.taskIds.push("mock-video");
        if (tasksData.flashcards.length) lessonDraft.taskIds.push("mock-vocab");
        if (tasksData.grammar.length) lessonDraft.taskIds.push("mock-grammar");

        const savedLessons = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        
        if (editId) {
            const index = savedLessons.findIndex(l => l.id === editId);
            if (index !== -1) savedLessons[index] = lessonDraft;
        } else {
            savedLessons.unshift(lessonDraft);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLessons));
        window.location.href = "lesson.html?level=" + lessonGroup;
    }

    function saveDraft() {
        saveCurrentStepData();
        lessonDraft.status = "Draft";
        const savedLessons = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (editId) {
            const index = savedLessons.findIndex(l => l.id === editId);
            if (index !== -1) savedLessons[index] = lessonDraft;
        } else {
            savedLessons.unshift(lessonDraft);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLessons));
        window.location.href = "lesson.html?level=" + lessonGroup;
    }

    // ----------------------------------------------------
    // EVENT LISTENERS
    // ----------------------------------------------------

    addGrammarBtn.addEventListener("click", addGrammar);

    document.getElementById("saveDraftBtn").addEventListener("click", saveDraft);
    document.getElementById("mobileDraftBtn").addEventListener("click", saveDraft);
    
    mobilePrevBtn.addEventListener("click", () => {
        if (currentStepIndex > 0) {
            saveCurrentStepData();
            currentStepIndex--;
            updateWorkspace();
        }
    });

    mobileNextBtn.addEventListener("click", () => {
        if (currentStepIndex === STEPS.length - 1) {
            publishLesson();
        } else {
            if (validateCurrentStep()) {
                saveCurrentStepData();
                currentStepIndex++;
                updateWorkspace();
            }
        }
    });

    // Dark Mode Sync (Admin Dashboard usually sets body.dark-mode)
    const isDarkMode = document.body.classList.contains("dark-mode") || localStorage.getItem("edu-dashboard-theme") === "dark";
    if (isDarkMode) document.body.classList.add("dark-mode");

    // Initialize
    loadExistingLesson();
    if (tasksData.flashcards.length === 0) {
        tasksData.flashcards.push({ word: "", def: "", ex: "" });
        activeFcIndex = 0;
    }
    renderFcWorkspace();
    if (tasksData.grammar.length === 0) addGrammar();
    updateWorkspace();
});
