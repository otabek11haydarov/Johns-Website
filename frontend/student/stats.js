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

function setActiveSection(section) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.section === section);
  });

  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = sectionNames[section] || "Dashboard";
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

let currentXpHistory = [];

function drawPerformanceChart() {
  const xpChartCanvas = document.getElementById("xpHistoryChart");
  if (!xpChartCanvas || currentXpHistory.length === 0) return;

  const isLight = document.body.classList.contains("light-mode");
  const ctx = xpChartCanvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = xpChartCanvas.clientWidth || 800;
  const height = xpChartCanvas.clientHeight || 300;

  xpChartCanvas.width = Math.round(width * ratio);
  xpChartCanvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  
  const maxXP = Math.max(...currentXpHistory.map(d => d.xp), 100);
  
  function x(index) {
    return padding.left + (plotWidth / Math.max(1, currentXpHistory.length - 1)) * index;
  }

  function y(value) {
    return padding.top + plotHeight - (value / maxXP) * plotHeight;
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = isLight ? "rgba(76,48,39,0.11)" : "rgba(255,255,255,0.075)";
  ctx.fillStyle = isLight ? "rgba(92,67,58,0.78)" : "rgba(211,196,191,0.82)";
  ctx.font = "12px Segoe UI, Arial";

  for (let tick = 0; tick <= maxXP; tick += Math.ceil(maxXP / 4)) {
    const tickY = y(tick);
    ctx.beginPath();
    ctx.moveTo(padding.left, tickY);
    ctx.lineTo(width - padding.right, tickY);
    ctx.stroke();
    ctx.fillText(tick, 10, tickY + 4);
  }

  const labelStep = Math.ceil(currentXpHistory.length / 7);
  currentXpHistory.forEach((item, index) => {
    if (index % labelStep === 0 || index === currentXpHistory.length - 1) {
      ctx.fillText(item.date, x(index) - 15, height - 10);
    }
  });

  ctx.save();
  ctx.shadowColor = "rgba(255,185,29,0.6)";
  ctx.shadowBlur = 10;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ffb91d";
  ctx.beginPath();
  currentXpHistory.forEach((item, index) => {
    const pointX = x(index);
    const pointY = y(item.xp);
    if (index === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  });
  ctx.stroke();
  ctx.restore();
  
  currentXpHistory.forEach((item, index) => {
    ctx.beginPath();
    ctx.arc(x(index), y(item.xp), 4, 0, Math.PI * 2);
    ctx.fillStyle = isLight ? "#fff" : "#1a1a1a";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffb91d";
    ctx.stroke();
  });
}

function renderStreakCalendar(calendarData) {
  const container = document.getElementById("streak-calendar");
  if (!container || !calendarData) return;
  
  container.innerHTML = "";
  calendarData.forEach(day => {
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    if (day.level > 0) cell.classList.add(`active-level-${day.level}`);
    cell.title = `${day.date}: ${day.xp} XP`;
    container.appendChild(cell);
  });
}

async function fetchStatsData() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../auth/login.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/students/stats`, {
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
    
    document.getElementById("stat-total-time").textContent = `${data.totalLearningTime.hours}h ${data.totalLearningTime.minutes}m`;
    document.getElementById("stat-total-xp").textContent = data.totalXP;
    document.getElementById("stat-current-streak").textContent = `${data.currentStreak} Days`;
    document.getElementById("stat-longest-streak").textContent = `${data.longestStreak} Days`;
    
    currentXpHistory = data.xpHistory || [];
    drawPerformanceChart();
    renderStreakCalendar(data.calendar || []);

  } catch (error) {
    console.error("Error fetching stats data:", error);
  }
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

fetchStatsData();
