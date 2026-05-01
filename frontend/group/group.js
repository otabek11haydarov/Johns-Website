const THEME_KEY = "edu-dashboard-theme";

const defaultLessons = {
  A1: [
    {
      id: "a1-1",
      title: "Alphabet and Greetings",
      date: "2026-05-03",
      time: "09:00",
      teacher: "Malika Rahimova",
      description: "Introducing greetings, self-introduction phrases, and alphabet pronunciation.",
    },
  ],
  A2: [
    {
      id: "a2-1",
      title: "Daily Routine Practice",
      date: "2026-05-04",
      time: "11:00",
      teacher: "Javohir Tursunov",
      description: "Talking about habits, time expressions, and present simple reinforcement.",
    },
  ],
  B1: [
    {
      id: "b1-1",
      title: "Past Experience Discussion",
      date: "2026-05-05",
      time: "14:00",
      teacher: "Dilnoza Karimova",
      description: "Speaking tasks around life experiences and past simple versus present perfect review.",
    },
  ],
  B2: [
    {
      id: "b2-1",
      title: "Opinion Essay Structure",
      date: "2026-05-06",
      time: "15:30",
      teacher: "Bekzod Islomov",
      description: "Planning and structuring a clear opinion essay with linking and support sentences.",
    },
  ],
  C1: [
    {
      id: "c1-1",
      title: "Advanced Listening Analysis",
      date: "2026-05-07",
      time: "16:00",
      teacher: "Nigina Qodirova",
      description: "Listening for implication, attitude, and subtle meaning in longer audio material.",
    },
  ],
  C2: [
    {
      id: "c2-1",
      title: "Debate and Precision Speaking",
      date: "2026-05-08",
      time: "17:00",
      teacher: "Sardor Yuldashev",
      description: "High-precision speaking practice with argument defense and vocabulary refinement.",
    },
  ],
};

const themeToggle = document.getElementById("themeToggle");
const lessonModalOverlay = document.getElementById("lessonModalOverlay");
const openLessonModalBtn = document.getElementById("openLessonModalBtn");
const lessonModalClose = document.getElementById("lessonModalClose");
const lessonModalCancel = document.getElementById("lessonModalCancel");
const lessonForm = document.getElementById("lessonForm");
const lessonList = document.getElementById("lessonList");
const lessonCountChip = document.getElementById("lessonCountChip");

const urlParams = new URLSearchParams(window.location.search);
const groupLevel = (urlParams.get("level") || "A1").toUpperCase();
const groupData = groupCatalog[groupLevel] || groupCatalog.A1;
const lessonsStorageKey = `group-lessons-${groupData.level}`;

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.setAttribute("title", isDark ? "Light mode" : "Dark mode");
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

function getLessons() {
  const savedLessons = localStorage.getItem(lessonsStorageKey);
  if (savedLessons) {
    return JSON.parse(savedLessons);
  }

  const seedLessons = defaultLessons[groupData.level] || [];
  localStorage.setItem(lessonsStorageKey, JSON.stringify(seedLessons));
  return seedLessons;
}

function saveLessons(lessons) {
  localStorage.setItem(lessonsStorageKey, JSON.stringify(lessons));
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Date not set";
  }

  return new Date(dateValue).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderGroupDetails() {
  document.title = `${groupData.level} Group`;
  document.getElementById("groupTitle").textContent = `${groupData.level} Group`;
  document.getElementById("groupLevelBadge").textContent = groupData.level;
  document.getElementById("groupHeroTitle").textContent = groupData.title;
  document.getElementById("groupDescription").textContent = groupData.description;
}

function renderLessons() {
  const lessons = getLessons();
  lessonCountChip.textContent = `${lessons.length} Lesson${lessons.length === 1 ? "" : "s"}`;

  if (!lessons.length) {
    lessonList.innerHTML = `<div class="lesson-empty">No lessons created for this group yet.</div>`;
    return;
  }

  lessonList.innerHTML = lessons
    .map(
      (lesson) => `
        <article class="lesson-card" data-lesson-id="${lesson.id}">
          <div class="lesson-card-header">
            <div>
              <h3 class="lesson-card-title">${lesson.title}</h3>
              <p class="lesson-card-subtitle">${formatDate(lesson.date)} at ${lesson.time} • ${lesson.teacher}</p>
            </div>
            <button class="btn btn-danger" type="button" data-delete-lesson="${lesson.id}">Delete</button>
          </div>
          <div class="lesson-meta">
            <span class="lesson-badge">${groupData.level}</span>
            <span class="lesson-badge">${groupData.room}</span>
          </div>
          <p class="lesson-card-description">${lesson.description || "No description added."}</p>
        </article>
      `,
    )
    .join("");
}

function openLessonModal() {
  lessonModalOverlay.classList.add("open");
}

function closeLessonModal() {
  lessonModalOverlay.classList.remove("open");
  lessonForm.reset();
}

function createLesson(payload) {
  const lessons = getLessons();
  const newLesson = {
    id: `${groupData.level.toLowerCase()}-${Date.now()}`,
    ...payload,
  };

  lessons.push(newLesson);
  saveLessons(lessons);
  renderLessons();
}

function deleteLesson(id) {
  const lessons = getLessons().filter((lesson) => lesson.id !== id);
  saveLessons(lessons);
  renderLessons();
}

themeToggle.addEventListener("click", toggleTheme);
openLessonModalBtn.addEventListener("click", openLessonModal);
lessonModalClose.addEventListener("click", closeLessonModal);
lessonModalCancel.addEventListener("click", closeLessonModal);

lessonModalOverlay.addEventListener("click", (event) => {
  if (event.target === lessonModalOverlay) {
    closeLessonModal();
  }
});

lessonForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.getElementById("lessonTitle").value.trim();
  const date = document.getElementById("lessonDate").value;
  const time = document.getElementById("lessonTime").value;
  const teacher = document.getElementById("lessonTeacher").value.trim();
  const description = document.getElementById("lessonDescription").value.trim();

  if (!title || !date || !time || !teacher) {
    return;
  }

  createLesson({ title, date, time, teacher, description });
  closeLessonModal();
});

lessonList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-lesson]");
  if (!deleteButton) {
    return;
  }

  deleteLesson(deleteButton.dataset.deleteLesson);
});

renderGroupDetails();
renderLessons();
applyTheme(localStorage.getItem(THEME_KEY) || "light");

async function groupLoad() {
  const tbody = document.getElementById("dashboard-activity-tbody");
  tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Loading...</td></tr>`;

  const response = await fetch(BASE_URL + "/api/admin/dashboard", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  renderDashboardActivity(data.data.activity);
  renderStudents(data.data.students);
  renderGroups(data.data.groups);
}