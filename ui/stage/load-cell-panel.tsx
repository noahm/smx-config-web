import cn from "classnames";
import type { SMXPanelTestData } from "../../sdk";

interface EnabledProps {
  testData: SMXPanelTestData | undefined;
  active: boolean | undefined;
  disabled: boolean | undefined;
}

export function LoadCellPanel({ testData, active, disabled }: EnabledProps) {
  if (disabled) {
    return <div className={cn("panel", {})} />;
  }
  return (
    <div
      className={cn("panel", {
        commErr: testData && !testData.have_data_from_panel,
        active: active,
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
