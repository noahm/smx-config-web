import cn from "classnames";
import { Sensor, type SMXPanelTestData } from "../../sdk";

interface EnabledProps {
  testData: SMXPanelTestData | undefined;
  active: boolean | undefined;
}

export function FsrPanel({ testData, active }: EnabledProps) {
  return (
    <div
      className={cn("panel", {
        commErr: testData && !testData.have_data_from_panel,
        active: active,
      })}
    >
      <Fsr
        className="top horiz"
        badInput={testData?.bad_sensor_input[Sensor.Up]}
        value={testData?.sensor_level[Sensor.Up]}
      />
      <Fsr
        className="right vert"
        badInput={testData?.bad_sensor_input[Sensor.Right]}
        value={testData?.sensor_level[Sensor.Right]}
      />
      <Fsr
        className="bottom horiz"
        badInput={testData?.bad_sensor_input[Sensor.Down]}
        value={testData?.sensor_level[Sensor.Down]}
      />
      <Fsr
        className="left vert"
        badInput={testData?.bad_sensor_input[Sensor.Left]}
        value={testData?.sensor_level[Sensor.Left]}
      />
    </div>
  );
}

function Fsr({
  className,
  badInput,
  value,
}: {
  className?: string;
  badInput?: boolean;
  value?: number;
}) {
  return <div className={cn("fsr", className)}>{badInput ? "!!" : value}</div>;
}
