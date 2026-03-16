import { Button } from "@mantine/core";
import { useStage } from "../context";
import { useTransition } from "react";
import { IconTrashX } from "@tabler/icons-react";

export function ResetButton() {
  const stage = useStage();
  const [isPending, startTransition] = useTransition();
  return (
    <Button flex="1" color="red" loading={isPending} onClick={() => startTransition(() => stage?.factoryReset())}>
      <IconTrashX /> Factory Reset
    </Button>
  );
}
