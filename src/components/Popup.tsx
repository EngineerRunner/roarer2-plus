import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type PopupProps = {
  trigger: ReactNode;
  triggerAsChild?: boolean;
  children: ReactNode;
  controlled?: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
  className?: string;
  wide?: boolean;
};
export const Popup = (props: PopupProps) => {
  return (
    <Dialog.Root {...(props.controlled ?? {})}>
      <Dialog.Trigger asChild={props.triggerAsChild}>
        {props.trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="absolute left-0 top-0 z-[--z-popup-bg] h-screen w-screen bg-black/50 backdrop-blur-md" />
        <Dialog.Content
          aria-describedby={undefined}
          className={twMerge(
            "absolute inset-0 z-[--z-popup] m-auto h-fit max-h-[90vh] w-fit overflow-auto rounded-xl bg-white px-4 py-2 dark:bg-gray-900",
            props.className,
            props.wide ? "max-w-[90vw]" : "max-w-[min(90vw,30rem)]",
          )}
        >
          {props.children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
