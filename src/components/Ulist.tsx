import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { User } from "./User";
import { UserView } from "./UserView";

export const Ulist = () => {
  const [ulist, credentials] = useAPI(
    useShallow((state) => [state.ulist, state.credentials]),
  );

  return (
    <div>
      <div className="px-2 text-sm">{ulist.length} users online:</div>
      {credentials ?
        <UlistUser username={credentials.username} you />
      : undefined}
      {ulist.map((user) =>
        user !== credentials?.username ?
          <UlistUser key={user} username={user} />
        : undefined,
      )}
    </div>
  );
};

type UlistUserProps = {
  username: string;
  you?: boolean;
};
const UlistUser = (props: UlistUserProps) => {
  return (
    <User username={props.username}>
      <UserView
        username={props.username}
        text={props.you ? "You" : undefined}
        force
      />
    </User>
  );
};
