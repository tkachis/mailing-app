import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // Quotes
      quotes: ["error", "single"],
      "jsx-quotes": ["error", "prefer-single"],

      // Imports
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-anonymous-default-export": [
        "warn",
        {
          allowArray: false,
          allowArrowFunction: false,
          allowAnonymousClass: false,
          allowAnonymousFunction: false,
          allowCallExpression: false,
          allowLiteral: false,
          allowObject: false,
        },
      ],

      // Variables
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",

      // Formatting
      "no-tabs": "warn",
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "only-multiline",
        },
      ],
      "object-curly-spacing": ["warn", "always"],
      "linebreak-style": ["warn", "unix"],
      "eol-last": ["warn", "always"],

      // Disabled rules
      "no-template-curly-in-string": "off",
      "no-useless-escape": "off",
    },
  },
];

export default eslintConfig;
