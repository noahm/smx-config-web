import type { Config } from "postcss-load-config"

export default {
  plugins: {
    "postcss-preset-mantine": {
      // compile light-dark()/@mixin (light|dark) with a zero-specificity
      // :where() wrapper so dark values don't outrank state classes
      mixins: {
        light: {
          ":where([data-mantine-color-scheme='light']) &": {
            "@mixin-content": {},
          },
        },
        dark: {
          ":where([data-mantine-color-scheme='dark']) &": {
            "@mixin-content": {},
          },
        },
      },
    },
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    }
  }
} satisfies Config;
