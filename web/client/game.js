// Import socket.io client
const socket = io();

class Game {
  constructor() {
    this.socket = socket;
    this.lastPingTime = 0;
    this.pingInterval = 1000; // Ping every second
    this.lastPing = Date.now();
    
    // Add connection status to diagnostics
    this.diagnosticsDiv = null;
    this.setupDiagnostics();
    
    // Setup socket event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.updateDiagnostics({ status: 'Connected' });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.updateDiagnostics({ status: 'Connection Error' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.updateDiagnostics({ status: 'Disconnected' });
    });

    this.setupEventHandlers();
  }

  updateDiagnostics(data) {
    if (!this.diagnosticsDiv) return;
    
    const currentContent = this.diagnosticsDiv.innerHTML;
    const lines = currentContent.split('<br>');
    const status = `status: ${data.status || 'Unknown'}`;
    
    // Update or add status line
    const statusIndex = lines.findIndex(line => line.startsWith('status:'));
    if (statusIndex >= 0) {
      lines[statusIndex] = status;
    } else {
      lines.unshift(status);
    }
    
    this.diagnosticsDiv.innerHTML = lines.join('<br>');
  }

  setupDiagnostics() {
    // Create diagnostics overlay
    this.diagnosticsDiv = document.createElement('div');
    this.diagnosticsDiv.id = 'diagnostics';
    this.diagnosticsDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      border-radius: 5px;
      min-width: 200px;
    `;
    document.body.appendChild(this.diagnosticsDiv);

    // Initialize with connecting status
    this.updateDiagnostics({ status: 'Connecting...' });

    // Start ping interval
    setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.lastPing = Date.now();
        this.socket.emit('ping');
      }
    }, this.pingInterval);

    // Listen for server diagnostics
    this.socket.on('server_diagnostics', (data) => {
      const ping = Date.now() - this.lastPing;
      const diagnostics = {
        status: this.socket.connected ? 'Connected' : 'Disconnected',
        ping: `${ping}ms`,
        fps: `${data.fps} FPS`,
        players: `${data.playerCount} players`,
        uptime: `${Math.floor(data.uptime / 60)}:${(data.uptime % 60).toString().padStart(2, '0')}`,
        colors: `${data.availableColors}/${data.colorPoolSize} available`,
        connections: `${data.connections} connected`
      };

      this.diagnosticsDiv.innerHTML = Object.entries(diagnostics)
        .map(([key, value]) => `${key}: ${value}`)
        .join('<br>');
    });

    // Listen for pong
    this.socket.on('pong', (data) => {
      this.lastPingTime = Date.now() - data.timestamp;
    });
  }

  setupEventHandlers() {
    // ... existing event handlers ...
  }
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the game
  window.game = new Game();
}); 