import cn from "classnames";
import { Button, Menu, Popover } from "@mantine/core";
import { StagePanel } from "./panel";
import { timez } from "./util";
import { useTestData, useInputState, useConfig } from "./hooks";
import styles from "./stage.module.css";
import { PanelMeters } from "../common/panel-meters";
import type { StageLike } from "../../sdk/interface";
import { SensorTestMode } from "../../sdk";
import {
  IconArrowBigDown,
  IconArrowBigDownLines,
  IconArrowNarrowDownDashed,
  IconEraser,
  IconMenu2,
  IconPlayerEject,
  IconScale,
  IconSend,
  IconSquare,
  IconSquareCheckFilled,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { applySensitivityPreset, type PresetName } from "../../sdk/presets";

type Props = { stage: StageLike | undefined; onClose(): void } | { stage: undefined; onClose?: undefined };

export function StageLayout({ stage, onClose }: Props) {
  const testData = useTestData(stage, SensorTestMode.UncalibratedValues);
  const inputState = useInputState(stage);
  const config = useConfig(stage);

  let panels = timez(9, (idx) => (
    <StagePanel
      key={idx}
      type={config?.flags.PlatformFlags_FSR ? "fsr" : "loadcell"}
      disabled={config?.enabledSensors[idx].every((enabled) => !enabled)}
      active={inputState?.[idx]}
      index={idx}
      testData={testData?.[idx]}
    />
  ));

  if (stage) {
    panels = panels.map((p, idx) => {
      return (
        <Popover
          // biome-ignore lint/suspicious/noArrayIndexKey: there is no better key than the index here
          key={idx}
          withArrow
          arrowSize={20}
          shadow="xl"
          position="right-start"
          // offset={{ crossAxis: -10, mainAxis: 17 }}
          arrowOffset={75}
        >
          <Popover.Target>{p}</Popover.Target>
          <Popover.Dropdown>
            <PanelMeters stage={stage} panelIdx={idx} />
          </Popover.Dropdown>
        </Popover>
      );
    });
  }

  return (
    <div className={cn(styles.pad, { disabled: !stage })}>
      {stage && <StageMenu stage={stage} onClose={onClose} />}
      {panels}
    </div>
  );
}

function useTestMode(stage: StageLike) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (enabled) {
      return stage.engagePanelTestMode$.subscribe();
    }
  }, [enabled, stage]);
  return [enabled, setEnabled] as const;
}

function StageMenu({ stage, onClose }: { stage: StageLike; onClose(): void }) {
  const [, startTransition] = useTransition();
  const [testModeEnabled, setTestMode] = useTestMode(stage);
  const setPreset = useCallback(
    (preset: PresetName) => {
      return () => {
        if (!stage) return;
        startTransition(() => applySensitivityPreset(stage, preset));
      };
    },
    [stage],
  );
  return (
    <Menu>
      <Menu.Target>
        <Button pos="absolute" top={18} left={"44%"} p="xs">
          <IconMenu2 />
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Apply Sensitivty Preset</Menu.Label>
        <Menu.Item leftSection={<IconArrowBigDownLines size={18} />} onClick={setPreset("low")}>
          Low
        </Menu.Item>
        <Menu.Item leftSection={<IconArrowBigDown size={18} />} onClick={setPreset("normal")}>
          Normal
        </Menu.Item>
        <Menu.Item leftSection={<IconArrowNarrowDownDashed size={18} />} onClick={setPreset("high")}>
          High
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          rightSection={testModeEnabled ? <IconSquareCheckFilled size={18} /> : <IconSquare size={18} />}
          onClick={() => setTestMode((p) => !p)}
        >
          Show pressure with LEDs
        </Menu.Item>
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={<IconSend size={18} />}>Send Command</Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown>
            <Menu.Item
              leftSection={<IconScale size={18} />}
              onClick={() => startTransition(() => stage.forceRecalibrate())}
            >
              Calibrate Sensors
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<IconEraser size={18} />}
              onClick={() => startTransition(() => stage.factoryReset())}
            >
              Factory Reset
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
        <Menu.Item color="orange" leftSection={<IconPlayerEject size={18} />} onClick={onClose}>
          Close
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
