import { useState } from "react";
import {
  ActionIcon,
  Button,
  FileButton,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconCheck,
  IconDownload,
  IconFileExport,
  IconPencil,
  IconSend,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import type { CustomPreset } from "../../sdk/custom-presets";
import type { StageLike } from "../../sdk/interface";
import { useCustomPresets } from "./use-custom-presets";

type Props = {
  stage: StageLike | undefined;
  opened: boolean;
  onClose(): void;
};

export function CustomPresetsModal({ stage, opened, onClose }: Props) {
  const { presets, rename, remove, apply, exportOne, exportAll, importFromFile } = useCustomPresets();

  return (
    <Modal opened={opened} onClose={onClose} title={<strong>Custom Presets</strong>} centered size="lg">
      <Stack gap="md">
        <Group justify="flex-end" gap="xs">
          <FileButton onChange={(file) => file && importFromFile(file)} accept="application/json,.json">
            {(props) => (
              <Button {...props} variant="default" leftSection={<IconUpload size={16} />}>
                Import…
              </Button>
            )}
          </FileButton>
          <Button
            variant="default"
            leftSection={<IconFileExport size={16} />}
            disabled={presets.length === 0}
            onClick={exportAll}
          >
            Export all
          </Button>
        </Group>

        {presets.length === 0 ? (
          <Text c="dimmed" ta="center" py="lg">
            No saved presets yet. Save the stage's current config from the stage menu to create one.
          </Text>
        ) : (
          <ScrollArea.Autosize mah={360}>
            <Stack gap="xs">
              {presets.map((preset) => (
                <PresetRow
                  key={preset.id}
                  preset={preset}
                  stage={stage}
                  onApply={() => stage && apply(stage, preset)}
                  onRename={(name) => rename(preset.id, name)}
                  onExport={() => exportOne(preset)}
                  onDelete={() =>
                    modals.openConfirmModal({
                      title: "Delete preset",
                      children: <Text size="sm">Delete preset “{preset.name}”? This can't be undone.</Text>,
                      labels: { confirm: "Delete", cancel: "Cancel" },
                      confirmProps: { color: "red" },
                      onConfirm: () => remove(preset.id),
                    })
                  }
                />
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Stack>
    </Modal>
  );
}

type RowProps = {
  preset: CustomPreset;
  stage: StageLike | undefined;
  onApply(): void;
  onRename(name: string): void;
  onExport(): void;
  onDelete(): void;
};

function PresetRow({ preset, stage, onApply, onRename, onExport, onDelete }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(preset.name);

  const commit = () => {
    onRename(draft);
    setEditing(false);
  };

  return (
    <Group justify="space-between" wrap="nowrap" gap="xs">
      {editing ? (
        <Group gap={4} wrap="nowrap" style={{ flex: 1 }}>
          <TextInput
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            size="xs"
            style={{ flex: 1 }}
            autoFocus
          />
          <ActionIcon variant="subtle" color="green" onClick={commit} aria-label="Save name">
            <IconCheck size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" onClick={() => setEditing(false)} aria-label="Cancel rename">
            <IconX size={16} />
          </ActionIcon>
        </Group>
      ) : (
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text truncate fw={500}>
            {preset.name}
          </Text>
          <Text size="xs" c="dimmed">
            fw v{preset.firmwareVersion} · {new Date(preset.createdAt).toLocaleDateString()}
          </Text>
        </div>
      )}

      {!editing && (
        <Group gap={4} wrap="nowrap">
          <Tooltip label={stage ? "Restore to stage" : "No stage connected"}>
            <ActionIcon variant="subtle" color="blue" disabled={!stage} onClick={onApply} aria-label="Apply preset">
              <IconSend size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Rename">
            <ActionIcon variant="subtle" color="gray" onClick={() => setEditing(true)} aria-label="Rename preset">
              <IconPencil size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export to file">
            <ActionIcon variant="subtle" color="gray" onClick={onExport} aria-label="Export preset">
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" onClick={onDelete} aria-label="Delete preset">
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Group>
  );
}
