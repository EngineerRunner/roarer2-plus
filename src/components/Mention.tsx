import { ProfilePicture } from "./ProfilePicture";
import { User } from "./User";
import { Username } from "./Username";
import { UserColor } from "./UserColor";

export type MentionProps = {
  username: string;
  pfp?: boolean;
};
export const Mention = (props: MentionProps) => {
  return (
    <User username={props.username}>
      <button className="inline-flex items-center gap-1 align-top font-bold">
        <span className="inline-block align-text-top">
          {(props.pfp ?? true) ?
            <ProfilePicture
              username={props.username}
              dontShowOnline
              size="w-5 h-5 min-w-5 min-h-5"
            />
          : undefined}
        </span>
        <span className="inline-block">
          <span className="sr-only">@</span>
          <UserColor username={props.username}>
            <Username username={props.username} />
          </UserColor>
        </span>
      </button>
    </User>
  );
};
