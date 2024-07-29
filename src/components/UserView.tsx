import { twMerge } from "tailwind-merge";
import { MouseEventHandler, forwardRef } from "react";
import { ProfilePicture } from "./ProfilePicture";
import { Username } from "./Username";
import { useAPI } from "../lib/api";

export type UserViewProps = {
  username: string;
  text?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  secondary?: boolean;
  className?: string;
  force?: boolean;
  rightText?: string;
};
export const UserView = forwardRef<HTMLButtonElement, UserViewProps>(
  (props: UserViewProps, ref) => {
    const loadUser = useAPI((state) => state.loadUser);
    if (props.force) {
      loadUser(props.username, { force: true });
    }
    return (
      <button
        ref={ref}
        className={twMerge(
          "flex w-full items-center bg-white px-2 py-1 dark:bg-gray-950",
          props.secondary ?
            "bg-white dark:bg-gray-900"
          : "bg-white dark:bg-gray-950",
          props.disabled ? ""
          : props.secondary ? "hover:bg-gray-100 dark:hover:bg-gray-800"
          : "hover:bg-gray-100 dark:hover:bg-gray-900",
          props.disabled ? "" : "group",
          props.className,
        )}
        onClick={props.onClick}
        disabled={props.disabled}
      >
        <div className="flex w-full grow items-center gap-2">
          <ProfilePicture
            className="inline-block"
            username={props.username}
            size="h-8 min-h-8 w-8 min-w-8"
          />
          <div>
            <Username username={props.username} />{" "}
            {props.text ?
              <span className="text-sm">({props.text})</span>
            : undefined}
          </div>
        </div>
        {props.rightText ?
          <div className="text-sm">{props.rightText}</div>
        : undefined}
      </button>
    );
  },
);
