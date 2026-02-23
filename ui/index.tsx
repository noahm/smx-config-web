import * as Bacon from "baconjs";
import { Provider } from "jotai";
import { createRoot } from "react-dom/client";
import { App, ConfigProvider } from "antd";

import { uiState } from "./state.ts";
import { UI } from "./ui.tsx";

const defaultFontFamilies =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

Bacon.fromEvent(document, "DOMContentLoaded").onValue(async () => {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  const reactRoot = createRoot(rootEl);
  reactRoot.render(
    <Provider store={uiState}>
      <ConfigProvider theme={{ token: { fontFamily: `"Hanken Grotesk", ${defaultFontFamilies}` } }}>
        <App>
          <UI />
        </App>
      </ConfigProvider>
    </Provider>,
  );
});
