// jest.config.js

module.exports = {
    testEnvironment: 'jsdom',
    preset: 'ts-jest',
    extensionsToTreatAsEsm: [ ".ts" ],
    testRegex: '\\.test\\.tsx?$',
    testPathIgnorePatterns: [ '<rootDir>/node_modules/', '<rootDir>/build/', '\\.d\\.ts$' ],
    moduleNameMapper: {
        "\\.(css|less|scss|sass)$": "identity-obj-proxy"
    }
};