// Enhanced server URLs list with cloud providers
const commonBaseUrls = [
  // Local development
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
  
  // Docker/container
  "http://host.docker.internal:8000",
  "http://docker:8000",
  
  // Common production-like domains
  "http://api.localhost",
  "http://dev.localhost",
  "http://staging.localhost",
  
  // Network IPs
  "http://192.168.1.100:8000",
  "http://192.168.0.100:8000",
  "http://10.0.0.100:8000",
  
  // Cloud providers
  "https://api.example.com",
  "https://your-app.herokuapp.com",
  "https://your-service.azurewebsites.net",
  "https://your-api.onrender.com",
  "https://your-domain.digitalocean.app",

  // Special cases
  "http://0.0.0.0:8000",
  window.location.origin.replace(":8080", ":8000"),
  window.location.origin.replace(/:\d+/, ":8000")
];

// Connection status manager
const connectionStatus = {
  element: document.createElement('div'),
  update: function(isConnected, message = '') {
    this.element.innerHTML = `
      <span class="status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}"></span>
      ${isConnected ? 'Server connected' : 'Server disconnected'} ${message}
    `;
    this.element.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
  },
  init: function() {
    this.element.className = 'connection-status';
    document.body.insertBefore(this.element, document.body.firstChild);
    this.update(false);
  }
};

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("dark");
  document.querySelector(".theme-toggle").textContent =
    document.body.classList.contains("dark") ? "☀" : "🌙";
  localStorage.setItem('theme', document.body.classList.contains("dark") ? 'dark' : 'light');
}

// Check server connection with timeout
async function checkServerConnection(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  
  try {
    const schemaPath = document.getElementById("apiSchema").value || "/openapi.json";
    const res = await fetch(url + schemaPath, { 
      method: "GET",
      signal: controller.signal 
    });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) {
    clearTimeout(timeout);
    return false;
  }
}

