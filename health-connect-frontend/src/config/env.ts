// Check if the app is running on localhost or a local network IP
const isLocalhost = 
  window.location.protocol === 'http:';

// Auto-switch the base URL based on the environment
// Replace 'https://api.yourproductiondomain.com' with your actual backend domain when you deploy
export const API_BASE_URL = isLocalhost
  ? 'http://localhost:5000/api/v1'
  : 'https://health-connect-be.onrender.com/api/v1';

// You can add other global constants here later (e.g., APP_VERSION, TIMEOUT_LIMITS)