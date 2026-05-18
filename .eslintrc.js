module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'i18next'],
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    'i18next/no-literal-string': [
      'warn',
      {
        markupOnly: true,
        ignoreAttribute: [
          'testID',
          'accessibilityRole',
          'accessibilityLabel',
          'name',
          'iconName',
          'placeholder',
          'key',
          'type',
          'source',
          'style',
          'className',
        ],
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
  ignorePatterns: ['node_modules/', 'babel.config.js', 'metro.config.js'],
};
