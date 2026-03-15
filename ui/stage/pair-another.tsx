import { IconCirclePlus } from "@tabler/icons-react";
import { Box, Button } from "@mantine/core";
import styles from "./pair-another.module.css";
import classNames from "classnames";
import { promptSelectDevice } from "../pad-coms";

export function PairAnother(props: { side: "left" | "right" }) {
  return (
    <Box pos="relative" w={0} h={0}>
      <Button className={classNames(styles.base, styles[props.side])} fz="h2" onClick={promptSelectDevice}>
        <IconCirclePlus /> Pair another?
      </Button>
    </Box>
  );
}
