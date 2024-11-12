import * as Bacon from "baconjs";
import type { StateF } from "baconjs/types/withstatemachine";
import {
  PACKET_FLAG_DEVICE_INFO,
  PACKET_FLAG_END_OF_COMMAND,
  PACKET_FLAG_HOST_CMD_FINISHED,
  PACKET_FLAG_START_OF_COMMAND,
  PACKET_PREAMBLE_SIZE,
} from "../packet";

const ACK_PACKET = 0x7;

interface PacketHandlingState {
  currentPacket: Uint8Array;
}

export type DataPacket = { type: "data"; payload: Uint8Array };
export type AckPacket = { type: "ack" };
export type Packet = { type: "host_cmd_finished" } | DataPacket | AckPacket;

/**
 * Gets called when a packet is received, returns a tuple of new state and an array of
 */
export const collatePackets: StateF<DataView, PacketHandlingState, Packet> = (state, event) => {
  // TODO: This whole function could maybe just use a bit more comments
  if (!Bacon.hasValue(event)) {
    console.debug("No Event Value");
    return [state, []];
  }

  let currentPacket = state.currentPacket;
  const data = new Uint8Array(event.value.buffer);

  console.debug("INCOMING RAW PACKET: ", data.toString());

  // Return if packet is empty
  if (data.length <= PACKET_PREAMBLE_SIZE) {
    console.debug("Empty Packet");
    return [state, []];
  }
  const cmd = data[0];
  const byte_len = data[1];

  if (cmd & PACKET_FLAG_DEVICE_INFO) {
    // This is a response to RequestDeviceInfo. Since any application can send this,
    // we ignore the packet if we didn't request it, since it might be requested
    // for a different program.
    // TODO: Handle this? Not sure there's anything to handle here tbh
    console.debug("Found Packet Flag Device Info");
  }

  if (PACKET_PREAMBLE_SIZE + byte_len > data.length) {
    // TODO: Can this even happen???
    console.warn("Communication Error: Oversized Packet (ignored)");
    return [state, []];
  }

  // The data exists after the first 2 bytes
  const dataBody = data.slice(PACKET_PREAMBLE_SIZE, PACKET_PREAMBLE_SIZE + byte_len);

  /**
   * If packet starts with `ACK_PACKET`, the `byte_len` is 0, and the whole array is just 0,
   * then this is an ack packet.
   */
  const isAck = (cmd & ACK_PACKET) === ACK_PACKET && byte_len === 0 && dataBody.byteLength === 0;

  if (cmd & PACKET_FLAG_START_OF_COMMAND && state.currentPacket.length > 0) {
    /**
     * When we get a start packet, the read buffer should already be empty. If it isn't,
     * we got a command that didn't end with an END_OF_COMMAND packet and something is wrong.
     * This shouldn't happen, so warn about it and recover by clearing the junk in the buffer.
     * TODO: Again, does this actually happen???!?
     */
    console.warn(
      "Got PACKET_FLAG_OF_START_COMMAND, but we had ${current_packet.length} bytes in the buffer. Dropping it and continuing.",
    );
    currentPacket = new Uint8Array(0);
  }

  // concat the new data onto the current packet
  const nextPacket = new Uint8Array(currentPacket.byteLength + dataBody.byteLength);
  nextPacket.set(currentPacket);
  nextPacket.set(dataBody, currentPacket.byteLength);
  const eventsToPass: Packet[] = [];

  let newState = { currentPacket: nextPacket };

  // Note that if PACKET_FLAG_HOST_CMD_FINISHED is set, PACKET_FLAG_END_OF_COMMAND will also be set
  if ((cmd & PACKET_FLAG_HOST_CMD_FINISHED) === PACKET_FLAG_HOST_CMD_FINISHED) {
    // This tells us that a command we wrote to the device has finished executing, and it's safe to start writing another.
    //console.log("Packet Complete");
    eventsToPass.push({ type: "host_cmd_finished" });
  }

  if ((cmd & PACKET_FLAG_END_OF_COMMAND) === PACKET_FLAG_END_OF_COMMAND) {
    newState = { currentPacket: new Uint8Array(0) };
    if (isAck) {
      eventsToPass.push({ type: "ack" });
    } else {
      eventsToPass.push({ type: "data", payload: nextPacket });
    }
  }

  return [newState, eventsToPass.map((e) => new Bacon.Next(e))];
};
