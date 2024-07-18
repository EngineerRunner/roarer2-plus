import { useEffect, useState } from "react";

// I know that there are edge cases these constants don't account for. As they
// are only used for very rough relative timestamps anyway, that should be fine.
const UNITS = [
  { ms: 1000, max: 60, unit: "seconds" },
  { ms: 1000 * 60, max: 60, unit: "minutes" },
  { ms: 1000 * 60 * 60, max: 24, unit: "hours" },
  { ms: 1000 * 60 * 60 * 24, max: 7, unit: "days" },
  { ms: 1000 * 60 * 60 * 24, max: 4, unit: "weeks" },
  { ms: 1000 * 60 * 60 * 24 * 4, max: 12, unit: "months" },
  { ms: 1000 * 60 * 60 * 24 * 4 * 12, max: Infinity, unit: "years" },
] as const satisfies {
  ms: number;
  max: number;
  unit: Intl.RelativeTimeFormatUnit;
}[];

export type RelativeTimeProps = {
  time: number;
};
export const RelativeTime = (props: RelativeTimeProps) => {
  const [string, setString] = useState(calculateRelativeTime(props.time));
  useEffect(() => {
    const interval = setInterval(() => {
      setString(calculateRelativeTime(props.time));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const dateRepresentation = new Date(props.time * 1000).toString();

  return <span title={dateRepresentation}>{string}</span>;
};

const formatter = new Intl.RelativeTimeFormat("en", { style: "short" });
const calculateRelativeTime = (time: number) => {
  const diffMS = Date.now() - time * 1000;
  const unit = UNITS.find((unit) => diffMS <= unit.ms * unit.max) ?? UNITS[0];
  return formatter.format(-Math.round(diffMS / unit.ms), unit.unit);
};
