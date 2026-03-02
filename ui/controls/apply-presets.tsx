import { useCallback, useTransition } from "react";
import { applySensitivityPreset, type PresetName } from "../../sdk/presets";
import { Button, Group } from "@mantine/core";
import { useStage } from "../context";

export function WritePresetButtons() {
  const stage = useStage();
  const [sendingToStage, startTransition] = useTransition();
  const setPreset = useCallback(
    (preset: PresetName) => {
      return () => {
        if (!stage) return;
        startTransition(() => applySensitivityPreset(stage, preset));
      };
    },
    [stage],
  );
  return (
    <Group gap="xs">
      Set Sensitivity:
      <Button
        disabled={!stage}
        loading={!!sendingToStage}
        title="Use if panels are too easy to activate, or don't release fast enough."
        onClick={setPreset("low")}
      >
        Low
      </Button>
      <Button
        disabled={!stage}
        loading={!!sendingToStage}
        title="The default. Recommended for everyone to start with."
        onClick={setPreset("normal")}
      >
        Normal
      </Button>
      <Button
        disabled={!stage}
        loading={!!sendingToStage}
        title="Make the pannels easier to trigger. Try this if small children are having trouble activating panels."
        onClick={setPreset("high")}
      >
        High
      </Button>
    </Group>
  );
}
