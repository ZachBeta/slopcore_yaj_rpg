import Sequencer from '@jest/test-sequencer';

class CustomSequencer extends Sequencer {
  sort(tests: any[]): any[] {
    // Return a new array with the integration tests at the end
    // This ensures they run after all other tests and in sequence
    const integrationTests = tests.filter(t => t.path.includes('/server/'));
    const otherTests = tests.filter(t => !t.path.includes('/server/'));
    
    return [...otherTests, ...integrationTests];
  }
}

export default CustomSequencer; 