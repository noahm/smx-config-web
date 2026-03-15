import { type Observable, repeatedly, constant, interval, later } from "baconjs";
import { PanelTestMode } from "./api";
import type { ConfigShape } from "./commands/config";
import type { SMXPanelTestData } from "./commands/sensor_test";
import type { StageInfo, StageLike } from "./interface";
import { mockSensorValue } from "./mocks/test-data";
import { fsrConfig } from "./mocks/config";

export class StageMock implements StageLike {
  public inputState$ = repeatedly(1000, [1, 3, 4, 5, 7]).map((idxPressed) => {
    const out = new Array<boolean>(9).fill(false);
    out[idxPressed] = true;
    return out;
  });
  public calibratedSensorData$ = interval(50, null).withLatestFrom(this.inputState$, (_n, panels) => {
    return panels.map((pressed) => mockSensorValue(pressed ? 230 : 0));
  });
  public rawSensorData$ = interval(50, null).withLatestFrom(this.inputState$, (_n, panels) => {
    return panels.map((pressed) => mockSensorValue(pressed ? 235 : 5));
  });
  public engagePanelTestMode$ = constant(undefined);
  public testDataResponse$ = interval(50, null).withLatestFrom(this.inputState$, (_n, panels) => {
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
    await later(1200, undefined).toPromise();
    return this.config;
  }
  public async factoryReset(): Promise<void> {
    return later<void>(750, undefined).toPromise();
  }
  public async updateTestData(): Promise<SMXPanelTestData[]> {
    await later(200, undefined).toPromise();
    return this.testDataResponse$.firstToPromise();
  }
  public setPanelTestMode(mode: PanelTestMode): void {
    this.panelTestMode = mode;
  }
}
