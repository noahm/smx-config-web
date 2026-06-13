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
import { Stack, Switch, Text } from "@mantine/core";

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
  /** show row labels (Raw/Tare/Cal/Enabled) for this column; only the leftmost column needs them */
  showLabels?: boolean;
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
  showLabels,
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, type: "activation" | "release" | "both") => {
      let delta = 0;
      if (e.key === "ArrowUp") delta = e.shiftKey ? 10 : 1;
      else if (e.key === "ArrowDown") delta = e.shiftKey ? -10 : -1;
      else return;
      e.preventDefault();

      let next: number;
      if (type === "activation") {
        const minAllowed = (releaseThresholdRef.current ?? 0) + 1;
        next = clamp((activationThreshold ?? 0) + delta, minAllowed, maxValue);
      } else if (type === "release") {
        const maxAllowed = (activationThresholdRef.current ?? maxValue) - 1;
        next = clamp((releaseThreshold ?? 0) + delta, 0, maxAllowed);
      } else {
        next = clamp((releaseThreshold ?? 0) + delta, 0, maxValue - 1);
      }
      updateThreshold?.(id, type, next);
    },
    [id, activationThreshold, releaseThreshold, maxValue, updateThreshold],
  );

  const thresholdGapPx = (Math.abs(activationThresholdPct - releaseThresholdPct) / 100) * METER_HEIGHT_PX;
  const handlesOverlap = thresholdGapPx < HANDLE_SIZE_PX + 4;

  return (
    <div className={classes.root}>
      <div className={classes.control}>
        <div className={classes.meterContainer}>
          <div
            className={classNames(classes.meterValueFill, { [classes.meterValueFillActive]: isActive })}
            style={{ height: `${valuePct}%` }}
          />
          {!disabled && activationThreshold !== undefined && (
            <div className={classNames(classes.meterThresholdLine)} style={{ bottom: `${activationThresholdPct}%` }} />
          )}
          {!disabled && releaseThreshold !== undefined && (
            <div
              className={classNames(classes.meterThresholdLine, classes.rlsColor)}
              style={{ bottom: `${releaseThresholdPct}%` }}
            />
          )}
        </div>
        {showControls && simpleMode && (
          <div ref={meterRef} className={classes.controlsContainer}>
            <div
              className={classes.dragHandleContainer}
              style={{ bottom: `calc(${(activationThresholdPct + releaseThresholdPct) / 2}% - 8px)` }}
              role="slider"
              tabIndex={0}
              aria-valuenow={releaseThreshold}
              aria-valuetext={`${releaseThreshold} to ${activationThreshold}`}
              onMouseDown={() => handleMouseDown("both")}
              onTouchStart={() => handleMouseDown("both")}
              onKeyDown={(e) => handleKeyDown(e, "both")}
            >
              <div className={classes.dragHandle}>
                <IconArrowsVertical size={10} stroke={3} />
              </div>
              <span className={classes.handleLabel}>
                {activationThreshold !== undefined &&
                releaseThreshold !== undefined &&
                activationThreshold - releaseThreshold === 1
                  ? activationThreshold
                  : `${releaseThreshold}-${activationThreshold}`}
              </span>
            </div>
          </div>
        )}
        {showControls && !simpleMode && (
          <div ref={meterRef} className={classes.controlsContainer}>
            <div
              className={classNames(classes.dragHandleContainer, { [classes.dragHandleOffset]: handlesOverlap })}
              style={{ top: `calc(${100 - activationThresholdPct}% - 8px)` }}
              onMouseDown={() => handleMouseDown("activation")}
              onTouchStart={() => handleMouseDown("activation")}
              onKeyDown={(e) => handleKeyDown(e, "activation")}
              role="slider"
              aria-valuenow={activationThreshold}
              tabIndex={0}
            >
              <div className={classes.dragHandle}>
                <IconArrowUp size={10} stroke={3} />
              </div>
              <span className={classes.handleLabel}>{activationThreshold}</span>
            </div>
            <div
              className={classNames(classes.dragHandleContainer, { [classes.dragHandleOffset]: handlesOverlap })}
              style={{ top: `calc(${100 - releaseThresholdPct}% - 8px)` }}
              role="slider"
              tabIndex={0}
              aria-valuenow={releaseThreshold}
              onMouseDown={() => handleMouseDown("release")}
              onTouchStart={() => handleMouseDown("release")}
              onKeyDown={(e) => handleKeyDown(e, "release")}
            >
              <div className={classNames(classes.dragHandle, classes.rlsColor)}>
                <IconArrowDown size={10} stroke={3} />
              </div>
              <span className={classNames(classes.handleLabel, classes.rlsColor)}>{releaseThreshold}</span>
            </div>
          </div>
        )}
      </div>
      <Stack className={classes.bottomControls} gap="xs" align="center">
        {forFsr && <FsrIndicator index={id} />}
        {showLabels && (
          <Stack className={classes.labelFloat} gap="0">
            <Text>Enable Sensor</Text>
            <Stack gap={0}>
              <Text ff="monospace" span>
                &nbsp;&nbsp;Raw
              </Text>
              <Text ff="monospace" span>
                -&nbsp;Tare
              </Text>
              <Text ff="monospace" span>
                =&nbsp;Calibrated
              </Text>
            </Stack>
          </Stack>
        )}
        {onToggleEnabled && (
          <Switch
            size="sm"
            className={classes.enableSwitch}
            checked={!disabled}
            onChange={(e) => onToggleEnabled(id, e.currentTarget.checked)}
          />
        )}
        {!(badSensor && !disabled) && (
          <Stack gap={0}>
            <Text ff="monospace" ta="right" span>
              {rawValue === undefined || disabled ? "--" : rawValue}
            </Text>
            <Text ff="monospace" ta="right" span>
              {tareValue === undefined || disabled ? "--" : tareValue * -1}
            </Text>
            <Text ff="monospace" ta="right" span>
              {value === undefined || disabled ? "--" : value}
            </Text>
          </Stack>
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
      </Stack>
    </div>
  );
}

function FsrIndicator({ index }: { index: number }) {
  const side = FsrSensor[index];
  return (
    <div className={classes.fsrIndicator} style={{ [`border${side}`]: "4px solid var(--mantine-color-gray-7)" }} />
  );
}
