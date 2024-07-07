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
          {!user ? (
            <div>Loading...</div>
          ) : user.error ? (
            <div>
              An error occured getting the user!
              <br />
              Message: {user.message}
            </div>
          ) : (
            <>
              <Markdown>
                {props.username === "Discord"
                  ? "This user is used to bridge posts from the official Meower Discord servers and other servers to Meower.\nTherefore, it gives people the opportunity to not use Meower at all while still interacting with its community.\n**This is harmful to Meower.** Features that Meower lacks are compensated for using this feature.\nBecause of this, Meower never gets a chance to improve - as people can just use Discord instead.\nPlease, *do not* use the bridge. This is vital for Meower's existence.\n\n_This message was added by Roarer._"
                  : user.quote ?? ""}
              </Markdown>
              {credentials && credentials.username !== props.username ? (
                <Button type="button" onClick={dm}>
                  DM
                </Button>
              ) : undefined}
              {error ? <div className="text-red-500">{error}</div> : undefined}
            </>
          )}
        </div>
      </div>
    </Popup>
  );
};
