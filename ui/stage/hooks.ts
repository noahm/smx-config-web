import { useState, useEffect } from "react";
import { type SMXPanelTestData, SensorTestMode } from "../../sdk";
import type { StageLike } from "../../sdk/interface";

// UI Update Rate in Milliseconds
const UI_UPDATE_RATE = 50;

export function useInputState(stage: StageLike | undefined) {
  // const readTestData = useAtomValue(displayTestData$);
  const [panelStates, setPanelStates] = useState<Array<boolean> | null>();
  useEffect(() => {
    return stage?.inputState$.throttle(UI_UPDATE_RATE).onValue(setPanelStates);
  }, [stage]);
  return panelStates;
}

export function useTestData(
  stage: StageLike | undefined,
  testMode: SensorTestMode.CalibratedValues | SensorTestMode.UncalibratedValues | SensorTestMode.Tare,
) {
  const [testData, setTestData] = useState<readonly SMXPanelTestData[] | null>(null);

  // ingest responses and display in UI
  useEffect(() => {
    if (testMode === SensorTestMode.Tare) return stage?.sensorTareData$.onValue(setTestData);
    if (testMode === SensorTestMode.CalibratedValues) return stage?.calibratedSensorData$.onValue(setTestData);
    return stage?.rawSensorData$.onValue(setTestData);
  }, [stage, testMode]);

  return testData;
}

export function useConfig(stage: StageLike | undefined) {
  const [configData, setConfig] = useState(stage?.config);

  useEffect(() => {
    setConfig(stage?.config); // sync immediately on stage change
    return stage?.configResponse$.onValue(setConfig);
  }, [stage]);

  return configData;
}
