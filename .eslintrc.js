module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "prettier"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking", // Ensures type-checking rules are enabled
        "plugin:prettier/recommended",
    ],
    env: {
        browser: false,
        node: true,
    },
    parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: __dirname, // Ensure correct resolution of tsconfig.json
        exclude: [".eslintrc.js"], // Exclude this file from type-checking
    },
    rules: {
        indent: ["error", 4], // Use 4 spaces for indentation
        quotes: ["error", "double"], // Enforce double quotes
        semi: ["error", "always"], // Always require semicolons
        "comma-dangle": ["error", "always-multiline"], // Require trailing commas in multi-line objects/arrays
        "object-curly-spacing": ["error", "always"], // Ensure space inside curly braces
        "no-var": "error", // Disallow var; use let or const
        // "no-unused-vars": "warn", // Warn about unused variables
        "no-undef": "error", // Disallow the use of undeclared variables
        "no-empty-function": "error", // Disallow empty functions
        "no-unescaped-entities": "off", // Allow unescaped characters in JSX
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off", // Ensure function return types are specified
        "@typescript-eslint/no-non-null-assertion": "warn", // Warn about non-null assertions
        "@typescript-eslint/explicit-function-return-type": "warn", // Ensure functions return types are explicit
        "prefer-const": "error", // Use const when variables are not reassigned
        "prefer-arrow-callback": "error", // Prefer arrow functions for callbacks
        "no-console": "error", // Ensure console is not used
        // "import/no-unresolved": "error", // Ensure imports are resolved
        // "import/named": "error", // Ensure named imports are valid
        // "import/default": "error", // Ensure default imports are valid
        // "plugin:import/errors": "error", // Ensure import errors are reported
        // "plugin:import/warnings": "warn", // Ensure import warnings are reported
    },
    settings: {
        "import/resolver": {
            typescript: {
                project: "./tsconfig.json",
            },
        },
    },
};
