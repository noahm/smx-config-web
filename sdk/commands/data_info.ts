import { StructBuffer, char, uint8_t, uint16_t } from "struct-buffer";

const data_info_packet_t = new StructBuffer("data_info_packet_t", {
  // Always 'I'
  cmd: char,
  // Not Used
  packet_size: uint8_t,
  // '0' for P1, '1' for P2 (Note there are the characters '0' and '1', not the numbers 0 and 1)
  player: char,
  // Unused and Unknown
  unused2: char,
  // Serial Number
  serial: uint8_t[16],
  // Firmware Version
  firmware_version: uint16_t,
  // Unused, always '\n'
  unused3: char,
});

export class SMXDeviceInfo {
  serial = new Uint8Array(16);
  firmware_version = 0;
  player = 0;

  constructor(data: Array<number>) {
    this.#decode(data);
  }

  #decode(data: Array<number>) {
    const info_packet = data_info_packet_t.decode(data, true);

    this.player = Number.parseInt(String.fromCharCode(info_packet.player)) + 1;
    this.serial = info_packet.serial.map((x) => x.toString(16).toUpperCase()).join("");
    this.firmware_version = info_packet.firmware_version;
  }
}
