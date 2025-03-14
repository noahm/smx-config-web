import { useState, useCallback } from "react";
import { useAtomValue } from "jotai";

import { useTestData } from "../stage/hooks";
import { selectedStage$, selectedPanelIdx$ } from "../state";
import { SensorMeterInput } from "./sensor-meter-input";
import { ToggleSwitch } from "./toggle-switch";
import classes from "./panel-meters.module.css";

export function PanelMeters() {
  const stage = useAtomValue(selectedStage$);
  const panelIdx = useAtomValue(selectedPanelIdx$);
  const testData = useTestData(stage);
  const panelData = panelIdx === undefined ? null : testData?.panels[panelIdx];
  const [sensors, setSensors] = useState([
    { id: 1, activationThreshold: 70, releaseThreshold: 30 },
    { id: 2, activationThreshold: 60, releaseThreshold: 20 },
    { id: 3, activationThreshold: 80, releaseThreshold: 40 },
    { id: 4, activationThreshold: 75, releaseThreshold: 25 },
  ]);

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

  const toggleLock = () => {
    setIsLocked((prev) => !prev);
    if (!isLocked) {
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
        <ToggleSwitch isOn={isLocked} onToggle={toggleLock} label="Lock Thresholds" />
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
            showControls={!isLocked || index === sensors.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
