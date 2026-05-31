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

```mermaid
graph LR
    A["SMX Dance Pad\n(WebHID Device)"] -- "USB IN\nHID Reports" --> B["Bacon.js Observable\nPipelines"]
    B -- "React Hooks\n.onValue(setState)" --> C["UI Components\n(React)"]
    C -- "Push commands\noutput$.push(...)" --> B
    B -- "USB OUT\nsend_data()" --> A
```

---

## Data Flowing IN (Device to UI)

When the device sends data, it flows through this pipeline:

```mermaid
graph TD
    USB["USB Device sends HID report"] --> raw["<b>rawReport$</b>\nBacon.fromEvent(dev, 'inputreport')\nListens to ALL incoming USB HID events"]

    raw -- "reportId = 0x03\n(Panel Press/Release)" --> input["<b>inputState$</b>\nfilter by report ID\nmap: decode binary → boolean[9]\n(one bool per panel)"]
    raw -- "reportId = 0x06\n(Command Responses)" --> report["<b>report$</b>\nfilter by report ID\nfilter out empty packets\nwithStateMachine(collatePackets)\nreassembles multi-packet responses"]

    input --> useInput["<b>useInputState</b>\nReact Hook → panel highlight"]

    report -- "type = data" --> other["<b>otherReports$</b>\nmap: extract payload bytes"]
    report -- "type = ack" --> ack["<b>ackReports$</b>\nused to resolve Promises"]
    report -- "type = host_cmd_finished" --> finished["<b>finishedCommand$</b>\nsignals 'ok to send next cmd'"]

    other -- "filter: 'I' cmd\nmap: decode" --> devInfo["<b>deviceInfo$</b>\ndevice info"]
    other -- "filter: config cmd\nmap: decode" --> configResp["<b>configResponse$</b>\nconfig struct"]
    other -- "filter: test data cmd\nmap: decode" --> sensorReports["<b>sensorTestReports$</b>\n9 panels × 4 sensors each"]

    configResp --> useConfig["<b>useConfig</b>\nReact Hook → settings UI"]
    sensorReports --> useTest["<b>useTestData</b>\nReact Hook subscribes to one of:\nrawSensorData$ · calibratedSensorData$ · sensorTareData$\n→ sensor visualization"]
```

### How Multi-Packet Reassembly Works

USB HID has a max packet size, so large responses arrive in pieces.
The `withStateMachine(collatePackets)` step remembers previous chunks:

```mermaid
graph LR
    P1["Packet 1\n[partial data...]"] --> SM["State Machine\n(buffer)"]
    P2["Packet 2\n[more data...]"] --> SM
    P3["Packet 3\n[end marker]"] --> SM
    SM -- "emits complete message" --> OUT["Complete\nResponse"]
```

---

## Data Flowing OUT (UI to Device)

When the UI sends a command, it flows through this pipeline:

```mermaid
graph TD
    UI["UI Action\ne.g. 'Write Config', 'Recalibrate', 'Get Sensor Data'"] --> bus["<b>output$</b> (Bacon.Bus)\nAny code can push commands:\noutput$.push(Uint8Array.of(...))"]

    bus -- "Config write commands\n(WRITE_CONFIG,\nWRITE_CONFIG_V5)" --> configOut["<b>configOutput$</b>\nthrottle(1000)\nmax 1 write/second\nto protect device"]
    bus -- "All other commands\n(GET_INFO, GET_CONFIG,\nRECALIBRATE, etc.)" --> otherOut["<b>otherOutput$</b>\npassed through immediately"]

    configOut --> merged["<b>merge()</b>\ncombine into single stream"]
    otherOut --> merged

    finished["<b>finishedCommand$</b>\n(from inbound pipeline above)"] -. "feeds into" .-> okSend["<b>okSend$</b>\nstartsWith(true)\n.merge(finishedCommand$)"]
    okSend --> zipped
    merged --> zipped["<b>.zip(okSend$)</b>\npairs each command with an\n'ok to send' signal\n(sends one cmd at a time)"]

    zipped --> ready["<b>eventsToSend$</b>\ncommands ready to send"]
    ready --> send["<b>onValue(send_data)</b>\nactually writes bytes\nto USB via WebHID API"]
    send --> device["USB Device receives command"]
```

### Why zip() Matters

The `zip()` operator ensures **one command at a time**. It pairs each outgoing
command with an "ok to send" signal from the device. Without this, we could
flood the device with commands faster than it can process them.

```mermaid
sequenceDiagram
    participant Q as Command Queue
    participant Z as zip()
    participant D as USB Device

    Note over Z: okSend$ starts with true
    Q->>Z: cmd1
    Z->>D: cmd1 sent
    Note over D: processing...
    D->>Z: "host_cmd_finished"
    Q->>Z: cmd2
    Z->>D: cmd2 sent
    Note over D: processing...
    D->>Z: "host_cmd_finished"
    Q->>Z: cmd3
    Z->>D: cmd3 sent
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

```mermaid
graph TD
    subgraph "Subscribe (component mounts)"
        A["Component subscribes\nto rawSensorData$"] --> B["fromBinder starts"]
        B --> C["Creates interval timer\n(every 100ms)"]
        B --> D["Listens for matching\nresponse packets"]
        C -- "each tick" --> E["Pushes GET_SENSOR_TEST_DATA\ncommand to output$"]
        D --> F["Component receives\nsensor readings at ~10Hz"]
    end

    F ~~~ G

    subgraph "Unsubscribe (component unmounts)"
        G["Component unmounts\n(unsubscribes)"] --> H["fromBinder cleanup\nruns automatically"]
        H --> I["Cancels interval timer"]
        H --> J["Stops listening\nfor responses"]
        I --> K["No more USB traffic\nfor this feature"]
        J --> K
    end
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

```mermaid
sequenceDiagram
    participant UI as React Component
    participant Stage as SMXStage
    participant Bus as output$ Bus
    participant Pipe as Observable Pipeline
    participant Dev as USB Device

    UI->>Stage: writeConfig()
    Stage->>Bus: push([WRITE_CONFIG, length, ...bytes])
    Note over Bus,Pipe: configOutput$ throttles to 1/sec<br/>merge → zip(okSend$)
    Pipe->>Dev: send_data(dev, bytes)

    Dev->>Pipe: ACK packet (HID report)
    Note over Pipe: rawReport$ → report$<br/>(collatePackets reassembles)<br/>→ ackReports$ emits
    Pipe->>Stage: ackReports$.firstToPromise() resolves

    Stage->>Bus: push([GET_CONFIG])
    Pipe->>Dev: send_data(dev, bytes)
    Dev->>Pipe: Config response bytes
    Note over Pipe: rawReport$ → report$<br/>→ otherReports$<br/>→ configResponse$ (filter + decode)

    Pipe->>UI: useConfig hook onValue fires
    Note over UI: React re-renders with<br/>updated settings
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
