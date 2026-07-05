const textSwitcherBtn = document.getElementById("text-switcher-btn");
const heading = document.querySelector("h2");
const loginBtn = document.getElementById("loginBtn");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameField = document.getElementById("usernameField");
const form = document.getElementById("form");
const formDescription = document.getElementById("formDescription");

textSwitcherBtn.addEventListener("click", function () {
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
  void form.offsetWidth;
  form.classList.add("form-switching");

  loginBtn.value = title;
  heading.textContent = title;
  textSwitcherBtn.value = switchText;
  formDescription.textContent = description;

  if (showUsername) {
    usernameField.classList.remove("is-collapsed");
  } else {
    usernameField.classList.add("is-collapsed");
  }
}

form.addEventListener("animationend", function () {
  form.classList.remove("form-switching");
});

loginBtn.addEventListener("click", function () {
  if (loginBtn.value === "Sign up") {
    register();
  } else {
    login();
  }
});

async function register() {
  try {
    if (!usernameInput.value || !emailInput.value || !passwordInput.value) {
      alert("All fields are required");
      return;
    }

    const response = await fetch("http://localhost:5500/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
      })
    });

    if (response.ok) {
      const data = await response.json();
      passwordInput.value = "";
      emailInput.value = "";
      usernameInput.value = "";
      alert(data.message);
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Server bilan bog'lanib bo'lmadi");
  }
}

async function login() {
  try {
    if (!emailInput.value || !passwordInput.value) {
      alert("All fields are required");
      return;
    }

    const response = await fetch("http://localhost:5500/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
      })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.id);
      passwordInput.value = "";
      emailInput.value = "";
      alert(data.message);

      const role = data.role.toLowerCase();

      if (role === "admin") {
        window.location.href = "../admin/index.html";
        return;
      }

      if (role === "student") {
        window.location.href = "../student/student.html";
        return;
      }

      if (role === "teacher") {
        window.location.href = "../teacher-dashboard.html";
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

function statusAlerts(code) {
  alert(code);
}
