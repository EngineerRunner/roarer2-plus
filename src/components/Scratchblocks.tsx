import { useEffect, useRef } from "react";
// @ts-expect-error - scratchblocks doesn't have type definitions
import scratchblocks from "scratchblocks";

export type ScratchblocksProps = {
  code: string;
  inline?: boolean;
};
export const Scratchblocks = (props: ScratchblocksProps) => {
  const isMounted = useRef(false);
  const id = getID();
  useEffect(() => {
    if (!isMounted.current) {
      scratchblocks.renderMatching(`[data-scratchblocks-id=${id}]`, {
        style: "scratch3",
        inline: props.inline ?? false,
        scale: 0.675,
      });
      isMounted.current = true;
    }
  }, []);

  return <span data-scratchblocks-id={id}>{props.code}</span>;
};

let id = 0;
const getID = () => `scratchblocks-${id++}`;
