const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
// Fallback to a placeholder if backend not deployed yet, but handles local dev flawlessly
const BASE_URL = isLocal ? "http://localhost:5500" : "https://api.yourdomain.com"; // UPDATE THIS LATER

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BASE_URL };
}
