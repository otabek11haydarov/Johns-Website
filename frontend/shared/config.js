const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
// Connects to local Express backend in dev, and external Render backend in production.
const BASE_URL = isLocal ? "http://localhost:5000" : "https://johns-website-v0pm.onrender.com"; 

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BASE_URL };
}
