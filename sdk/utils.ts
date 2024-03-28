import { MAX_PACKET_SIZE } from "./packet.js";

/**
 * Pad incomming packet to `MAX_PACKET_SIZE` and convert to Uint8Array as a
 * final step before being sent to the device.
 */
export function pad_packet(packet: Array<number>, padding = 0): Uint8Array {
  return Uint8Array.from({ length: MAX_PACKET_SIZE }, (_, i) => packet[i] ?? 0);
}
