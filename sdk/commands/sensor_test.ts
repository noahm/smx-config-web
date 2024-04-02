import { StructBuffer, bitFields, bits, int16_t, uint16_t, uint8_t } from "@nmann/struct-buffer";
import { API_COMMAND, PANEL_COUNT, SENSOR_COUNT } from "../api";
import type { Decoded } from "./config";

/**
 * Sensor Test Mode values the stages expect
 */
export enum SensorTestMode {
  /** Actual 0 value */
  Off = 0,

  /**
   * Return the raw uncalibrated value of each sensor.
   * 48 represents the char "0"
   **/
  UncalibratedValues = 48,

  /**
   * Return the calibrated value of each sensor
   * 49 represents the char "1"
   **/
  CalibratedValues = 49,

  /**
   * Return the sensor noise value
   * 50 represents the char "2"
   **/
  Noise = 50,

  /**
   * Return the sensor tare value
   * 51 represents the char "3"
   **/
  Tare = 51,
}

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
  sensor_level: Array<number> = Array(SENSOR_COUNT).fill(-1);
  bad_sensor_input: Array<boolean> = Array(SENSOR_COUNT).fill(false);
  dip_switch_value = -1;
  bad_jumper: Array<boolean> = Array(SENSOR_COUNT).fill(false);

  constructor(data: Decoded<typeof detail_data_t>, mode: SensorTestMode) {
    /**
     * Check the header. this is always `false true false` or `0 1 0` to identify it as a response,
     * and not as random steps from the player.
     */
    if (data.sig_bad.sig1 || !data.sig_bad.sig2 || data.sig_bad.sig3) {
      this.have_data_from_panel = false;
      return;
    }

    // Assuming the sig bits are correct, we can confirm here that we have proper data
    this.have_data_from_panel = true;

    /**
     * These bits are true if that sensor's most recent reading is invalid.
     * A sensors reading could be considered invalid if the sensor has been turned
     * off in the config tool.
     */
    this.bad_sensor_input = [
      data.sig_bad.bad_sensor_0,
      data.sig_bad.bad_sensor_1,
      data.sig_bad.bad_sensor_2,
      data.sig_bad.bad_sensor_3,
    ];

    // This is what the dipswitch is set to for this panel
    this.dip_switch_value = data.dips.dip;

    // These are true if the sensor has the incorrect jumper set
    this.bad_jumper = [
      !!data.dips.bad_sensor_dip_0,
      !!data.dips.bad_sensor_dip_1,
      !!data.dips.bad_sensor_dip_2,
      !!data.dips.bad_sensor_dip_3,
    ];

    /**
     * These are 16-bit signed integers for the sensor values.
     * These are signed as they can be negative, but I imagine them going
     * negative is just kind of noise from the hardware.
     */
    this.sensor_level = data.sensors.map((value) => this.clamp_sensor_value(value, mode));
  }

  private clamp_sensor_value(value: number, mode: SensorTestMode) {
    if (mode === SensorTestMode.Noise) {
      /**
       * In Noise mode, we receive standard deviation values squared.
       * Display the square root, since the panels don't do this for us.
       * This makes the number different than the configured value
       * (square it to convert back), but without this we display a bunch
       * of four and five digit numbers that are too hard to read.
       *
       * TODO: Do we want to round this value or just display decimal values?
       */
      return Math.sqrt(value);
    }

    // TODO: We need a way to pass in if the stage we are getting this data for
    // is using FSRs or not. Defined as `true` for now.
    const isFSR = true;

    // TODO: This may be necessary for defining sensor value vertial bars in the UI
    // const max_value = isFSR ? 250 : 500;

    let clamped_value = value;
    /**
     * Very slightly negative values happen due to noise.
     * The don't indicate a problem, but they're confusing
     * in the UI, so clamp them away.
     */
    if (value < 0 && value >= -10) {
      clamped_value = 0;
    }

    // FSR values are bitshifted right by 2 (effectively a div by 4).
    if (isFSR) {
      clamped_value >>= 2;
    }

    return clamped_value;
  }
}

export class SMXSensorTestData {
  panels: Array<SMXPanelTestData> = [];

  constructor(data: Array<number>) {
    /**
     * The first 3 bytes are the preamble.
     *
     * "y" is a response to our "y" query. This is binary data with the format:
     * yAB......
     * where A (mode) is our original query mode (currently "0", "1", "2", or "3"), and
     * B (size) is the number of 16-Bit Integers that contain all of our panel data.
     *
     * The explanation of how these bits are interlaced and decoded can be found
     * in the README.
     *
     * TODO: Put in readme link here
     */
    const preamble = 3;

    // Expected to be 'y'
    console.assert(data[0] === API_COMMAND.GET_SENSOR_TEST_DATA, `Unknown PanelTestData Response: ${data[0]}`);

    // TODO: We need to somehow know what mode we requested, so we can potentially check
    // here that we got the right response.
    const mode = data[1];
    console.assert(SensorTestMode[mode] !== undefined, `Unknown SensorTestMode: ${mode}`);

    const size = data[2];
    console.assert(size === 80, `Unknown PanelTestData Size: ${size}`);

    /**
     * Convert the data from 8-Bit Little Endian Bytes to 16-Bit Integers
     */
    const sensor_data_t = new StructBuffer("sensor_data_t", { data: uint16_t[size] });
    const decoded_data = sensor_data_t.decode(data.slice(preamble), true);

    // Cycle through each panel and grab the data
    for (let panel = 0; panel < PANEL_COUNT; panel++) {
      let idx = 0;
      const out_bytes: Array<number> = [];

      /**
       * Read each byte in our decoded_data.
       * The length here is the size from above (in bits) div by 8 to give bytes.
       */
      for (const _ of Array.from({ length: size / 8 })) {
        let result = 0;

        // Read each bit in each 8-bit byte
        for (let bit = 0; bit < 8; bit++, idx++) {
          const new_bit = decoded_data.data[idx] & (1 << panel);
          result |= new_bit << bit;
        }

        // We need to shift the result by the panel to move it back to fit within an 8-bit byte
        out_bytes.push(result >> panel);
      }

      // Generate an SMXPanelTestData object for each panel
      this.panels.push(new SMXPanelTestData(detail_data_t.decode(out_bytes, true), mode));
    }
  }
}
