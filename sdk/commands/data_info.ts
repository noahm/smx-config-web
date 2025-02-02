import { StructBuffer, char, uint8_t, uint16_t } from "@nmann/struct-buffer";

const data_info_packet_t = new StructBuffer("data_info_packet_t", {
  /** Always 'I' */
  cmd: char,
  // Not Used
  packet_size: uint8_t,
  // '0' for P1, '1' for P2 (Note these are the characters '0' and '1', not the numbers 0 and 1)
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
  serial = "";
  firmware_version = 0;
  player = 0;

  constructor(data: Uint8Array) {
    console.debug("DEVICEINFO RAW DATA: ", data.toString());
    this.#decode(data);
  }

  #decode(data: Uint8Array) {
    const info_packet = data_info_packet_t.decode(data, true);

    this.player = Number.parseInt(String.fromCharCode(info_packet.player)) + 1;
    this.serial = info_packet.serial.map((x) => `00${x.toString(16).toUpperCase()}`.slice(-2)).join("");
    this.firmware_version = info_packet.firmware_version;
  }
}
