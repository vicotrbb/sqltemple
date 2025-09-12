module.exports = {
  preset: 'ts-jest',
  
  testEnvironment: 'node',
  
  setupFilesAfterEnv: ['<rootDir>/src/main/__tests__/setup.ts'],
  
  testMatch: [
    '<rootDir>/src/main/__tests__/**/*.test.ts',
    '<rootDir>/src/main/__tests__/**/*.spec.ts'
  ],
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.webpack/',
    '/coverage/'
  ],
  
  collectCoverageFrom: [
    'src/main/**/*.ts',
    '!src/main/**/*.d.ts',
    '!src/main/__tests__/**',
    '!src/main/main.ts'
  ],
  
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
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  verbose: true,
  
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
  
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  testTimeout: 30000,
  
  globalSetup: '<rootDir>/src/main/__tests__/globalSetup.ts',
  globalTeardown: '<rootDir>/src/main/__tests__/globalTeardown.ts'
};