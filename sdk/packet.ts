import { pad_packet } from "./utils.ts";

/*
StepManiaX Stages expect packets that are exactly 64-bytes in length.

The HID framework we're using takes in the Report ID as a parameter rater than
it being included in the data, and then prepends it to the data when it get's
sent.

Thus, we're going to set the packet length to 63, since the Report ID will
be added to the data going out, making it 64 bits.
*/
export const MAX_PACKET_SIZE = 63;
export const PACKET_PREAMBLE_SIZE = 2;

// USB Communication Packet Flags
export const PACKET_FLAG_START_OF_COMMAND = 0x04;
export const PACKET_FLAG_END_OF_COMMAND = 0x01;
export const PACKET_FLAG_HOST_CMD_FINISHED = 0x02;
export const PACKET_FLAG_DEVICE_INFO = 0x80;

// HID Report Codes
export const HID_REPORT_INPUT_STATE = 0x03;
export const HID_REPORT_OUTPUT = 0x05;
export const HID_REPORT_INPUT = 0x06;

export async function send_data(dev: HIDDevice, data: Array<number>, debug = false) {
  // Split data into packets
  const packets = make_packets(data);

  // Send each packet
  for (const packet of packets) {
    if (debug) {
      console.log("OUTGOING RAW PACKET: ", packet.toString());
    }
    await dev.sendReport(HID_REPORT_OUTPUT, packet);
  }
}

export function make_packets(data: Array<number>): Array<Uint8Array> {
  const packets = [];
  const data_len = data.length;
  let idx = 0;

  while (true) {
    let flags = 0x00;
    const packet_size = Math.min(data_len - idx, MAX_PACKET_SIZE - PACKET_PREAMBLE_SIZE);

    if (idx === 0) {
      // This flag marks that this is the first packet we are sending
      flags |= PACKET_FLAG_START_OF_COMMAND;
    }

    if (idx + packet_size === data_len) {
      // This flag marks that this is the last packet we are sending
      flags |= PACKET_FLAG_END_OF_COMMAND;
    }

    // Packet preamble always contains the flags, and the packet size
    const packet = [flags, packet_size];

    // Add the command data
    packet.push(...data.slice(idx, idx + packet_size));

    if (!(packet[0] === 0x05 && packet[1] === 0x00)) {
      // Pad command to `MAX_PACKET_SIZE` and add to packets array
      // Only if the packet isn't empty
      packets.push(pad_packet(packet));
    }

    // Once we have all packets generated, break out
    idx = idx + packet_size;
    if (idx >= data_len) {
      break;
    }
  }

  return packets;
}
