import * as Bacon from "baconjs";
import { Provider } from "jotai";
import { createRoot } from "react-dom/client";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { uiState } from "./state.ts";
import { UI } from "./ui.tsx";

const defaultFontFamilies =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

const theme = createTheme({
  fontFamily: `"Hanken Grotesk", ${defaultFontFamilies}`,
});

Bacon.fromEvent(document, "DOMContentLoaded").onValue(async () => {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  const reactRoot = createRoot(rootEl);
  reactRoot.render(
    <Provider store={uiState}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <Notifications />
          <UI />
        </ModalsProvider>
      </MantineProvider>
    </Provider>,
  );
});
