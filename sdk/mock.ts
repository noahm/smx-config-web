import { type Observable, repeatedly, constant, interval } from "baconjs";
import { PanelTestMode } from "./api";
import type { ConfigShape } from "./commands/config";
import type { SensorTestMode, SMXPanelTestData } from "./commands/sensor_test";
import type { StageInfo, StageLike } from "./interface";
import { mockSensorValue } from "./mocks/test-data";
import { fsrConfig } from "./mocks/config";

// const activityShape = new Array<0 | 1>(30).fill(1).concat(new Array(220).fill(0));

export class StageMock implements StageLike {
  public inputState$ = repeatedly(1000, [1, 3, 4, 5, 7]).map((idxPressed) => {
    const out = new Array<boolean>(9).fill(false);
    out[idxPressed] = true;
    return out;
  });
  public testDataResponse$ = interval(30, null).withLatestFrom(this.inputState$, (n, panels) => {
    return panels.map((pressed) => mockSensorValue(pressed ? 235 : 0));
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
