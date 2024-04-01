import { bits, uint16_t } from "@nmann/struct-buffer";

export type EachSensor<T> = {
  up: T;
  right: T;
  down: T;
  left: T;
};

export type PanelName = keyof EachPanel<any>;

export type EachPanel<T> = {
  up_left: T;
  up: T;
  up_right: T;
  left: T;
  center: T;
  right: T;
  down_left: T;
  down: T;
  down_right: T;
};

export const StageInputs = bits(uint16_t, {
  up_left: 0,
  up: 1,
  up_right: 2,
  left: 3,
  center: 4,
  right: 5,
  down_left: 6,
  down: 7,
  down_right: 8,
});
