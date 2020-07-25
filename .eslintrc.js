module.exports = {
    "extends": "airbnb-base",
    "env": {
        "browser": true
    },
    "parserOptions": {
        "ecmaVersion": 5
    },
    "rules": {
        "prefer-arrow-callback": "off",
        "func-names": "off",
        "space-before-function-paren": ["error", "never"],
        "object-shorthand": "off",
        "comma-dangle": ["error", "never"],
        "quote-props": "off",
        "no-multi-spaces": ["error", { ignoreEOLComments: true }],
        "prefer-destructuring": "off",
        "prefer-template": "off",
        "no-var": "off",
        "no-use-before-define": "off",
        "no-param-reassign": "off",
        "consistent-return": "off",
        "vars-on-top": "off",
        "max-len": [1,150,4],
        "no-unused-vars": "off"
    }
};
