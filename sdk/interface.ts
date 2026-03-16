import type { Observable } from "baconjs";
import type { ConfigShape } from "./commands/config";
import type { SMXPanelTestData } from "./commands/sensor_test";

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
  readonly config: ConfigShape | null;
  info: StageInfo | null;
  readonly inputState$: Observable<boolean[]>;
  readonly configResponse$: Observable<ConfigShape>;
  readonly rawSensorData$: Observable<readonly SMXPanelTestData[]>;
  readonly calibratedSensorData$: Observable<readonly SMXPanelTestData[]>;
  readonly sensorTareData$: Observable<readonly SMXPanelTestData[]>;
  /** as long as anything remains subscribed, the stages will be kept in test mode */
  readonly engagePanelTestMode$: Observable<void>;
  init(): Promise<void>;
  writeConfig(): Promise<ConfigShape>;
  factoryReset(): Promise<void>;
  forceRecalibrate(): Promise<void>;
  /** close the underlying WebHID device */
  close(): void;
}
