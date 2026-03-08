import type { Observable } from "baconjs";
import type { ConfigShape } from "./commands/config";
import type { SensorTestMode, SMXPanelTestData } from "./commands/sensor_test";
import type { PanelTestMode } from "./api";

export interface StageInfo {
  serial: string;
  firmware_version: number;
  player: number;
}

/**
 * Describes the whole public interface of a stage object
 * to make the process of building mock stage objects easy,
 * which makes UI development much easier!
 **/
export interface StageLike {
  panelTestMode: PanelTestMode;
  config: ConfigShape | null;
  info: StageInfo | null;
  inputState$: Observable<boolean[]>;
  configResponse$: Observable<ConfigShape>;
  testDataResponse$: Observable<SMXPanelTestData[]>;
  init(): Promise<void>;
  writeConfig(): Promise<ConfigShape>;
  factoryReset(): Promise<void>;
  updateTestData(mode?: SensorTestMode | null): Promise<SMXPanelTestData[]>;
  setPanelTestMode(mode: PanelTestMode): void;
}
