import { useState, ReactNode } from "react";
import { Popup } from "./Popup";
import { Post } from "./Post";

export type PostPopupProps = {
  id: string;
  children: ReactNode;
  openInitially?: boolean;
};
export const PostPopup = (props: PostPopupProps) => {
  const [open, setOpen] = useState(props.openInitially ?? false);
  return (
    <Popup
      trigger={props.children}
      controlled={{ open, onOpenChange: setOpen }}
      size="extend"
    >
      <Post id={props.id} topLevel={false} />
    </Popup>
  );
};
