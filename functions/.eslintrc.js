module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "object-curly-spacing": ["error", "always"],
    "quotes": ["error", "double"],
    "indent": "off",
    "eol-last": "off",
    "arrow-parens": 0,
    "max-len": 0,
    "camelcase": "off",
    "require-jsdoc": "off",
    "comma-dangle": "off",
  },
};


//   rules: {
//     "quotes": ["error", "double"],
//     "import/no-unresolved": 0,
//     "indent": "off",
//     "max-len": "off",
//     "arrow-parens": "off",
//   },
// };
