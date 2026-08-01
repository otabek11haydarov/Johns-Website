const breadcrumbLesson = document.getElementById("breadcrumbLesson");
const lessonTitle = document.getElementById("lessonTitle");
const metaDuration = document.getElementById("metaDuration");
const metaTasksCount = document.getElementById("metaTasksCount");
const overallProgressText = document.getElementById("overallProgressText");
const overallProgressFill = document.getElementById("overallProgressFill");

const horizontalStepper = document.getElementById("horizontalStepper");
const outlineItemsList = document.getElementById("outlineItemsList");

const taskStepBadge = document.getElementById("taskStepBadge");
const taskLevelChip = document.getElementById("taskLevelChip");
const taskIframe = document.getElementById("taskIframe");

const prevTaskBtn = document.getElementById("prevTaskBtn");
const nextTaskBtn = document.getElementById("nextTaskBtn");
const finishLessonBtn = document.getElementById("finishLessonBtn");

const completionOverlay = document.getElementById("completionOverlay");
const statCompletedTasks = document.getElementById("statCompletedTasks");
const backToAssignmentsBtn = document.getElementById("backToAssignmentsBtn");

const TASK_TYPE_META = {
  VIDEO: { name: "Video Intro", duration: "5 min", icon: "🎬", url: "../Video/video.html" },
  FLASHCARD: { name: "Flashcards", duration: "8 min", icon: "🎴", url: "../Flashkard/fleshkard.html" },
  TEST: { name: "Grammar Test", duration: "10 min", icon: "📝", url: "../Test/test.html" },
  GRAMMAR: { name: "Grammar Test", duration: "10 min", icon: "📝", url: "../Test/test.html" },
  SPEAKING: { name: "Speaking Module", duration: "5 min", icon: "🎙️", url: "../speaking/speak.html" },
};

const DEFAULT_TASKS = [
  { id: "t1", type: "VIDEO", name: "01. Video Intro", duration: "5 min", url: "../Video/video.html" },
  { id: "t2", type: "FLASHCARD", name: "02. Flashcards", duration: "8 min", url: "../Flashkard/fleshkard.html" },
  { id: "t3", type: "TEST", name: "03. Grammar Test", duration: "10 min", url: "../Test/test.html" },
  { id: "t4", type: "SPEAKING", name: "04. Speaking Module", duration: "5 min", url: "../speaking/speak.html" },
];

let lessonData = null;
let tasksList = [];
let currentTaskIndex = 0;

const params = new URLSearchParams(window.location.search);
const lessonId = params.get("lessonId") || params.get("id");

const baseUrl = typeof BASE_URL !== "undefined" ? BASE_URL : "http://localhost:5000";
const token = localStorage.getItem("token");

