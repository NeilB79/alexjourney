export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private maxLogs = 500;
  private originalConsole: any = {};

  constructor() {
    this.interceptConsole();
    
    // Capture global errors
    if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
            this.add('error', `Uncaught: ${event.message}`);
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.add('error', `Unhandled Promise Rejection: ${event.reason}`);
        });
    }
  }

  private interceptConsole() {
    const methods: (LogLevel | 'log')[] = ['log', 'info', 'warn', 'error', 'debug'];
    
    methods.forEach((method) => {
      this.originalConsole[method] = (console as any)[method];
      
      (console as any)[method] = (...args: any[]) => {
        // Call original
        if (this.originalConsole[method]) {
            this.originalConsole[method].apply(console, args);
        }

        // Process for internal log
        try {
            const message = args.map(a => {
                if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack}`;
                if (typeof a === 'object') {
                    try {
                        return JSON.stringify(a, null, 2);
                    } catch {
                        return '[Circular Object]';
                    }
                }
                return String(a);
            }).join(' ');
            
            // Map 'log' to 'info' for consistency
            const level: LogLevel = method === 'log' ? 'info' : method;
            this.add(level, message);
        } catch (e) {
            // Failsafe
        }
      };
    });
  }

  add(level: LogLevel, message: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    
    this.logs.unshift(entry); // Add to top
    if (this.logs.length > this.maxLogs) {
        this.logs.pop();
    }
    this.notify();
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }
}

export const logger = new LoggerService();