import { useAtom } from "jotai";

import { promptSelectDevice, usePreviouslyPairedDevices } from "../pad-coms.tsx";
import { browserSupported, stages$ } from "../state.ts";
import { StepCounter } from "./step-counter.tsx";

export function CounterPage() {
  usePreviouslyPairedDevices();
  const [stages, setStages] = useAtom(stages$);

  if (!browserSupported) {
    return "must use a chrome-like browser... sorry.";
  }

  return (
    <>
      <StepCounter />
      <p>
        <button type="button" onClick={() => promptSelectDevice()}>
          Add Stage
        </button>
        <ul>
          {Object.keys(stages).map((serial) => (
            <li key={serial}>
              {serial}{" "}
              <button
                type="button"
                onClick={() => {
                  setStages((prev) => {
                    const next = { ...prev };
                    delete next[serial];
                    return next;
                  });
                }}
              >
                X
              </button>
            </li>
          ))}
        </ul>
      </p>
    </>
  );
}
