import cn from "classnames";
import { FsrSensor, type SMXPanelTestData } from "../../sdk";
import { useCallback, forwardRef } from "react";
import styles from "./stage.module.css";
import { IconAlertCircleFilled, IconAlertHexagonFilled, IconAlertTriangleFilled } from "@tabler/icons-react";

interface EnabledProps {
  type: "fsr" | "loadcell";
  testData: SMXPanelTestData | undefined;
  /** is the panel being pressed at the moment? */
  active: boolean | undefined;
  /** are all 4 sensors disabled? */
  disabled: boolean | undefined;
  index: number;
  /** required for use as a popover target */
  onClick?(index: number): void;
  className?: string;
}

export const StagePanel = forwardRef<HTMLDivElement, EnabledProps>(
  ({ testData, active, disabled, index, onClick, className, type }, ref) => {
    const handleClick = useCallback(() => onClick?.(index), [index, onClick]);
    const handleKeydown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "Space") {
          handleClick();
        }
      },
      [handleClick],
    );
    const warningIcon =
      testData?.dip_switch_value !== index ? <IconAlertTriangleFilled color="var(--mantine-color-yellow-8)" /> : null;
    if (disabled) {
      return (
        // biome-ignore lint/a11y/useSemanticElements: may use actual radio buttons in full UI rebuild
        <div
          ref={ref}
          className={cn(styles.panel, styles.disabled, className)}
          onClick={handleClick}
          onKeyDown={handleKeydown}
          role="button"
          tabIndex={0}
        >
          {warningIcon}
        </div>
      );
    }
    return (
      // biome-ignore lint/a11y/useSemanticElements: may use actual radio buttons in full UI rebuild
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeydown}
        onClick={handleClick}
        className={cn(styles.panel, className, {
          [styles.commErr]: testData && !testData.have_data_from_panel,
          [styles.active]: active,
        })}
      >
        {testData && (type === "fsr" ? <FsrReadings testData={testData} /> : <LoadCellReadings testData={testData} />)}
        {warningIcon}
      </div>
    );
  },
);

function FsrReadings({ testData }: { testData: SMXPanelTestData }) {
  return (
    <>
      <SensorReading
        className={cn(styles.top, styles.horiz)}
        badSensor={testData.bad_sensor_input[FsrSensor.Top]}
        badJumper={testData.bad_jumper[FsrSensor.Top]}
        value={testData.sensor_level[FsrSensor.Top]}
      />
      <SensorReading
        className={cn(styles.right, styles.vert)}
        badSensor={testData.bad_sensor_input[FsrSensor.Right]}
        badJumper={testData.bad_jumper[FsrSensor.Right]}
        value={testData.sensor_level[FsrSensor.Right]}
      />
      <SensorReading
        className={cn(styles.bottom, styles.horiz)}
        badSensor={testData.bad_sensor_input[FsrSensor.Bottom]}
        badJumper={testData.bad_jumper[FsrSensor.Bottom]}
        value={testData.sensor_level[FsrSensor.Bottom]}
      />
      <SensorReading
        className={cn(styles.left, styles.vert)}
        badSensor={testData.bad_sensor_input[FsrSensor.Left]}
        badJumper={testData.bad_jumper[FsrSensor.Left]}
        value={testData.sensor_level[FsrSensor.Left]}
      />
    </>
  );
}

function LoadCellReadings({ testData }: { testData: SMXPanelTestData }) {
  return (
    <>
      <SensorReading
        className={cn(styles.top, styles.left)}
        badSensor={testData.bad_sensor_input[0]}
        badJumper={testData.bad_jumper[0]}
        value={testData?.sensor_level[0]}
      />
      <SensorReading
        className={cn(styles.top, styles.right)}
        badSensor={testData.bad_sensor_input[1]}
        badJumper={testData.bad_jumper[1]}
        value={testData?.sensor_level[1]}
      />
      <SensorReading
        className={cn(styles.bottom, styles.left)}
        badSensor={testData.bad_sensor_input[2]}
        badJumper={testData.bad_jumper[2]}
        value={testData?.sensor_level[2]}
      />
      <SensorReading
        className={cn(styles.bottom, styles.right)}
        badSensor={testData.bad_sensor_input[3]}
        badJumper={testData.bad_jumper[3]}
        value={testData?.sensor_level[3]}
      />
    </>
  );
}

function SensorReading({
  className,
  badSensor,
  badJumper,
  value,
}: {
  className?: string;
  badSensor?: boolean;
  badJumper?: boolean;
  value?: number;
}) {
  return (
    <div className={cn(styles.fsr, className)}>
      {badJumper && <IconAlertHexagonFilled color="var(--mantine-color-red-6)" />}
      {badSensor && <IconAlertCircleFilled color="var(--mantine-color-red-6)" />}
      {!badJumper && !badSensor && value}
    </div>
  );
}
