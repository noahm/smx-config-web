import cn from "classnames";
import type { SMXPanelTestData } from "../../sdk";
import type React from "react";
import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { selectedPanelIdx$, selectedStageSerial$ } from "../state";
import styles from "./stage.module.css";

interface EnabledProps {
  testData: SMXPanelTestData | undefined;
  active: boolean | undefined;
  disabled: boolean | undefined;
  index: number;
  stageSerial: string;
  onClick(index: number): void;
}

export function LoadCellPanel({ testData, active, disabled, onClick, index, stageSerial }: EnabledProps) {
  const handleClick = useCallback(() => onClick(index), [index, onClick]);
  const handleKeydown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Space") {
        handleClick();
      }
    },
    [handleClick],
  );
  const selectedPanelIdx = useAtomValue(selectedPanelIdx$);
  const selectedStageSerial = useAtomValue(selectedStageSerial$);
  if (disabled) {
    return <div className={cn(styles.panel, styles.disabled)} />;
  }
  const selected = stageSerial === selectedStageSerial && selectedPanelIdx === index;
  return (
    // biome-ignore lint/a11y/useSemanticElements: may use actual radio buttons in the full UI rebuild
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={handleKeydown}
      onClick={handleClick}
      className={cn(styles.panel, {
        [styles.commErr]: testData && !testData.have_data_from_panel,
        [styles.active]: active,
        [styles.selected]: selected,
      })}
    >
      {/* TODO: load cells don't have inherent placement, so this UI layout should become more ambiguous soon */}
      <LoadCell
        className={cn(styles.top, styles.left)}
        badInput={testData?.bad_sensor_input[0]}
        value={testData?.sensor_level[0]}
      />
      <LoadCell
        className={cn(styles.top, styles.right)}
        badInput={testData?.bad_sensor_input[1]}
        value={testData?.sensor_level[1]}
      />
      <LoadCell
        className={cn(styles.bottom, styles.left)}
        badInput={testData?.bad_sensor_input[2]}
        value={testData?.sensor_level[2]}
      />
      <LoadCell
        className={cn(styles.bottom, styles.right)}
        badInput={testData?.bad_sensor_input[3]}
        value={testData?.sensor_level[3]}
      />
    </div>
  );
}

function LoadCell({ className, badInput, value }: { className?: string; badInput?: boolean; value?: number }) {
  return <div className={cn(styles.loadCell, className)}>{badInput ? "!!" : value}</div>;
}
