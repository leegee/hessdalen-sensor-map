module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    // 'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    // plugin:@typescript-eslint/stylistic-type-checked,
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    '*.d.ts',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
  ],
  rules: {
    'react-refresh/only-export-components': 'off',
    "react/react-in-jsx-scope": "off",
    "react/jsx-uses-react": "off",
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unused-vars': 'off', /* React is defined by never used...fixed once, now back */
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: [ './tsconfig.json', './tsconfig.node.json' ],
    tsconfigRootDir: __dirname,
  },
}
