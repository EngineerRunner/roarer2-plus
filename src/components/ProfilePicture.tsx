import { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { uploads } from "../lib/servers";
import { NO_PROFILE_PICTURE } from "../lib/noProfilePicture";
import { profilePictures } from "../assets/pfp";

export type ProfilePictureProps = {
  username: string | undefined;
  className?: string;
  dontShowOnline?: boolean;
  size?: string;
  smallBorderPadding?: boolean;
};
export const ProfilePicture = (props: ProfilePictureProps) => {
  const [user, loadUser, ulist] = useAPI(
    useShallow((state) => [
      props.username ? state.users[props.username.toLowerCase()] : undefined,
      state.loadUser,
      state.ulist,
    ]),
  );
  if (props.username) {
    loadUser(props.username);
  }

  return (
    <ProfilePictureBase
      pfp={user && !user.error ? user : NO_PROFILE_PICTURE}
      className={props.className}
      online={
        (props.dontShowOnline ?? false) ? false
        : props.username ?
          ulist.includes(props.username)
        : false
      }
      smallBorderPadding={props.smallBorderPadding}
      size={props.size}
    />
  );
};

export type ChatProfilePictureProps = {
  chat: string | undefined;
  className?: string;
  size?: string;
  smallBorderPadding?: boolean;
};
export const ChatProfilePicture = (props: ChatProfilePictureProps) => {
  const [chat, loadChat] = useAPI(
    useShallow((state) => [
      props.chat ? state.chats[props.chat] : undefined,
      state.loadChat,
    ]),
  );
  if (props.chat) {
    loadChat(props.chat);
  }

  return (
    <ProfilePictureBase
      pfp={
        chat && !chat.error && "icon" in chat && "icon_color" in chat ?
          {
            avatar: chat.icon ?? "",
            avatar_color: chat.icon_color ?? "",
            pfp_data: null,
          }
        : NO_PROFILE_PICTURE
      }
      className={props.className}
      size={props.size}
      smallBorderPadding={props.smallBorderPadding}
      placeholder={22}
    />
  );
};

export type ProfilePictureBaseProps = {
  pfp: {
    avatar: string;
    avatar_color: string;
    pfp_data: number | null;
  };
  className?: string;
  online?: boolean;
  size?: string;
  placeholder?: number;
  smallBorderPadding?: boolean;
};
export const ProfilePictureBase = (props: ProfilePictureBaseProps) => {
  const settings = useAPI((state) => state.settings);
  return (
    <div
      className={twMerge(
        "relative",
        props.size ?? "h-10 min-h-10 w-10 min-w-10",
      )}
    >
      <img
        className={twMerge(
          "rounded-lg bg-[--border-color] object-cover",
          props.className,
          props.smallBorderPadding ? "p-[0.0625rem]" : "p-0.5",
          props.size ?? "h-10 min-h-10 w-10 min-w-10",
        )}
        style={
          {
            "--border-color":
              (
                settings.avatarBorders &&
                props.pfp.avatar &&
                props.pfp.avatar_color !== "!color"
              ) ?
                "#" + props.pfp.avatar_color
              : "transparent",
          } as CSSProperties
        }
        src={
          props.pfp.avatar ?
            `${uploads}/icons/${props.pfp.avatar}`
          : profilePictures.get(props.pfp.pfp_data ?? props.placeholder ?? 500)
        }
        aria-hidden
      />
      {props.online ?
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-green-600 bg-green-400 dark:border-green-500 dark:bg-green-600">
          <span className="sr-only">Online</span>
        </div>
      : undefined}
    </div>
  );
};
