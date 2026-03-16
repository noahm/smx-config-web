import { IconSquarePlus } from "@tabler/icons-react";
import { Box, Button } from "@mantine/core";
import styles from "./pair-another.module.css";
import classNames from "classnames";
import { promptSelectDevice } from "../pad-coms";

export function PairAnother(props: { side: "left" | "right" }) {
  return (
    <Box pos="relative" w={0} h={0}>
      <Button
        leftSection={<IconSquarePlus />}
        className={classNames(styles.base, styles[props.side])}
        fz="h3"
        onClick={promptSelectDevice}
      >
        Pair another?
      </Button>
    </Box>
  );
}
