const BASE_URL = "http://localhost:5500";

const sectionLabels = {
  dashboard: "Dashboard",
  library: "Library",
  users: "Students",
};



const navLinks = document.querySelectorAll(".nav-link[data-section]");
const sections = document.querySelectorAll(".section");
const headerTitle = document.getElementById("headerTitle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const themeToggle = document.getElementById("themeToggle");
const THEME_KEY = "edu-dashboard-theme";

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("title", isDark ? "Light mode" : "Dark mode");
  }
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

function createStatusBadge(status) {
  const normalized = (status || "").toLowerCase();
  return `<span class="status-badge ${normalized}">${status || "-"}</span>`;
}

function renderDashboardActivity(activity) {
  const tbody = document.getElementById("dashboard-activity-tbody");

  if (!activity){
    tbody.innerHTML = `<tr><td colspan="5">No activity data available.</td></tr>`;
  }else { tbody.innerHTML = activity
    .map(
      (item) => `
        <tr>
          <td>${item.rank}</td>
          <td>${item.name}</td>
          <td>${item.email}</td>
          <td>${item.group}</td>
          <td>${item.score}</td>
        </tr>`,
    )
    .join("");
  }
}

function renderStudents(students) {
  
  const tbody = document.getElementById("users-tbody");

  if (!students){
    tbody.innerHTML = `<tr><td colspan="6">No students found.</td></tr>`;
  }else {
    tbody.innerHTML = students
    .map(
      (item) => `
        <tr>
          <td>${item.id}</td>
          <td>${item.name}</td>
          <td>${item.email}</td>
          <td>${item.program}</td>
          <td>${item.joined}</td>
          <td>${createStatusBadge(item.status)}</td>
        </tr>`,
    )
    .join("");
  } 
}

function renderGroups(groups) {
  
  const statsGrid = document.getElementById("stats-grid");
  const palette = ["purple", "blue", "peach"];

  if (!groups){
    statsGrid.innerHTML = `<article class="metric-card purple">
          <div class="metric-copy">
            <span class="metric-foot">Groups not found</span>
          </div>
        </article>`;
  }else {
    statsGrid.innerHTML = groups
    .map(
      (item, index) => `
        <a class="metric-link" href="../group/group.html?level=${encodeURIComponent(item.level)}">
        <article class="metric-card ${palette[index % palette.length]}">
          <div class="metric-icon">${item.level}</div>
          <div class="metric-copy">
            <span class="metric-label">${item.label}</span>
            <strong class="metric-value">${item.title}</strong>
            <span class="metric-foot">${item.description}</span>
          </div>
        </article>
        </a>`,
    )
    .join("");
  } 
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

  if (headerTitle) {
    headerTitle.textContent = sectionLabels[name] || "Dashboard";
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

sidebarToggle?.addEventListener("click", openSidebar);
sidebarClose?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);
themeToggle?.addEventListener("click", toggleTheme);

function clearFormErrors() {
  document.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
  });

  document.querySelectorAll(".modal-form input, .modal-form textarea, .modal-form select").forEach((el) => {
    el.classList.remove("invalid");
  });
}

const DEFAULT_BOOK_IMAGE = "default-book.png";
const DEFAULT_BOOK_PREVIEW = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 600">
    <defs>
      <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#d97b41" />
        <stop offset="100%" stop-color="#c95a52" />
      </linearGradient>
    </defs>
    <rect width="480" height="600" rx="36" fill="url(#bookGradient)" />
    <rect x="34" y="34" width="412" height="532" rx="28" fill="rgba(255,255,255,0.12)" />
    <text x="52" y="118" fill="#fff7f1" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700">Library</text>
    <text x="52" y="210" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="46" font-weight="700">Default Book</text>
    <text x="52" y="520" fill="#fff7f1" font-family="Segoe UI, Arial, sans-serif" font-size="24">John Academy</text>
  </svg>
`)}`;

