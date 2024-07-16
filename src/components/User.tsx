import { useState, ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { Button } from "./Button";
import { Popup } from "./Popup";
import { Markdown } from "./Markdown";
import { ProfilePicture } from "./ProfilePicture";

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
      <div className="flex gap-2">
        <ProfilePicture username={props.username} />
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold"> {props.username}</span>
          {!user ?
            <div>Loading...</div>
          : user.error ?
            <div>
              An error occured getting the user!
              <br />
              Message: {user.message}
            </div>
          : <>
              {user.quote ?
                <Markdown children={user.quote} />
              : undefined}
              {credentials && credentials.username !== props.username ?
                <Button type="button" onClick={dm}>
                  DM
                </Button>
              : undefined}
              {error ?
                <div className="text-red-500">{error}</div>
              : undefined}
            </>
          }
        </div>
      </div>
    </Popup>
  );
};
