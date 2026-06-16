import { bits, createDataView, makeDataView, uint8_t } from "@nmann/struct-buffer";
import { SENSOR_COUNT, FsrSensor } from "../api";
import type { LikeBuffer_t, IDecodeOptions, IBufferLike, IEncodeOptions } from "@nmann/struct-buffer/dist/interfaces";
import { TypeDeep } from "@nmann/struct-buffer/dist/base/type-deep";

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
    up0: sensorA[FsrSensor.Top],
    down0: sensorA[FsrSensor.Bottom],
    left1: sensorB[FsrSensor.Left],
    right1: sensorB[FsrSensor.Right],
    up1: sensorB[FsrSensor.Top],
    down1: sensorB[FsrSensor.Bottom],
  };
}

const BYTE_LENGTH = 5;

class Decorator<RawD, RawE, RichD, RichE>
  extends TypeDeep<IBufferLike<RichD[], RichE[]>>
  implements IBufferLike<RichD, RichE>
{
  constructor(
    protected src: IBufferLike<RawD, RawE>,
    protected transformD: (raw: RawD) => RichD,
    protected transformE: (rich: RichE) => RawE,
  ) {
    super();
  }

  get byteLength() {
    return this.src.byteLength * this.length;
  }

  decode(view: LikeBuffer_t, options?: IDecodeOptions | undefined): RichD {
    const littleEndian = options?.littleEndian,
      _view = makeDataView(view);

    let offset = options?.offset ?? 0;

    return this.resultEach([], () => {
      const raw = this.src.decode(_view, { littleEndian, offset });
      offset += this.src.byteLength;
      return this.transformD(raw);
    });
  }

  encode(obj: RichE, options?: IEncodeOptions): DataView {
    let view = createDataView(this.byteLength, options?.view),
      offset = options?.offset ?? 0;
    const postTransformed = this.deepTransform(obj, this.deeps.length);
    this.each(postTransformed, (raw) => {
      console.log(raw);
      view = this.src.encode(raw, { view, offset, littleEndian: options?.littleEndian });
      offset += this.src.byteLength;
    });
    return view;
  }
  deepTransform(objList: RichE, depth: number): unknown {
    if (!depth) return this.transformE(objList);
    return (objList as RichE[]).map((obj) => this.deepTransform(obj, depth - 1));
  }
}

export const enabledSensors_t = new Decorator(
  twoEnabledSensors_t[5],
  // decoding is just a matter of splitting each byte into
  // each panel's group of 4 sensors, and then slicing off
  // the non-existent tenth panel's zeros
  (raw) => raw.flatMap(splitTwoSensors).slice(0, 9),
  (values: boolean[][]) => {
    if (values.length !== 9) {
      throw new TypeError(`DisabledSensors only encodes sets of 9, given ${values.length}`);
    }
    const joined: Array<Decoded<typeof twoEnabledSensors_t>> = [];
    for (let i = 0; i < BYTE_LENGTH; i++) {
      const aIdx = i * 2;
      const bIdx = aIdx + 1;
      joined.push(joinTwoSensors(values[aIdx], bIdx < values.length ? values[bIdx] : undefined));
    }
    return joined;
  },
);
