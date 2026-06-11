import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { useTestData } from "../stage/hooks";
import { SensorMeterInput } from "./sensor-meter-input";
import { Alert, Group, Stack, Switch } from "@mantine/core";
import classes from "./panel-meters.module.css";
import type { StageLike } from "../../sdk/interface";
import type { ConfigShape } from "../../sdk/commands/config";
import { sensitivityLevelsForPanel } from "../stage/util";
import { FsrSensor, SensorTestMode } from "../../sdk";
import { IconAlertCircle, IconAlertHexagon, IconAlertTriangle } from "@tabler/icons-react";

const orderedSensorLevel = [FsrSensor.Left, FsrSensor.Bottom, FsrSensor.Top, FsrSensor.Right];

function DipSwitchDisplay({ value, mismatch }: { value: number | undefined; mismatch?: boolean }) {
  const isUnknown = value === undefined || value < 0;
  return (
    <div className={`${classes.dipSwitches} ${mismatch ? classes.dipSwitchesMismatch : ""}`}>
      {[0, 1, 2, 3].map((bit) => {
        const on = isUnknown ? null : Boolean(value & (1 << bit));
        return (
          <div key={bit} className={classes.dipSwitch}>
            <div
              className={`${classes.dipNub} ${on === true ? classes.dipNubOn : on === false ? classes.dipNubOff : classes.dipNubUnknown}`}
            />
            <span className={classes.dipBitLabel}>{bit + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

export function PanelMeters({ stage, panelIdx, config }: { stage: StageLike; panelIdx: number; config: ConfigShape }) {
  const testData = useTestData(stage, SensorTestMode.CalibratedValues);
  const rawTestData = useTestData(stage, SensorTestMode.UncalibratedValues);
  const tareTestData = useTestData(stage, SensorTestMode.Tare);
  const panelData = panelIdx === undefined ? null : testData?.[panelIdx];
  const rawPanelData = panelIdx === undefined ? null : rawTestData?.[panelIdx];
  const tarePanelData = panelIdx === undefined ? null : tareTestData?.[panelIdx];
  const isFsr = config.flags.PlatformFlags_FSR;

  const levels = sensitivityLevelsForPanel(config, panelIdx);

  // FSR stages support per-sensor independent thresholds; load cell must always share one value.
  // Default to linked if the panel's initial thresholds already match across all 4 sensors.
  const [isLinked, setIsLinked] = useState(
    () => levels.highs.every((high) => high === levels.highs[0]) && levels.lows.every((low) => low === levels.lows[0]),
  );

  const effectivelyLinked = isLinked || !isFsr;
  const effectivelyLinkedRef = useRef(effectivelyLinked);
  effectivelyLinkedRef.current = effectivelyLinked;

  // FSR defaults to a single combined handle (high = low + 1) only if the panel's
  // initial thresholds are already exactly 1 apart on every sensor; otherwise it
  // starts in advanced mode so existing wider gaps remain visible.
  const [simpleMode, setSimpleMode] = useState(() => levels.highs.every((high, i) => high - levels.lows[i] === 1));

  type OptimisticUpdate =
    | { op: "threshold"; sensorIdx: number; type: "activation" | "release" | "both"; value: number; linked: boolean }
    | { op: "snap"; high: number; low: number };

  const [optimisticLevels, setOptimisticLevels] = useOptimistic(levels, (current, update: OptimisticUpdate) => {
    if (!current) return current;
    if (update.op === "snap") {
      return { highs: Array(4).fill(update.high) as number[], lows: Array(4).fill(update.low) as number[] };
    }
    const highs = [...current.highs];
    const lows = [...current.lows];
    if (update.type === "both") {
      const low = update.value;
      const high = Math.min(update.value + 1, 255);
      if (update.linked) {
        highs.fill(high);
        lows.fill(low);
      } else {
        highs[update.sensorIdx] = high;
        lows[update.sensorIdx] = low;
      }
    } else if (update.type === "activation") {
      if (update.linked) highs.fill(update.value);
      else highs[update.sensorIdx] = update.value;
    } else {
      if (update.linked) lows.fill(update.value);
      else lows[update.sensorIdx] = update.value;
    }
    return { highs, lows };
  });

  const [, startTransition] = useTransition();

  const updateThreshold = useCallback(
    (sensorIdx: number, type: "activation" | "release" | "both", value: number) => {
      if (!stage.config) return;
      const linked = effectivelyLinkedRef.current;
      const panel = stage.config.panelSettings[panelIdx];
      startTransition(async () => {
        setOptimisticLevels({ op: "threshold", sensorIdx, type, value, linked });
        if (type === "both") {
          const low = value;
          const high = Math.min(value + 1, 255);
          if (linked && isFsr) {
            for (let i = 0; i < 4; i++) {
              panel.fsrHighThreshold[i] = high;
              panel.fsrLowThreshold[i] = low;
            }
          } else if (isFsr) {
            panel.fsrHighThreshold[sensorIdx] = high;
            panel.fsrLowThreshold[sensorIdx] = low;
          } else {
            panel.loadCellHighThreshold = high;
            panel.loadCellLowThreshold = low;
          }
        } else if (type === "activation") {
          if (linked && isFsr) for (let i = 0; i < 4; i++) panel.fsrHighThreshold[i] = value;
          else if (isFsr) panel.fsrHighThreshold[sensorIdx] = value;
          else panel.loadCellHighThreshold = value;
        } else {
          if (linked && isFsr) for (let i = 0; i < 4; i++) panel.fsrLowThreshold[i] = value;
          else if (isFsr) panel.fsrLowThreshold[sensorIdx] = value;
          else panel.loadCellLowThreshold = value;
        }
        await stage.writeConfig();
      });
    },
    [stage, panelIdx, isFsr, setOptimisticLevels],
  );

  const toggleSensorEnabled = useCallback(
    (sensorIdx: number, enabled: boolean) => {
      if (!stage.config) return;
      const panel = stage.config.enabledSensors[panelIdx];
      startTransition(async () => {
        panel[sensorIdx] = enabled;
        await stage.writeConfig();
      });
    },
    [stage, panelIdx],
  );

  const handleToggleLinked = useCallback(
    (newLinked: boolean) => {
      setIsLinked(newLinked);
      if (!newLinked || !isFsr || !stage.config || !optimisticLevels) return;
      // Snap all sensors to the rightmost sensor's current values when linking.
      const snapIdx = orderedSensorLevel[orderedSensorLevel.length - 1];
      const snapHigh = optimisticLevels.highs[snapIdx];
      const snapLow = optimisticLevels.lows[snapIdx];
      const panel = stage.config.panelSettings[panelIdx];
      startTransition(async () => {
        setOptimisticLevels({ op: "snap", high: snapHigh, low: snapLow });
        for (let i = 0; i < 4; i++) {
          panel.fsrHighThreshold[i] = snapHigh;
          panel.fsrLowThreshold[i] = snapLow;
        }
        await stage.writeConfig();
      });
    },
    [isFsr, stage, panelIdx, optimisticLevels, setOptimisticLevels],
  );

  const dipCurrent = panelData?.dip_switch_value;
  const dipExpected = panelIdx;
  const dipMismatch = dipCurrent !== undefined && dipCurrent >= 0 && dipCurrent !== dipExpected;
  const anyBadJumper = panelData?.bad_jumper.some((b) => b) ?? false;
  const anyBadSensorReading = panelData?.bad_sensor_input.some((b, idx) => b && config.enabledSensors[panelIdx][idx]);
  const showBadJumperWarning = anyBadJumper && !anyBadSensorReading;

  return (
    <Stack p="sm">
      {dipMismatch && (
        <>
          <Alert color="orange" icon={<IconAlertTriangle size={20} />} p="sm">
            DIP switch mismatch — update PCB switches as shown
          </Alert>
          <Group>
            <Group>
              <span className={classes.dipRowLabel}>Current</span>
              <DipSwitchDisplay value={dipCurrent} mismatch={dipMismatch} />
            </Group>
            <Group>
              <span className={classes.dipRowLabel}>Expected</span>
              <DipSwitchDisplay value={dipExpected} />
            </Group>
          </Group>
        </>
      )}
      {anyBadSensorReading && (
        <Alert color="red" icon={<IconAlertCircle size={20} />} p="sm">
          Bad sensor readings detected by this panel
        </Alert>
      )}
      {showBadJumperWarning && (
        <Alert color="red" icon={<IconAlertHexagon size={20} />} p="sm">
          Incorrect sensor jumper(s) detected on this panel
        </Alert>
      )}
      {/* <div className={classes.switchWrapper}>
        <Switch defaultChecked={panelIsEnabled} label="Enable Panel" />
      </div> */}
      {isFsr && (
        <Group>
          <Switch
            label="Link all sensors"
            size="sm"
            checked={isLinked}
            onChange={(e) => handleToggleLinked(e.currentTarget.checked)}
          />
          <Switch
            label="Separate thresholds"
            size="sm"
            checked={!simpleMode}
            onChange={(e) => setSimpleMode(!e.currentTarget.checked)}
          />
        </Group>
      )}
      <Group justify="center" align="flex-start" gap="xl">
        {orderedSensorLevel.map((sensorIdx, renderIdx) => (
          <SensorMeterInput
            key={sensorIdx}
            value={panelData?.sensor_level[sensorIdx]}
            rawValue={rawPanelData?.sensor_level[sensorIdx]}
            tareValue={tarePanelData?.sensor_level[sensorIdx]}
            id={sensorIdx}
            activationThreshold={optimisticLevels?.highs[sensorIdx]}
            releaseThreshold={optimisticLevels?.lows[sensorIdx]}
            maxValue={255}
            updateThreshold={updateThreshold}
            showControls={!effectivelyLinked || renderIdx === orderedSensorLevel.length - 1}
            simpleMode={isFsr ? simpleMode : false}
            forFsr={isFsr}
            disabled={!config.enabledSensors[panelIdx][sensorIdx]}
            onToggleEnabled={toggleSensorEnabled}
            badSensor={!!panelData?.bad_sensor_input[sensorIdx]}
            badJumper={!!panelData?.bad_jumper[sensorIdx]}
          />
        ))}
      </Group>
    </Stack>
  );
}
