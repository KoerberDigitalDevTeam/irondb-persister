'use strict'

module.exports = {
  'extends': 'google',
  'parserOptions': {
     'ecmaVersion': 2017,
  },
  'rules': {
    'array-bracket-spacing': [ 'error', 'always' ],
    'camelcase': [ 'off' ],
    'guard-for-in': [ 'off' ],
    'max-len': 'off',
    'object-curly-spacing': [ 'error', 'always' ],
    'one-var': [ 'off' ],
    'require-jsdoc': 'off',
    'semi': [ 'error', 'never' ],
    'strict': [ 'error', 'global' ],
  },
}
