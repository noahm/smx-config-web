import { type Observable, repeatedly, constant, interval, later } from "baconjs";
import type { ConfigShape } from "./commands/config";
import type { StageInfo, StageLike } from "./interface";
import { mockFsrSensorValue, mockLoadCellSensorValue } from "./mocks/test-data";
import { fsrConfig, loadCellConfig } from "./mocks/config";
import { times } from "../ui/stage/util";
import type { SMXPanelTestData } from "./commands/sensor_test";

export class FsrStageMock implements StageLike {
  public inputState$ = repeatedly(1000, [1, 3, 4, 5, 7]).map((idxPressed) => {
    const out = new Array<boolean>(9).fill(false);
    out[idxPressed] = true;
    return out;
  });
  public calibratedSensorData$ = interval(50, null).withLatestFrom(this.inputState$, (_n, panels) => {
    return panels.map((pressed) => mockFsrSensorValue(pressed ? 230 : 0));
  });
  public rawSensorData$ = interval(50, null).withLatestFrom(this.inputState$, (_n, panels) => {
    return panels.map((pressed) => mockFsrSensorValue(pressed ? 235 : 5));
  });
  public sensorTareData$ = interval(30_000, null).map((_n) => {
    return times(9, () => mockFsrSensorValue(4, 2));
  });
  public engagePanelTestMode$ = constant(undefined);
  public configResponse$: Observable<ConfigShape>;
  private _config = structuredClone(fsrConfig);
  public get config() {
    return this._config;
  }
  public info: StageInfo;
  constructor(player: number) {
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
  public async forceRecalibrate(): Promise<void> {
    return later<void>(750, undefined).toPromise();
  }
  public close() {}
}

export class LoadCellStageMock implements StageLike {
  public inputState$ = repeatedly(1000, [1, 3, 4, 5, 7]).map((idxPressed) => {
    const out = new Array<boolean>(9).fill(false);
    out[idxPressed] = true;
    return out;
  });
  public calibratedSensorData$ = interval(50, null).withLatestFrom(this.inputState$, (_n, panels) => {
    return panels.map((pressed) => mockLoadCellSensorValue(pressed ? 60 : 0));
  });
  public rawSensorData$ = interval(50, null).withLatestFrom(this.inputState$, (_n, panels) => {
    return panels.map((pressed) => mockLoadCellSensorValue(pressed ? 75 : 15));
  });
  public sensorTareData$ = interval(30_000, null).map((_n) => {
    return times(9, () => mockLoadCellSensorValue(8, 4));
  });
  public engagePanelTestMode$ = constant(undefined);
  public configResponse$: Observable<ConfigShape>;
  private _config = structuredClone(loadCellConfig);
  public get config() {
    return this._config;
  }
  public info: StageInfo;
  constructor(player: number) {
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
  public async forceRecalibrate(): Promise<void> {
    return later<void>(750, undefined).toPromise();
  }
  public close() {}
}
