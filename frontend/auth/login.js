const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

loginBtn.addEventListener("click", function () {
  login();
});

async function login() {
  try {
    if (!usernameInput.value || !passwordInput.value) {
      alert("All fields are required");
      return;
    }

    const response = await fetch("http://localhost:5500/api/auth/login", {
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
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.id);
      passwordInput.value = "";
      usernameInput.value = "";
      alert(data.message);

      if (data.role === "admin") {
        window.location.href = "../admin/index.html";
        return;
      }

      if (data.role === "student") {
        window.location.href = "../student/student.html";
        return;
      }

      alert("Unknown user role");
      return;
    }

    alert(data.message || "Login failed");
  } catch (error) {
    console.error("Network error:", error);
    alert("Server bilan bog'lanib bo'lmadi");
  }
}
