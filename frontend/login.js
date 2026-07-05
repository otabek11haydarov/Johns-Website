const textSwitcherBtn = document.getElementById("text-switcher-btn");
const heading = document.getElementById("formTitle");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameField = document.getElementById("usernameField");
const form = document.getElementById("form");
const formDescription = document.getElementById("formDescription");
const errorMessage = document.getElementById("errorMessage");

// API Config - using your actual local backend port
const BACKEND_URL = "http://localhost:5500"; 

// Form Mode Switcher (Login <-> Sign up)
textSwitcherBtn.addEventListener("click", function () {
  errorMessage.style.display = "none"; // Clear errors
  if (heading.textContent === "Login") {
    switcher(
      "Sign up",
      "Already have an account? Login",
      true,
      "Create your profile and start using the platform."
    );
  } else {
    switcher(
      "Login",
      "Don't have an account? Sign up",
      false,
      "Access your account and continue your workflow."
    );
  }
});

function switcher(title, switchText, showUsername, description) {
  form.classList.remove("form-switching");
  void form.offsetWidth; // Trigger reflow
  form.classList.add("form-switching");

  loginBtn.value = title;
  heading.textContent = title;
  textSwitcherBtn.value = switchText;
  formDescription.textContent = description;

  if (showUsername) {
    usernameField.classList.remove("is-collapsed");
    usernameInput.required = true;
  } else {
    usernameField.classList.add("is-collapsed");
    usernameInput.required = false;
  }
}

form.addEventListener("animationend", function () {
  form.classList.remove("form-switching");
});

// Form Submission handling
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  errorMessage.style.display = "none"; // Hide error initially

  if (heading.textContent === "Sign up") {
    await register();
  } else {
    await login();
  }
});

// Register Logic
async function register() {
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || "Registration failed");
      return;
    }

    // Success
    alert("Registered successfully! You can now log in.");
    // Switch to login form
    switcher(
      "Login",
      "Don't have an account? Sign up",
      false,
      "Access your account and continue your workflow."
    );
    passwordInput.value = "";
  } catch (error) {
    console.error("Network error:", error);
    showError("Could not connect to the server.");
  }
}

// Login Logic
async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.message || "Incorrect email or password");
      return;
    }

    // Save token and user info into localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userId", data.id);

    // Role-based routing
    const role = data.role.toUpperCase(); // Ensure uppercase matching (ADMIN, TEACHER, STUDENT)

    switch (role) {
      case "ADMIN":
        // Redirecting to your actual admin page (change to 'admin-dashboard.html' if needed)
        window.location.href = "admin/index.html"; 
        break;
      case "TEACHER":
        // Redirecting to teacher dashboard
        window.location.href = "teacher-dashboard.html"; 
        break;
      case "STUDENT":
        // Redirecting to your actual student page (change to 'student-dashboard.html' if needed)
        window.location.href = "student/student.html"; 
        break;
      default:
        showError("Invalid account role assigned.");
        break;
    }

  } catch (error) {
    console.error("Network error:", error);
    showError("Could not connect to the server.");
  }
}

// Helper to show errors below form in red text
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}
