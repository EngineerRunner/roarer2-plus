import React, {
  forwardRef,
  ComponentPropsWithoutRef,
  KeyboardEventHandler,
  FormEventHandler,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import { twMerge } from "tailwind-merge";
import { useAPI } from "../lib/api";

export type InputProps = ComponentPropsWithoutRef<"input"> & { label: string };
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (props: InputProps, ref) => {
    const inputProps: Omit<InputProps, "label"> & { label?: string } = {
      ...props,
    };
    delete inputProps.label;
    return (
      <label className="flex flex-col">
        <span className="text-sm font-bold">{props.label}</span>
        <input
          {...inputProps}
          ref={ref}
          className={twMerge(
            "rounded-xl border border-gray-200 bg-transparent px-2 py-1 transition-colors focus:border-transparent focus:shadow-sm focus:outline-0 focus:[box-shadow:0_0_0.25rem_theme(colors.lime.600)] disabled:opacity-70 dark:border-gray-700 dark:focus:[box-shadow:0_0_0.25rem_theme(colors.lime.300)]",
            props.className,
          )}
        />
      </label>
    );
  },
);

export type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  before?: React.ReactNode;
  after?: React.ReactNode;
  above?: React.ReactNode;
  below?: React.ReactNode;
  replaceTextarea?: React.ReactNode;
  onEnter?: () => void;
};
export const Textarea = forwardRef<HTMLTextAreaElement | null, TextareaProps>(
  (props: TextareaProps, ref) => {
    const textareaProps = { ...props };
    delete textareaProps.before;
    delete textareaProps.after;
    delete textareaProps.above;
    delete textareaProps.below;
    delete textareaProps.onEnter;
    delete textareaProps.replaceTextarea;
    const settings = useAPI((state) => state.settings);
    const elementRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(ref, () => elementRef.current!);

    const adjustHeight = () => {
      if (!elementRef.current) {
        return;
      }
      elementRef.current.style.height = "auto";
      elementRef.current.style.height = elementRef.current.scrollHeight + "px";
    };
    const handleInput: FormEventHandler<HTMLTextAreaElement> = (e) => {
      adjustHeight();
      props.onInput?.(e);
    };
    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
      if (!settings.enterSend) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        props.onEnter?.();
      }
      props.onKeyDown?.(e);
    };

    useEffect(() => {
      adjustHeight();
    });

    return (
      <div
        className={twMerge(
          "flex flex-col rounded-xl border border-gray-200 px-2 py-1 transition-colors has-[textarea:focus]:border-transparent has-[textarea:disabled]:opacity-70 has-[textarea:focus]:shadow-sm has-[textarea:focus]:[box-shadow:0_0_0.25rem_theme(colors.lime.600)] dark:border-gray-700 dark:has-[textarea:focus]:[box-shadow:0_0_0.25rem_theme(colors.lime.300)]",
          props.className,
        )}
      >
        {props.above}
        <div className="flex">
          {props.before}
          {props.replaceTextarea ?
            <div className="mx-2 max-h-64 min-h-8 grow overflow-y-auto py-1">
              {props.replaceTextarea}
            </div>
          : <textarea
              {...{ ...textareaProps, className: undefined }}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              className="mx-2 h-full max-h-64 grow resize-none overflow-y-auto bg-transparent py-1 outline-none"
              rows={1}
              ref={elementRef}
            />
          }
          {props.after}
        </div>
        {props.below}
      </div>
    );
  },
);
