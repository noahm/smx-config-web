import type React from "react";
import { useState, useCallback } from "react";

import { useTestData } from "../stage/hooks";
import { SensorMeterInput } from "./sensor-meter-input";
import { Switch } from "@mantine/core";
import classes from "./panel-meters.module.css";
import type { SMXStage } from "../../sdk";

export function PanelMeters({ stage, panelIdx }: { stage: SMXStage; panelIdx: number }) {
  const testData = useTestData(stage);
  const panelData = panelIdx === undefined ? null : testData?.panels[panelIdx];
  // TODO remove this internal state and use the config data directly from the stage!
  const [sensors, setSensors] = useState([
    { id: 1, activationThreshold: 70, releaseThreshold: 30 },
    { id: 2, activationThreshold: 60, releaseThreshold: 20 },
    { id: 3, activationThreshold: 80, releaseThreshold: 40 },
    { id: 4, activationThreshold: 75, releaseThreshold: 25 },
  ]);
  const isFsr = stage?.config?.flags.PlatformFlags_FSR;

  const [isLocked, setIsLocked] = useState(false);

  const updateSensorThreshold = useCallback(
    (id: number, type: "activation" | "release", value: number) => {
      setSensors((prevSensors) => {
        const updatedSensors = prevSensors.map((sensor) =>
          sensor.id === id ? { ...sensor, [`${type}Threshold`]: value } : sensor,
        );

        if (isLocked) {
          // If locked, update all sensors with the same threshold
          return updatedSensors.map((sensor) => ({
            ...sensor,
            [`${type}Threshold`]: value,
          }));
        }

        return updatedSensors;
      });
    },
    [isLocked],
  );

  const toggleLock = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLocked(e.currentTarget.checked);
    if (e.currentTarget.checked) {
      // When locking, set all thresholds to the values of the first sensor
      const { activationThreshold, releaseThreshold } = sensors[0];
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => ({
          ...sensor,
          activationThreshold,
          releaseThreshold,
        })),
      );
    }
  };

  return (
    <div className={classes.panelWrapper}>
      <h1 className={classes.title}>Sensor Thresholds</h1>
      <div className={classes.switchWrapper}>
        <Switch checked={isLocked} onChange={toggleLock} label="Lock Thresholds" />
      </div>
      <div className={classes.meterGroup}>
        {sensors.map((sensor, index) => (
          <SensorMeterInput
            key={sensor.id}
            value={panelData?.sensor_level[index]}
            id={sensor.id}
            activationThreshold={sensor.activationThreshold}
            releaseThreshold={sensor.releaseThreshold}
            maxValue={255}
            updateThreshold={updateSensorThreshold}
            // showControls={!isLocked || index === sensors.length - 1}
            showControls={false}
            forFsr={isFsr}
          />
        ))}
      </div>
    </div>
  );
}
