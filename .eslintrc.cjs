/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  // dividend-tracker is a separate, pre-existing project in this folder with its
  // own toolchain — it is not part of Iron Log and must not be linted here.
  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.cjs',
    'dividend-tracker',
    'vite.config.js',
    'vite.config.d.ts',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
}
