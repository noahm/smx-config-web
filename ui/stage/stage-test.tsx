import { useAtomValue, type Atom } from "jotai";
import { useEffect, useState } from "react";
import type { SMXSensorTestData } from "../../sdk/commands/sensor_test";
import { requestTestData } from "../pad-coms";
import { FsrPanel } from "./fsr-panel";

export function StageTest({
  deviceAtom,
}: {
  deviceAtom: Atom<HIDDevice | undefined>;
}) {
  const device = useAtomValue(deviceAtom);
  const [testData, setTestData] = useState<SMXSensorTestData>();

  useEffect(() => {
    if (!device) {
      return;
    }

    const handle = requestAnimationFrame(async () => {
      const data = await requestTestData(device);
      setTestData(data);
    });

    return () => cancelAnimationFrame(handle);
  }, [device]);

  if (!testData) {
    return null;
  }

  return (
    <div className="pad">
      {Object.entries(testData.panels).map(([key, data]) => (
        <FsrPanel key={key} data={data} />
      ))}
    </div>
  );
}
