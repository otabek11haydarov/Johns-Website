const menuBtn = document.getElementById("menuBtn");
const studentApp = document.querySelector(".student-app");
const sidebar = document.getElementById("sidebar");
const sidebarScrim = document.getElementById("sidebarScrim");
const collapseBtn = document.getElementById("collapseBtn");
const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
const navItems = document.querySelectorAll(".nav-item[data-section]");
const chartCanvas = document.getElementById("performanceChart");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const THEME_KEY = "student-portal-theme";
const SIDEBAR_KEY = "student-sidebar-hidden";
const desktopQuery = window.matchMedia("(min-width: 1121px)");

const sectionNames = {
  dashboard: "Dashboard",
  classes: "My Classes",
  schedule: "Schedule",
  attendance: "Attendance",
  assignments: "My Assignments",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
};

function openSidebar() {
  sidebar?.classList.add("open");
  sidebarScrim?.classList.add("open");
  updateMenuButtonLabel();
}

function closeSidebar() {
  sidebar?.classList.remove("open");
  sidebarScrim?.classList.remove("open");
  updateMenuButtonLabel();
}

function updateMenuButtonLabel() {
  const isHidden = studentApp?.classList.contains("sidebar-hidden");
  const isOpen = sidebar?.classList.contains("open");

  if (desktopQuery.matches) {
    menuBtn?.setAttribute("aria-label", isHidden ? "Show dashboard menu" : "Hide dashboard menu");
    menuBtn?.setAttribute("aria-expanded", String(!isHidden));
    return;
  }

  menuBtn?.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  menuBtn?.setAttribute("aria-expanded", String(isOpen));
}

function setDesktopSidebarHidden(hidden, persist = true) {
  studentApp?.classList.toggle("sidebar-hidden", hidden);
  if (persist) {
    localStorage.setItem(SIDEBAR_KEY, hidden ? "true" : "false");
  }
  updateMenuButtonLabel();
  window.setTimeout(drawPerformanceChart, 240);
}

function toggleSidebarFromMenu() {
  if (!desktopQuery.matches) {
    if (sidebar?.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
    return;
  }

  const isHidden = studentApp?.classList.contains("sidebar-hidden");
  setDesktopSidebarHidden(!isHidden);
}

let studentLessons = [
  {
    id: "lesson-1",
    order: 1,
    title: "Lesson 1: Essential Flashcards & Vocabulary",
    description: "A1 darajadagi eng muhim so'zlarni interaktiv 3D flashcardlar va video dars orqali o'rganing.",
    badge: "1-DARS • 4 TASKS",
    status: "Yangi",
    tags: ["🎬 Video", "🎴 Flashcard", "📝 Test", "🎙️ Speaking"],
    link: "lesson-runner.html?lessonId=lesson-1"
  },
  {
    id: "lesson-2",
    order: 2,
    title: "Lesson 2: Daily Expressions & Speaking",
    description: "Kunlik so'z birikmalari va iboralarni takrorlang hamda xotirani sinab ko'ring.",
    badge: "2-DARS • 4 TASKS",
    status: "Topshiriq",
    tags: ["🎬 Video", "🎴 Flashcard", "📝 Test", "🎙️ Speaking"],
    link: "lesson-runner.html?lessonId=lesson-2"
  },
  {
    id: "lesson-3",
    order: 3,
    title: "Lesson 3: Grammar Test & Quiz",
    description: "Grammatika qoidalarini sinovdan o'tkazish uchun interaktiv testlar va darslar.",
    badge: "3-DARS • 4 TASKS",
    status: "Dars",
    tags: ["🎬 Video", "🎴 Flashcard", "📝 Test", "🎙️ Speaking"],
    link: "lesson-runner.html?lessonId=lesson-3"
  }
];

function renderAssignmentsGrid(apiLessons) {
  const container = document.getElementById("assignments-grid");
  if (!container) return;

  const lessonsToRender = (apiLessons && apiLessons.length > 0) ? apiLessons.map((l, index) => ({
    id: l.id,
    order: l.order || index + 1,
    title: l.title || `${index + 1}-Dars`,
    description: l.description || "Interactive dars mashqlari va vazifalar.",
    badge: `${l.order || index + 1}-DARS • ${l.taskCount || 4} TASKS`,
    status: "Mavjud",
    tags: ["🎬 Video", "🎴 Flashcard", "📝 Test", "🎙️ Speaking"],
    link: `lesson-runner.html?lessonId=${l.id}`
  })) : studentLessons;

  container.innerHTML = lessonsToRender.map(item => `
    <article class="assignment-card">
      <div>
        <div class="assignment-card-top">
          <span class="assignment-badge">${item.badge}</span>
          <span class="assignment-status-tag">${item.status}</span>
        </div>
        <h3 class="assignment-title">${item.title}</h3>
        <p class="assignment-desc">${item.description}</p>
        <div class="assignment-meta">
          ${item.tags.map(t => `<span class="assignment-tag">${t}</span>`).join('')}
        </div>
      </div>
      <a href="${item.link}" class="assignment-start-btn">
        <span>Boshlash</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </a>
    </article>
  `).join('');
}

function setActiveSection(section) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === section);
  });

  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = sectionNames[section] || "Dashboard";
  }

  const dashSection = document.getElementById("section-dashboard");
  const assignSection = document.getElementById("section-assignments");

  if (section === "assignments") {
    if (dashSection) dashSection.style.display = "none";
    if (assignSection) assignSection.style.display = "block";
    renderAssignmentsGrid();
  } else {
    if (assignSection) assignSection.style.display = "none";
    if (dashSection) dashSection.style.display = "block";
  }

  closeSidebar();
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  const isLight = nextTheme === "light";

  document.body.classList.toggle("light-mode", isLight);
  localStorage.setItem(THEME_KEY, nextTheme);

  themeToggle?.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  themeToggle?.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
  if (themeIcon) {
    themeIcon.classList.toggle("moon-icon", isLight);
    themeIcon.classList.toggle("sun-icon", !isLight);
  }
  drawPerformanceChart();
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("light-mode") ? "light" : "dark";
  applyTheme(currentTheme === "light" ? "dark" : "light");
}

