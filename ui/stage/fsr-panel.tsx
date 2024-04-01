import cn from "classnames";
import type { SMXPanelTestData } from "../../sdk/commands/sensor_test";

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
      <Fsr
        className="top horiz"
        badInput={bad_sensor_input.up}
        value={sensor_level.up}
      />
      <Fsr
        className="right vert"
        badInput={bad_sensor_input.right}
        value={sensor_level.right}
      />
      <Fsr
        className="bottom horiz"
        badInput={bad_sensor_input.down}
        value={sensor_level.down}
      />
      <Fsr
        className="left vert"
        badInput={bad_sensor_input.left}
        value={sensor_level.left}
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
  badInput: boolean;
  value: number;
}) {
  return <div className={cn("fsr", className)}>{badInput ? "!!" : value}</div>;
}
