import { useAtomValue, useAtom } from "jotai";
import type React from "react";
import { useEffect } from "react";

import { DebugCommands } from "./DebugCommands.tsx";
import { open_smx_device, promptSelectDevice } from "./pad-coms.tsx";
import {
  browserSupported,
  displayTestData$,
  selectedStage$,
  selectedStageSerial$,
  stages$,
  statusText$,
} from "./state.ts";
import { StageTest } from "./stage/stage-test.tsx";
import { TypedSelect } from "./common/typed-select.tsx";
import { ConfigValues } from "./stage/config.tsx";
import { PanelTestMode } from "../sdk/api.ts";
import { SensorMeterInput } from "./common/sensor-meter-input.tsx";
import { PanelMeters } from "./common/panel-meters.tsx";

function usePreviouslyPairedDevices() {
  useEffect(() => {
    // once, on load, get paired devices and attempt connection
    if (browserSupported) {
      navigator.hid.getDevices().then((devices) =>
        devices.forEach((device) => {
          open_smx_device(device);
        }),
      );
    }
  }, []);
}

export function UI() {
  usePreviouslyPairedDevices();

  return (
    <>
      <h1>SMX Web Config</h1>
      <StageTest stageAtom={selectedStage$} />
      <p>
        <PickDevice /> <DebugCommands />
      </p>
      <p>
        <TestDataDisplayToggle /> <PanelTestModeToggle />
      </p>
      <ConfigValues stageAtom={selectedStage$} />

      <PanelMeters />
      <StatusDisplay />
      <footer>
        A project of Cathadan and SenPi. This tool is unofficial and not affiliated with Step Revolution. Want to help?{" "}
        <a href="https://discord.gg/VjvCKYVxBR" target="_blank" rel="noreferrer">
          join our discord
        </a>{" "}
        or <a href="https://github.com/noahm/smx-config-web">browse the source code</a>
      </footer>
    </>
  );
}

function PickDevice() {
  const stages = useAtomValue(stages$);
  const [selectedSerial, setSelectedSerial] = useAtom(selectedStageSerial$);
  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newValue = e.currentTarget.value;
    if (newValue === "pair-new") {
      promptSelectDevice();
    } else {
      setSelectedSerial(newValue);
    }
  };

  return (
    <select value={selectedSerial || ""} disabled={!browserSupported} onChange={handleChange}>
      {!selectedSerial ? (
        <option disabled value="">
          No Stage Selected
        </option>
      ) : null}
      <option value="pair-new">Pair a stage...</option>
      {Object.entries(stages).map(([serial, stage]) => (
        <option value={serial} key={serial}>
          P{stage.info?.player} - {serial}
        </option>
      ))}
    </select>
  );
}

function StatusDisplay() {
  const statusText = useAtomValue(statusText$);
  return (
    <>
      <h3>Event Log</h3>
      <pre>{statusText}</pre>
    </>
  );
}

function TestDataDisplayToggle() {
  const stage = useAtomValue(selectedStage$);
  const [testMode, setTestMode] = useAtom(displayTestData$);

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is in the TypedSelect
    <label>
      Read Test Values:{" "}
      <TypedSelect
        disabled={!stage}
        value={testMode}
        options={[
          ["calibrated", "Calibrated"],
          ["raw", "Raw"],
          ["noise", "Noise"],
          ["tare", "Tare"],
        ]}
        onOptSelected={(next) => setTestMode(next)}
      />
    </label>
  );
}

function PanelTestModeToggle() {
  const stage = useAtomValue(selectedStage$);

  return (
    <label>
      Panel Test Mode:{" "}
      <input
        type="checkbox"
        style={{ height: "2em", width: "2em" }}
        disabled={!stage}
        defaultChecked={stage?.getPanelTestMode() === PanelTestMode.PressureTest}
        onChange={(e) => {
          stage?.setPanelTestMode(e.currentTarget.checked ? PanelTestMode.PressureTest : PanelTestMode.Off);
        }}
      />
    </label>
  );
}
