import { forwardRef, ComponentPropsWithoutRef, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type IconButtonProps = ComponentPropsWithoutRef<"button"> & {
  children: ReactNode;
};
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props: IconButtonProps, ref) => {
    const buttonProps = { ...props };
    return (
      <button
        {...buttonProps}
        ref={ref}
        className={twMerge("", props.className)}
      >
        {props.children}
      </button>
    );
  },
);
