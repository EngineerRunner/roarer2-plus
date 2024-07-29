import { forwardRef, ComponentPropsWithoutRef } from "react";
import { twMerge } from "tailwind-merge";

export type SelectProps = ComponentPropsWithoutRef<"select"> & {
  label: string;
};
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (props: SelectProps, ref) => {
    const selectProps: Omit<SelectProps, "label"> & { label?: string } = {
      ...props,
    };
    delete selectProps.label;
    return (
      <label className="flex flex-col">
        <span className="text-sm font-bold">{props.label}</span>
        <select
          {...selectProps}
          ref={ref}
          className={twMerge(
            "rounded-xl border border-gray-200 bg-transparent px-2 py-1 transition-colors disabled:opacity-70 dark:border-gray-700",
            props.className,
          )}
        />
      </label>
    );
  },
);

export type OptionProps = ComponentPropsWithoutRef<"option">;
export const Option = forwardRef<HTMLOptionElement, OptionProps>(
  (props: OptionProps, ref) => {
    return (
      <option
        {...props}
        className={twMerge("bg-white dark:bg-gray-900", props.className)}
        ref={ref}
      />
    );
  },
);
