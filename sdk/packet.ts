import { pad_packet } from "./utils.ts";

/**
 * Gets the next report from the device matching a given reportId,
 * wrapped in a promise for convenience. Times out after 500ms looking
 * for a response.
 */
export function nextReportCommand(dev: HIDDevice): Promise<DataView> {
  return new Promise((resolve, reject) => {
    // set a 500ms timeout
    // TODO: Should this be longer?
    const timeoutHandle = window.setTimeout(() => {
      // stop listening
      dev.removeEventListener("inputreport", handleReport);
      reject("timeout");
    }, 500);

    function handleReport(event: HIDInputReportEvent) {
      // TODO other more specific filtering here?
      if (event.reportId !== HID_REPORT_INPUT) {
        return; // not the report we're looking for
      }
      // stop listening
      dev.removeEventListener("inputreport", handleReport);
      // stop timeout
      clearTimeout(timeoutHandle);
      // return data to caller
      resolve(event.data);
    }

    dev.addEventListener("inputreport", handleReport);
  });
}

/*
StepManiaX Stages expect packets that are exactly 64-bytes in length.

The HID framework we're using takes in the Report ID as a parameter rater than
it being included in the data, and then prepends it to the data when it get's
sent.

Thus, we're going to set the packet length to 63, since the Report ID will
be added to the data going out, making it 64 bits.
*/
export const MAX_PACKET_SIZE = 63;
const PACKET_PREAMBLE_SIZE = 2;

// USB Communication Packet Flags
export const PACKET_FLAG_START_OF_COMMAND = 0x04;
export const PACKET_FLAG_END_OF_COMMAND = 0x01;
export const PACKET_FLAG_HOST_CMD_FINISHED = 0x02;
export const PACKET_FLAG_DEVICE_INFO = 0x80;

// HID Report Codes
export const HID_REPORT_INPUT_STATE = 0x03;
export const HID_REPORT_OUTPUT = 0x05;
export const HID_REPORT_INPUT = 0x06;

// Acknowledge Code
const ACK_COMMAND = 0x7;

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

export async function send_data(dev: HIDDevice, data: Array<number>, debug = false) {
  // Split data into packets
  const packets = make_packets(data);

  // Send each packet
  for (const packet of packets) {
    await dev.sendReport(HID_REPORT_OUTPUT, packet);
  }
}

export async function process_packets(dev: HIDDevice, responseType: number, debug = false): Promise<Array<number>> {
  let current_packet: Array<number> = [];
  let seenFirstPacket = false;
  let readingPacket = false;

  while (true) {
    const data = await nextReportCommand(dev);

    // Just continue if there's no data (I feel like this doesn't work here without a timeout)
    if (data.byteLength === 0) {
      continue;
    }

    // Create the data buffer here so we can check for start flags and ACKs
    const data_buffer = new Uint8Array(data.buffer);

    // If we see an ACK Command just ignore it and restart
    if (data_buffer[0] === ACK_COMMAND) {
      readingPacket = false;
      seenFirstPacket = false;
      current_packet = [];
      continue;
    }

    // Wait until we see a packet start flag so we don't grab a
    // packet half way through
    if (!readingPacket) {
      if (data_buffer[0] & PACKET_FLAG_START_OF_COMMAND) {
        readingPacket = true;
      } else {
        continue;
      }
    }

    if (handle_packet(data_buffer, current_packet)) {
      break;
    }

    if (!seenFirstPacket) {
      if (current_packet[0] === responseType) {
        seenFirstPacket = true;
      } else {
        // we just picked up some other data that has nothing to do with
        // what we're waiting on, so just discard it and keep waiting
        current_packet = [];
      }
    }

    // If we've gotten here and our current packet is empty, that means
    // we flushed it at some point. Restart
    if (current_packet.length === 0) {
      readingPacket = false;
    }
  }

  // TODO: Handle Acknowledgements

  return current_packet;
}

function handle_packet(dataIn: Uint8Array, currentPacketIn: Array<number>): boolean {
  let data = dataIn;
  let currentPacket = currentPacketIn;

  // Return if packet is empty, or it's an HID Serial packet (< 3 elements)
  if (data.length <= 3) {
    return false;
  }

  const cmd = data[0];
  const byte_len = data[1];

  if ((cmd & PACKET_FLAG_DEVICE_INFO) === PACKET_FLAG_DEVICE_INFO) {
    // This is a response to RequestDeviceInfo. Since any application can send this,
    // we ignore the packet if we didn't request it, since it might be requested
    // for a different program.
    // TODO: Handle this? Not sure there's anything to handle here tbh
  }

  // TODO: Make some consts for these 2's everywhere
  if (2 + byte_len > data.length) {
    // TODO: Can this even happen???
    console.log("Communication Error: Oversized Packet (ignored)");
    return false;
  }

  // The data exists after the first 2 bytes
  data = data.slice(2, 2 + byte_len);

  if ((cmd & PACKET_FLAG_START_OF_COMMAND) === PACKET_FLAG_START_OF_COMMAND && currentPacket.length > 0) {
    /**
     * When we get a start packet, the read buffer should already be empty. If it isn't,
     * we got a command that didn't end with an END_OF_COMMAND packet and something is wrong.
     * This shouldn't happen, so warn about it and recover by clearing the junk in the buffer.
     * TODO: Again, does this actually happen???!?
     */
    console.log(
      "Got PACKET_FLAG_OF_START_COMMAND, but we had ${current_packet.length} bytes in the buffer. Dropping it and continuing.",
    );
    currentPacket = [];
  }

  currentPacket.push(...data);

  // Note that if PACKET_FLAG_HOST_CMD_FINISHED is set, PACKET_FLAG_END_OF_COMMAND will also be set
  if ((cmd & PACKET_FLAG_HOST_CMD_FINISHED) === PACKET_FLAG_HOST_CMD_FINISHED) {
    // This tells us that a command we wrote to the devide has finished executing, and it's safe to start writing another.
    // console.log("Packet Complete");
  }

  if ((cmd & PACKET_FLAG_END_OF_COMMAND) === PACKET_FLAG_END_OF_COMMAND) {
    return true;
  }

  return false;
}
