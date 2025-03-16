import { useState, useCallback, useRef } from "react";
import classes from "./sensor-meter-input.module.css";
import classNames from "classnames";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface SensorProps {
  id: number;
  value?: number | undefined;
  activationThreshold: number;
  releaseThreshold: number;
  maxValue: number;
  updateThreshold?: (id: number, type: "activation" | "release", value: number) => void;
  showControls?: boolean;
  forFsr?: boolean;
}

function useSensorActive(value: number, atk: number, rls: number) {
  const prev = useRef(false);
  let isActive: boolean | null = null;
  if (value <= rls) {
    isActive = false;
  } else if (value >= atk) {
    isActive = true;
  }

  // current value is determinate (between atk and release)
  if (isActive !== null) {
    prev.current = isActive;
  }

  return prev.current;
}

export function SensorMeterInput({
  id,
  value,
  maxValue,
  releaseThreshold,
  activationThreshold,
  updateThreshold,
  showControls,
  forFsr,
}: SensorProps) {
  const valuePct = (100 * (value || 0)) / maxValue;
  const releaseThresholdPct = (100 * releaseThreshold) / maxValue;
  const activationThresholdPct = (100 * activationThreshold) / maxValue;
  const [currentDraggingHandle, setIsDragging] = useState<"activation" | "release" | null>(null);
  const isActive = useSensorActive(value || 0, activationThreshold, releaseThreshold);

  const handleMouseDown = (type: "activation" | "release") => {
    setIsDragging(type);
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!currentDraggingHandle) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const height = rect.height;
      const y = e.clientY - rect.top;
      const percentage = clamp(maxValue - (y / height) * maxValue, 0, maxValue);

      updateThreshold?.(id, currentDraggingHandle, Math.round(percentage));
    },
    [id, currentDraggingHandle, updateThreshold, maxValue],
  );

  return (
    <div className={classes.root}>
      <div className={classes.control}>
        <div className={classes.meterContainer}>
          <div
            className={classNames(classes.meterValueFill, { [classes.meterValueFillActive]: isActive })}
            style={{ height: `${valuePct}%` }}
          />
          <div
            className={classNames(classes.meterThresholdLine, classes.atkColorBg)}
            style={{ bottom: `${activationThresholdPct}%` }}
          />
          <div
            className={classNames(classes.meterThresholdLine, classes.rlsColorBg)}
            style={{ bottom: `${releaseThresholdPct}%` }}
          />
        </div>
        {showControls && (
          <div
            className={classes.controlsContainer}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className={classes.dragHandleContainer} style={{ bottom: `calc(${activationThresholdPct}% - 8px)` }}>
              <div
                className={classNames(classes.dragHandle, classes.atkColorBg)}
                onMouseDown={() => handleMouseDown("activation")}
              />
              <span className={classNames(classes.handleLabel, classes.atkColorFg)}>{activationThreshold}</span>
            </div>
            <div className={classes.dragHandleContainer} style={{ bottom: `calc(${releaseThresholdPct}% - 8px)` }}>
              <div
                className={classNames(classes.dragHandle, classes.rlsColorBg)}
                onMouseDown={() => handleMouseDown("release")}
              />
              <span className={classNames(classes.handleLabel, classes.rlsColorFg)}>{releaseThreshold}</span>
            </div>
          </div>
        )}
      </div>
      <div className={classes.bottomLabel}>
        {forFsr && <FsrIndicator index={id} />}
        <p>Value: {value === undefined ? "--" : value}</p>
      </div>
    </div>
  );
}

const fsrSidesByIndex = ["Left", "Right", "Top", "Bottom"] as const;

function FsrIndicator({ index }: { index: number }) {
  const side = fsrSidesByIndex[index];
  return (
    <div
      className={classes.fsrIndicator}
      style={{ [`border${side}Width`]: "4px", [`border${side}Color`]: "var(--color-gray-700)" }}
    />
  );
}