function drawPerformanceChart() {
  if (!chartCanvas) {
    return;
  }

  const isLight = document.body.classList.contains("light-mode");
  const ctx = chartCanvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = chartCanvas.clientWidth || 560;
  const height = chartCanvas.clientHeight || 176;

  chartCanvas.width = Math.round(width * ratio);
  chartCanvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 14, right: 12, bottom: 30, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const assignment = [82, 75, 88, 66, 78, 74, 76];
  const homework = [60, 44, 67, 36, 49, 43, 42];

  function x(index) {
    return padding.left + (plotWidth / (days.length - 1)) * index;
  }

  function y(value) {
    return padding.top + plotHeight - (value / 100) * plotHeight;
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = isLight ? "rgba(76,48,39,0.11)" : "rgba(255,255,255,0.075)";
  ctx.fillStyle = isLight ? "rgba(92,67,58,0.78)" : "rgba(211,196,191,0.82)";
  ctx.font = "11px Segoe UI, Arial";

  for (let tick = 0; tick <= 100; tick += 20) {
    const tickY = y(tick);
    ctx.beginPath();
    ctx.moveTo(padding.left, tickY);
    ctx.lineTo(width - padding.right, tickY);
    ctx.stroke();
    ctx.fillText(`${tick}%`, 7, tickY + 4);
  }

  days.forEach((day, index) => {
    ctx.fillText(day, x(index) - 10, height - 8);
  });

  function plot(values, color, glow) {
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 13;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.beginPath();
    values.forEach((value, index) => {
      const pointX = x(index);
      const pointY = y(value);
      if (index === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    });
    ctx.stroke();
    ctx.restore();

    values.forEach((value, index) => {
      ctx.beginPath();
      ctx.arc(x(index), y(value), 4, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? "#fff8f3" : "#26100d";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = color;
      ctx.stroke();
    });
  }

  plot(assignment, "#ff7a32", "rgba(255,122,50,0.65)");
  plot(homework, "#ff414a", "rgba(255,65,74,0.55)");
}

navItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    setActiveSection(item.dataset.section || "dashboard");
  });
});

menuBtn?.addEventListener("click", toggleSidebarFromMenu);
sidebarScrim?.addEventListener("click", closeSidebar);
collapseBtn?.addEventListener("click", () => {
  if (desktopQuery.matches) {
    setDesktopSidebarHidden(true);
    return;
  }

  closeSidebar();
});
themeToggle?.addEventListener("click", toggleTheme);
desktopQuery.addEventListener("change", () => {
  closeSidebar();
  if (desktopQuery.matches) {
    setDesktopSidebarHidden(localStorage.getItem(SIDEBAR_KEY) === "true", false);
  } else {
    setDesktopSidebarHidden(false, false);
  }
  drawPerformanceChart();
});
window.addEventListener("resize", drawPerformanceChart);

