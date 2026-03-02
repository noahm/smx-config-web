import cn from "classnames";
import type React from "react";
import { Popover } from "@mantine/core";
import { FsrPanel } from "./fsr-panel";
import { timez } from "./util";
import { LoadCellPanel } from "./load-cell-panel";
import { useTestData, useInputState, useConfig } from "./hooks";
import styles from "./stage.module.css";
import { PanelMeters } from "../common/panel-meters";
import type { StageLike } from "../../sdk/interface";

export function StageTest({ stage }: { stage: StageLike | undefined }) {
  const testData = useTestData(stage);
  const inputState = useInputState(stage);
  const config = useConfig(stage);
  // const [popoverPanel, setPopoverPanel] = useState(-1);

  let panels: React.ReactElement[];
  if (stage?.config?.flags.PlatformFlags_FSR) {
    panels = timez(9, (idx) => (
      <FsrPanel
        key={idx}
        disabled={config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        index={idx}
        testData={testData?.[idx]}
        // onClick={setPopoverPanel}
      />
    ));
  } else {
    panels = timez(9, (idx) => (
      <LoadCellPanel
        key={idx}
        disabled={!config || config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        index={idx}
        testData={testData?.[idx]}
        // onClick={setPopoverPanel}
      />
    ));
  }

  if (stage) {
    panels = panels.map((p, idx) => {
      return (
        <Popover
          // biome-ignore lint/suspicious/noArrayIndexKey: there is no better key than the index here
          key={idx}
          withArrow
          arrowSize={20}
          shadow="xl"
          position="right-start"
          // offset={{ crossAxis: -10, mainAxis: 17 }}
          arrowOffset={105}
        >
          <Popover.Target>{p}</Popover.Target>
          <Popover.Dropdown>
            <PanelMeters stage={stage} panelIdx={idx} />
          </Popover.Dropdown>
        </Popover>
      );
    });
  }

  return <div className={cn(styles.pad, { disabled: !stage })}>{panels}</div>;
}
