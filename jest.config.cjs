// jest.config.js
module.exports = {
  testEnvironment: 'node',

  // Suporte a ES6 modules
  transform: {},

  // Onde estão os testes
  testMatch: [
    '**/tests/**/*.test.js',
  ],

  // Setup e teardown globais (banco de dados)
  globalSetup: './tests/setup/globalSetup.cjs',
  globalTeardown: './tests/setup/globalTeardown.cjs',

  // Timeout maior para testes E2E (pagamentos, e-mail, etc)
  testTimeout: 30000,

  // Cobertura mínima exigida antes de qualquer deploy
  collectCoverageFrom: [
    'src/modules/**/*.js',
    '!src/modules/**/index.js',
    '!src/**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Cobertura mais alta para módulos críticos
    './src/modules/commission/': {
      branches: 95,
      functions: 95,
      lines: 95,
    },
    './src/modules/order/': {
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },

  // Rodar testes E2E em série (não em paralelo — compartilham o banco)
  // Testes unitários podem rodar em paralelo
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/tests/unit/**/*.test.js'],
      testEnvironment: 'node',
      transform: {},
    },
    {
      displayName: 'e2e',
      testMatch: ['**/tests/e2e/**/*.test.js'],
      testEnvironment: 'node',
      runner: 'jest-serial-runner',
      transform: {},
    },
  ],

  // Relatório de cobertura
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',

  // Variáveis de ambiente para teste
  testEnvironmentOptions: {
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/impakt_test',
    },
  },

  // Mostra cada teste individualmente (útil para debug)
  verbose: true,
}
