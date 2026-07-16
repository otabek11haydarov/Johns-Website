const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
// Connects to local Express backend in dev, and external Render backend in production.
// IMPORTANT: Replace the placeholder below with your actual Render URL!
const BASE_URL = isLocal ? "http://localhost:5500" : "https://YOUR_RENDER_BACKEND.onrender.com"; 

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BASE_URL };
}
