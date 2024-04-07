import { MAX_PACKET_SIZE } from "./packet.ts";

/**
 * Pad incomming packet to `MAX_PACKET_SIZE` and convert to Uint8Array as a
 * final step before being sent to the device.
 */
export function pad_packet(packet: Array<number>, padding = 0): Uint8Array {
  return Uint8Array.from({ length: MAX_PACKET_SIZE }, (_, i) => packet[i] ?? 0);
}

export class RGB {
  public r: number;
  public g: number;
  public b: number;

  constructor(r: number, g: number, b: number) {
    this.r = this.clamp(r);
    this.g = this.clamp(g);
    this.b = this.clamp(b);
  }

  private clamp(value: number) {
    return value < 0 ? 0 : value > 255 ? 255 : value;
  }

  toArray(): Array<number> {
    return [this.r, this.g, this.b];
  }
}
