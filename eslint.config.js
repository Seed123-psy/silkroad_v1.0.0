import globals from 'globals'
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import vuePlugin from 'eslint-plugin-vue'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier/flat'

const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts']
const vueFiles = ['*.vue', '**/*.vue']

const typescriptBaseConfigs = tseslint.configs['flat/recommended']

const customizeTypeScriptRules = config => ({
  ...config,
  rules: {
    ...(config.rules ?? {}),
    '@typescript-eslint/no-explicit-any': 'off',
  },
})

const typescriptConfigsForTs = typescriptBaseConfigs.map(config => ({
  ...customizeTypeScriptRules(config),
  files: tsFiles,
}))

const typescriptConfigsForVue = typescriptBaseConfigs.map(config => ({
  ...customizeTypeScriptRules(config),
  files: vueFiles,
  languageOptions: {
    ...config.languageOptions,
    parser: vueParser,
    parserOptions: {
      ...config.languageOptions?.parserOptions,
      parser: tsParser,
      extraFileExtensions: ['.vue'],
    },
  },
}))

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...vuePlugin.configs['flat/recommended'],
  ...typescriptConfigsForTs,
  ...typescriptConfigsForVue,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
      'vue/multi-word-component-names': 'off',
    },
  },
]
