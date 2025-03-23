module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  testPathIgnorePatterns: ['/node_modules/'],
  // Run integration tests serially
  testSequencer: './jest.sequencer.js',
  // Configure different test environments
  projects: [
    {
      displayName: 'dom',
      testMatch: ['<rootDir>/src/test/**/*.[jt]s?(x)', '<rootDir>/src/terminal-game/__tests__/console-renderer.test.[jt]s?(x)'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
    },
    {
      displayName: 'node',
      testMatch: ['<rootDir>/server/**/*.test.[jt]s?(x)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
    },
    {
      displayName: 'default',
      testMatch: ['<rootDir>/src/terminal-game/__tests__/!(console-renderer).test.[jt]s?(x)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
    }
  ]
}; 