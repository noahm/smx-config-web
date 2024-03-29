import { bitFields, uint16_t } from "@nmann/struct-buffer";

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

export const StageInputs = bitFields(uint16_t, {
  up_left: 1,
  up: 1,
  up_right: 1,
  left: 1,
  center: 1,
  right: 1,
  down_left: 1,
  down: 1,
  down_right: 1,
});
