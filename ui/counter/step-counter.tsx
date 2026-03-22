import { useState, useEffect } from "react";
import type { SMXStage } from "../../sdk";

export function StepCounter(props: { stages: Record<string, SMXStage> }) {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    const subscriptions = Object.values(props.stages).map((stage) =>
      stage.inputState$
        .diff(new Array<boolean>(9), (prev, curr) => curr.filter((pressed, i) => pressed && !prev[i]).length)
        .filter((n) => n > 0)
        .onValue((n) => setSteps((s) => s + n)),
    );

    return () => subscriptions.forEach((unsub) => void unsub());
  }, [props.stages]);

  return <p>Total Steps: {steps}</p>;
}
