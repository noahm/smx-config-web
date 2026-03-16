import { useConfig, useTestData } from "../stage/hooks";
import { SensorMeterInput } from "./sensor-meter-input";
import { Alert, Group, Stack } from "@mantine/core";
import classes from "./panel-meters.module.css";
import type { StageLike } from "../../sdk/interface";
import { sensitivityLevelsForPanel } from "../stage/util";
import { FsrSensor, SensorTestMode } from "../../sdk";
import { IconAlertTriangle } from "@tabler/icons-react";

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

export function PanelMeters({ stage, panelIdx }: { stage: StageLike; panelIdx: number }) {
  const testData = useTestData(stage, SensorTestMode.CalibratedValues);
  const config = useConfig(stage);
  const panelData = panelIdx === undefined ? null : testData?.[panelIdx];
  const isFsr = stage?.config?.flags.PlatformFlags_FSR;
  // has at least one enabled sensor
  // const panelIsEnabled = config?.enabledSensors[panelIdx].some((p) => p);

  const levels = config ? sensitivityLevelsForPanel(config, panelIdx) : null;

  const dipCurrent = panelData?.dip_switch_value;
  const dipExpected = panelIdx;
  const dipMismatch = dipCurrent !== undefined && dipCurrent >= 0 && dipCurrent !== dipExpected;
  const anyBadJumper = panelData?.bad_jumper.some((b) => b) ?? false;
  // Only warn about bad jumpers when sensors are responding (not flagged as bad input)
  const sensorsResponding = panelData?.bad_sensor_input.some((b) => b) === false;
  const showBadJumperWarning = anyBadJumper && sensorsResponding;
  const orderedSensorLevel = [FsrSensor.Left, FsrSensor.Bottom, FsrSensor.Top, FsrSensor.Right];

  return (
    <Stack p="sm">
      {showBadJumperWarning && (
        <Alert color="red" className={classes.dipAlert}>
          Incorrect sensor jumper(s) detected on this panel
        </Alert>
      )}
      {dipMismatch && (
        <>
          <Alert color="orange" className={classes.dipAlert}>
            <IconAlertTriangle style={{ verticalAlign: "text-bottom" }} size={20} /> DIP switch mismatch — update PCB
            switches as shown
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
      {/* <div className={classes.switchWrapper}>
        <Switch defaultChecked={panelIsEnabled} label="Enable Panel" />
      </div> */}
      <Group justify="center" align="flex-start" gap="xl">
        {orderedSensorLevel
          .map((index) => [panelData?.sensor_level[index], index] as const)
          .map(([level, index]) => (
            <SensorMeterInput
              key={index}
              value={level}
              id={index}
              activationThreshold={levels?.highs[index]}
              releaseThreshold={levels?.lows[index]}
              maxValue={255}
              // updateThreshold={updateSensorThreshold}
              // showControls={!isLocked || index === sensors.length - 1}
              showControls={false}
              forFsr={isFsr}
              disabled={!config?.enabledSensors[panelIdx][index]}
              badJumper={!!panelData?.bad_jumper[index]}
              badSensor={!!panelData?.bad_sensor_input[index]}
            />
          ))}
      </Group>
    </Stack>
  );
}
