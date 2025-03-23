/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', 'setupTests.ts'],
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
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json'
        }]
      },
    },
    {
      displayName: 'node',
      testMatch: ['<rootDir>/server/**/*.test.[jt]s?(x)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json'
        }]
      },
    },
    {
      displayName: 'default',
      testMatch: [
        '<rootDir>/src/terminal-game/__tests__/!(console-renderer).test.[jt]s?(x)',
        '<rootDir>/src/open-world/__tests__/**/*.test.[jt]s?(x)'
      ],
      testEnvironment: 'node',
      preset: 'ts-jest',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.test.json'
        }]
      },
    }
  ]
};

module.exports = config; 