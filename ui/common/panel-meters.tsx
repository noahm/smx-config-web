import { useConfig, useTestData } from "../stage/hooks";
import { SensorMeterInput } from "./sensor-meter-input";
import { Switch } from "@mantine/core";
import classes from "./panel-meters.module.css";
import type { StageLike } from "../../sdk/interface";
import { sensitivityLevelsForPanel } from "../stage/util";
import { SensorTestMode } from "../../sdk";

export function PanelMeters({ stage, panelIdx }: { stage: StageLike; panelIdx: number }) {
  const testData = useTestData(stage, SensorTestMode.CalibratedValues);
  const config = useConfig(stage);
  const panelData = panelIdx === undefined ? null : testData?.[panelIdx];
  const isFsr = stage?.config?.flags.PlatformFlags_FSR;
  // has at least one enabled sensor
  const panelIsEnabled = config?.enabledSensors[panelIdx].some((p) => p);

  // const [isLocked, setIsLocked] = useState(false);

  // const updateSensorThreshold = useCallback(
  //   (id: number, type: "activation" | "release", value: number) => {
  //     // setSensors((prevSensors) => {
  //     //   const updatedSensors = prevSensors.map((sensor) =>
  //     //     sensor.id === id ? { ...sensor, [`${type}Threshold`]: value } : sensor,
  //     //   );

  //     //   if (isLocked) {
  //     //     // If locked, update all sensors with the same threshold
  //     //     return updatedSensors.map((sensor) => ({
  //     //       ...sensor,
  //     //       [`${type}Threshold`]: value,
  //     //     }));
  //     //   }

  //     //   return updatedSensors;
  //     // });
  //   },
  //   [isLocked],
  // );

  // const toggleLock = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setIsLocked(e.currentTarget.checked);
  //   if (e.currentTarget.checked) {
  //     // When locking, set all thresholds to the values of the first sensor
  //     const { activationThreshold, releaseThreshold } = sensors[0];
  //     setSensors((prevSensors) =>
  //       prevSensors.map((sensor) => ({
  //         ...sensor,
  //         activationThreshold,
  //         releaseThreshold,
  //       })),
  //     );
  //   }
  // };
  const levels = config ? sensitivityLevelsForPanel(config, panelIdx) : null;

  return (
    <div className={classes.panelWrapper}>
      {/* <h1 className={classes.title}>Sensor Thresholds</h1> */}
      <div className={classes.switchWrapper}>
        <Switch defaultChecked={panelIsEnabled} label="Enable Panel" />
      </div>
      <div className={classes.meterGroup}>
        {panelData?.sensor_level.map((level, index) => (
          <SensorMeterInput
            // biome-ignore lint/suspicious/noArrayIndexKey: index is the only id we have for these
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
          />
        ))}
      </div>
    </div>
  );
}
