import { useState } from "react";
import { applySensitivityPreset } from "../../sdk/presets";
import { Button, Group } from "@mantine/core";
import { useStage } from "../context";

export function WritePresetButtons() {
  const stage = useStage();
  // holds the stage serial that we were sending to
  const [sendingToStage, updateSending] = useState<string | null>(null);
  if (sendingToStage) {
    if (!stage) {
      // stage went away
      updateSending(null);
    } else if (stage.info?.serial !== sendingToStage) {
      // stage changed
      updateSending(null);
    }
  }
  return (
    <Group gap="xs">
      Set Sensitivity:
      <Button
        disabled={!stage}
        loading={!!sendingToStage}
        title="Use if panels are too easy to activate, or don't release fast enough."
        onClick={() => {
          if (!stage?.info) return;
          updateSending(stage.info.serial);
          applySensitivityPreset(stage, "low").then(() => updateSending(null));
        }}
      >
        Low
      </Button>
      <Button
        disabled={!stage}
        loading={!!sendingToStage}
        title="The default. Recommended for everyone to start with."
        onClick={() => {
          if (!stage?.info) return;
          updateSending(stage.info.serial);
          applySensitivityPreset(stage, "normal").then(() => updateSending(null));
        }}
      >
        Normal
      </Button>
      <Button
        disabled={!stage}
        loading={!!sendingToStage}
        title="Make the pannels easier to trigger. Try this if small children are having trouble activating panels."
        onClick={() => {
          if (!stage?.info) return;
          updateSending(stage.info.serial);
          applySensitivityPreset(stage, "high").then(() => updateSending(null));
        }}
      >
        High
      </Button>
    </Group>
  );
}
