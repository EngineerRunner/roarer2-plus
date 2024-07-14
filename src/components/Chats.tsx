import { twMerge } from "tailwind-merge";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { ProfilePicture, ChatProfilePicture } from "./ProfilePicture";
import { Chat as APIChat } from "../lib/api/chats";

export type ChatsProps = {
  onChatClick: (chat: string) => void;
  currentChat: string;
};
export const Chats = (props: ChatsProps) => {
  const [chats, userChats, credentials, loadChats] = useAPI(
    useShallow((store) => [
      store.chats,
      store.userChats,
      store.credentials,
      store.loadChats,
    ]),
  );
  if (credentials) {
    loadChats();
  }

  if (!credentials) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-lg font-bold">No chats yet!</p>
        <p>Sign into Meower to join chats and message users.</p>
      </div>
    );
  }
  if (!userChats) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        Loading...
      </div>
    );
  }
  if (userChats.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-lg font-bold">
          There was an error loading your chats.
        </p>
        <p>{userChats.message}</p>
      </div>
    );
  }
  if (userChats.chats.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <p className="text-lg font-bold">No chats yet!</p>
        <p>
          Ask someone on a better client than this to add you to one or to DM
          you.
        </p>
      </div>
    );
  }

  const lastActive = (id: string) => {
    const chat = chats[id];
    if (chat === undefined || chat.error || chat.deleted) {
      return 0;
    }
    return chat.last_active;
  };
  const sortedChats = [...userChats.chats].sort(
    (a, b) => lastActive(b) - lastActive(a),
  );

  return (
    <div className="max-w-full">
      <Chat
        chat="home"
        onClick={props.onChatClick}
        current={props.currentChat === "home"}
      />
      <Chat
        chat="livechat"
        onClick={props.onChatClick}
        current={props.currentChat === "livechat"}
      />
      {sortedChats.map((chat) => (
        <Chat
          key={chat}
          chat={chat}
          onClick={props.onChatClick}
          current={props.currentChat === chat}
        />
      ))}
    </div>
  );
};

type ChatProps = {
  chat: string;
  onClick: (id: string) => void;
  current: boolean;
};
const Chat = (props: ChatProps) => {
  const [credentials, baseChat, loadChat] = useAPI(
    useShallow((state) => [
      state.credentials,
      state.chats[props.chat],
      state.loadChat,
    ]),
  );
  if (props.chat !== "home" && props.chat !== "livechat") {
    loadChat(props.chat);
  }

  const chat =
    props.chat === "home"
      ? "home"
      : props.chat === "livechat"
        ? "livechat"
        : baseChat;
  const isSpecialChat = chat === "home" || chat === "livechat";

  if (!isSpecialChat && !chat) {
    return <>Loading chat...</>;
  }
  if (!isSpecialChat && chat.error) {
    return (
      <div>
        <p>There was an error loading this chat.</p>
        <p>{chat.message}</p>
      </div>
    );
  }
  if (!isSpecialChat && chat.deleted) {
    return <></>;
  }

  const isDM = chat !== "home" && chat !== "livechat" && !chat.owner;
  const dmRecipient = (chat: APIChat) =>
    chat.members.find((member) => member !== credentials?.username);

  return (
    <button
      className={twMerge(
        "flex w-full max-w-full items-center gap-2 px-2 py-1 text-left",
        props.current
          ? "bg-gray-100 dark:bg-gray-900"
          : "bg-white hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900",
      )}
      type="button"
      onClick={() => {
        props.onClick(props.chat);
      }}
    >
      {isDM ? (
        <ProfilePicture username={dmRecipient(chat)} />
      ) : chat !== "home" && chat !== "livechat" ? (
        <ChatProfilePicture chat={props.chat} />
      ) : undefined}
      <div className="grow">
        <div className="font-bold">
          {isDM
            ? `@${dmRecipient(chat)}`
            : chat === "home"
              ? "Home"
              : chat === "livechat"
                ? "Livechat"
                : chat.nickname}
        </div>
        <div className="line-clamp-1 text-sm text-gray-500 dark:text-gray-400">
          {!isDM && !isSpecialChat ? chat.members.join(", ") : undefined}
        </div>
      </div>
    </button>
  );
};
