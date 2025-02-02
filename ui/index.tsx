import * as Bacon from "baconjs";
import { Provider } from "jotai";
import { createRoot } from "react-dom/client";

import { uiState } from "./state.ts";
import { UI } from "./ui.tsx";

Bacon.fromEvent(document, "DOMContentLoaded").onValue(async () => {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  const reactRoot = createRoot(rootEl);
  reactRoot.render(
    <Provider store={uiState}>
      <UI />
    </Provider>,
  );
});
