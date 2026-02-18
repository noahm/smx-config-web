import cn from "classnames";
import { useAtomValue, type Atom, useSetAtom } from "jotai";
import type React from "react";
import { FsrPanel } from "./fsr-panel";
import type { SMXStage } from "../../sdk/";
import { timez } from "./util";
import { LoadCellPanel } from "./load-cell-panel";
import { useTestData, useInputState, useConfig } from "./hooks";
import { selectedPanelIdx$, selectedStageSerial$ } from "../state";
import { useCallback } from "react";

export function StageTest({ stageAtom }: { stageAtom: Atom<SMXStage | undefined> }) {
  const stage = useAtomValue(stageAtom);
  const testData = useTestData(stage);
  const inputState = useInputState(stage);
  const config = useConfig(stage);
  const setSelectedPanelIdx = useSetAtom(selectedPanelIdx$);
  const setSelectedStateSerial = useSetAtom(selectedStageSerial$);
  const handleSelectPanel = useCallback(
    (panelIdx: number) => {
      setSelectedPanelIdx(panelIdx);
      setSelectedStateSerial(stage?.info?.serial);
    },
    [setSelectedPanelIdx, setSelectedStateSerial, stage],
  );

  let panels: React.ReactNode;
  if (stage?.config?.flags.PlatformFlags_FSR) {
    panels = timez(9, (idx) => (
      <FsrPanel
        disabled={config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        key={idx}
        index={idx}
        testData={testData?.panels[idx]}
        onClick={handleSelectPanel}
        stageSerial={stage?.info?.serial || ""}
      />
    ));
  } else {
    panels = timez(9, (idx) => (
      <LoadCellPanel
        disabled={!config || config?.enabledSensors[idx].every((enabled) => !enabled)}
        active={inputState?.[idx]}
        key={idx}
        index={idx}
        testData={testData?.panels[idx]}
        onClick={handleSelectPanel}
        stageSerial={stage?.info?.serial || ""}
      />
    ));
  }

  return <div className={cn("pad", { disabled: !stage })}>{panels}</div>;
}
