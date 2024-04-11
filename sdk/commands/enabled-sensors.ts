import { StructBuffer, bits, createDataView, uint8_t } from "@nmann/struct-buffer";
import { SENSOR_COUNT, FsrSensor } from "../api";

type Decoded<Struct extends { decode(...args: unknown[]): unknown }> = ReturnType<Struct["decode"]>;

/** sensors enabled, with two panels packed into a single byte */
export const twoEnabledSensors_t = bits(uint8_t, {
  left0: 7,
  right0: 6,
  up0: 5,
  down0: 4,
  left1: 3,
  right1: 2,
  up1: 1,
  down1: 0,
});

/** splits packed */
function splitTwoSensors(decoded: Decoded<typeof twoEnabledSensors_t>): Array<Array<boolean>> {
  return [
    [decoded.left0, decoded.right0, decoded.up0, decoded.down0],
    [decoded.left1, decoded.right1, decoded.up1, decoded.down1],
  ];
}

function joinTwoSensors(
  sensorA: Array<boolean>,
  sensorB: Array<boolean> = Array(SENSOR_COUNT).fill(false),
): Decoded<typeof twoEnabledSensors_t> {
  return {
    left0: sensorA[FsrSensor.Left],
    right0: sensorA[FsrSensor.Right],
    up0: sensorA[FsrSensor.Up],
    down0: sensorA[FsrSensor.Down],
    left1: sensorB[FsrSensor.Left],
    right1: sensorB[FsrSensor.Right],
    up1: sensorB[FsrSensor.Up],
    down1: sensorB[FsrSensor.Down],
  };
}

export class EnabledSensors extends StructBuffer<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  {},
  Array<Array<boolean>>,
  Array<Array<boolean>>
> {
  constructor() {
    super("EnabledSensors", {});
  }

  override get count() {
    return 5; // always 5 items (5 twoDisabledSensors_t)
  }

  override get isList() {
    return true;
  }

  override get byteLength() {
    return 5;
  }

  override decode(view: DataView, littleEndian = false, offset = 0): Array<Array<boolean>> {
    const decoded = twoEnabledSensors_t[this.count]
      .decode(view, littleEndian, offset)
      .flatMap<Array<boolean>>(splitTwoSensors);

    // decoded now has a trailing entry for the 4 bits of padding on the end of data
    // so we slice to just the desired data
    return decoded.slice(0, 9);
  }

  override encode(obj: Array<Array<boolean>>, littleEndian = false, offset = 0, view?: DataView): DataView {
    if (obj.length !== 9) {
      throw new TypeError("DisabledSensors only encodes sets of 9");
    }
    const v = createDataView(this.count, view);
    const joined: Array<Decoded<typeof twoEnabledSensors_t>> = [];
    for (let i = 0; i < this.count; i++) {
      const aIdx = i * 2;
      const bIdx = aIdx + 1;
      joined.push(joinTwoSensors(obj[aIdx], bIdx < obj.length ? obj[bIdx] : undefined));
    }
    twoEnabledSensors_t[this.count].encode(joined, littleEndian, offset, v);

    return v;
  }
}
