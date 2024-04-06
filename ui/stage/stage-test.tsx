import { useAtomValue, type Atom } from "jotai";
import { useEffect, useState } from "react";
import { FsrPanel } from "./fsr-panel";
import {
  type PanelName,
  type SMXStage,
  SensorTestMode,
  type SMXPanelTestData,
  type SMXSensorTestData,
} from "../../sdk/";
import { displayTestData$ } from "../state";

/*
function useInputState(dev: HIDDevice | undefined) {
  const [panelStates, setPanelStates] = useState<EachPanel<boolean> | undefined>();
  useEffect(() => {
    if (!dev) return;
    function handleInputReport(e: HIDInputReportEvent) {
      if (e.reportId !== HID_REPORT_INPUT_STATE) return;
      const state = StageInputs.decode(e.data, true);
      setPanelStates(state);
    }
    dev.addEventListener("inputreport", handleInputReport);
    return () => dev.removeEventListener("inputreport", handleInputReport);
  }, [dev]);
  return panelStates;
}
*/

function useTestData(stage: SMXStage | undefined) {
  const readTestData = useAtomValue(displayTestData$);
  const [testData, setTestData] = useState<SMXSensorTestData | null>();

  useEffect(() => {
    if (!stage || !readTestData) {
      return;
    }

    const d = stage;
    async function update() {
      await d.updateTestData(SensorTestMode.CalibratedValues);
      setTestData(d.test);
      if (readTestData) {
        handle = requestAnimationFrame(update);
      }
    }

    let handle = setInterval(update, 50);

    return () => clearInterval(handle);
  }, [stage, readTestData]);

  return testData;
}

export function StageTest({
  stageAtom,
}: {
  stageAtom: Atom<SMXStage | undefined>;
}) {
  const stage = useAtomValue(stageAtom);
  const testData = useTestData(stage);
  // const inputState = useInputState(stage);

  if (!testData) {
    return null;
  }

  const entries = Object.entries(testData.panels) as [PanelName, SMXPanelTestData][];

  return (
    <div className="pad">
      {entries.map(([key, data]) => (
        <FsrPanel active={false} key={key} data={data} />
      ))}
    </div>
  );
}
