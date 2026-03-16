import { useState, useEffect, useRef } from "react";
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
  const stageRef = useRef(stage);
  const [configData, setConfig] = useState(stage?.config);

  useEffect(() => {
    if (stageRef.current !== stage) {
      // detected the stage has changed, so keep the config in sync
      setConfig(stage?.config);
      stageRef.current = stage;
    }
  }, [stage]);

  useEffect(() => {
    return stage?.configResponse$.onValue(setConfig);
  }, [stage]);

  return configData;
}
