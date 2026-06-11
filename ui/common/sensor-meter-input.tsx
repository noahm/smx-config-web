import { useState, useCallback, useRef, useEffect } from "react";
import classes from "./sensor-meter-input.module.css";
import classNames from "classnames";
import { FsrSensor } from "../../sdk";
import {
  IconAlertCircleFilled,
  IconAlertHexagonFilled,
  IconArrowDown,
  IconArrowUp,
  IconArrowsVertical,
} from "@tabler/icons-react";
import { Switch } from "@mantine/core";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const METER_HEIGHT_PX = 256;
const HANDLE_SIZE_PX = 16;

interface SensorProps {
  id: number;
  value?: number | undefined;
  rawValue?: number | undefined;
  tareValue?: number | undefined;
  activationThreshold?: number;
  releaseThreshold?: number;
  maxValue: number;
  updateThreshold?: (id: number, type: "activation" | "release" | "both", value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  showControls?: boolean;
  simpleMode?: boolean;
  forFsr?: boolean;
  disabled?: boolean;
  onToggleEnabled?: (id: number, enabled: boolean) => void;
  badJumper: boolean;
  badSensor: boolean;
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
  rawValue,
  tareValue,
  maxValue,
  releaseThreshold,
  activationThreshold,
  updateThreshold,
  onDragStart,
  onDragEnd,
  showControls,
  simpleMode,
  forFsr,
  disabled,
  onToggleEnabled,
  badJumper,
  badSensor,
}: SensorProps) {
  if (disabled) {
    value = 0;
  }
  const valuePct = (100 * (value || 0)) / maxValue;
  const releaseThresholdPct = (100 * (releaseThreshold || 0)) / maxValue;
  const activationThresholdPct = (100 * (activationThreshold || 0)) / maxValue;
  const [currentDraggingHandle, setIsDragging] = useState<"activation" | "release" | "both" | null>(null);
  const isActive = useSensorActive(value || 0, activationThreshold || 0, releaseThreshold || 0);
  const meterRef = useRef<HTMLDivElement>(null);

  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  const activationThresholdRef = useRef(activationThreshold);
  activationThresholdRef.current = activationThreshold;
  const releaseThresholdRef = useRef(releaseThreshold);
  releaseThresholdRef.current = releaseThreshold;

  const handleMouseDown = (type: "activation" | "release" | "both") => {
    setIsDragging(type);
    onDragStart?.();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!currentDraggingHandle) return;
      if (!meterRef.current) return;

      const rect = meterRef.current.getBoundingClientRect();
      const height = rect.height;
      const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;
      let percentage = maxValue - (y / height) * maxValue;

      if (currentDraggingHandle === "activation") {
        const minAllowed = (releaseThresholdRef.current ?? 0) + 1;
        percentage = clamp(percentage, minAllowed, maxValue);
      } else if (currentDraggingHandle === "release") {
        const maxAllowed = (activationThresholdRef.current ?? maxValue) - 1;
        percentage = clamp(percentage, 0, maxAllowed);
      } else {
        percentage = clamp(percentage, 0, maxValue - 1);
      }

      updateThreshold?.(id, currentDraggingHandle, Math.round(percentage));
    },
    [id, currentDraggingHandle, updateThreshold, maxValue],
  );

  useEffect(() => {
    if (!currentDraggingHandle) return;
    const controller = new AbortController();
    document.addEventListener("selectstart", (e) => e.preventDefault(), { signal: controller.signal });
    document.addEventListener("touchmove", handleMouseMove, { signal: controller.signal });
    document.addEventListener("mousemove", handleMouseMove, { signal: controller.signal });
    document.addEventListener(
      "mouseup",
      () => {
        setIsDragging(null);
        onDragEndRef.current?.();
      },
      { signal: controller.signal },
    );
    document.addEventListener(
      "touchend",
      () => {
        setIsDragging(null);
        onDragEndRef.current?.();
      },
      { signal: controller.signal },
    );
    return () => controller.abort();
  }, [currentDraggingHandle, handleMouseMove]);

  const thresholdGapPx = (Math.abs(activationThresholdPct - releaseThresholdPct) / 100) * METER_HEIGHT_PX;
  const handlesOverlap = thresholdGapPx < HANDLE_SIZE_PX;

  return (
    <div className={classes.root}>
      <div className={classes.control}>
        <div className={classes.meterContainer}>
          <div
            className={classNames(classes.meterValueFill, { [classes.meterValueFillActive]: isActive })}
            style={{ height: `${valuePct}%` }}
          />
          {!disabled && activationThreshold !== undefined && (
            <div
              className={classNames(classes.meterThresholdLine, classes.atkColorBg)}
              style={{ bottom: `${activationThresholdPct}%` }}
            />
          )}
          {!disabled && releaseThreshold !== undefined && (
            <div
              className={classNames(classes.meterThresholdLine, classes.rlsColorBg)}
              style={{ bottom: `${releaseThresholdPct}%` }}
            />
          )}
        </div>
        {showControls && simpleMode && (
          <div ref={meterRef} className={classes.controlsContainer}>
            <div
              className={classes.dragHandleContainer}
              style={{ bottom: `calc(${(activationThresholdPct + releaseThresholdPct) / 2}% - 8px)` }}
            >
              <div
                role="slider"
                tabIndex={0}
                aria-valuenow={releaseThreshold}
                aria-valuetext={`${releaseThreshold} to ${activationThreshold}`}
                className={classNames(classes.dragHandle, classes.bothColorBg)}
                onMouseDown={() => handleMouseDown("both")}
                onTouchStart={() => handleMouseDown("both")}
              >
                <IconArrowsVertical size={10} stroke={3} />
              </div>
              <span className={classes.handleLabel}>
                {releaseThreshold}-{activationThreshold}
              </span>
            </div>
          </div>
        )}
        {showControls && !simpleMode && (
          <div ref={meterRef} className={classes.controlsContainer}>
            <div className={classes.dragHandleContainer} style={{ bottom: `calc(${activationThresholdPct}% - 8px)` }}>
              <div
                role="slider"
                tabIndex={0}
                aria-valuenow={activationThreshold}
                className={classNames(classes.dragHandle, classes.atkColorBg)}
                onMouseDown={() => handleMouseDown("activation")}
                onTouchStart={() => handleMouseDown("activation")}
              >
                <IconArrowUp size={10} stroke={3} />
              </div>
              <span className={classNames(classes.handleLabel, classes.atkColorFg)}>{activationThreshold}</span>
            </div>
            <div
              className={classNames(classes.dragHandleContainer, { [classes.dragHandleOffset]: handlesOverlap })}
              style={{ bottom: `calc(${releaseThresholdPct}% - 8px)` }}
            >
              <div
                role="slider"
                tabIndex={0}
                aria-valuenow={releaseThreshold}
                className={classNames(classes.dragHandle, classes.rlsColorBg)}
                onMouseDown={() => handleMouseDown("release")}
                onTouchStart={() => handleMouseDown("release")}
              >
                <IconArrowDown size={10} stroke={3} />
              </div>
              <span className={classNames(classes.handleLabel, classes.rlsColorFg)}>{releaseThreshold}</span>
            </div>
          </div>
        )}
      </div>
      <div className={classes.bottomLabel}>
        {forFsr && <FsrIndicator index={id} />}
        {!badJumper && !(badSensor && !disabled) && (
          <>
            <p className={classes.valueRow}>Raw: {rawValue === undefined || disabled ? "--" : rawValue}</p>
            <p className={classes.valueRow}>Tare: {tareValue === undefined || disabled ? "--" : tareValue}</p>
            <p className={classes.valueRow}>Cal: {value === undefined || disabled ? "--" : value}</p>
          </>
        )}
        {badJumper && (
          <p className={classes.bad} title="Incorrect jumper set for this sensor">
            <IconAlertHexagonFilled size={18} /> Jumper
          </p>
        )}
        {badSensor && !disabled && (
          <p className={classes.bad} title="Bad readings from this sensor">
            <IconAlertCircleFilled size={18} /> Sensor
          </p>
        )}
        {onToggleEnabled && (
          <Switch
            label="Enabled"
            size="sm"
            className={classes.enableSwitch}
            checked={!disabled}
            onChange={(e) => onToggleEnabled(id, e.currentTarget.checked)}
          />
        )}
      </div>
    </div>
  );
}

function FsrIndicator({ index }: { index: number }) {
  const side = FsrSensor[index];
  return (
    <div className={classes.fsrIndicator} style={{ [`border${side}`]: "4px solid var(--mantine-color-gray-7)" }} />
  );
}
