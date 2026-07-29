const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarScrim = document.getElementById("sidebarScrim");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

let currentLevel = "Umumiy";
let currentPage = 1;
let totalPages = 1;
let availableLevelsLoaded = false;
const limit = 10;

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-mode", isLight);
  localStorage.setItem("student-portal-theme", theme);
  
  if (themeToggle) {
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    themeToggle.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
    if (themeIcon) {
      themeIcon.classList.toggle("moon-icon", isLight);
      themeIcon.classList.toggle("sun-icon", !isLight);
    }
  }
}

function initUI() {
  applyTheme(localStorage.getItem("student-portal-theme") || "dark");
  
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.body.classList.contains("light-mode") ? "light" : "dark";
      applyTheme(current === "light" ? "dark" : "light");
    });
  }

  if (menuBtn && sidebar && sidebarScrim) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      sidebarScrim.classList.toggle("open");
    });
    sidebarScrim.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarScrim.classList.remove("open");
    });
  }

  document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchLeaderboard();
    }
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchLeaderboard();
    }
  });
}

function renderTabs(levels) {
  if (availableLevelsLoaded) return;
  const container = document.getElementById("levelTabs");
  // Keep Umumiy, clear others
  container.innerHTML = `<button class="tab-btn active" data-level="Umumiy">Umumiy</button>`;
  
  levels.forEach(l => {
    container.innerHTML += `<button class="tab-btn" data-level="${l}">${l}</button>`;
  });

  const buttons = container.querySelectorAll(".tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      // Remove active from all
      buttons.forEach(b => b.classList.remove("active"));
      // Add active to clicked
      e.target.classList.add("active");
      
      currentLevel = e.target.dataset.level;
      currentPage = 1;
      fetchLeaderboard();
    });
  });

  availableLevelsLoaded = true;
}

function renderPodium(students) {
  const container = document.getElementById("podiumContainer");
  container.innerHTML = "";
  
  // Podium only shows on page 1
  if (currentPage !== 1 || students.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";

  // Podium order: 2, 1, 3
  const top3 = students.slice(0, 3);
  
  // Fill empty spots if less than 3 students
  const p1 = top3[0] || { name: "---", score: 0 };
  const p2 = top3[1] || { name: "---", score: 0 };
  const p3 = top3[2] || { name: "---", score: 0 };

  const podiumOrder = [
    { rank: 2, data: p2 },
    { rank: 1, data: p1 },
    { rank: 3, data: p3 }
  ];

  podiumOrder.forEach(item => {
    if (item.data.name !== "---" || item.rank === 1) {
      const initial = item.data.name !== "---" ? item.data.name.substring(0, 2).toUpperCase() : "-";
      container.innerHTML += `
        <div class="podium-item rank-${item.rank}">
            <div class="podium-avatar">${initial}</div>
            <div class="podium-name" title="${item.data.name}">${item.data.name}</div>
            <div class="podium-score">${item.data.score > 0 ? item.data.score + '%' : ''}</div>
            <div class="podium-block">
                <span class="podium-rank">${item.rank}</span>
            </div>
        </div>
      `;
    } else {
      // Empty placeholder for aesthetic
      container.innerHTML += `
        <div class="podium-item rank-${item.rank}">
            <div class="podium-avatar" style="visibility:hidden;">-</div>
            <div class="podium-name"></div>
            <div class="podium-score"></div>
            <div class="podium-block" style="opacity:0.3;">
                <span class="podium-rank">${item.rank}</span>
            </div>
        </div>
      `;
    }
  });
}

function renderList(students) {
  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";
  
  // If page 1, skip first 3 (they are on podium)
  const startIndex = currentPage === 1 ? 3 : 0;
  const listStudents = students.slice(startIndex);

  if (listStudents.length === 0 && currentPage === 1 && students.length <= 3) {
      // It's fine, all are on podium
      return;
  }

  if (students.length === 0) {
      list.innerHTML = `<li style="justify-content:center; color:#888;">Hech kim topilmadi</li>`;
      return;
  }

  const colors = ["blue", "pink", "green", "orange", "gray"];
  
  listStudents.forEach((student, index) => {
    const realRank = (currentPage - 1) * limit + startIndex + index + 1;
    const initial = student.name.substring(0, 2).toUpperCase();
    
    // Choose a color randomly or based on name length so it's consistent
    const colorIdx = student.name.length % colors.length;
    const faceClass = colors[colorIdx] + "-face"; // reuse dashboard face colors conceptually, but here we just use background colors

    list.innerHTML += `
      <li>
          <div class="list-rank">${realRank}</div>
          <div class="list-avatar" style="background-color: var(--${colors[colorIdx]}-color, #555);">${initial}</div>
          <div class="list-name">${student.name}</div>
          <div class="list-score">${student.score}%</div>
      </li>
    `;
  });
}

async function fetchLeaderboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../auth/login.html";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/students/leaderboard?level=${currentLevel}&page=${currentPage}&limit=10`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "../auth/login.html";
      }
      return;
    }

    const { data } = await res.json();
    
    renderTabs(data.availableLevels || []);
    renderPodium(data.leaderboard);
    renderList(data.leaderboard);
    
    // Header Avatar
    if (data.currentUser) {
       const headerAvatar = document.getElementById("header-avatar");
       if(headerAvatar) {
         headerAvatar.textContent = data.currentUser.name.substring(0,2).toUpperCase();
       }
    }

    // Pagination
    totalPages = data.totalPages || 1;
    document.getElementById("pageInfo").textContent = `Sahifa ${currentPage} / ${totalPages}`;
    document.getElementById("prevBtn").disabled = currentPage === 1;
    document.getElementById("nextBtn").disabled = currentPage === totalPages || totalPages === 0;

  } catch (err) {
    console.error(err);
  }
}

initUI();
fetchLeaderboard();
