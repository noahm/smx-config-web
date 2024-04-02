import cn from "classnames";
import type { SMXPanelTestData } from "../../sdk/commands/sensor_test";
import { Sensor } from "../../sdk/api";

interface EnabledProps {
  data: SMXPanelTestData;
  active: boolean | undefined;
}

export function FsrPanel(props: EnabledProps) {
  const { bad_sensor_input, have_data_from_panel, sensor_level } = props.data;
  return (
    <div
      className={cn("panel", {
        commErr: !have_data_from_panel,
        active: props.active,
      })}
    >
      <Fsr className="top horiz" badInput={bad_sensor_input[Sensor.Up]} value={sensor_level[Sensor.Up]} />
      <Fsr className="right vert" badInput={bad_sensor_input[Sensor.Right]} value={sensor_level[Sensor.Right]} />
      <Fsr className="bottom horiz" badInput={bad_sensor_input[Sensor.Down]} value={sensor_level[Sensor.Down]} />
      <Fsr className="left vert" badInput={bad_sensor_input[Sensor.Left]} value={sensor_level[Sensor.Left]} />
    </div>
  );
}

function Fsr({
  className,
  badInput,
  value,
}: {
  className?: string;
  badInput: boolean;
  value: number;
}) {
  return <div className={cn("fsr", className)}>{badInput ? "!!" : value}</div>;
}
