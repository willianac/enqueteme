module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\.e2e-spec\.ts$',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@openrouter/sdk$': '<rootDir>/test/mocks/openrouter.mock.ts',
  },
};
