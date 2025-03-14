import cn from "classnames";
import type { SMXPanelTestData } from "../../sdk";
import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { selectedPanelIdx$, selectedStageSerial$ } from "../state";

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
  const selectedPanelIdx = useAtomValue(selectedPanelIdx$);
  const selectedStageSerial = useAtomValue(selectedStageSerial$);
  if (disabled) {
    return <div className={cn("panel disabled", {})} />;
  }
  const selected = stageSerial === selectedStageSerial && selectedPanelIdx === index;
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: not doing a11y right now :/
    <div
      onClick={handleClick}
      className={cn("panel", {
        commErr: testData && !testData.have_data_from_panel,
        active: active,
        selected,
      })}
    >
      {/* TODO: load cells don't have inherent placement, so this UI layout should become more ambiguous soon */}
      <LoadCell className="top left" badInput={testData?.bad_sensor_input[0]} value={testData?.sensor_level[0]} />
      <LoadCell className="top right" badInput={testData?.bad_sensor_input[1]} value={testData?.sensor_level[1]} />
      <LoadCell className="bottom left" badInput={testData?.bad_sensor_input[2]} value={testData?.sensor_level[2]} />
      <LoadCell className="right bottom" badInput={testData?.bad_sensor_input[3]} value={testData?.sensor_level[3]} />
    </div>
  );
}

function LoadCell({
  className,
  badInput,
  value,
}: {
  className?: string;
  badInput?: boolean;
  value?: number;
}) {
  return <div className={cn("load-cell", className)}>{badInput ? "!!" : value}</div>;
}