async function initLessonRunner() {
  if (lessonId) {
    try {
      const res = await fetch(`${baseUrl}/api/lessons/${lessonId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        lessonData = json.data || json;
      }
    } catch (err) {
      console.warn("Could not load backend lesson data, using fallback task sequence.", err);
    }
  }

  if (lessonData) {
    const title = lessonData.title || "Daily Vocabulary Practice";
    if (lessonTitle) lessonTitle.textContent = title;
    if (breadcrumbLesson) breadcrumbLesson.textContent = title;
    if (taskLevelChip) taskLevelChip.textContent = `Level: ${lessonData.groupLevel || "A1 Beginner"}`;

    if (lessonData.tasks && lessonData.tasks.length > 0) {
      // Sort tasks based on backend order sequence
      const sorted = [...lessonData.tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

      // Deduplicate: keep only first task of each type (in case backend seeded duplicates)
      const seenTypes = new Set();
      const deduped = sorted.filter((t) => {
        const key = t.type?.toUpperCase();
        if (seenTypes.has(key)) return false;
        seenTypes.add(key);
        return true;
      });
      tasksList = deduped.map((t, index) => {
        const meta = TASK_TYPE_META[t.type?.toUpperCase()] || TASK_TYPE_META.VIDEO;
        let queryParams = `?lessonId=${lessonId}&taskId=${t.id}`;
        
        let dynamicDuration = meta.duration;

        if (t.type === "VIDEO" && t.videoTask) {
          if (t.videoTask.videoUrl) {
            queryParams += `&videoUrl=${encodeURIComponent(t.videoTask.videoUrl)}`;
          }
          if (t.videoTask.duration) {
            dynamicDuration = `${t.videoTask.duration} mins`;
          }
        } else if (t.type === "TEST" || t.type === "GRAMMAR") {
          if (t.testTask?.timeLimit) dynamicDuration = `${t.testTask.timeLimit} mins`;
        } else if (t.type === "SPEAKING" && t.speakingTask?.durationLimit) {
          dynamicDuration = `${t.speakingTask.durationLimit} mins`;
        } else if (t.type === "LISTENING" && t.listeningTask?.duration) {
          dynamicDuration = `${t.listeningTask.duration} mins`;
        }

        const paddedNum = (index + 1).toString().padStart(2, "0");
        return {
          id: t.id || `task-${index}`,
          type: t.type,
          name: `${paddedNum}. ${meta.name}`,
          duration: dynamicDuration,
          url: `${meta.url}${queryParams}`,
          icon: meta.icon,
        };
      });
    }
  }

  // Fallback default 4 tasks sequence if no backend list
  if (tasksList.length === 0) {
    tasksList = DEFAULT_TASKS.map((t) => ({
      ...t,
      url: lessonId ? `${t.url}?lessonId=${lessonId}` : t.url,
    }));
  }

  updateProgressHeader();
  renderHorizontalStepper();
  renderSidebarOutline();
  loadCurrentTask();
}

function updateProgressHeader() {
  const total = tasksList.length;
  const percentage = Math.round((currentTaskIndex / total) * 100);

  if (metaTasksCount) metaTasksCount.textContent = `${currentTaskIndex} / ${total} Tasks`;
  if (overallProgressText) overallProgressText.textContent = `${percentage}%`;
  if (overallProgressFill) overallProgressFill.style.width = `${percentage}%`;

  // Total estimated duration calculation
  const totalMinutes = tasksList.reduce((acc, t) => acc + parseInt(t.duration || "5", 10), 0);
  if (metaDuration) metaDuration.textContent = `${totalMinutes} Minutes`;
}

function renderHorizontalStepper() {
  if (!horizontalStepper) return;

  const html = [];
  tasksList.forEach((task, index) => {
    const isCompleted = index < currentTaskIndex;
    const isActive = index === currentTaskIndex;
    const isLocked = index > currentTaskIndex;

    let nodeClass = "stepper-step";
    let iconContent = index + 1;

    if (isCompleted) {
      nodeClass += " completed";
      iconContent = "✓";
    } else if (isActive) {
      nodeClass += " active";
      iconContent = "▶";
    } else if (isLocked) {
      nodeClass += " locked";
      iconContent = "🔒";
    }

    html.push(`
      <div class="${nodeClass}" data-index="${index}">
        <div class="step-node">${iconContent}</div>
        <span class="step-node-label">${task.name.replace(/^\d+\.\s*/, "")}</span>
      </div>
    `);

    // Connecting line between steps
    if (index < tasksList.length - 1) {
      const lineClass = isCompleted ? "stepper-line completed" : "stepper-line";
      html.push(`<div class="${lineClass}"></div>`);
    }
  });

  horizontalStepper.innerHTML = html.join("");

  horizontalStepper.querySelectorAll(".stepper-step").forEach((stepEl) => {
    stepEl.addEventListener("click", () => {
      const idx = parseInt(stepEl.dataset.index, 10);
      if (!isNaN(idx) && idx <= currentTaskIndex) {
        currentTaskIndex = idx;
        updateProgressHeader();
        renderHorizontalStepper();
        renderSidebarOutline();
        loadCurrentTask();
      }
    });
  });
}

function renderSidebarOutline() {
  if (!outlineItemsList) return;

  outlineItemsList.innerHTML = tasksList
    .map((task, index) => {
      const isCompleted = index < currentTaskIndex;
      const isActive = index === currentTaskIndex;
      const isLocked = index > currentTaskIndex;

      let itemClass = "outline-item";
      let statusIcon = index + 1;

      if (isCompleted) {
        itemClass += " completed";
        statusIcon = "✓";
      } else if (isActive) {
        itemClass += " active";
        statusIcon = "▶";
      } else if (isLocked) {
        itemClass += " locked";
        statusIcon = "🔒";
      }

      return `
        <div class="${itemClass}" data-index="${index}">
          <div class="outline-item-left">
            <span class="item-icon-badge">${statusIcon}</span>
            <span class="item-title">${task.name}</span>
          </div>
          <span class="item-time">${task.duration}</span>
        </div>
      `;
    })
    .join("");

  outlineItemsList.querySelectorAll(".outline-item").forEach((itemEl) => {
    itemEl.addEventListener("click", () => {
      const idx = parseInt(itemEl.dataset.index, 10);
      if (!isNaN(idx) && idx <= currentTaskIndex) {
        currentTaskIndex = idx;
        updateProgressHeader();
        renderHorizontalStepper();
        renderSidebarOutline();
        loadCurrentTask();
      }
    });
  });
}

function loadCurrentTask() {
  const task = tasksList[currentTaskIndex];
  if (!task) return;

  if (taskIframe) {
    taskIframe.src = task.url;
  }

  if (taskStepBadge) {
    taskStepBadge.textContent = `Task ${currentTaskIndex + 1} of ${tasksList.length} • Estimated ${task.duration}`;
  }

  // Footer Buttons
  if (prevTaskBtn) {
    prevTaskBtn.disabled = currentTaskIndex === 0;
  }

  const isLastTask = currentTaskIndex === tasksList.length - 1;
  if (nextTaskBtn && finishLessonBtn) {
    if (isLastTask) {
      nextTaskBtn.style.display = "none";
      finishLessonBtn.style.display = "inline-block";
    } else {
      nextTaskBtn.style.display = "inline-block";
      finishLessonBtn.style.display = "none";
    }
  }
}

// Controls Event Listeners
prevTaskBtn?.addEventListener("click", () => {
  if (currentTaskIndex > 0) {
    currentTaskIndex--;
    updateProgressHeader();
    renderHorizontalStepper();
    renderSidebarOutline();
    loadCurrentTask();
  }
});

nextTaskBtn?.addEventListener("click", () => {
  if (currentTaskIndex < tasksList.length - 1) {
    currentTaskIndex++;
    updateProgressHeader();
    renderHorizontalStepper();
    renderSidebarOutline();
    loadCurrentTask();
  }
});

finishLessonBtn?.addEventListener("click", async () => {
  if (metaTasksCount) metaTasksCount.textContent = `${tasksList.length} / ${tasksList.length} Tasks`;
  if (overallProgressText) overallProgressText.textContent = `100%`;
  if (overallProgressFill) overallProgressFill.style.width = `100%`;

  // Submit assessment score to backend
  if (token && lessonId) {
    try {
      await fetch(`${baseUrl}/api/assessments/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId,
          score: 100,
          status: "COMPLETED",
        }),
      });
    } catch (err) {
      console.warn("Backend assessment submit error:", err);
    }
  }

  if (statCompletedTasks) {
    statCompletedTasks.textContent = `${tasksList.length} / ${tasksList.length}`;
  }
  if (completionOverlay) {
    completionOverlay.style.display = "flex";
  }
});

backToAssignmentsBtn?.addEventListener("click", () => {
  window.location.href = "student.html#my-assignments";
});

initLessonRunner();
