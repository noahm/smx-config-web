import { useAtomValue, type Atom } from "jotai";
import { useEffect, useState } from "react";
import type { SMXPanelTestData, SMXSensorTestData } from "../../sdk/commands/sensor_test";
import { FsrPanel } from "./fsr-panel";
import { getSensorTestData } from "../../sdk";
import { StageInputs, type EachPanel, type PanelName } from "../../sdk/commands/inputs";
import { HID_REPORT_INPUT_STATE } from "../../sdk/packet";
import { displayTestData$ } from "../state";

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

function useTestData(device: HIDDevice | undefined) {
  const readTestData = useAtomValue(displayTestData$);
  const [testData, setTestData] = useState<SMXSensorTestData>();

  useEffect(() => {
    if (!device || !readTestData) {
      return;
    }

    const d = device;
    async function update() {
      const data = await getSensorTestData(d);
      if (data) {
        setTestData(data);
      }
      handle = requestAnimationFrame(update);
    }

    let handle = setInterval(update, 50);

    return () => clearInterval(handle);
  }, [device, readTestData]);

  return testData;
}

export function StageTest({
  deviceAtom,
}: {
  deviceAtom: Atom<HIDDevice | undefined>;
}) {
  const device = useAtomValue(deviceAtom);
  const testData = useTestData(device);
  const inputState = useInputState(device);

  if (!testData) {
    return null;
  }

  const entries = Object.entries(testData.panels) as [PanelName, SMXPanelTestData][];

  return (
    <div className="pad">
      {entries.map(([key, data]) => (
        <FsrPanel active={inputState?.[key]} key={key} data={data} />
      ))}
    </div>
  );
}
