import * as Bacon from "baconjs";
import type { StateF } from "baconjs/types/withstatemachine";
import { API_COMMAND } from "./api";
import { StageInputs } from "./commands/inputs";
import { SENSOR_TEST_MODE } from "./commands/sensor_test";
import {
  HID_REPORT_INPUT,
  HID_REPORT_INPUT_STATE,
  PACKET_FLAG_DEVICE_INFO,
  PACKET_FLAG_END_OF_COMMAND,
  PACKET_FLAG_HOST_CMD_FINISHED,
  PACKET_FLAG_START_OF_COMMAND,
  process_packets,
  send_data,
} from "./packet";

export async function getDeviceInfo(dev: HIDDevice) {
  await send_data(dev, [API_COMMAND.GET_DEVICE_INFO], true);
  return process_packets(dev, true);
}

export async function getStageConfig(dev: HIDDevice) {
  await send_data(dev, [API_COMMAND.GET_CONFIG_V5], true);
  return process_packets(dev, true);
}

export async function getSensorTestData(dev: HIDDevice) {
  await send_data(dev, [API_COMMAND.GET_SENSOR_TEST_DATA, SENSOR_TEST_MODE.CALIBRATED_VALUES], true);
  return process_packets(dev, true);
}

interface PacketHandlingState {
  currentPacket: Uint8Array;
}

function hasValue<T>(ev: Bacon.Event<T>): ev is Bacon.Value<T> {
  return ev.hasValue;
}

type Packet = { type: "host_cmd_finished" } | { type: "data"; payload: Uint8Array };

/**
 * Gets called when a packet is received, returns a tuple of new state and an array of
 */
const handlePacket: StateF<DataView, PacketHandlingState, Packet> = (state, event) => {
  if (!hasValue(event)) return [state, []];
  let currentPacket = state.currentPacket;
  const data = new Uint8Array(event.value.buffer);
  if (data.length <= 3) return [state, []];
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
    // This tells us that a command we wrote to the devide has finished executing, and it's safe to start writing another.
    console.log("Packet Complete");
    eventsToPass.push({ type: "host_cmd_finished" });
  }

  if ((cmd & PACKET_FLAG_END_OF_COMMAND) === PACKET_FLAG_END_OF_COMMAND) {
    newState = { currentPacket: new Uint8Array(0) };
    eventsToPass.push({ type: "data", payload: nextPacket });
  }

  return [newState, eventsToPass.map((e) => new Bacon.Next(e))];
};

export function SmxStage(device: HIDDevice) {
  const input$ = Bacon.fromEvent<HIDInputReportEvent>(device, "inputreport");
  const inputState$ = input$
    .filter((e) => e.reportId === HID_REPORT_INPUT_STATE)
    .map((e) => StageInputs.decode(e.data, true));
  const otherReports$ = input$
    .filter((e) => e.reportId === HID_REPORT_INPUT)
    .map((e) => e.data)
    .filter((d) => d.byteLength !== 0)
    .withStateMachine({ currentPacket: new Uint8Array() }, handlePacket);

  return {
    device,
    inputState$,
    otherReports$,
  };
}
