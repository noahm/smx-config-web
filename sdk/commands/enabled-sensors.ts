import { StructBuffer, bits, createDataView, uint8_t } from "@nmann/struct-buffer";

type Decoded<Struct extends { decode(...args: unknown[]): unknown }> = ReturnType<Struct["decode"]>;

interface EnabeledSensorSet {
  up: boolean;
  right: boolean;
  down: boolean;
  left: boolean;
}

/** sensors enabled, with two panels packed into a single byte */
export const twoEnabledSensors_t = bits(uint8_t, {
  up0: 7,
  right0: 6,
  down0: 5,
  left0: 4,
  up1: 3,
  right1: 2,
  down1: 1,
  left1: 0,
});

/** splits packed */
function splitTwoSensors(decoded: Decoded<typeof twoEnabledSensors_t>): EnabeledSensorSet[] {
  return [
    {
      up: decoded.up0,
      right: decoded.right0,
      down: decoded.down0,
      left: decoded.left0,
    },
    {
      up: decoded.up1,
      right: decoded.right1,
      down: decoded.down1,
      left: decoded.left1,
    },
  ];
}

function joinTwoSensors(
  sensorA: EnabeledSensorSet,
  sensorB: EnabeledSensorSet = {
    up: false,
    right: false,
    down: false,
    left: false,
  },
): Decoded<typeof twoEnabledSensors_t> {
  return {
    up0: sensorA.up,
    right0: sensorA.right,
    down0: sensorA.down,
    left0: sensorA.left,
    up1: sensorB.up,
    right1: sensorB.right,
    down1: sensorB.down,
    left1: sensorB.left,
  };
}

export class EnabledSensors extends StructBuffer<
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  {},
  EnabeledSensorSet[],
  EnabeledSensorSet[]
> {
  constructor() {
    super("DisabledSensors", {});
  }

  override get count() {
    return 5; // always 5 items (5 twoDisabledSensors_t)
  }

  override get isList() {
    return true;
  }

  override decode(view: DataView, littleEndian = false, offset = 0): EnabeledSensorSet[] {
    const decoded = twoEnabledSensors_t[this.count]
      .decode(view, littleEndian, offset)
      .flatMap<EnabeledSensorSet>(splitTwoSensors);
    // decoded now has a trailing entry for the 4 bits of padding on the end of data
    // so we slice to just the desired data
    return decoded.slice(0, 9);
  }

  override encode(obj: EnabeledSensorSet[], littleEndian = false, offset = 0, view?: DataView): DataView {
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
