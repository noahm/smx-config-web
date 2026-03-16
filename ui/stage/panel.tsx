import cn from "classnames";
import { FsrSensor, type SMXPanelTestData } from "../../sdk";
import { useCallback, forwardRef } from "react";
import styles from "./stage.module.css";
import { IconAlertCircle, IconAlertTriangleFilled } from "@tabler/icons-react";

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
      testData && testData.dip_switch_value !== index ? (
        <IconAlertTriangleFilled color="var(--mantine-color-yellow-7)" />
      ) : null;
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
        badInput={testData.bad_sensor_input[FsrSensor.Top] || testData.bad_jumper[FsrSensor.Top]}
        value={testData.sensor_level[FsrSensor.Top]}
      />
      <SensorReading
        className={cn(styles.right, styles.vert)}
        badInput={testData.bad_sensor_input[FsrSensor.Right] || testData.bad_jumper[FsrSensor.Right]}
        value={testData.sensor_level[FsrSensor.Right]}
      />
      <SensorReading
        className={cn(styles.bottom, styles.horiz)}
        badInput={testData.bad_sensor_input[FsrSensor.Bottom] || testData.bad_jumper[FsrSensor.Bottom]}
        value={testData.sensor_level[FsrSensor.Bottom]}
      />
      <SensorReading
        className={cn(styles.left, styles.vert)}
        badInput={testData.bad_sensor_input[FsrSensor.Left] || testData.bad_jumper[FsrSensor.Left]}
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
        badInput={testData?.bad_sensor_input[0]}
        value={testData?.sensor_level[0]}
      />
      <SensorReading
        className={cn(styles.top, styles.right)}
        badInput={testData?.bad_sensor_input[1]}
        value={testData?.sensor_level[1]}
      />
      <SensorReading
        className={cn(styles.bottom, styles.left)}
        badInput={testData?.bad_sensor_input[2]}
        value={testData?.sensor_level[2]}
      />
      <SensorReading
        className={cn(styles.bottom, styles.right)}
        badInput={testData?.bad_sensor_input[3]}
        value={testData?.sensor_level[3]}
      />
    </>
  );
}

function SensorReading({ className, badInput, value }: { className?: string; badInput?: boolean; value?: number }) {
  return <div className={cn(styles.fsr, className)}>{badInput ? <IconAlertCircle /> : value}</div>;
}
