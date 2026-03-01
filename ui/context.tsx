import { createContext, useContext } from "react";
import type { StageLike } from "../sdk/interface";

const StageContext = createContext<StageLike | undefined>(undefined);

export const StageContextProvider = StageContext.Provider;

export function useStage() {
  const stage = useContext(StageContext);
  if (!stage) throw new Error("you gotta have a stage");
  return stage;
}
