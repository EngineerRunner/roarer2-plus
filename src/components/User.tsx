import { useState, ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { Button } from "./Button";
import { Popup } from "./Popup";
import { Markdown } from "./Markdown";
import { ProfilePicture } from "./ProfilePicture";
import { RelativeTime } from "./RelativeTime";
import { PERMISSIONS } from "../lib/permissions";

export type UserProps = {
  username: string;
  children: ReactNode;
};
export const User = (props: UserProps) => {
  const [credentials, user, loadUser, setOpenChat, getDM] = useAPI(
    useShallow((state) => [
      state.credentials,
      state.users[props.username],
      state.loadUser,
      state.setOpenChat,
      state.getDM,
    ]),
  );
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState(false);
  loadUser(props.username);

  const dm = async () => {
    const chat = await getDM(props.username);
    if (chat.error) {
      setError(chat.message);
      return;
    }
    setOpenChat(chat.chat);
    setOpen(false);
  };

  return (
    <Popup
      trigger={props.children}
      triggerAsChild
      controlled={{ open, onOpenChange: setOpen }}
    >
      {!user ?
        <div>Loading {props.username}...</div>
      : user.error ?
        <div>
          An error occured getting {props.username}!
          <br />
          Message: {user.message}
        </div>
      : <div className="flex gap-2">
          <div>
            <div className="flex items-center gap-4">
              <ProfilePicture username={props.username} />
              <div>
                <span className="text-xl font-bold">{props.username}</span>
                {user.created ?
                  <p className="text-sm italic opacity-60">
                    Joined <RelativeTime time={user.created} />
                  </p>
                : undefined}
              </div>
              {credentials && credentials.username !== props.username ?
                <div className="flex grow justify-end">
                  <Button type="button" onClick={dm}>
                    DM
                  </Button>
                </div>
              : undefined}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {user.quote ?
                <Markdown children={user.quote} />
              : undefined}
              {user.permissions ?
                <Permissions permissions={user.permissions} />
              : undefined}
              {error ?
                <div className="text-red-500">{error}</div>
              : undefined}
            </div>
          </div>
        </div>
      }
    </Popup>
  );
};

type PermissionsProps = {
  permissions: number;
};
const Permissions = (props: PermissionsProps) => {
  return (
    <div>
      <p className="font-bold">Permissions:</p>
      <div className="rounded-xl bg-gray-100 dark:bg-gray-800">
        {PERMISSIONS.map((permission, index) =>
          (props.permissions & (1 << index)) !== 0 ?
            <div className="flex items-center gap-4 px-2 py-1">
              <permission.icon aria-hidden />
              <div className="flex flex-col">
                <p className="font-bold">{permission.name}</p>
                <p className="text-sm italic">{permission.description}</p>
              </div>
            </div>
          : undefined,
        )}
      </div>
    </div>
  );
};
