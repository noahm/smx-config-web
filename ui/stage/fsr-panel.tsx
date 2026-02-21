import cn from "classnames";
import { FsrSensor, type SMXPanelTestData } from "../../sdk";
import { useCallback } from "react";
import { selectedPanelIdx$, selectedStageSerial$ } from "../state";
import { useAtomValue } from "jotai";

interface EnabledProps {
  testData: SMXPanelTestData | undefined;
  active: boolean | undefined;
  disabled: boolean | undefined;
  index: number;
  stageSerial: string;
  onClick(index: number): void;
}

export function FsrPanel({ testData, active, disabled, index, onClick, stageSerial }: EnabledProps) {
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
    return <div className={cn("panel disabled", {})} />;
  }
  const selected = stageSerial === selectedStageSerial && selectedPanelIdx === index;
  return (
    // biome-ignore lint/a11y/useSemanticElements: may use actual radio buttons in full UI rebuild
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={handleKeydown}
      onClick={handleClick}
      className={cn("panel", {
        commErr: testData && !testData.have_data_from_panel,
        active: active,
        selected,
      })}
    >
      <Fsr
        className="top horiz"
        badInput={testData?.bad_sensor_input[FsrSensor.Up]}
        value={testData?.sensor_level[FsrSensor.Up]}
      />
      <Fsr
        className="right vert"
        badInput={testData?.bad_sensor_input[FsrSensor.Right]}
        value={testData?.sensor_level[FsrSensor.Right]}
      />
      <Fsr
        className="bottom horiz"
        badInput={testData?.bad_sensor_input[FsrSensor.Down]}
        value={testData?.sensor_level[FsrSensor.Down]}
      />
      <Fsr
        className="left vert"
        badInput={testData?.bad_sensor_input[FsrSensor.Left]}
        value={testData?.sensor_level[FsrSensor.Left]}
      />
    </div>
  );
}

function Fsr({ className, badInput, value }: { className?: string; badInput?: boolean; value?: number }) {
  return <div className={cn("fsr", className)}>{badInput ? "!!" : value}</div>;
}
