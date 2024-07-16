import { forwardRef, ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  secondary?: boolean;
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props: ButtonProps, ref) => {
    const buttonProps = { ...props };
    delete buttonProps.secondary;
    return (
      <button
        {...buttonProps}
        ref={ref}
        className={twMerge(
          "rounded-lg border px-2 py-1 font-bold transition-[background-color] disabled:cursor-not-allowed disabled:opacity-70",
          props.secondary ?
            "border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-600 [&:not(:disabled):hover]:bg-gray-300 dark:[&:not(:disabled):hover]:bg-gray-700"
          : "border-lime-500 bg-lime-300 dark:border-lime-600 dark:bg-lime-700 [&:not(:disabled):hover]:bg-lime-400 dark:[&:not(:disabled):hover]:bg-lime-800",
          props.className,
        )}
      >
        {props.children}
      </button>
    );
  },
);
