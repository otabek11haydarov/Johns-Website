/**
 * Normalizes a role string to uppercase to match backend Prisma Enum
 */
function resolveUserRole(role) {
    if (!role) return null;
    const normalized = role.trim().toUpperCase();
    if (["ADMIN", "TEACHER", "STUDENT"].includes(normalized)) {
        return normalized;
    }
    return null;
}

/**
 * Returns the expected routing path for a given role
 */
function getRoleRoute(role) {
    const normalized = resolveUserRole(role);
    switch (normalized) {
        case "ADMIN": return "../admin/index.html";
        case "TEACHER": return "../Task Manager/task.html"; // Teacher dashboard is under Task Manager in this app, or fallback
        case "STUDENT": return "../student/student.html";
        default: return null;
    }
}

/**
 * Enforces that the user is logged in and has the expected role.
 * Redirects to login page if unauthorized.
 */
function enforceRole(expectedRole) {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    
    if (!token || resolveUserRole(role) !== resolveUserRole(expectedRole)) {
        window.location.href = "../auth/login.html";
        return false;
    }
    return true;
}

// Optionally, export for modules if needed (though it's used via plain script tags currently)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { resolveUserRole, getRoleRoute, enforceRole };
}
