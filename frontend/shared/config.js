const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
// We now use Vercel Serverless, so frontend and backend are on the same domain.
// Empty string means it will fetch from its own domain (e.g., /api/...)
const BASE_URL = isLocal ? "http://localhost:5500" : ""; 

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BASE_URL };
}
