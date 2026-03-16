import type { StageLike } from "../../sdk/interface";
import { useConfig, useTestData } from "./hooks";
import { Fieldset, ScrollArea, Paper, Text, Stack, Group, Divider } from "@mantine/core";
import { sensitivityLevelsForPanel } from "./util";
import { SensorTestMode } from "../../sdk";

const SENSOR_INDICES = [0, 1, 2, 3] as const;

const PANEL_LABELS = ["Up-Left", "Up", "Up-Right", "Left", "Center", "Right", "Down-Left", "Down", "Down-Right"];

function ThresholdDisplay({ lows, highs }: { lows: number[]; highs: number[] }) {
  const uniform = lows.every((v) => v === lows[0]) && highs.every((v) => v === highs[0]);

  if (uniform) {
    return (
      <Group gap={4} wrap="nowrap">
        <Text size="xs" c="dimmed">
          L
        </Text>
        <Text size="xs" ff="monospace">
          {lows[0]}
        </Text>
        <Text size="xs" c="dimmed">
          H
        </Text>
        <Text size="xs" ff="monospace">
          {highs[0]}
        </Text>
      </Group>
    );
  }

  // FSR panels with per-sensor thresholds
  return (
    <Stack gap={2}>
      {SENSOR_INDICES.map((i) => (
        <Group key={i} gap={4} wrap="nowrap">
          <Text size="xs" c="dimmed" w={10}>
            {i}
          </Text>
          <Text size="xs" ff="monospace">
            {lows[i]}–{highs[i]}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}

function TareGrid({ values }: { values: readonly number[] | null }) {
  if (!values) {
    return (
      <Text size="xs" c="dimmed">
        —
      </Text>
    );
  }
  return (
    <Group gap={6} wrap="nowrap">
      {SENSOR_INDICES.map((i) => (
        <Text key={i} size="xs" ff="monospace">
          {values[i]}
        </Text>
      ))}
    </Group>
  );
}

function PanelCard({
  label,
  lows,
  highs,
  tare,
}: {
  label: string;
  lows: number[];
  highs: number[];
  tare: readonly number[] | null;
}) {
  return (
    <Paper>
      <Stack gap={4}>
        <Text size="xs" fw={600}>
          {label}
        </Text>
        <Divider />
        <Group gap="xl">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Threshold
            </Text>
            <ThresholdDisplay lows={lows} highs={highs} />
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Tare
            </Text>
            <TareGrid values={tare} />
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
}

export function ConfigValues(props: { stage: StageLike }) {
  const config = useConfig(props.stage);
  const tareData = useTestData(props.stage, SensorTestMode.Tare);

  if (!config) return null;

  const enabledPanels = PANEL_LABELS.flatMap((label, idx) => {
    const panelSensors = config.enabledSensors[idx];
    if (!panelSensors || !panelSensors.some(Boolean)) return [];
    return [{ label, idx }];
  });

  return (
    <Fieldset p="xs" legend="Current settings">
      <ScrollArea h={450}>
        <Stack gap="lg">
          {enabledPanels.map(({ label, idx }) => {
            const { lows, highs } = sensitivityLevelsForPanel(config, idx);
            const tare = tareData?.[idx]?.sensor_level ?? null;
            return <PanelCard key={label} label={label} lows={lows} highs={highs} tare={tare} />;
          })}
        </Stack>
      </ScrollArea>
    </Fieldset>
  );
}
