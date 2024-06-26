import cn from "classnames";
import { FsrSensor, type SMXPanelTestData } from "../../sdk";

interface EnabledProps {
  testData: SMXPanelTestData | undefined;
  active: boolean | undefined;
  disabled: boolean | undefined;
}

export function FsrPanel({ testData, active, disabled }: EnabledProps) {
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
