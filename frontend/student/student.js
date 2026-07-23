

const sectionLabels = {
  dashboard: "Dashboard",
  results: "Results",
  library: "Library",
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
const libraryGrid = document.getElementById("library-grid");
const librarySearch = document.getElementById("library-search");
const libraryFilters = document.querySelectorAll("[data-library-filter]");
const THEME_KEY = "edu-dashboard-theme";
const LOGIN_PAGE = "../auth/login.html";

const DEFAULT_BOOK_IMAGE = "default-book.png";
const DEFAULT_BOOK_PREVIEW = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600">
    <defs>
      <linearGradient id="coverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d97b41" />
        <stop offset="100%" stop-color="#c95a52" />
      </linearGradient>
    </defs>
    <rect width="480" height="600" rx="36" fill="url(#coverGradient)" />
    <rect x="34" y="34" width="412" height="532" rx="28" fill="rgba(255,255,255,0.12)" />
    <text x="52" y="118" fill="#fff7f1" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700">Library</text>
    <text x="52" y="210" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="46" font-weight="700">Digital Book</text>
    <text x="52" y="520" fill="#fff7f1" font-family="Segoe UI, Arial, sans-serif" font-size="24">Student Access</text>
  </svg>
`)}`;

let backlogExpanded = false;
let activeLibraryCategory = "All";

function redirectToLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  window.location.replace(LOGIN_PAGE);
}

function ensureStudentAccess() {
  return enforceRole("STUDENT");
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle?.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle?.setAttribute("title", isDark ? "Light mode" : "Dark mode");
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

function normalizeBookLevel(level) {
  return (level || "").toUpperCase().startsWith("CEFR") ? "CEFR" : level || "IELTS";
}

function resolveBookImage(image) {
  if (!image || image === DEFAULT_BOOK_IMAGE) {
    return DEFAULT_BOOK_PREVIEW;
  }

  if (image.startsWith("http") || image.startsWith("data:")) {
    return image;
  }

  return `${BASE_URL}/${image.replace(/^\/+/, "")}`;
}

function resolveBookPdf(pdf) {
  if (!pdf) {
    return "#";
  }

  if (pdf.startsWith("http")) {
    return pdf;
  }

  return `${BASE_URL}/${pdf.replace(/^\/+/, "")}`;
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

function renderBooks(payload) {
  if (!libraryGrid) {
    return;
  }

  const books = Array.isArray(payload?.data) ? payload.data : [];
  const searchValue = (librarySearch?.value || "").trim().toLowerCase();

  const filteredBooks = books.filter((book) => {
    const matchesCategory =
      activeLibraryCategory === "All" ? true : normalizeBookLevel(book.level) === activeLibraryCategory;
    const matchesSearch = (book.title || "").toLowerCase().includes(searchValue);

    return matchesCategory && matchesSearch;
  });

  if (!filteredBooks.length) {
    libraryGrid.innerHTML = `
      <div class="library-empty">
        Hech qanday kitob topilmadi. Boshqa nom yoki kategoriya bilan qayta urinib ko'ring.
      </div>
    `;
    return;
  }

  libraryGrid.innerHTML = filteredBooks
    .map(
      (book) => `
        <article class="panel library-card">
          <img class="library-card-cover" src="${escapeHtml(resolveBookImage(book.image))}" alt="${escapeHtml(book.title)} cover" />
          <div class="library-card-body">
            <div class="library-card-copy">
              <h3>${escapeHtml(book.title)}</h3>
              <p>${escapeHtml(book.author)}</p>
            </div>

            <div class="library-card-meta">
              <span class="library-badge">${escapeHtml(book.level)}</span>
              <span class="library-badge">PDF</span>
            </div>

            <div class="library-card-actions">
              <button class="lesson-link library-action" type="button" data-library-read="${escapeHtml(book.pdf)}">
                Read
              </button>
              <a class="task-link library-action" href="${escapeHtml(resolveBookPdf(book.pdf))}" download>
                Download
              </a>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

async function loadBooks() {
  if (!libraryGrid) {
    return;
  }

  libraryGrid.innerHTML = `
    <div class="library-empty">
      Kitoblar yuklanmoqda...
    </div>
  `;

  try {
    const res = await fetch(`${BASE_URL}/api/books`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load books.");
    }

    renderBooks(data);
  } catch (error) {
    libraryGrid.innerHTML = `
      <div class="library-empty">
        Kutubxona backend bilan ulanmagan.
      </div>
    `;
  }
}

function setLibraryCategory(category) {
  activeLibraryCategory = category;

  libraryFilters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.libraryFilter === category);
  });

  loadBooks();
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
  sidebar?.classList.remove("open");
  sidebarOverlay?.classList.remove("open");
}

function openSidebar() {
  sidebar?.classList.add("open");
  sidebarOverlay?.classList.add("open");
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

  if (name === "library") {
    loadBooks();
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

toggleBacklogBtn?.addEventListener("click", () => {
  setBacklogExpanded(!backlogExpanded);
});

sidebarToggle?.addEventListener("click", openSidebar);
sidebarClose?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);
themeToggle?.addEventListener("click", toggleTheme);

if (librarySearch) {
  librarySearch.addEventListener("input", loadBooks);
}

libraryFilters.forEach((button) => {
  button.addEventListener("click", () => {
    setLibraryCategory(button.dataset.libraryFilter || "All");
  });
});

libraryGrid?.addEventListener("click", (event) => {
  const readButton = event.target.closest("[data-library-read]");
  if (!readButton) {
    return;
  }

  const pdfPath = readButton.dataset.libraryRead;
  if (!pdfPath) {
    return;
  }

  window.open(`${BASE_URL}/${pdfPath}`, "_blank", "noopener");
});

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
