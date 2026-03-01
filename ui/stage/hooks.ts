import { useAtomValue } from "jotai";
import { useState, useEffect, useRef } from "react";
import { type SMXPanelTestData, SensorTestMode } from "../../sdk";
import { displayTestData$ } from "../state";
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

export function useTestData(stage: StageLike | undefined) {
  const testDataMode = useAtomValue(displayTestData$);
  const [testData, setTestData] = useState<SMXPanelTestData[] | null>(null);

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

  if (!testDataMode) return null;
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
