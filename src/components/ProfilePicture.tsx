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
};
export const ProfilePicture = (props: ProfilePictureProps) => {
  const [user, loadUser, ulist] = useAPI(
    useShallow((state) => [
      props.username ? state.users[props.username] : undefined,
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
        props.dontShowOnline ?? false
          ? false
          : props.username
            ? ulist.includes(props.username)
            : false
      }
      size={props.size}
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
};
export const ProfilePictureBase = (props: ProfilePictureBaseProps) => {
  return (
    <div
      className={twMerge(
        "relative",
        props.size ?? "h-10 min-h-10 w-10 min-w-10",
      )}
    >
      <img
        className={twMerge(
          "rounded-lg border border-[--border-color] [border-style:--border-style]",
          props.className,
          props.size ?? "h-10 min-h-10 w-10 min-w-10",
        )}
        style={
          {
            "--border-color": "#" + props.pfp.avatar_color,
            "--border-style":
              props.pfp.avatar && props.pfp.avatar_color !== "!color"
                ? "solid"
                : "none",
          } as CSSProperties
        }
        src={
          props.pfp.avatar
            ? `${uploads}/icons/${props.pfp.avatar}`
            : profilePictures.get(props.pfp.pfp_data ?? 500)
        }
        aria-hidden
      />
      {props.online ? (
        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-green-600 bg-green-400 dark:border-green-500 dark:bg-green-600">
          <span className="sr-only">Online</span>
        </div>
      ) : undefined}
    </div>
  );
};
