/**
 * Utility functions for testing
 */

/**
 * Silence console output during test execution
 * Use with beforeEach/afterEach in Jest
 * 
 * @example
 * ```
 * let consoleControl: ConsoleSilencer;
 * 
 * beforeEach(() => {
 *   consoleControl = silenceConsole();
 * });
 * 
 * afterEach(() => {
 *   consoleControl.restore();
 * });
 * ```
 */
export type ConsoleSilencer = {
  restore: () => void;
};

export const silenceConsole = (): ConsoleSilencer => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;
  const originalDebug = console.debug;
  
  // Replace console methods with no-ops
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
  console.debug = jest.fn();
  
  return {
    restore: () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
      console.debug = originalDebug;
    }
  };
};

/**
 * Filter console output during test execution to only show certain messages
 * Useful for debugging specific test issues
 * 
 * @example
 * ```
 * let consoleControl: ConsoleSilencer;
 * 
 * beforeEach(() => {
 *   consoleControl = filterConsole(msg => msg.includes('important'));
 * });
 * 
 * afterEach(() => {
 *   consoleControl.restore();
 * });
 * ```
 */
export const filterConsole = (filter: (message: string) => boolean): ConsoleSilencer => {
  const originalLog = console.log;
  
  console.log = (message: string, ...args: any[]) => {
    if (typeof message === 'string' && filter(message)) {
      originalLog(message, ...args);
    }
  };
  
  return {
    restore: () => {
      console.log = originalLog;
    }
  };
}; 