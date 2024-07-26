import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/src/', '<rootDir>/(dist-e2e|e2e)/_util.js'],
  testMatch: ['<rootDir>/e2e/**/*.js', '<rootDir>/dist-e2e/**/*.spec.js'],
};

export default config;
