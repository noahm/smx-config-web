import cn from "classnames";
import type React from "react";
import { Popover } from "@mantine/core";
import { FsrPanel } from "./fsr-panel";
import type { SMXStage } from "../../sdk/";
import { timez } from "./util";
import { LoadCellPanel } from "./load-cell-panel";
import { useTestData, useInputState, useConfig } from "./hooks";
import styles from "./stage.module.css";
import { useState } from "react";
import { PanelMeters } from "../common/panel-meters";

export function StageTest({ stage }: { stage: SMXStage | undefined }) {
  const testData = useTestData(stage);
  const inputState = useInputState(stage);
  const config = useConfig(stage);
  const [popoverPanel, setPopoverPanel] = useState(-1);

  let panels: React.ReactElement[];
  if (stage?.config?.flags.PlatformFlags_FSR) {
    panels = timez(9, (idx) => (
      <FsrPanel
        disabled={config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        index={idx}
        testData={testData?.panels[idx]}
        onClick={setPopoverPanel}
        selected={popoverPanel === idx}
      />
    ));
  } else {
    panels = timez(9, (idx) => (
      <LoadCellPanel
        disabled={!config || config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        index={idx}
        testData={testData?.panels[idx]}
        onClick={setPopoverPanel}
        selected={popoverPanel === idx}
      />
    ));
  }

  if (stage) {
    panels = panels.map((p, idx) => {
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: there is no better key than the index here
        <Popover opened={idx === popoverPanel} key={idx} withArrow>
          <Popover.Target>{p}</Popover.Target>
          <Popover.Dropdown>
            <PanelMeters stage={stage} panelIdx={popoverPanel} />
          </Popover.Dropdown>
        </Popover>
      );
    });
  }

  return <div className={cn(styles.pad, { disabled: !stage })}>{panels}</div>;
}
