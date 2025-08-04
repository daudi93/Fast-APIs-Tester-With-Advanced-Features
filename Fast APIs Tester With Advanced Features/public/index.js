
    // Standard localhost addresses
const commonBaseUrls = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  
  // Common alternative ports
  "http://127.0.0.1:80",
  "http://localhost:80",
  "http://127.0.0.1:8080", 
  "http://localhost:8080",
  "http://127.0.0.1:8888",
  "http://localhost:8888",
  "http://127.0.0.1:5000",
  "http://localhost:5000",
  
  // HTTPS variants
  "https://127.0.0.1:8000",
  "https://localhost:8000",
  "https://127.0.0.1:443",
  "https://localhost:443",
  
  // Docker and container environments
  "http://host.docker.internal:8000",
  "http://docker:8000",
  
  // Common production-like local domains
  "http://api.localhost",
  "http://dev.localhost",
  "http://staging.localhost",
  
  // Network IP addresses (common in local networks)
  "http://192.168.1.100:8000",
  "http://192.168.0.100:8000",
  "http://10.0.0.100:8000",
  
    // Common cloud providers
  "https://api.example.com",
  "https://your-app.herokuapp.com",
  "https://your-service.azurewebsites.net",
  "https://your-api.onrender.com",
  "https://your-domain.digitalocean.app",

  // Special cases
  "http://0.0.0.0:8000",  // Sometimes used in Docker/container setups
  window.location.origin.replace(":8080", ":8000"),  // Your existing dynamic check
  window.location.origin.replace(/:\d+/, ":8000")    // More flexible port replacement
];

// Connection status element
const connectionStatus = {
  element: document.createElement('div'),
  update: function(isConnected) {
    this.element.innerHTML = `
      <span class="status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}"></span>
      ${isConnected ? 'Server connected' : 'Server disconnected'}
    `;
    this.element.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
  },
  init: function() {
    this.element.className = 'connection-status';
    document.body.insertBefore(this.element, document.body.firstChild);
    this.update(false); // Initialize as disconnected
  }
};

function toggleTheme() {
  document.body.classList.toggle("dark");
  document.querySelector(".theme-toggle").textContent =
    document.body.classList.contains("dark") ? "☀" : "🌙";
}

