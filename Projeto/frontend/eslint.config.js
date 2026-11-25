import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // android/ guarda uma cópia já compilada do site (gerada pelo Capacitor)
  globalIgnores(['dist', 'android', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Maiúscula = componente usado no JSX (ex.: ícone recebido como parâmetro)
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      // Regras do React Compiler: o projeto não usa o compilador (ver vite.config.js).
      // set-state-in-effect acusaria o padrão de carregar dados ao abrir a tela, usado em todo o app.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      // Recarga rápida no desenvolvimento: estes arquivos exportam, junto do componente,
      // o hook ou as funções que só fazem sentido com ele
      'react-refresh/only-export-components': ['error', {
        allowExportNames: ['useAuth', 'FILTRO_DATA_VAZIO', 'temFiltroData', 'passaFiltroData', 'anosDe'],
      }],
    },
  },
])
