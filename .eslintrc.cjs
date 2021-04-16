module.exports = {
  root: true,
  env: {
    es6: true,
    node: true
  },
  'extends': [
    'eslint:recommended'
  ],
  parserOptions: {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  rules: {
    "semi": [2, "never"]
  }
}
