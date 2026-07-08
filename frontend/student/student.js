const BASE_URL = "http://localhost:5500";

const sectionLabels = {
  dashboard: "Dashboard",
  results: "Results",
};

const videoLessons = [
  {
    title: "React Components Basics",
    teacher: "Aziza Karim",
    note: "Frontend Bootcamp, 28 daqiqalik video dars",
    link: "https://www.youtube.com/watch?v=SqcY0GlETPk",
  },
  {
    title: "JavaScript DOM Practice",
    teacher: "Aziza Karim",
    note: "Uyga vazifaga tayyorlovchi amaliy dars",
    link: "https://www.youtube.com/watch?v=5fb2aPlgoys",
  },
  {
    title: "English Speaking Shadowing",
    teacher: "David Brown",
    note: "Speaking uchun talaffuz va repetition mashqi",
    link: "https://www.youtube.com/watch?v=n4NVPg2kHv4",
  },
  {
    title: "UI Layout Principles",
    teacher: "Nodira Usmon",
    note: "Dizayn joylashuvi va spacing bo'yicha video",
    link: "https://www.youtube.com/watch?v=HThA0kF7GQo",
  },
  {
    title: "Flexbox and Grid Review",
    teacher: "Javohir Aliyev",
    note: "Responsive sahifa uchun takrorlash darsi",
    link: "https://www.youtube.com/watch?v=3YW65K6LcIA",
  },
  {
    title: "Homework Walkthrough",
    teacher: "Aziza Karim",
    note: "Oxirgi vazifalarni qanday bajarish bo'yicha ko'rsatma",
    link: "https://www.youtube.com/watch?v=1PnVor36_40",
  },
];

const assignmentRows = [
  {
    title: "React landing page",
    detail: "Hero, cards va responsive footer tayyorlash",
    deadline: "Deadline: 30 Apr",
    type: "Frontend",
  },
  {
    title: "Vocabulary notebook",
    detail: "25 ta yangi so'z va 10 ta gap yozish",
    deadline: "Deadline: 29 Apr",
    type: "English",
  },
  {
    title: "DOM mini task",
    detail: "3 ta button va modal interaction yasash",
    deadline: "Deadline: 1 May",
    type: "JavaScript",
  },
  {
    title: "UI critique sheet",
    detail: "2 ta saytni UX bo'yicha tahlil qilish",
    deadline: "Deadline: 2 May",
    type: "Design",
  },
  {
    title: "Reading summary",
    detail: "Article dan 1 betlik summary topshirish",
    deadline: "Deadline: 3 May",
    type: "Homework",
  },
];

const backlogRows = [
  {
    title: "Navbar responsive fix",
    detail: "Mobil holatda menu joylashuvi xato bo'lib qolgan",
    status: "Chala bajarilgan",
  },
  {
    title: "Essay correction",
    detail: "Grammar xatolari tuzatilishi kerak",
    status: "Xato bajarilgan",
  },
  {
    title: "Flexbox homework",
    detail: "Cards orasidagi spacing noto'g'ri",
    status: "Qayta topshirish",
  },
  {
    title: "JS condition task",
    detail: "Logic qismi to'liq ishlamayapti",
    status: "Chala bajarilgan",
  },
];

const resultRows = [
  {
    subject: "Frontend Bootcamp",
    assessment: "JavaScript Quiz",
    score: "92/100",
    feedback: "Strong logic and clean code",
    status: "Completed",
  },
  {
    subject: "English Speaking",
    assessment: "Vocabulary Test",
    score: "84/100",
    feedback: "Good pronunciation, expand word bank",
    status: "Active",
  },
  {
    subject: "UI Design Basics",
    assessment: "Mobile Layout Task",
    score: "95/100",
    feedback: "Excellent visual balance",
    status: "Completed",
  },
  {
    subject: "React Workshop",
    assessment: "Mini Project Review",
    score: "Pending",
    feedback: "Submission expected by Friday",
    status: "Pending",
  },
];

