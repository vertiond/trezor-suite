module.exports = {
    extends: '../../.eslintrc.js',
    parserOptions: {
        project: ['./tsconfig.json'],
    },
    overrides: [
        {
            files: ['**/electrum.*', '**/electrum/**/*'],
            rules: {
                camelcase: "off",
            },
        }
    ]
};
