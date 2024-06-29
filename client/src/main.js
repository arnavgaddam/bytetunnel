// src/main.js

// Generate a random 6 character code
function generateCode() {
    return Math.random().toString(36).substring(2, 8);
  }
  
  const createTunnelButton = document.getElementById('createTunnel');
  createTunnelButton.addEventListener('click', async () => {
    const code = generateCode();
    // Navigate to the new tunnel page with the generated code as a query parameter
    window.location.href = `/tunnel.html?code=${code}`;
  });
  
  