async function checkServerConnection(url) {
  try {
    const res = await fetch(url + "/openapi.json", { method: "GET" });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function detectBaseUrl() {
  connectionStatus.update(false); // Reset status before checking
  let foundServer = false;
  
  for (const url of commonBaseUrls) {
    try {
      const isConnected = await checkServerConnection(url);
      if (isConnected) {
        document.getElementById("baseURL").value = url;
        document.getElementById("url").value = url; // Set root endpoint initially
        
        const res = await fetch(url + "/openapi.json");
        const data = await res.json();
        const paths = Object.keys(data.paths);
        
        const endpointSelect = document.getElementById("endpointSelect");
        endpointSelect.innerHTML = '';
        
        // Add root endpoint as first option
        const rootOpt = document.createElement('option');
        rootOpt.value = "/";
        rootOpt.textContent = "Root Endpoint (/)";
        endpointSelect.appendChild(rootOpt);
        
        // Add all other endpoints
        paths.forEach(path => {
          if (path !== "/") { // Skip root since we already added it
            const opt = document.createElement('option');
            opt.value = path;
            opt.textContent = path;
            endpointSelect.appendChild(opt);
          }
        });
        
        connectionStatus.update(true);
        foundServer = true;
        return;
      }
    } catch (e) {
      continue;
    }
  }
  
  if (!foundServer) {
    document.getElementById("response").textContent =
      "❌ Could not auto-detect running backend.";
    connectionStatus.update(false);
  }
}

document.getElementById("endpointSelect").addEventListener("change", () => {
  const base = document.getElementById("baseURL").value;
  const endpoint = document.getElementById("endpointSelect").value;
  document.getElementById("url").value = endpoint ? `${base}${endpoint}` : base;
});

// Enhanced sendRequest with loading animation
async function sendRequest() {
  const method = document.getElementById("method").value;
  const url = document.getElementById("url").value;
  const body = document.getElementById("body").value;
  const headersJson = document.getElementById("headersJson").value;

  // Show loading state
  const button = document.querySelector('button[onclick="sendRequest()"]');
  const originalText = button.innerHTML;
  button.innerHTML = `<span class="loading"></span> Sending...`;
  button.disabled = true;

  // First verify server connection
  const baseUrl = document.getElementById("baseURL").value;
  const isConnected = await checkServerConnection(baseUrl);
  connectionStatus.update(isConnected);
  
  if (!isConnected) {
    document.getElementById("response").textContent = "❌ Server is not connected";
    button.innerHTML = originalText;
    button.disabled = false;
    return;
  }

  let headers = {};
  try {
    headers = JSON.parse(headersJson);
  } catch (e) {
    alert('❌ Invalid JSON in headers');
    button.innerHTML = originalText;
    button.disabled = false;
    return;
  }

  const options = { method, headers };
  
  if (method !== 'GET' && method !== 'DELETE' && body) {
    try {
      options.body = JSON.stringify(JSON.parse(body));
      headers['Content-Type'] = 'application/json';
    } catch (e) {
      alert('❌ Invalid JSON in body');
      button.innerHTML = originalText;
      button.disabled = false;
      return;
    }
  }

  try {
    document.getElementById("response").textContent = "⏳ Sending request...";
    const res = await fetch(url, options);
    const resText = await res.text();
    
    const headerObj = {};
    res.headers.forEach((v, k) => headerObj[k] = v);
    
    document.getElementById('headers').textContent = JSON.stringify(headerObj, null, 2);
    
    try {
      // Try to pretty-print JSON responses
      const jsonResponse = JSON.parse(resText);
      document.getElementById('response').textContent = `✅ ${res.status} ${res.statusText}\n\n${JSON.stringify(jsonResponse, null, 2)}`;
    } catch {
      document.getElementById('response').textContent = `✅ ${res.status} ${res.statusText}\n\n${resText}`;
    }
    connectionStatus.update(true); // Confirm connection is still good
  } catch (err) {
    document.getElementById('response').textContent = `❌ ${err.message}`;
    connectionStatus.update(false);
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

// Auto-generate sample data for POST/PUT/PATCH
document.getElementById("method").addEventListener("change", function() {
  const method = this.value;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    // Generate sample data based on endpoint
    const sampleData = {
      name: "Sample Item",
      description: "This is a sample description for testing",
      price: 19.99,
      inStock: true,
      tags: ["sample", "test", "demo"]
    };
    document.getElementById("body").value = JSON.stringify(sampleData, null, 2);
  } else if (method === "DELETE") {
    document.getElementById("body").value = "{}";
    // For DELETE, suggest an ID in the URL
    const currentUrl = document.getElementById("url").value;
    if (!currentUrl.match(/\/\d+$/)) {
      document.getElementById("url").value = currentUrl.replace(/\/?$/, "/1");
    }
  }
});

// Add floating particles to body background
document.addEventListener('DOMContentLoaded', function() {
  // Update current year
  document.querySelector('.current-year').textContent = new Date().getFullYear();
  
  // Add floating particles to body background
  const body = document.body;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.width = `${Math.random() * 4 + 2}px`;
    particle.style.height = particle.style.width;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    body.appendChild(particle);
  }
});

// For Footer

  document.addEventListener('DOMContentLoaded', function() {
    // Update current year
    document.querySelector('.current-year').textContent = new Date().getFullYear();
    
    // Add floating particles to footer background
    const footer = document.querySelector('.footer');
    if (footer) {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        footer.appendChild(particle);
      }
    }
  });

// Initialize connection status on load
connectionStatus.init();
window.toggleTheme = toggleTheme;
window.sendRequest = sendRequest;
window.onload = detectBaseUrl;