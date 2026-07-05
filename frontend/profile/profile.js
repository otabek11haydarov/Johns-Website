const BASE_URL = "http://localhost:5500";

const sectionLabels = {
  overview: "My Profile",
  courses: "My Courses",
  settings: "Settings",
  certificates: "Certificates",
};

const navLinks = document.querySelectorAll(".nav-link[data-section]");
const sections = document.querySelectorAll(".section");
const headerTitle = document.getElementById("headerTitle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const themeToggle = document.getElementById("themeToggle");
const THEME_KEY = "profile-theme";

// Theme Management
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

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

// Section Navigation
function switchSection(sectionName) {
  // Remove active class from all sections and nav links
  sections.forEach((section) => section.classList.remove("active"));
  navLinks.forEach((link) => link.classList.remove("active"));

  // Add active class to selected section and nav link
  const targetSection = document.getElementById(`section-${sectionName}`);
  const targetLink = document.querySelector(`[data-section="${sectionName}"]`);

  if (targetSection) {
    targetSection.classList.add("active");
  }

  if (targetLink) {
    targetLink.classList.add("active");
  }

  // Update header title
  if (headerTitle) {
    headerTitle.textContent = sectionLabels[sectionName] || sectionName;
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// Sidebar Management
function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("open");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("open");
}

function toggleSidebar() {
  if (sidebar.classList.contains("open")) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

// Event Listeners
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const section = link.getAttribute("data-section");
    switchSection(section);
  });
});

sidebarToggle.addEventListener("click", toggleSidebar);
sidebarClose.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);
themeToggle.addEventListener("click", toggleTheme);

// Window Resize Handler
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeSidebar();
  }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  switchSection("overview");
});

// Demo Function: Fetch user profile (can be connected to backend later)
async function fetchUserProfile() {
  try {
    const response = await fetch(`${BASE_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("User Profile:", data);
      // Update UI with user data
      updateProfileUI(data);
    } else {
      console.log("Unable to fetch profile");
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
  }
}

// Demo Function: Update profile UI with fetched data
function updateProfileUI(profileData) {
  // Example: Update profile information
  if (profileData.fullName) {
    document.querySelector(".topbar-user-copy strong").textContent = profileData.fullName;
    document.querySelector(".profile-copy strong").textContent = profileData.fullName;
  }

  if (profileData.email) {
    document.querySelector(".topbar-user-copy span").textContent = profileData.email;
  }
}

// Demo Function: Handle password change
function handlePasswordChange() {
  const buttons = document.querySelectorAll("button.btn-secondary");
  buttons.forEach((btn) => {
    if (btn.textContent.includes("Update")) {
      btn.addEventListener("click", () => {
        alert("Password change feature would redirect to a secure form");
      });
    }
  });
}

// Demo Function: Handle certificate download
function handleCertificateDownload() {
  const downloadButtons = document.querySelectorAll(".certificate-card .btn");
  downloadButtons.forEach((btn) => {
    if (btn.textContent.includes("Download")) {
      btn.addEventListener("click", () => {
        alert("Downloading certificate...");
        // In a real application, this would trigger a download
      });
    }
  });
}

// Initialize demo features
handlePasswordChange();
handleCertificateDownload();
