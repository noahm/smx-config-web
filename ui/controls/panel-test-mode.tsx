import { Switch } from "@mantine/core";
import { useStage } from "../context";
import { useEffect, useState } from "react";

export function PanelTestModeToggle() {
  const stage = useStage();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (enabled) {
      return stage.engagePanelTestMode$.subscribe();
    }
  }, [enabled, stage]);

  return (
    <Switch
      label="Show sensor pressure with stage LEDs"
      disabled={!stage}
      checked={enabled}
      onChange={(v) => {
        setEnabled(v.currentTarget.checked);
      }}
    />
  );
}
