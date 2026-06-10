module.exports = {
  extends: ['stylelint-config-recommended', 'stylelint-config-recommended-scss'],
  plugins: ['stylelint-order'],
  rules: {
    'order/properties-alphabetical-order': true,
    'selector-class-pattern': [
      '^(cx|chronix)(-[a-z0-9]+)+(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      {
        message:
          'Class names must use chronix BEM convention: cx-block, cx-block__elem, cx-block--mod',
      },
    ],
    'custom-property-pattern': '^(cx|chronix)(-[a-z0-9]+)+$',
    'no-descending-specificity': null,
  },
};
