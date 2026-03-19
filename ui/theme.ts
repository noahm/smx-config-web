import { createTheme } from "@mantine/core";

const defaultFontFamilies =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

export const theme = createTheme({
  fontFamily: `"Hanken Grotesk", ${defaultFontFamilies}`,
});