const bookGrid = document.getElementById("book-grid");
const addBookBtn = document.getElementById("addBookBtn");
const bookSearchInput = document.getElementById("bookSearchInput");
const bookLevelFilter = document.getElementById("bookLevelFilter");
const bookModalOverlay = document.getElementById("bookModalOverlay");
const bookForm = document.getElementById("bookForm");
const bookModalTitle = document.getElementById("bookModalTitle");
const bookModalSubmit = document.getElementById("bookModalSubmit");
const bookPdfInput = document.getElementById("bookPdf");
const bookPdfHint = document.getElementById("bookPdfHint");
const bookImageInput = document.getElementById("bookImage");
const bookImagePreview = document.getElementById("bookImagePreview");
const deleteBookModalOverlay = document.getElementById("deleteBookModalOverlay");
const deleteBookModalConfirm = document.getElementById("deleteBookModalConfirm");

let pendingBookDeleteId = null;
let currentBookImageValue = DEFAULT_BOOK_IMAGE;
let currentBookPdfValue = "";
let currentBookObjectUrl = "";

function normalizeBookLevel(level) {
  return (level || "").toUpperCase().startsWith("CEFR") ? "CEFR" : level || "IELTS";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveBookImage(image) {
  if (!image || image === DEFAULT_BOOK_IMAGE) {
    return DEFAULT_BOOK_PREVIEW;
  }

  if (image.startsWith("data:") || image.startsWith("http")) {
    return image;
  }

  return `${BASE_URL}/${image.replace(/^\/+/, "")}`;
}

function getPdfFileName(pdfPath) {
  return (pdfPath || "").split("/").pop() || "No PDF selected";
}

function updateBookPreview(src) {
  bookImagePreview.src = src || DEFAULT_BOOK_PREVIEW;
}

function resetBookObjectUrl() {
  if (currentBookObjectUrl) {
    URL.revokeObjectURL(currentBookObjectUrl);
    currentBookObjectUrl = "";
  }
}

function renderBooks(payload) {
  if (!bookGrid) {
    return;
  }

  const books = Array.isArray(payload?.data) ? payload.data : [];
  const searchValue = (bookSearchInput?.value || "").trim().toLowerCase();
  const levelValue = bookLevelFilter?.value || "All";

  const filteredBooks = books.filter((book) => {
    const matchesSearch = (book.title || "").toLowerCase().includes(searchValue);
    const matchesLevel =
      levelValue === "All" ? true : normalizeBookLevel(book.level) === levelValue;

    return matchesSearch && matchesLevel;
  });

  if (!filteredBooks.length) {
    bookGrid.innerHTML = `<div class="book-empty">No books found for the current search or level filter.</div>`;
    return;
  }

  bookGrid.innerHTML = filteredBooks
    .map(
      (book) => `
        <article
          class="panel book-card"
          data-book-card="true"
          data-book-id="${book.id}"
          data-book-title="${escapeHtml(book.title)}"
          data-book-author="${escapeHtml(book.author)}"
          data-book-level="${escapeHtml(book.level)}"
          data-book-pdf="${escapeHtml(book.pdf)}"
          data-book-image="${escapeHtml(book.image || DEFAULT_BOOK_IMAGE)}"
        >
          <img
            class="book-card-cover"
            src="${escapeHtml(resolveBookImage(book.image))}"
            alt="${escapeHtml(book.title)} cover"
            onerror="this.onerror=null;this.src='${DEFAULT_BOOK_PREVIEW}'"
          />
          <div class="book-card-body">
            <div class="book-card-copy">
              <h3>${escapeHtml(book.title)}</h3>
              <p>${escapeHtml(book.author)}</p>
            </div>

            <div class="book-card-meta">
              <span class="book-badge">${escapeHtml(book.level)}</span>
              <span class="book-badge">PDF Ready</span>
            </div>

            <div class="book-card-actions">
              <button class="btn btn-edit btn-shine book-action" type="button" data-book-action="edit">
                Edit
              </button>
              <button class="btn btn-danger btn-shine book-action" type="button" data-book-action="delete">
                Delete
              </button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

async function loadBooks() {
  if (!bookGrid) {
    return;
  }

  bookGrid.innerHTML = `<div class="book-empty">Loading books...</div>`;

  try {
    const res = await fetch(`${BASE_URL}/api/books`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to load books.");
    }

    renderBooks(data);
  } catch (error) {
    bookGrid.innerHTML = `<div class="book-empty">Book backend is not available yet.</div>`;
  }
}

function clearBookFormErrors() {
  clearFormErrors();
  bookPdfInput?.classList.remove("invalid");
}

function clearBookFormState() {
  resetBookObjectUrl();
  currentBookImageValue = DEFAULT_BOOK_IMAGE;
  currentBookPdfValue = "";
  bookForm.reset();
  document.getElementById("bookId").value = "";
  clearBookFormErrors();
  bookPdfHint.textContent = "PDF is required for new books.";
  updateBookPreview(DEFAULT_BOOK_PREVIEW);
}

function openCreateBookModal() {
  bookModalTitle.textContent = "Add Book";
  bookModalSubmit.textContent = "Create Book";
  clearBookFormState();
  bookModalOverlay.classList.add("open");
}

function closeBookModal() {
  bookModalOverlay.classList.remove("open");
  clearBookFormState();
}

function openEditBookModal(trigger) {
  const card = trigger.closest("[data-book-card]");
  if (!card) {
    return;
  }

  bookModalTitle.textContent = "Edit Book";
  bookModalSubmit.textContent = "Save Changes";
  clearBookFormErrors();
  resetBookObjectUrl();
  bookForm.reset();

  document.getElementById("bookId").value = card.dataset.bookId || "";
  document.getElementById("bookTitle").value = card.dataset.bookTitle || "";
  document.getElementById("bookAuthor").value = card.dataset.bookAuthor || "";
  document.getElementById("bookLevel").value = card.dataset.bookLevel || "";
  currentBookPdfValue = card.dataset.bookPdf || "";
  currentBookImageValue = card.dataset.bookImage || DEFAULT_BOOK_IMAGE;

  bookPdfHint.textContent = `Current PDF: ${getPdfFileName(currentBookPdfValue)}`;
  updateBookPreview(resolveBookImage(currentBookImageValue));
  bookModalOverlay.classList.add("open");
}

function openDeleteBookModal(trigger) {
  const card = trigger.closest("[data-book-card]");
  if (!card) {
    return;
  }

  pendingBookDeleteId = card.dataset.bookId;
  document.getElementById("deleteBookName").textContent = card.dataset.bookTitle || "this book";
  deleteBookModalOverlay.classList.add("open");
}

function closeDeleteBookModal() {
  deleteBookModalOverlay.classList.remove("open");
  pendingBookDeleteId = null;
}

function setBookFieldError(fieldId, errId, message) {
  const input = document.getElementById(fieldId);
  const err = document.getElementById(errId);

  if (input) {
    input.classList.add("invalid");
  }

  if (err) {
    err.textContent = message;
  }
}

function validateBookForm() {
  clearBookFormErrors();
  let valid = true;

  const title = document.getElementById("bookTitle").value.trim();
  const author = document.getElementById("bookAuthor").value.trim();
  const level = document.getElementById("bookLevel").value;
  const hasPdfFile = Boolean(bookPdfInput.files?.[0]);
  const hasExistingPdf = Boolean(currentBookPdfValue);

  if (!title) {
    setBookFieldError("bookTitle", "book-err-title", "Book title is required.");
    valid = false;
  }

  if (!author) {
    setBookFieldError("bookAuthor", "book-err-author", "Author is required.");
    valid = false;
  }

  if (!level) {
    setBookFieldError("bookLevel", "book-err-level", "Please select a level.");
    valid = false;
  }

  if (!hasPdfFile && !hasExistingPdf) {
    setBookFieldError("bookPdf", "book-err-pdf", "PDF is required.");
    valid = false;
  }

  return valid;
}

function buildBookPayload() {
  const formData = new FormData();

  formData.append("title", document.getElementById("bookTitle").value.trim());
  formData.append("author", document.getElementById("bookAuthor").value.trim());
  formData.append("level", document.getElementById("bookLevel").value);

  if (bookPdfInput.files?.[0]) {
    formData.append("pdf", bookPdfInput.files[0]);
  }

  if (bookImageInput.files?.[0]) {
    formData.append("image", bookImageInput.files[0]);
  }

  return formData;
}

async function onCreateBook(data) {
  const response = await fetch(`${BASE_URL}/api/books`, {
    method: "POST",
    body: data,
  });

  const value = await response.json();
  if (!response.ok) {
    throw new Error(value.message || "Failed to create book.");
  }

  alert(value.message);
}

async function onUpdateBook(id, data) {
  const response = await fetch(`${BASE_URL}/api/books/${id}`, {
    method: "PUT",
    body: data,
  });

  const value = await response.json();
  if (!response.ok) {
    throw new Error(value.message || "Failed to update book.");
  }

  alert(value.message);
}

async function onDeleteBook(id) {
  const response = await fetch(`${BASE_URL}/api/books/${id}`, {
    method: "DELETE",
  });

  const value = await response.json();
  if (!response.ok) {
    throw new Error(value.message || "Failed to delete book.");
  }

  alert(value.message);
}

addBookBtn?.addEventListener("click", openCreateBookModal);

bookSearchInput?.addEventListener("input", loadBooks);
bookLevelFilter?.addEventListener("change", loadBooks);

bookGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.bookAction;

  if (action === "edit") {
    openEditBookModal(button);
  }

  if (action === "delete") {
    openDeleteBookModal(button);
  }
});

document.getElementById("bookModalClose")?.addEventListener("click", closeBookModal);
document.getElementById("bookModalCancel")?.addEventListener("click", closeBookModal);
bookModalOverlay?.addEventListener("click", (event) => {
  if (event.target === bookModalOverlay) {
    closeBookModal();
  }
});

bookPdfInput?.addEventListener("change", () => {
  const selectedFile = bookPdfInput.files?.[0];
  bookPdfHint.textContent = selectedFile
    ? `Selected PDF: ${selectedFile.name}`
    : currentBookPdfValue
      ? `Current PDF: ${getPdfFileName(currentBookPdfValue)}`
      : "PDF is required for new books.";
});

bookImageInput?.addEventListener("change", () => {
  const file = bookImageInput.files?.[0];

  resetBookObjectUrl();

  if (!file) {
    updateBookPreview(resolveBookImage(currentBookImageValue));
    return;
  }

  currentBookObjectUrl = URL.createObjectURL(file);
  updateBookPreview(currentBookObjectUrl);
});

bookForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validateBookForm()) {
    return;
  }

  const id = document.getElementById("bookId").value;
  bookModalSubmit.disabled = true;
  bookModalSubmit.textContent = "Saving...";

  try {
    const payload = buildBookPayload();

    if (id) {
      await onUpdateBook(id, payload);
    } else {
      await onCreateBook(payload);
    }

    closeBookModal();
    await loadBooks();
  } catch (error) {
    alert(error.message);
  } finally {
    bookModalSubmit.disabled = false;
    bookModalSubmit.textContent = id ? "Save Changes" : "Create Book";
  }
});

document.getElementById("deleteBookModalClose")?.addEventListener("click", closeDeleteBookModal);
document.getElementById("deleteBookModalCancel")?.addEventListener("click", closeDeleteBookModal);
deleteBookModalOverlay?.addEventListener("click", (event) => {
  if (event.target === deleteBookModalOverlay) {
    closeDeleteBookModal();
  }
});

deleteBookModalConfirm?.addEventListener("click", async () => {
  if (!pendingBookDeleteId) {
    return;
  }

  deleteBookModalConfirm.disabled = true;
  deleteBookModalConfirm.textContent = "Deleting...";

  try {
    await onDeleteBook(pendingBookDeleteId);
    closeDeleteBookModal();
    await loadBooks();
  } catch (error) {
    alert(error.message);
  } finally {
    deleteBookModalConfirm.disabled = false;
    deleteBookModalConfirm.textContent = "Yes, Delete";
  }
});

if (themeToggle) {
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
}

if (document.getElementById("section-dashboard")) {
  loadData();
  renderStudents();
  showSection("dashboard");
}

async function loadData() {
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
