import { useAtomValue } from "jotai";
import { useState, useEffect } from "react";
import { stages$ } from "../state";

export function StepCounter() {
  const stages = useAtomValue(stages$);
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    const subscriptions = Object.values(stages).map((stage) =>
      stage.inputState$
        .diff(new Array<boolean>(9), (prev, curr) => curr.filter((pressed, i) => pressed && !prev[i]).length)
        .filter((n) => n > 0)
        .onValue((n) => setSteps((s) => s + n)),
    );

    return () => subscriptions.forEach((unsub) => void unsub());
  }, [stages]);

  return <p>Total Steps: {steps}</p>;
}
