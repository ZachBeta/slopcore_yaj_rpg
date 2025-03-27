import { silenceConsole, filterConsole } from './test-utils';

describe('Test Utilities', () => {
  describe('silenceConsole', () => {
    it('should silence console output', () => {
      // Save original console methods
      const originalLog = console.log;
      
      // Silence console
      const silencer = silenceConsole();
      
      // Check that console.log is now a mock function
      expect(console.log).not.toBe(originalLog);
      expect(jest.isMockFunction(console.log)).toBe(true);
      
      // Restore console
      silencer.restore();
      
      // Check that console.log is restored
      expect(console.log).toBe(originalLog);
    });
  });
  
  describe('filterConsole', () => {
    it('should filter console output', () => {
      // Save original console methods
      const originalLog = console.log;
      
      // Create a spy to monitor calls
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Filter console to only show messages containing 'important'
      const filter = filterConsole(msg => msg.includes('important'));
      
      // Log messages
      console.log('This is important');
      console.log('This is not');
      
      // Restore console
      filter.restore();
      
      // Check that only important messages were logged
      expect(consoleSpy).toHaveBeenCalledWith('This is important');
      expect(consoleSpy).not.toHaveBeenCalledWith('This is not');
      
      // Clean up spy
      consoleSpy.mockRestore();
      console.log = originalLog;
    });
  });
}); 