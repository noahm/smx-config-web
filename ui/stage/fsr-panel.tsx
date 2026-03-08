import cn from "classnames";
import { FsrSensor, type SMXPanelTestData } from "../../sdk";
import { useCallback, forwardRef } from "react";
import styles from "./stage.module.css";

interface EnabledProps {
  testData: SMXPanelTestData | undefined;
  active: boolean | undefined;
  disabled: boolean | undefined;
  index: number;
  selected?: boolean;
  onClick?(index: number): void;
  className?: string;
}

export const FsrPanel = forwardRef<HTMLDivElement, EnabledProps>(
  ({ testData, active, disabled, index, onClick, selected, className }, ref) => {
    const handleClick = useCallback(() => onClick?.(index), [index, onClick]);
    const handleKeydown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "Space") {
          handleClick();
        }
      },
      [handleClick],
    );
    if (disabled) {
      return (
        // biome-ignore lint/a11y/useSemanticElements: may use actual radio buttons in full UI rebuild
        <div
          ref={ref}
          className={cn(styles.panel, styles.disabled, className)}
          onClick={handleClick}
          onKeyDown={handleKeydown}
          role="radio"
          aria-checked={selected}
          tabIndex={0}
        />
      );
    }
    return (
      // biome-ignore lint/a11y/useSemanticElements: may use actual radio buttons in full UI rebuild
      <div
        ref={ref}
        role="radio"
        aria-checked={selected}
        tabIndex={0}
        onKeyDown={handleKeydown}
        onClick={handleClick}
        className={cn(styles.panel, className, {
          [styles.commErr]: testData && !testData.have_data_from_panel,
          [styles.active]: active,
          [styles.selected]: selected,
        })}
      >
        <Fsr
          className={cn(styles.top, styles.horiz)}
          badInput={testData?.bad_sensor_input[FsrSensor.Top]}
          value={testData?.sensor_level[FsrSensor.Top]}
        />
        <Fsr
          className={cn(styles.right, styles.vert)}
          badInput={testData?.bad_sensor_input[FsrSensor.Right]}
          value={testData?.sensor_level[FsrSensor.Right]}
        />
        <Fsr
          className={cn(styles.bottom, styles.horiz)}
          badInput={testData?.bad_sensor_input[FsrSensor.Bottom]}
          value={testData?.sensor_level[FsrSensor.Bottom]}
        />
        <Fsr
          className={cn(styles.left, styles.vert)}
          badInput={testData?.bad_sensor_input[FsrSensor.Left]}
          value={testData?.sensor_level[FsrSensor.Left]}
        />
      </div>
    );
  },
);

function Fsr({ className, badInput, value }: { className?: string; badInput?: boolean; value?: number }) {
  return <div className={cn(styles.fsr, className)}>{badInput ? "!!" : value}</div>;
}
