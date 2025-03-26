import { io, Socket } from 'socket.io-client';

interface ServerDiagnostics {
  fps: number;
  playerCount: number;
  uptime: number;
  availableColors: number;
  colorPoolSize: number;
  connections: number;
}

interface PongData {
  timestamp: number;
}

interface DiagnosticsData {
  status?: string;
}

class Game {
  private socket: Socket;
  private lastPingTime: number;
  private pingInterval: number;
  private lastPing: number;
  private diagnosticsDiv: HTMLDivElement | null;

  constructor() {
    // Import socket.io client
    this.socket = io();
    this.lastPingTime = 0;
    this.pingInterval = 1000; // Ping every second
    this.lastPing = Date.now();
    this.diagnosticsDiv = null;

    // Add connection status to diagnostics
    this.setupDiagnostics();

    // Setup socket event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.updateDiagnostics({ status: 'Connected' });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      this.updateDiagnostics({ status: 'Connection Error' });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected:', reason);
      this.updateDiagnostics({ status: 'Disconnected' });
    });

    this.setupEventHandlers();
  }

  private updateDiagnostics(data: DiagnosticsData): void {
    if (!this.diagnosticsDiv) return;

    const currentContent = this.diagnosticsDiv.innerHTML;
    const lines = currentContent.split('<br>');
    const status = `status: ${data.status || 'Unknown'}`;

    // Update or add status line
    const statusIndex = lines.findIndex((line) => line.startsWith('status:'));
    if (statusIndex >= 0) {
      lines[statusIndex] = status;
    } else {
      lines.unshift(status);
    }

    this.diagnosticsDiv.innerHTML = lines.join('<br>');
  }

  private setupDiagnostics(): void {
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
    this.socket.on('server_diagnostics', (data: ServerDiagnostics) => {
      const ping = Date.now() - this.lastPing;
      const diagnostics = {
        status: this.socket.connected ? 'Connected' : 'Disconnected',
        ping: `${ping}ms`,
        fps: `${data.fps} FPS`,
        players: `${data.playerCount} players`,
        uptime: `${Math.floor(data.uptime / 60)}:${(data.uptime % 60).toString().padStart(2, '0')}`,
        colors: `${data.availableColors}/${data.colorPoolSize} available`,
        connections: `${data.connections} connected`,
      };

      this.diagnosticsDiv!.innerHTML = Object.entries(diagnostics)
        .map(([key, value]) => `${key}: ${value}`)
        .join('<br>');
    });

    // Listen for pong
    this.socket.on('pong', (data: PongData) => {
      this.lastPingTime = Date.now() - data.timestamp;
    });
  }

  private setupEventHandlers(): void {
    // ... existing event handlers ...
  }
}

// Initialize game instance
if (typeof document !== 'undefined') {
  // Only initialize in browser environment
  globalThis.game = new Game();
}
