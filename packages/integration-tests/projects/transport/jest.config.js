module.exports = {
    testEnvironment: 'node',
    rootDir: './',
    moduleFileExtensions: ['js'],
    testMatch: [
        '**/tests/*.integration.js',
    ],
    modulePathIgnorePatterns: ['node_modules', 'src/types'],
    setupFilesAfterEnv: [
        '<rootDir>/common.setup.js'],
    transformIgnorePatterns: [
        // todo: ??/
        'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)',
    ],
    transform: {
        // todo: ??
        '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
    },
    collectCoverage: false,
    verbose: true,
    bail: true,
}