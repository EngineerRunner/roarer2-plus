import { useAPI } from "../lib/api";
import { twMerge } from "tailwind-merge";
import { ProfilePicture } from "./ProfilePicture";
import { User } from "./User";

export type MentionProps = {
  username: string;
  pfp?: boolean;
};
export const Mention = (props: MentionProps) => {
  const credentials = useAPI((state) => state.credentials);

  return (
    <User username={props.username}>
      <button
        className={twMerge(
          "text-nowrap font-bold",
          props.username === credentials?.username ?
            "text-yellow-600"
          : "text-lime-600",
        )}
      >
        <span className="inline-block align-text-top">
          {props.pfp ?? true ?
            <ProfilePicture
              username={props.username}
              dontShowOnline
              size="w-5 h-5 min-w-5 min-h-5"
            />
          : undefined}
        </span>
        &nbsp;
        <span className="inline-block">
          <span className="sr-only">@</span>
          {props.username}
        </span>
      </button>
    </User>
  );
};
