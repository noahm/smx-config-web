import { type Observable, repeatedly, constant } from "baconjs";
import { PanelTestMode } from "./api";
import type { ConfigShape } from "./commands/config";
import type { SensorTestMode, SMXPanelTestData } from "./commands/sensor_test";
import type { StageInfo, StageLike } from "./interface";
import { mockSensorValue } from "./mocks/test-data";
import { fsrConfig } from "./mocks/config";

const activityShape = new Array(30).fill(1).concat(new Array(300).fill(0));

export class StageMock implements StageLike {
  public inputState$ = repeatedly(1000, [true, false]).map((centerPressed) => {
    return [false, false, false, false, centerPressed, false, false, false, false];
  });
  public testDataResponse$ = repeatedly(20, activityShape).map<SMXPanelTestData[]>((highOrLow) => {
    return [
      mockSensorValue(),
      mockSensorValue(),
      mockSensorValue(),
      mockSensorValue(),
      mockSensorValue(highOrLow ? 235 : 0),
      mockSensorValue(),
      mockSensorValue(),
      mockSensorValue(),
      mockSensorValue(),
    ];
  });
  public configResponse$: Observable<ConfigShape>;
  public get config() {
    return structuredClone(fsrConfig);
  }
  public info: StageInfo;
  constructor(
    player: number,
    public panelTestMode: PanelTestMode = PanelTestMode.Off,
  ) {
    this.info = {
      firmware_version: 5,
      player: player,
      serial: crypto.randomUUID(),
    };
    this.configResponse$ = constant(this.config);
  }
  public async init(): Promise<void> {}
  public async writeConfig(): Promise<ConfigShape> {
    return this.config;
  }
  public async factoryReset(): Promise<void> {}
  public async updateTestData(mode?: SensorTestMode | null): Promise<SMXPanelTestData[]> {
    return [];
  }
  public setPanelTestMode(mode: PanelTestMode): void {}
}
