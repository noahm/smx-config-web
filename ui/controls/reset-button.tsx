import { Button } from "@mantine/core";
import { useStage } from "../context";
import { useTransition } from "react";

export function ResetButton() {
  const stage = useStage();
  const [isPending, startTransition] = useTransition();
  return (
    <Button color="red" loading={isPending} onClick={() => startTransition(() => stage?.factoryReset())}>
      Factory Rest Stage
    </Button>
  );
}