const navLinks = document.querySelectorAll(".nav-link[data-section]");
const sections = document.querySelectorAll(".section");
const headerTitle = document.getElementById("headerTitle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const metricCards = document.querySelectorAll(".metric-action");
const backlogList = document.getElementById("backlog-list");
const toggleBacklogBtn = document.getElementById("toggleBacklogBtn");
const themeToggle = document.getElementById("themeToggle");
const THEME_KEY = "edu-dashboard-theme";
const LOGIN_PAGE = "../auth/login.html";

let backlogExpanded = false;

function redirectToLogin() {
  window.location.href = LOGIN_PAGE;
}

function ensureStudentAccess() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !role || role.toLowerCase() !== "student") {
    redirectToLogin();
    return false;
  }

  return true;
}

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

function createStatusBadge(status) {
  return `<span class="status-badge ${(status || "").toLowerCase()}">${status || "-"}</span>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderRows(targetId, rows, columns) {
  const tbody = document.getElementById(targetId);

  tbody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          ${columns.map((column) => `<td>${column(row)}</td>`).join("")}
        </tr>`,
    )
    .join("");
}

function renderVideoLessons() {
  const container = document.getElementById("video-lessons-list");

  container.innerHTML = videoLessons
    .map(
      (lesson) => `
        <div class="lesson-item">
          <div class="lesson-item-copy">
            <strong>${lesson.title}</strong>
            <span>${lesson.teacher}</span>
            <span>${lesson.note}</span>
          </div>
          <a class="lesson-link" href="${lesson.link}" target="_blank" rel="noreferrer">Video darsni ochish</a>
        </div>`,
    )
    .join("");
}

function renderAssignments() {
  const container = document.getElementById("assignment-list");

  container.innerHTML = assignmentRows
    .map(
      (task) => `
        <div class="task-item">
          <div class="task-item-copy">
            <strong>${task.title}</strong>
            <span>${task.detail}</span>
            <div class="task-meta">
              <span class="task-tag">${task.type}</span>
              <span>${task.deadline}</span>
            </div>
          </div>
          <a class="task-link" href="#assignment-list">Vazifaga o'tish</a>
        </div>`,
    )
    .join("");
}

function renderBacklog() {
  backlogList.innerHTML = backlogRows
    .map(
      (task) => `
        <div class="task-item">
          <div class="task-item-copy">
            <strong>${task.title}</strong>
            <span>${task.detail}</span>
          </div>
          <span class="task-tag">${task.status}</span>
        </div>`,
    )
    .join("");
}

function setBacklogExpanded(expanded) {
  backlogExpanded = expanded;
  backlogList.classList.toggle("collapsed", !expanded);
  toggleBacklogBtn.textContent = expanded ? "Yopish" : "Hammasini ko'rish";
}

function scrollToPanel(id) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("open");
}

function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("open");
}

function showSection(name) {
  sections.forEach((section) => section.classList.remove("active"));
  navLinks.forEach((link) => link.classList.remove("active"));

  const target = document.getElementById(`section-${name}`);
  if (target) {
    target.classList.add("active");
  }

  const activeLink = document.querySelector(`.nav-link[data-section="${name}"]`);
  if (activeLink) {
    activeLink.classList.add("active");
  }

  if (headerTitle && sectionLabels[name]) {
    headerTitle.textContent = sectionLabels[name];
  }

  closeSidebar();
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showSection(link.dataset.section);
  });
});

metricCards.forEach((card) => {
  card.addEventListener("click", () => {
    const target = card.dataset.target;
    scrollToPanel(target);
  });
});

toggleBacklogBtn.addEventListener("click", () => {
  setBacklogExpanded(!backlogExpanded);
});

sidebarToggle.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);
themeToggle.addEventListener("click", toggleTheme);

if (ensureStudentAccess()) {
  renderVideoLessons();
  renderAssignments();
  renderBacklog();
  setBacklogExpanded(false);
  applyTheme(localStorage.getItem(THEME_KEY) || "light");

  renderRows("results-tbody", resultRows, [
    (row) => row.subject,
    (row) => row.assessment,
    (row) => row.score,
    (row) => row.feedback,
    (row) => createStatusBadge(row.status),
  ]);

  showSection("dashboard");
}
