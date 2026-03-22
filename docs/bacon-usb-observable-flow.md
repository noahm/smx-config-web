# Bacon.js Observable Data Flow: USB Device Communication

This document explains how [Bacon.js](https://baconjs.github.io/) observables manage
the bidirectional data flow between the web UI and a USB (WebHID) dance pad device.

## What is an Observable?

Think of an observable as a **conveyor belt for data**. Values arrive over time (like
USB packets), and you can attach workers along the belt to filter, transform, or react
to each item. You set up the belt once, and it handles data automatically as it flows.

Key Bacon.js concepts used here:
- **EventStream** - a conveyor belt of discrete events (e.g. each USB packet)
- **Bus** - a special stream you can manually push values into (like a hopper)
- **filter()** - only lets matching items through
- **map()** - transforms each item into something else
- **withStateMachine()** - remembers previous items to assemble multi-part messages
- **merge()** - combines two belts into one
- **zip()** - pairs items from two belts 1-to-1 (used for send/ack synchronization)
- **throttle(ms)** - limits how often items pass through
- **onValue(fn)** - the end of the belt; runs your function for each item

---

## High-Level Architecture

```
+---------------------+          +---------------------------+          +------------------+
|                     |  USB IN  |                           |  React   |                  |
|   SMX Dance Pad     | -------> |   Bacon.js Observable     | -------> |   UI Components  |
|   (WebHID Device)   |          |       Pipelines           |          |   (React Hooks)  |
|                     | <------- |                           | <------- |                  |
|                     |  USB OUT |                           |  Push    |                  |
+---------------------+          +---------------------------+          +------------------+
```

---

## Data Flowing IN (Device to UI)

When the device sends data, it flows through this pipeline:

```
  USB Device sends HID report
         |
         v
  +----------------------------------------------+
  | rawReport$                                    |
  | Bacon.fromEvent(dev, "inputreport")           |
  | Listens to ALL incoming USB HID events        |
  +----------------------------------------------+
         |                           |
         | reportId = 0x03           | reportId = 0x06
         | (Panel Press/Release)     | (Command Responses)
         v                           v
  +-----------------------+   +-------------------------------------------+
  | inputState$           |   | report$                                   |
  | filter by report ID   |   | filter by report ID                       |
  | map: decode binary    |   | filter out empty packets                  |
  |   -> boolean[9]       |   | withStateMachine(collatePackets)          |
  | (one bool per panel)  |   | reassembles multi-packet responses        |
  +-----------------------+   +-------------------------------------------+
         |                      |               |                |
         |                      | type="data"   | type="ack"     | type="host_cmd_finished"
         v                      v               v                v
  +--------------+   +----------------+  +--------------+  +-------------------+
  | useInputState|   | otherReports$  |  | ackReports$  |  | finishedCommand$  |
  | React Hook   |   | map: extract   |  | used to      |  | signals "ok to    |
  | -> panel     |   |   payload      |  | resolve      |  |  send next cmd"   |
  |   highlight  |   | bytes          |  | Promises     |  |                   |
  +--------------+   +----------------+  +--------------+  +-------------------+
                        |       |       |
         +--------------+       |       +----------------+
         |                      |                        |
         v                      v                        v
  +-----------------+  +------------------+  +------------------------+
  | deviceInfo$     |  | configResponse$  |  | sensorTestReports$     |
  | filter: "I" cmd |  | filter: config   |  | filter: test data cmd  |
  | map: decode     |  |   command byte   |  | map: decode sensor     |
  |   device info   |  | map: decode      |  |   readings (9 panels   |
  |                 |  |   config struct  |  |   x 4 sensors each)    |
  +-----------------+  +------------------+  +------------------------+
                              |                        |
                              v                        v
                       +--------------+   +---------------------------+
                       | useConfig    |   | useTestData React Hook    |
                       | React Hook   |   | subscribes to one of:     |
                       | -> settings  |   |  - rawSensorData$         |
                       |   UI         |   |  - calibratedSensorData$  |
                       +--------------+   |  - sensorTareData$        |
                                          | -> sensor visualization   |
                                          +---------------------------+
```

### How Multi-Packet Reassembly Works

USB HID has a max packet size, so large responses arrive in pieces.
The `withStateMachine(collatePackets)` step remembers previous chunks:

```
  Packet 1 arrives: [partial data...]     -> state machine buffers it
  Packet 2 arrives: [more data...]        -> state machine appends
  Packet 3 arrives: [end marker]          -> state machine emits complete message
```

---

## Data Flowing OUT (UI to Device)

When the UI sends a command, it flows through this pipeline:

```
  UI Action (e.g. "Write Config", "Recalibrate", "Get Sensor Data")
         |
         v
  +-----------------------------------------------+
  | output$  (Bacon.Bus)                           |
  | Any code can push commands into this bus:      |
  |   this.events.output$.push(Uint8Array.of(...)) |
  +-----------------------------------------------+
         |                             |
         | Config write commands       | All other commands
         | (WRITE_CONFIG,              | (GET_INFO, GET_CONFIG,
         |  WRITE_CONFIG_V5)           |  RECALIBRATE, etc.)
         v                             v
  +---------------------+    +---------------------+
  | configOutput$       |    | otherOutput$        |
  | throttle(1000)      |    | passed through      |
  | max 1 write/second  |    | immediately         |
  | to protect device   |    |                     |
  +---------------------+    +---------------------+
         |                             |
         +----------+  +---------------+
                    |  |
                    v  v
             +-----------------+
             | merge()         |
             | combine into    |
             | single stream   |
             +-----------------+
                    |
                    v
             +-------------------------------+       +-------------------+
             | .zip(okSend$, ...)            | <---- | okSend$           |
             | pairs each command with an    |       | starts with: true |
             | "ok to send" signal           |       | then: each        |
             | (sends one cmd at a time)     |       | host_cmd_finished |
             +-------------------------------+       +-------------------+
                    |
                    v
             +--------------------------+
             | eventsToSend$            |
             | commands ready to send   |
             +--------------------------+
                    |
                    v
             +--------------------------+
             | onValue(send_data)       |
             | actually writes bytes    |
             | to USB via WebHID API    |
             +--------------------------+
                    |
                    v
              USB Device receives command
```

### Why zip() Matters

The `zip()` operator ensures **one command at a time**. It pairs each outgoing
command with an "ok to send" signal from the device. Without this, we could
flood the device with commands faster than it can process them.

```
  Commands waiting:   [cmd1] [cmd2] [cmd3]
  Ok signals:         [true] ...waiting...

  zip produces:       [cmd1] -> sent!
                               device processes...
                               device says "finished"
                      [cmd2] -> sent!
                               device processes...
```

---

## Request/Response Pattern

Many operations follow a push-then-listen pattern:

```
  // 1. Push a command into the output bus
  this.events.output$.push(Uint8Array.of(API_COMMAND.GET_DEVICE_INFO));

  // 2. Wait for the matching response on an input stream
  //    firstToPromise() converts the next stream event into a Promise
  return this.deviceInfo$.firstToPromise();
```

This converts the observable pattern into familiar async/await:

```typescript
  // In practice:
  async init() {
    await this.updateDeviceInfo();   // push GET_INFO cmd, await response
    await this.updateConfig();       // push GET_CONFIG cmd, await response
  }
```

---

## Sensor Test Mode: Lifecycle-Managed Streams

The sensor test feature uses `fromBinder()` to create streams that **automatically
manage their own setup and teardown**:

```
  Component subscribes to rawSensorData$
         |
         v
  fromBinder starts:
    1. Creates interval timer (every 100ms)
    2. Timer pushes GET_SENSOR_TEST_DATA command to output$
    3. Pipes matching responses to subscriber
         |
         v
  Component receives sensor readings at ~10Hz
         |
  Component unmounts (unsubscribes)
         |
         v
  fromBinder cleanup runs automatically:
    1. Cancels interval timer
    2. Stops listening for responses
    -> No more USB traffic for this feature
```

Similarly, `engagePanelTestMode$` keeps the device in test mode only while
something is subscribed, and automatically exits test mode on unsubscribe.

---

## Connecting to React

React hooks in `ui/stage/hooks.ts` bridge observables to component state:

```typescript
  function useInputState(stage) {
    const [panelStates, setPanelStates] = useState(null);

    useEffect(() => {
      // Subscribe: stream values update React state
      // onValue returns an unsubscribe function
      return stage?.inputState$
        .throttle(UI_UPDATE_RATE)
        .onValue(setPanelStates);
      // React calls the unsubscribe on cleanup ^
    }, [stage]);

    return panelStates;
  }
```

The pattern is always the same:
1. **Subscribe** to an observable with `.onValue(setStateFunction)`
2. **Return** the unsubscribe function as the useEffect cleanup
3. React state updates trigger re-renders automatically

---

## Complete Round-Trip Example

**User changes a config setting and clicks Save:**

```
  1. React component calls stage.writeConfig()

  2. writeConfig() encodes the config to bytes
     and pushes to output$ Bus
       output$.push([WRITE_CONFIG, length, ...bytes])

  3. output$ -> configOutput$ (throttled to 1/sec)
          -> merge with otherOutput$
          -> zip with okSend$ (wait for device ready)
          -> eventsToSend$ emits the command

  4. onValue callback sends bytes over USB
       await send_data(dev, bytes)

  5. Device processes config, sends ACK packet

  6. rawReport$ receives HID report
       -> report$ (collatePackets reassembles)
       -> ackReports$ emits { type: "ack" }

  7. writeConfig() was awaiting:
       this.events.ackReports$.firstToPromise()
     Promise resolves!

  8. writeConfig() then requests fresh config back:
       output$.push([GET_CONFIG])

  9. Device responds with current config bytes

  10. rawReport$ -> report$ -> otherReports$
        -> configResponse$ (filter + decode)

  11. useConfig hook's onValue fires
        -> setPanelStates(newConfig)
        -> React re-renders with updated settings
```

---

## Key Files

| File | Role |
|------|------|
| `sdk/smx.ts` | Core observable pipelines (`SMXEvents`) and device API (`SMXStage`) |
| `sdk/state-machines/collate-packets.ts` | Multi-packet reassembly state machine |
| `sdk/packet.ts` | Low-level USB send (`send_data`) |
| `sdk/interface.ts` | `StageLike` interface defining all public observables |
| `sdk/mock.ts` | Mock stage using Bacon operators for UI development |
| `ui/stage/hooks.ts` | React hooks bridging observables to component state |
| `ui/pad-coms.tsx` | WebHID device connection lifecycle |
