/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/main/__tests__/setup.ts'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/main/__tests__/**/*.test.ts',
    '<rootDir>/src/main/__tests__/**/*.spec.ts'
  ],
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.webpack/',
    '/coverage/'
  ],
  
  // Coverage collection
  collectCoverageFrom: [
    'src/main/**/*.ts',
    '!src/main/**/*.d.ts',
    '!src/main/__tests__/**',
    '!src/main/main.ts' // Exclude main entry point as it's hard to test
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/main/storage/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    './src/main/database/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  },
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Verbose output for better debugging
  verbose: true,
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'commonjs',
        target: 'ES2020'
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Timeout for tests (30 seconds)
  testTimeout: 30000,
  
  // Global setup/teardown
  globalSetup: '<rootDir>/src/main/__tests__/globalSetup.ts',
  globalTeardown: '<rootDir>/src/main/__tests__/globalTeardown.ts'
};