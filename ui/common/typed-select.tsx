import type React from "react";

interface Props<T extends string>
  extends React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> {
  value: T;
  options: Array<[key: T, label: string]>;
  onOptSelected?(selectedValue: T): void;
}

export function TypedSelect<Opts extends string>(props: Props<Opts>) {
  const { options, onOptSelected, ...selectProps } = props;

  return (
    <select {...selectProps} onChange={(e) => onOptSelected?.(e.currentTarget.value as Opts)}>
      {options.map(([key, label]) => (
        <option value={key}>{label}</option>
      ))}
    </select>
  );
}
