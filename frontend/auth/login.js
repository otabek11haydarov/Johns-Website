const heading = document.querySelector("h2");
const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const form = document.getElementById("form");
const formDescription = document.getElementById("formDescription");

// API Config - using your actual local backend port
const BACKEND_URL = "http://localhost:5500"; 

// Form Submission handling
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  await login();
});

// Also trigger login on loginBtn click (since it's input type="button" in login.html)
loginBtn.addEventListener("click", async function () {
  await login();
});

// Login Logic
async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("All fields are required");
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Incorrect email or password");
      return;
    }

    // Save token and role to localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role); // e.g., 'ADMIN', 'TEACHER', 'STUDENT'
    localStorage.setItem("userId", data.id);

    alert("Login successful!");

    // Role-based routing (case-insensitive conversion to match exact roles)
    const role = data.role.toUpperCase();

    switch (role) {
      case "ADMIN":
        window.location.href = "../admin/index.html";
        break;
      case "TEACHER":
        window.location.href = "../teacher/index.html"; // Adjust to teacher dashboard if created
        break;
      case "STUDENT":
        window.location.href = "../student/student.html"; // Points to your actual student page
        break;
      default:
        alert("Unknown user role");
        break;
    }

  } catch (error) {
    console.error("Network error:", error);
    alert("Could not connect to the server.");
  }
}
