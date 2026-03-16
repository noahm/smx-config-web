import { SensorTestMode, SMXPanelTestData } from "../commands/sensor_test";

export function mockFsrSensorValue(baselineSensorValue = 0) {
  return new SMXPanelTestData(
    {
      dips: { dip: 0, bad_sensor_dip_0: 0, bad_sensor_dip_1: 0, bad_sensor_dip_2: 0, bad_sensor_dip_3: 0 },
      sensors: [
        Math.round((Math.random() * 5 + baselineSensorValue) << 2),
        Math.round((Math.random() * 5 + baselineSensorValue) << 2),
        Math.round((Math.random() * 5 + baselineSensorValue) << 2),
        Math.round((Math.random() * 5 + baselineSensorValue) << 2),
      ],
      sig_bad: {
        bad_sensor_0: false,
        bad_sensor_1: false,
        bad_sensor_2: false,
        bad_sensor_3: false,
        dummy: false,
        sig1: false,
        sig2: true,
        sig3: false,
      },
    },
    SensorTestMode.Off,
    true,
  );
}

export function mockLoadCellSensorValue(baselineSensorValue = 0) {
  return new SMXPanelTestData(
    {
      dips: { dip: 0, bad_sensor_dip_0: 0, bad_sensor_dip_1: 0, bad_sensor_dip_2: 0, bad_sensor_dip_3: 0 },
      sensors: [
        Math.round(Math.random() * 10 + baselineSensorValue),
        Math.round(Math.random() * 10 + baselineSensorValue),
        Math.round(Math.random() * 10 + baselineSensorValue),
        Math.round(Math.random() * 10 + baselineSensorValue),
      ],
      sig_bad: {
        bad_sensor_0: false,
        bad_sensor_1: false,
        bad_sensor_2: false,
        bad_sensor_3: false,
        dummy: false,
        sig1: false,
        sig2: true,
        sig3: false,
      },
    },
    SensorTestMode.Off,
    false,
  );
}
