module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  forceExit: true,
  moduleNameMapper: {
    '^jsdom$':     '<rootDir>/__mocks__/jsdom.js',
    '^dompurify$': '<rootDir>/__mocks__/dompurify.js',
  },
};