applyTheme(localStorage.getItem(THEME_KEY) || "dark");
if (desktopQuery.matches) {
  setDesktopSidebarHidden(localStorage.getItem(SIDEBAR_KEY) === "true", false);
} else {
  setDesktopSidebarHidden(false, false);
}

// Fetch dashboard data
async function fetchDashboardData() {
  // BASE_URL is defined in shared/config.js
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../auth/login.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/students/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "../auth/login.html";
      }
      return;
    }
    const json = await res.json();
    const data = json.data;
    if(!data) return;
    
    // Update Stats
    document.getElementById("stat-streak").textContent = data.stats.streak || 0;
    document.getElementById("stat-xp").textContent = data.stats.xp || 0;
    document.getElementById("stat-level").textContent = data.profile.level || "A1";
    document.getElementById("stat-group").textContent = data.profile.groupName || "No Group";
    document.getElementById("stat-attendance").textContent = `${data.stats.attendanceRate || 0}%`;
    document.getElementById("stat-pending").textContent = data.stats.pendingTasks || 0;
    
    // Quick Actions
    const quickPending = document.getElementById("quick-action-pending");
    if(quickPending) quickPending.textContent = `${data.stats.pendingTasks || 0} pending tasks`;

    // Current Lesson
    const cl = data.currentLesson;
    if (cl) {
      document.getElementById("current-lesson-title").textContent = cl.title;
      document.getElementById("current-lesson-teacher").textContent = cl.teacher;
      document.getElementById("current-lesson-type").textContent = cl.groupLabel ? `Guruh: ${cl.groupLabel}` : `Vazifalar: ${cl.taskCount}`;
      document.getElementById("current-lesson-status").textContent = "Boshlash";
      document.getElementById("current-lesson-status").href = `lesson-runner.html?lessonId=${cl.id}`;
    } else {
      document.getElementById("current-lesson-title").textContent = "Barcha darslar tugatildi!";
      document.getElementById("current-lesson-teacher").textContent = "Tabriklaymiz!";
      document.getElementById("current-lesson-type").textContent = "";
      document.getElementById("current-lesson-status").textContent = "Tugatilgan";
      document.getElementById("current-lesson-status").href = "#";
    }

    if (data.profile && data.profile.level) {
      try {
        const lRes = await fetch(`${BASE_URL}/api/lessons/group/${data.profile.level}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (lRes.ok) {
          const lJson = await lRes.json();
          if (lJson.data && Array.isArray(lJson.data)) {
            renderAssignmentsGrid(lJson.data);
          }
        }
      } catch (err) {
        console.log("Could not load group lessons:", err);
      }
    }

    // Top Students
    const topList = document.getElementById("top-students-list");
    if (topList && data.topStudents) {
      topList.innerHTML = "";
      const medals = ["gold-medal", "silver-medal", "bronze-medal"];
      const colors = ["blue", "gray", "pink", "green", "orange"];
      data.topStudents.forEach((student, index) => {
        const medalStr = index < 3 ? `<em class="medal ${medals[index]}">${index + 1}</em>` : `<em>${index + 1}</em>`;
        const faceColor = colors[index % colors.length] + "-face";
        topList.innerHTML += `<li>${medalStr}<span class="face ${faceColor}"></span><strong>${student.name}</strong><b>${student.score}%</b></li>`;
      });
      if(data.topStudents.length === 0) topList.innerHTML = "<li>Hech kim topilmadi</li>";
    }

    const youRow = document.getElementById("top-students-you");
    if (youRow && data.stats) {
       const initial = data.profile.fullName ? data.profile.fullName.substring(0,2).toUpperCase() : "OH";
       youRow.innerHTML = `
            <div class="avatar">${initial}</div>
            <span>
                <strong>You (${data.profile.fullName})</strong>
                <small>Rank #${data.stats.rank || '-'}</small>
            </span>
            <b>${data.stats.xp > 0 ? 'Active' : 'No XP'}</b>
       `;
    }

    // Performance (mocked updates for UI until accurate daily data logic is fully built)
    if(document.getElementById("perf-today")) {
      document.getElementById("perf-today").textContent = `${Math.floor(Math.random() * 20 + 80)}%`;
      document.getElementById("perf-avg").textContent = `${Math.floor(Math.random() * 20 + 75)}%`;
      document.getElementById("perf-best").textContent = "Wednesday";
      document.getElementById("perf-weakest").textContent = "Monday";
    }

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  }
}

fetchDashboardData();