// Enhanced base URL detection
async function detectBaseUrl() {
  connectionStatus.update(false, '(Detecting servers...)');
  let foundServer = false;
  
  // Check if manual URL exists in localStorage
  const savedUrl = localStorage.getItem('apiBaseUrl');
  if (savedUrl && await checkServerConnection(savedUrl)) {
    setActiveUrl(savedUrl);
    foundServer = true;
  } else {
    // Auto-detect from common URLs
    for (const url of commonBaseUrls) {
      try {
        if (await checkServerConnection(url)) {
          setActiveUrl(url);
          foundServer = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  if (!foundServer) {
    document.getElementById("baseURL").removeAttribute('readonly');
    document.getElementById("response").textContent =
      "❌ Could not auto-detect server. Please enter your API URL manually.";
    connectionStatus.update(false, '(Waiting for manual input)');
  }
}

function setActiveUrl(url) {
  document.getElementById("baseURL").value = url;
  localStorage.setItem('apiBaseUrl', url);
  loadEndpoints(url);
  connectionStatus.update(true, `(Connected to ${new URL(url).hostname})`);
}

// Load endpoints from OpenAPI schema
async function loadEndpoints(baseUrl) {
  try {
    const schemaPath = document.getElementById("apiSchema").value || "/openapi.json";
    const res = await fetch(baseUrl + schemaPath);
    const data = await res.json();
    const paths = Object.keys(data.paths);
    
    const endpointSelect = document.getElementById("endpointSelect");
    endpointSelect.innerHTML = '';
    
    // Add root endpoint
    const rootOpt = document.createElement('option');
    rootOpt.value = "/";
    rootOpt.textContent = "Root Endpoint (/)";
    endpointSelect.appendChild(rootOpt);
    
    // Add other endpoints
    paths.forEach(path => {
      if (path !== "/") {
        const opt = document.createElement('option');
        opt.value = path;
        opt.textContent = path;
        endpointSelect.appendChild(opt);
      }
    });
    
    // Store schema for later use
    window.apiSchema = data;
  } catch (e) {
    console.error("Failed to load endpoints:", e);
    connectionStatus.update(false, '(Failed to load endpoints)');
  }
}

// Enhanced request sender with auth support
async function sendRequest() {
  const method = document.getElementById("method").value;
  const url = document.getElementById("url").value;
  const body = document.getElementById("body").value;
  const headersJson = document.getElementById("headersJson").value || '{}';
  
  // UI loading state
  const button = document.querySelector('button[onclick="sendRequest()"]');
  const originalText = button.innerHTML;
  button.innerHTML = `<span class="loading"></span> Sending...`;
  button.disabled = true;
  
  try {
    // Prepare headers
    let headers = {};
    try {
      headers = JSON.parse(headersJson);
    } catch (e) {
      throw new Error('Invalid JSON in headers');
    }
    
    // Add auth headers if provided
    const authHeaders = getAuthHeaders();
    headers = { ...headers, ...authHeaders };
    
    // Add content type for non-GET requests
    if (method !== 'GET' && method !== 'DELETE') {
      headers['Content-Type'] = 'application/json';
    }
    
    // Prepare request options
    const options = { 
      method, 
      headers,
      body: method !== 'GET' && method !== 'DELETE' && body ? JSON.stringify(JSON.parse(body)) : null
    };
    
    // Send request
    document.getElementById("response").textContent = "⏳ Sending request...";
    const res = await fetch(url, options);
    
    // Process response
    const resText = await res.text();
    const headerObj = {};
    res.headers.forEach((v, k) => headerObj[k] = v);
    
    // Update UI
    document.getElementById('headers').textContent = JSON.stringify(headerObj, null, 2);
    
    try {
      const jsonResponse = JSON.parse(resText);
      document.getElementById('response').textContent = `✅ ${res.status} ${res.statusText}\n\n${JSON.stringify(jsonResponse, null, 2)}`;
    } catch {
      document.getElementById('response').textContent = `✅ ${res.status} ${res.statusText}\n\n${resText}`;
    }
    
    connectionStatus.update(true);
  } catch (err) {
    document.getElementById('response').textContent = `❌ Error: ${err.message}`;
    document.getElementById('headers').textContent = 'Failed to get headers';
    connectionStatus.update(false);
  } finally {
    button.innerHTML = originalText;
    button.disabled = false;
  }
}

// Auth header generator
function getAuthHeaders() {
  const authType = document.getElementById("authType")?.value || 'none';
  const apiKey = document.getElementById("apiKey")?.value || '';
  
  switch(authType) {
    case 'bearer':
      return { 'Authorization': `Bearer ${apiKey}` };
    case 'basic':
      return { 'Authorization': `Basic ${btoa(apiKey)}` };
    case 'custom':
      return { 'X-API-Key': apiKey };
    default:
      return {};
  }
}

// Auto-generate sample request data
document.getElementById("method").addEventListener("change", function() {
  const method = this.value;
  const endpoint = document.getElementById("endpointSelect").value;
  
  if (["POST", "PUT", "PATCH"].includes(method)) {
    generateSampleRequest(endpoint, method);
  } else if (method === "DELETE") {
    document.getElementById("body").value = "{}";
    // Auto-add ID to URL if needed
    const currentUrl = document.getElementById("url").value;
    if (!currentUrl.match(/\/\d+$/)) {
      document.getElementById("url").value = currentUrl.replace(/\/?$/, "/1");
    }
  }
});

function generateSampleRequest(endpoint, method) {
  if (!window.apiSchema || !endpoint) return;
  
  const endpointInfo = window.apiSchema.paths[endpoint]?.[method.toLowerCase()];
  if (!endpointInfo?.requestBody) return;
  
  const content = endpointInfo.requestBody.content;
  if (content['application/json']?.schema) {
    const sampleData = generateSampleData(content['application/json'].schema);
    document.getElementById("body").value = JSON.stringify(sampleData, null, 2);
  }
}

// Sample data generator
function generateSampleData(schema) {
  // ... (keep your existing sample data generator logic)
  // This should generate appropriate sample data based on the schema
}

// Initialize the application
function initApp() {
  // Set saved theme
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.querySelector(".theme-toggle").textContent = "☀";
  }
  
  // Initialize connection status
  connectionStatus.init();
  
  // Set up event listeners
  document.getElementById("endpointSelect").addEventListener("change", () => {
    const base = document.getElementById("baseURL").value;
    const endpoint = document.getElementById("endpointSelect").value;
    document.getElementById("url").value = endpoint ? `${base}${endpoint}` : base;
  });
  
  document.getElementById("baseURL").addEventListener("change", function() {
    if (this.value) {
      setActiveUrl(this.value);
    }
  });
  
  // Load particles
  loadParticles();
  
  // Auto-detect server
  detectBaseUrl();
}

// Load floating particles
function loadParticles() {
  // ... (keep your existing particle loading logic)
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Expose functions to global scope
window.toggleTheme = toggleTheme;
window.sendRequest = sendRequest;