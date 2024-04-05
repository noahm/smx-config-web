import * as Bacon from "baconjs";
import type { StateF } from "baconjs/types/withstatemachine";
import {
  PACKET_FLAG_DEVICE_INFO,
  PACKET_FLAG_END_OF_COMMAND,
  PACKET_FLAG_HOST_CMD_FINISHED,
  PACKET_FLAG_START_OF_COMMAND,
} from "./packet";


// TODO: Probably move all this bacon packet stuff to `packet.js`?
interface PacketHandlingState {
  currentPacket: Uint8Array;
}

function hasValue<T>(ev: Bacon.Event<T>): ev is Bacon.Value<T> {
  return ev.hasValue;
}

export type Packet = { type: "host_cmd_finished"; payload: [] } | { type: "data"; payload: Uint8Array };

/**
 * Gets called when a packet is received, returns a tuple of new state and an array of
 */
export const handlePacket: StateF<DataView, PacketHandlingState, Packet> = (state, event) => {
  if (!hasValue(event)) {
    console.log("No Event Value");
    return [state, []];
  }

  let currentPacket = state.currentPacket;
  const data = new Uint8Array(event.value.buffer);

  // console.log("Raw Packet Data: ", data);

  // Return if packet is empty
  if (data.length <= 3){
    console.log("Empty Packet");
     return [state, []];
  }
  const cmd = data[0];
  const byte_len = data[1];

  if (cmd & PACKET_FLAG_DEVICE_INFO) {
    // This is a response to RequestDeviceInfo. Since any application can send this,
    // we ignore the packet if we didn't request it, since it might be requested
    // for a different program.
    // TODO: Handle this? Not sure there's anything to handle here tbh
    console.log("Found Packet Flag Device Info");
  }

  // TODO: Make some consts for these 2's everywhere
  if (2 + byte_len > data.length) {
    // TODO: Can this even happen???
    console.log("Communication Error: Oversized Packet (ignored)");
    return [state, []];
  }

  // The data exists after the first 2 bytes
  const dataBody = data.slice(2, 2 + byte_len);

  if ((cmd & PACKET_FLAG_START_OF_COMMAND) === PACKET_FLAG_START_OF_COMMAND && state.currentPacket.length > 0) {
    /**
     * When we get a start packet, the read buffer should already be empty. If it isn't,
     * we got a command that didn't end with an END_OF_COMMAND packet and something is wrong.
     * This shouldn't happen, so warn about it and recover by clearing the junk in the buffer.
     * TODO: Again, does this actually happen???!?
     */
    console.log(
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
    eventsToPass.push({ type: "host_cmd_finished", payload: [] });
  }

  if ((cmd & PACKET_FLAG_END_OF_COMMAND) === PACKET_FLAG_END_OF_COMMAND) {
    newState = { currentPacket: new Uint8Array(0) };
    eventsToPass.push({ type: "data", payload: nextPacket });
  }

  return [newState, eventsToPass.map((e) => new Bacon.Next(e))];
};