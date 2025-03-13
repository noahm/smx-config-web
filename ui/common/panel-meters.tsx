
import { useState, useCallback } from "react"
import { SensorMeterInput } from "./sensor-meter-input"
import { ToggleSwitch } from "./toggle-switch"
import classes from "./panel-meters.module.css";

export function PanelMeters() {
  const [sensors, setSensors] = useState([
    { id: 1, value: 50, activationThreshold: 70, releaseThreshold: 30 },
    { id: 2, value: 30, activationThreshold: 60, releaseThreshold: 20 },
    { id: 3, value: 70, activationThreshold: 80, releaseThreshold: 40 },
    { id: 4, value: 40, activationThreshold: 75, releaseThreshold: 25 },
  ])

  const [isLocked, setIsLocked] = useState(false)

  const updateSensorThreshold = useCallback(
    (id: number, type: "activation" | "release", value: number) => {
      setSensors((prevSensors) => {
        const updatedSensors = prevSensors.map((sensor) =>
          sensor.id === id ? { ...sensor, [`${type}Threshold`]: value } : sensor,
        )

        if (isLocked) {
          // If locked, update all sensors with the same threshold
          return updatedSensors.map((sensor) => ({
            ...sensor,
            [`${type}Threshold`]: value,
          }))
        }

        return updatedSensors
      })
    },
    [isLocked],
  )

  const toggleLock = () => {
    setIsLocked((prev) => !prev)
    if (!isLocked) {
      // When locking, set all thresholds to the values of the first sensor
      const { activationThreshold, releaseThreshold } = sensors[0]
      setSensors((prevSensors) =>
        prevSensors.map((sensor) => ({
          ...sensor,
          activationThreshold,
          releaseThreshold,
        })),
      )
    }
  }

  return (
    <div className={classes.panelWrapper}>
      <h1 className={classes.title}>Pressure Sensors</h1>
      <div className={classes.switchWrapper}>
        <ToggleSwitch isOn={isLocked} onToggle={toggleLock} label="Lock Thresholds" />
      </div>
      <div className={classes.meterGroup}>
        {sensors.map((sensor, index) => (
          <SensorMeterInput
            key={sensor.id}
            value={sensor.value}
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
  )
}

