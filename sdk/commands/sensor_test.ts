import { StructBuffer, bitFields, bits, bool, int16_t, uint16_t, uint8_t } from "@nmann/struct-buffer";
import { API_COMMAND, char2byte } from "../api";
import type { Decoded } from "./config";
import type { EachPanel, EachSensor } from "./inputs";

/**
 * Sensor Test Mode values the stages expect
 */
export const SENSOR_TEST_MODE = {
  /** Actual 0 value */
  OFF: 0,

  /** Return the raw uncalibrated value of each sensor */
  UNCALIBRATED_VALUES: char2byte("0"),

  /** Return the calibrated value of each sensor */
  CALIBRATED_VALUES: char2byte("1"),

  /** Return the sensor noise value */
  NOISE: char2byte("2"),

  /** Return the sensor tare value */
  TARE: char2byte("3"),
};

/**
 * The first byte of the test mode detail data contains
 * 3 signal bits, 4 bits showing if the sensor has a fault,
 * and one dummy bit.
 *
 * Valid test data will always have sig1 = 0, sig2 = 1, and sig3 = 0
 */
const sig_bad_t = bits(uint8_t, {
  sig1: 0,
  sig2: 1,
  sig3: 2,
  bad_sensor_0: 3,
  bad_sensor_1: 4,
  bad_sensor_2: 5,
  bad_sensor_3: 6,
  dummy: 7,
});

/**
 * The last byte of the test mode detail data contains
 * the value of the panels dip switch, as well as 4 bits showing
 * if any sensor has the wrong jumper set.
 *
 * The name `bad_sensor_dip_x` is taken from the source, and feels like
 * kind of a misnomer.
 */
const dips_t = bitFields(uint8_t, {
  dip: 4,
  bad_sensor_dip_0: 1,
  bad_sensor_dip_1: 1,
  bad_sensor_dip_2: 1,
  bad_sensor_dip_3: 1,
});

/**
 * Intermediate test mode detail data.
 * Contains the `sig_bad_t` data as defined above,
 * 4 16-bit signed integers for the actual values of each sensor,
 * and the `dips_t` data as defined above.
 *
 * These values are then used to create the `SMXPanelTestData` for each panel.
 */
const detail_data_t = new StructBuffer("detail_data_t", {
  sig_bad: sig_bad_t,
  sensors: int16_t[4],
  dips: dips_t,
});

/**
 * This class represents the results of an SensorTestData request for a single
 * panel.
 */
export class SMXPanelTestData {
  have_data_from_panel: boolean;
  sensor_level: EachSensor<number> = {
    up: 0,
    right: 0,
    down: 0,
    left: 0,
  };
  bad_sensor_input: EachSensor<boolean> = {
    up: false,
    right: false,
    down: false,
    left: false,
  };
  dip_switch_value = -1;
  bad_jumper: EachSensor<boolean> = {
    up: false,
    right: false,
    down: false,
    left: false,
  };

  constructor(data: Decoded<typeof detail_data_t>) {
    /**
     * Check the header. this is always `false true false` or `0 1 0` to identify it as a response,
     * and not as random steps from the player.
     */
    if (data.sig_bad.sig1 || !data.sig_bad.sig2 || data.sig_bad.sig3) {
      this.have_data_from_panel = false;
      return;
    }

    this.have_data_from_panel = true;

    /**
     * These bits are true if that sensor's most recent reading is invalid.
     * A sensors reading could be considered invalid if the sensor has been turned
     * off in the config tool.
     */
    this.bad_sensor_input = {
      up: data.sig_bad.bad_sensor_0,
      right: data.sig_bad.bad_sensor_1,
      down: data.sig_bad.bad_sensor_2,
      left: data.sig_bad.bad_sensor_3,
    };

    // This is what the dipswitch is set to for this panel
    this.dip_switch_value = data.dips.dip;

    // These are true if the sensor has the incorrect jumper set
    this.bad_jumper = {
      up: !!data.dips.bad_sensor_dip_0,
      right: !!data.dips.bad_sensor_dip_1,
      down: !!data.dips.bad_sensor_dip_2,
      left: !!data.dips.bad_sensor_dip_3,
    };

    /**
     * These are 16-bit signed integers for the sensor values.
     * These are signed as they can be negative, but I imagine them going
     * negative is just kind of noise from the hardware. 
     */
    this.sensor_level = {
      up: data.sensors[0],
      right: data.sensors[1],
      down: data.sensors[2],
      left: data.sensors[3],
    };
  }
}

export class SMXSensorTestData {
  panels: EachPanel<SMXPanelTestData>;

  constructor(data: Array<number>) {
    /**
     * "y" is a response to our "y" query. This is binary data with the format:
     * yAB......
     * where A is our original query mode (currently "0", "1", "2", or "3"), and
     * B is the number of bits from each panel in the response.
     * Each bit is encoded as a 16-bit int, with each int having the response
     * bits from each panel.
     */
    console.assert(data[0] === API_COMMAND.GET_SENSOR_TEST_DATA); // Expected to be 'y'
    // const mode = data[1];  // If we know what command we sent we could confirm we get the right response
    const size = data[2];

    /**
     * Convert the data from 8-Bit Little Endian bytes to 16-Bit Integers
     */
    const sensor_data_t = new StructBuffer("sensor_data_t", {
      data: uint16_t[size],
    });
    const decoded_data = sensor_data_t.decode(data.slice(3), true);
    const panel_count = 9; // TODO: This could be a const somewhere?
    const panel_data = [];

    // Cycle through each panel and grab the data
    // TODO: Document exactly how we're dealing with the bits here and how things are layed out
    for (let panel = 0; panel < panel_count; panel++) {
      let idx = 0;
      const out_bytes: Array<number> = [];

      /**
       * Read each byte in our decoded_data.
       * The length here is the size from above (in bits) div by 8 to give bytes.
       */
      for (const _ of Array.from({ length: size / 8 })) {
        let result = 0;

        // Read each bit in each byte
        for (let bit = 0; bit < 8; bit++, idx++) {
          const new_bit = decoded_data.data[idx] & (1 << panel);
          result |= new_bit << bit;
        }

        // We need to shift the result by the panel to move it back to fit within
        // an 8-bit byte
        out_bytes.push(result >> panel);
      }

      console.log(`Panel ${panel}: ${out_bytes}`);
      panel_data.push(detail_data_t.decode(out_bytes, true));
    }

    const panels = [];
    for (let panel = 0; panel < 9; panel++) {
      panels.push(new SMXPanelTestData(panel_data[panel]));
    }

    this.panels = {
      up_left: panels[0],
      up: panels[1],
      up_right: panels[2],
      left: panels[3],
      center: panels[4],
      right: panels[5],
      down_left: panels[6],
      down: panels[7],
      down_right: panels[8],
    };

    console.log(decoded_data);
    console.log(panel_data);

    console.log(this);
  }
}
