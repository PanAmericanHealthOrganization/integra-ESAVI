const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = [
  {
    ignores: ['dist/**', 'coverage/**', 'reports/**', 'docs/**', 'node_modules/**', 'gaceta-integra-esavi/**'],
  },
  ...tsPlugin.configs['flat/recommended'],
  prettierRecommended, // Extiende las reglas de Prettier
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // `import x = require('y')` es sintaxis válida de TS y aquí es necesaria para
      // paquetes con `export =` (jwks-rsa) al no estar activo esModuleInterop.
      '@typescript-eslint/no-require-imports': ['error', { allowAsImport: true }],
      // El prefijo `_` marca un parámetro que existe por posición/contrato pero no se usa.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          // Permite el patrón "omitir campos": const { a, ...resto } = obj;
          ignoreRestSiblings: true,
        },
      ],
      'prettier/prettier': 'error', // Activa las reglas de Prettier como errores de ESLint
    },
  },
  {
    // En las pruebas se usa `require()` a propósito para alcanzar el módulo ya mockeado
    // por jest sin arrastrar los tipos reales (y poder llamar a .mockReturnValue()).
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
