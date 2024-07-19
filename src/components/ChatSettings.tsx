import { useState, useRef, ChangeEventHandler, ReactNode } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Menu } from "./Menu";
import { uploadFile } from "../lib/upload";
import { ProfilePictureBase } from "./ProfilePicture";
import { Errorable } from "../lib/api/utils";
import { UpdateChatOptions } from "../lib/api/chats";

export type ChatSettingsProps = {
  base: Omit<UpdateChatOptions, "icon" | "icon_color" | "allow_pinning"> & {
    icon: string | undefined;
    icon_color: string | undefined;
    allow_pinning: boolean | undefined;
  };
  onSubmit?: (options: Partial<UpdateChatOptions>) => Promise<Errorable>;
  trigger: ReactNode;
};
export const ChatSettings = (props: ChatSettingsProps) => {
  const [newOptions, setNewOptions] = useState<Partial<UpdateChatOptions>>({});
  const [editChatError, setEditChatError] = useState<string>();
  const fileUpload = useRef<HTMLInputElement | null>(null);

  const handleChatPFPUpload: ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      return;
    }
    const uploaded = await uploadFile(file, "icons");
    if (uploaded.error) {
      setEditChatError(uploaded.message);
      return;
    }
    setEditChatError(undefined);
    setNewOptions((o) => ({
      ...o,
      icon: uploaded.response.id,
      icon_color: "!color",
    }));
    e.currentTarget.value = "";
  };

  return (
    <Menu trigger={props.trigger} contextMenu={false}>
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const response = await props.onSubmit?.(newOptions);
          if (response?.error) {
            setEditChatError(response.message);
            return;
          }
          setNewOptions({});
        }}
      >
        <Input
          label="Chat name"
          placeholder="Chat name"
          type="text"
          value={newOptions.nickname ?? props.base.nickname}
          onInput={(e) =>
            setNewOptions((o) => ({ ...o, nickname: e.currentTarget.value }))
          }
        />
        {/* this doesn't work for whatever reason:
        <label className="flex items-center gap-2">
          <Checkbox
            checked={newOptions.allow_pinning ?? props.base.allow_pinning}
            onInput={(v) => setNewOptions((o) => ({ ...o, allow_pinning: v }))}
          />
          <span>Allow pinning messages</span>
        </label> */}
        <div className="flex flex-col gap-2">
          <p>New profile picture:</p>
          <input
            type="file"
            ref={fileUpload}
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onInput={handleChatPFPUpload}
          />
          {newOptions.icon ?
            <>
              <ProfilePictureBase
                pfp={{
                  avatar: newOptions.icon,
                  avatar_color: newOptions.icon_color ?? "!color",
                  pfp_data: null,
                }}
              />
              <label className="flex flex-row gap-2">
                <input
                  type="radio"
                  name="edit-chat-color"
                  checked={newOptions.icon_color === "!color"}
                  onChange={() =>
                    setNewOptions((o) => ({ ...o, icon_color: "!color" }))
                  }
                />
                No color
              </label>
              <label className="flex flex-row gap-2">
                <input
                  type="radio"
                  name="edit-chat-color"
                  checked={newOptions.icon_color !== "!color"}
                  onChange={() =>
                    setNewOptions((o) => ({ ...o, icon_color: "000000" }))
                  }
                />
                Color:
                <input
                  type="color"
                  value={newOptions.icon_color ?? props.base.icon_color}
                  onChange={(e) =>
                    setNewOptions((o) => ({
                      ...o,
                      icon_color: e.currentTarget.value.slice(1),
                    }))
                  }
                />
              </label>
            </>
          : undefined}
          <Button type="button" onClick={() => fileUpload.current?.click()}>
            Upload
          </Button>
        </div>
        {editChatError ?
          <p className="text-red-500">
            Failed uploading:
            <br />
            {editChatError}
          </p>
        : undefined}
        <Button type="submit">Edit</Button>
      </form>
    </Menu>
  );
};
