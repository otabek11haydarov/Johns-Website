/**
 * Global Auth Guard
 * Include this script at the top of protected HTML pages (in the <head>) to prevent unauthorized access.
 */
(function () {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Determine the allowed role based on the current folder path
  const path = window.location.pathname.toLowerCase();
  let isAllowed = false;
  let isProtectedRoute = false;

  if (path.includes("/admin/")) {
    isProtectedRoute = true;
    isAllowed = token && role && role.toUpperCase() === "ADMIN";
  } else if (path.includes("/student/")) {
    isProtectedRoute = true;
    isAllowed = token && role && role.toUpperCase() === "STUDENT";
  } else if (path.includes("/teacher/")) {
    isProtectedRoute = true;
    isAllowed = token && role && role.toUpperCase() === "TEACHER";
  }

  // If this is a protected route and user does not have access, redirect to login
  if (isProtectedRoute && !isAllowed) {
    console.warn("Unauthorized access detected. Redirecting to login...");
    localStorage.clear();
    
    // Resolve relative path to login page depending on current depth
    window.location.href = "../auth/login.html";
  }
})();
