import { useAtomValue, useAtom } from "jotai";
import { promptSelectDevice } from "../pad-coms";
import { stages$, selectedStageSerial$, browserSupported } from "../state";
import { Select } from "antd";

export function PickDevice() {
  const stages = useAtomValue(stages$);
  const [selectedSerial, setSelectedSerial] = useAtom(selectedStageSerial$);
  const handleChange = (value: string) => {
    if (value === "pair-new") {
      promptSelectDevice();
    } else {
      setSelectedSerial(value);
    }
  };

  return (
    <Select
      value={selectedSerial || ""}
      options={[
        { value: "", label: "No Stage Selected", disabled: true },
        { value: "pair-new", label: "Pair a stage..." },
        ...Object.entries(stages).map(([serial, stage]) => ({
          value: serial,
          label: `P${stage.info?.player} - ${serial}`,
        })),
      ]}
      disabled={!browserSupported}
      onChange={handleChange}
    />
  );
}
