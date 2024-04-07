import { useAtomValue, type Atom } from "jotai";
import { useEffect, useState } from "react";
import { FsrPanel } from "./fsr-panel";
import { type SMXStage, SensorTestMode, type SMXPanelTestData, type SMXSensorTestData } from "../../sdk/";
import { displayTestData$ } from "../state";

// UI Update Rate in Milliseconds
const UI_UPDATE_RATE = 50;

function useInputState(stage: SMXStage | undefined) {
  const [panelStates, setPanelStates] = useState<Array<boolean> | null>();

  useEffect(() => {
    if (!stage) return;

    const d = stage;
    async function update() {
      setPanelStates(d.inputs);
    }

    const handle = setInterval(update, UI_UPDATE_RATE);
    return () => clearInterval(handle);
  }, [stage]);

  return panelStates;
}

function useTestData(stage: SMXStage | undefined) {
  const readTestData = useAtomValue(displayTestData$);
  const [testData, setTestData] = useState<SMXSensorTestData | null>();

  useEffect(() => {
    if (!stage || !readTestData) {
      return;
    }

    const d = stage;
    async function update() {
      d.updateTestData(SensorTestMode.CalibratedValues);
      setTestData(d.test);
    }

    const handle = setInterval(update, UI_UPDATE_RATE);
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
  const inputState = useInputState(stage);

  if (!testData || !inputState) {
    return null;
  }

  const entries = Object.entries(testData.panels) as [string, SMXPanelTestData][];

  return (
    <div className="pad">
      {entries.map(([key, data]) => (
        <FsrPanel active={inputState?.[Number.parseInt(key)]} key={key} data={data} />
      ))}
    </div>
  );
}
