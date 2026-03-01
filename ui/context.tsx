import { createContext, useContext } from "react";
import type { SMXStage } from "../sdk";

const StageContext = createContext<SMXStage | undefined>(undefined);

export const StageContextProvider = StageContext.Provider;

export function useStage() {
  const stage = useContext(StageContext);
  if (!stage) throw new Error("you gotta have a stage");
  return stage;
}
