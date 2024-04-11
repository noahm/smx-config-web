import cn from "classnames";
import { LoadCellSensor, type SMXPanelTestData } from "../../sdk";

interface EnabledProps {
  testData: SMXPanelTestData | undefined;
  active: boolean | undefined;
}

export function LoadCellPanel({ testData, active }: EnabledProps) {
  return (
    <div
      className={cn("panel", {
        commErr: testData && !testData.have_data_from_panel,
        active: active,
      })}
    >
      <LoadCell
        className="top left"
        badInput={testData?.bad_sensor_input[LoadCellSensor.NW]}
        value={testData?.sensor_level[LoadCellSensor.NW]}
      />
      <LoadCell
        className="top right"
        badInput={testData?.bad_sensor_input[LoadCellSensor.NE]}
        value={testData?.sensor_level[LoadCellSensor.NE]}
      />
      <LoadCell
        className="bottom left"
        badInput={testData?.bad_sensor_input[LoadCellSensor.SW]}
        value={testData?.sensor_level[LoadCellSensor.SW]}
      />
      <LoadCell
        className="right bottom"
        badInput={testData?.bad_sensor_input[LoadCellSensor.SE]}
        value={testData?.sensor_level[LoadCellSensor.SE]}
      />
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
