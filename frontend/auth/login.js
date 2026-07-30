const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    stopOnFocus: true,
    style: {
      background: type === "success" 
        ? "linear-gradient(135deg, var(--pumpkin) 0%, var(--red-accent) 100%)" 
        : "linear-gradient(135deg, #b23a34 0%, #7f2623 100%)",
      borderRadius: "14px",
      boxShadow: "0 14px 40px rgba(17, 10, 8, 0.25)",
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      color: "#fff4ec",
      padding: "12px 24px",
      border: "1px solid rgba(255, 210, 186, 0.18)"
    },
  }).showToast();
}

loginBtn.addEventListener("click", function () {
  login();
});

async function login() {
  try {
    if (!usernameInput.value || !passwordInput.value) {
      showToast("All fields are required", "error");
      return;
    }

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        password: passwordInput.value.trim()
      })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      const resolvedRole = resolveUserRole(data.role);
      localStorage.setItem("role", resolvedRole || data.role); // save normalized role
      localStorage.setItem("userId", data.id);
      passwordInput.value = "";
      usernameInput.value = "";
      showToast(data.message || "Login successful", "success");

      const route = getRoleRoute(data.role);
      if (route) {
        setTimeout(() => { window.location.href = route; }, 800);
        return;
      }

      showToast("Unknown user role", "error");
      return;
    }

    showToast(data.message || "Login failed", "error");
  } catch (error) {
    console.error("Network error:", error);
    showToast("Server bilan bog'lanib bo'lmadi", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (token && role) {
    const route = getRoleRoute(role);
    if (route && !window.location.pathname.includes(route.replace('../', '').replace('.html', ''))) {
       window.location.replace(route);
    }
  }
});
