import cn from "classnames";
import { useAtomValue, type Atom } from "jotai";
import type React from "react";
import { FsrPanel } from "./fsr-panel";
import type { SMXStage } from "../../sdk/";
import { timez } from "./util";
import { LoadCellPanel } from "./load-cell-panel";
import { useTestData, useInputState, useConfig } from "./hooks";

export function StageTest({
  stageAtom,
}: {
  stageAtom: Atom<SMXStage | undefined>;
}) {
  const stage = useAtomValue(stageAtom);
  const testData = useTestData(stage);
  const inputState = useInputState(stage);
  const config = useConfig(stage);

  let panels: React.ReactNode;
  if (stage?.config?.flags.PlatformFlags_FSR) {
    panels = timez(9, (idx) => (
      <FsrPanel
        disabled={config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        key={idx}
        testData={testData?.panels[idx]}
      />
    ));
  } else {
    panels = timez(9, (idx) => (
      <LoadCellPanel
        disabled={config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        key={idx}
        testData={testData?.panels[idx]}
      />
    ));
  }

  return <div className={cn("pad", { disabled: !stage })}>{panels}</div>;
}
