import * as Toggle from "@radix-ui/react-toggle";

export type CheckboxProps = {
  checked?: boolean;
  onInput?: (checked: boolean) => void;
  disabled?: boolean;
};
export const Checkbox = (props: CheckboxProps) => {
  return (
    <Toggle.Root
      pressed={props.checked}
      onPressedChange={props.onInput}
      disabled={props.disabled}
      className="group flex h-5 w-8 items-center rounded-full border border-gray-400 bg-gray-300 transition-[background-color] disabled:opacity-50 aria-pressed:justify-end aria-pressed:border-lime-500 aria-pressed:bg-lime-300 dark:border-gray-500 dark:bg-gray-600 aria-pressed:dark:border-lime-600 aria-pressed:dark:bg-lime-800 [&:not(:disabled):hover]:bg-gray-300 aria-pressed:[&:not(:disabled):hover]:bg-lime-400 dark:[&:not(:disabled):hover]:bg-gray-700 aria-pressed:dark:[&:not(:disabled):hover]:bg-lime-700"
    >
      <div
        className="box-content h-4 w-4 rounded-full border border-gray-400 bg-white group-aria-pressed:border-lime-500"
        aria-hidden
      />
    </Toggle.Root>
  );
};
