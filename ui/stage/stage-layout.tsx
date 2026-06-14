import cn from "classnames";
import { ActionIcon, Button, Group, Menu, Modal, Popover, Stack, TextInput } from "@mantine/core";
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
  IconBookmark,
  IconDeviceFloppy,
  IconEraser,
  IconList,
  IconMenu2,
  IconScale,
  IconSend,
  IconSquare,
  IconSquareCheckFilled,
  IconSquareX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { applySensitivityPreset, type PresetName } from "../../sdk/presets";
import { useCustomPresets } from "./use-custom-presets";
import { CustomPresetsModal } from "./custom-presets-modal";

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
      enabledSensors={config?.enabledSensors[idx]}
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
          <Popover.Dropdown>{config && <PanelMeters stage={stage} panelIdx={idx} config={config} />}</Popover.Dropdown>
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
  const { presets, save, apply } = useCustomPresets();
  const [saveOpen, setSaveOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
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
    <>
      <Menu>
        <Menu.Target>
          <ActionIcon pos="absolute" top={20} left="45%" p="md">
            <IconMenu2 />
          </ActionIcon>
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
          <Menu.Label>Custom Presets</Menu.Label>
          <Menu.Item leftSection={<IconDeviceFloppy size={18} />} onClick={() => setSaveOpen(true)}>
            Save current as preset…
          </Menu.Item>
          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item leftSection={<IconBookmark size={18} />}>Apply preset</Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              {presets.length === 0 ? (
                <Menu.Item disabled>No saved presets</Menu.Item>
              ) : (
                presets.map((preset) => (
                  <Menu.Item key={preset.id} onClick={() => startTransition(() => apply(stage, preset))}>
                    {preset.name}
                  </Menu.Item>
                ))
              )}
            </Menu.Sub.Dropdown>
          </Menu.Sub>
          <Menu.Item leftSection={<IconList size={18} />} onClick={() => setManageOpen(true)}>
            Manage presets…
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
          <Menu.Item color="orange" leftSection={<IconSquareX size={18} />} onClick={onClose}>
            Remove
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <SavePresetModal
        opened={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={(name) => {
          save(stage, name);
          setSaveOpen(false);
        }}
      />
      <CustomPresetsModal stage={stage} opened={manageOpen} onClose={() => setManageOpen(false)} />
    </>
  );
}

function SavePresetModal({
  opened,
  onClose,
  onSave,
}: {
  opened: boolean;
  onClose(): void;
  onSave(name: string): void;
}) {
  const [name, setName] = useState("");
  const submit = () => {
    if (!name.trim()) return;
    onSave(name);
    setName("");
  };
  return (
    <Modal opened={opened} onClose={onClose} title={<strong>Save preset</strong>} centered>
      <Stack gap="md">
        <TextInput
          label="Preset name"
          placeholder="e.g. Tournament settings"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          data-autofocus
          autoFocus
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
