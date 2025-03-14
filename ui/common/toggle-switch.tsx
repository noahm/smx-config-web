import classNames from "classnames";
import classes from "./toggle-switch.module.css";

interface ToggleProps {
  isOn: boolean;
  onToggle: () => void;
  label: string;
}

export function ToggleSwitch({ isOn, onToggle, label }: ToggleProps) {
  return (
    <label className={classes.wrapper}>
      <div className={classes.inputParent}>
        <input type="checkbox" className={classes.screenReaderOnly} checked={isOn} onChange={onToggle} />
        <div className={classNames(classes.background, { [classes.bgOn]: isOn })} />
        <div className={classNames(classes.handle, { [classes.handleOn]: isOn })} />
      </div>
      <div className={classes.labelText}>{label}</div>
    </label>
  );
}
