import { promptSelectDevice, useHidDevices } from "../pad-coms.tsx";
import { browserSupported } from "../state.ts";
import { StepCounter } from "./step-counter.tsx";
import type { SMXStage } from "../../sdk/smx.ts";
import { useState, useTransition } from "react";
import { ActionIcon, Button } from "@mantine/core";
import { IconX } from "@tabler/icons-react";

export function CounterPage() {
  useHidDevices();
  const [inTransition, startTransition] = useTransition();
  const [stages, setStages] = useState<Record<string, SMXStage>>({});

  if (!browserSupported) {
    return "must use a chrome-like browser... sorry.";
  }

  async function addStageAction() {
    const stage = await promptSelectDevice();
    const serial = stage?.info?.serial;
    if (!stage || !serial) return;
    setStages((prev) => {
      return {
        ...prev,
        [serial]: stage,
      };
    });
  }

  return (
    <>
      <StepCounter stages={stages} />
      <p>
        <Button disabled={inTransition} onClick={() => startTransition(addStageAction)}>
          Add Stage
        </Button>
        <ul>
          {Object.keys(stages).map((serial) => (
            <li key={serial}>
              {serial}{" "}
              <ActionIcon
                onClick={() => {
                  setStages((prev) => {
                    const next = { ...prev };
                    delete next[serial];
                    return next;
                  });
                }}
              >
                <IconX />
              </ActionIcon>
            </li>
          ))}
        </ul>
      </p>
    </>
  );
}
