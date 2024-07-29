import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/e2e/'],
  testMatch: ['<rootDir>/dist-e2e/**/*.spec.js'],
};

export default config;
