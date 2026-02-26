import { useAtomValue, useAtom } from "jotai";
import { promptSelectDevice } from "../pad-coms";
import { stages$, selectedStageSerial$, browserSupported } from "../state";
import { Select } from "@mantine/core";

export function PickDevice() {
  const stages = useAtomValue(stages$);
  const [selectedSerial, setSelectedSerial] = useAtom(selectedStageSerial$);

  return (
    <Select
      value={selectedSerial || ""}
      data={[
        { value: "", label: "No Stage Selected", disabled: true },
        { value: "pair-new", label: "Pair a stage..." },
        ...Object.entries(stages).map(([serial, stage]) => ({
          value: serial,
          label: `P${stage.info?.player} - ${serial}`,
        })),
      ]}
      disabled={!browserSupported}
      onChange={(_, opt) => {
        if (opt.value) {
          promptSelectDevice();
        } else {
          setSelectedSerial(opt.value);
        }
      }}
    />
  );
}
