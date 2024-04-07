import { useAtomValue, type Atom } from "jotai";
import { useEffect, useState } from "react";
import { FsrPanel } from "./fsr-panel";
import { type SMXStage, SensorTestMode, type SMXSensorTestData } from "../../sdk/";
import { displayTestData$ } from "../state";
import { timez } from "./util";

// UI Update Rate in Milliseconds
const UI_UPDATE_RATE = 50;

function useInputState(stage: SMXStage | undefined) {
  const readTestData = useAtomValue(displayTestData$);
  const [panelStates, setPanelStates] = useState<Array<boolean> | null>();
  useEffect(() => {
    return stage?.inputState$.throttle(UI_UPDATE_RATE).onValue(setPanelStates);
  }, [stage]);
  return panelStates;
}

function useTestData(stage: SMXStage | undefined) {
  const testDataMode = useAtomValue(displayTestData$);
  const [testData, setTestData] = useState<SMXSensorTestData | null>();

  // request updates on an interval
  useEffect(() => {
    if (!stage || !testDataMode) {
      return;
    }
    let testMode = SensorTestMode.UncalibratedValues;
    switch (testDataMode) {
      case "calibrated":
        testMode = SensorTestMode.CalibratedValues;
        break;
      case "noise":
        testMode = SensorTestMode.Noise;
        break;
      case "tare":
        testMode = SensorTestMode.Tare;
    }
    const handle = setInterval(() => stage.updateTestData(testMode), UI_UPDATE_RATE);
    return () => clearInterval(handle);
  }, [stage, testDataMode]);

  // ingest responses and display in UI
  useEffect(() => {
    return stage?.testDataResponse$.onValue(setTestData);
  }, [stage]);

  return testData;
}

export function StageTest({
  stageAtom,
}: {
  stageAtom: Atom<SMXStage | undefined>;
}) {
  const stage = useAtomValue(stageAtom);
  const testData = useTestData(stage);
  const inputState = useInputState(stage);

  return (
    <div className="pad">
      {timez(9, (idx) => (
        <FsrPanel active={inputState?.[idx]} key={idx} testData={testData?.panels[idx]} />
      ))}
    </div>
  );
}
