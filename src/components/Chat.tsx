import { useRef, useState, useCallback } from "react";
import { Keyboard } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAPI } from "../lib/api";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./Button";
import { MarkdownInput } from "./MarkdownInput";
import { ChatSettings } from "./ChatSettings";
import { Post } from "./Post";

export type ChatProps = {
  chat: string;
};
export const Chat = (props: ChatProps) => {
  const [replies, setReplies] = useState<string[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string>();
  const container = useRef<HTMLDivElement | null>(null);
  const [
    credentials,
    chat,
    loadChat,
    posts,
    loadChatPosts,
    loadMore,
    updateChat,
  ] = useAPI(
    useShallow((state) => [
      state.credentials,
      state.chats[props.chat],
      state.loadChat,
      state.chatPosts[props.chat],
      state.loadChatPosts,
      state.loadMore,
      state.updateChat,
    ]),
  );
  loadChat(props.chat);
  loadChatPosts(props.chat);

  const setReplyFromPost = useCallback((id: string) => {
    setReplies((replies) => [...replies, id]);
  }, []);

  if (!posts) {
    return <>Loading posts...</>;
  }
  if (posts.error) {
    return (
      <div>
        <p className="font-bold">There was an error loading posts.</p>
        <p>{posts.message}</p>
      </div>
    );
  }

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const response = await loadMore(props.chat);
    if (response.error) {
      setLoadMoreError(response.message);
    }
    setLoadingMore(false);
  };

  return (
    <div className="flex flex-col gap-2" ref={container}>
      {props.chat === "home" ?
        undefined
      : <p className="flex justify-between font-bold">
          <div>
            {props.chat === "livechat" ?
              "Livechat"
            : props.chat === "inbox" ?
              "Inbox"
            : chat ?
              chat.error ?
                `Failed getting chat. Message: ${chat.message}`
              : chat.deleted ?
                ""
              : (chat.nickname ??
                "@" +
                  chat.members.find(
                    (member) => member !== credentials?.username,
                  ))

            : "Loading chat name..."}
            <span className="ml-2 text-xs font-medium">({props.chat})</span>
          </div>
          {(
            chat &&
            !chat.error &&
            !chat.deleted &&
            chat.nickname &&
            chat.owner === credentials?.username
          ) ?
            <ChatSettings
              trigger={<Button>Edit</Button>}
              base={{
                nickname: chat.nickname,
                icon: chat.icon,
                icon_color: chat.icon_color,
                allow_pinning: chat.allow_pinning,
              }}
              onSubmit={async (options) => {
                const response = await updateChat(props.chat, options);
                if (response.error) {
                  return response;
                }
                return { error: false };
              }}
            />
          : undefined}
        </p>
      }
      {props.chat !== "inbox" ?
        <>
          <EnterPost
            chat={props.chat}
            replies={replies}
            setReplies={setReplies}
            onPost={() => {
              if (!container.current || !container.current.parentElement) {
                return;
              }
              container.current.parentElement.scrollTop = 0;
            }}
          />
          <TypingIndicator chat={props.chat} />
        </>
      : undefined}
      {posts.posts.map((post) => (
        <Post key={post} id={post} onReply={setReplyFromPost} />
      ))}
      {posts.stopLoadingMore ?
        undefined
      : <Button type="button" onClick={handleLoadMore} disabled={loadingMore}>
          Load more
        </Button>
      }
      {loadMoreError ?
        <div className="text-red-500">{loadMoreError}</div>
      : null}
    </div>
  );
};

export type TypingIndicatorProps = {
  chat: string;
};
const TypingIndicator = (props: TypingIndicatorProps) => {
  const [users, credentials] = useAPI(
    useShallow((state) => [state.typingUsers[props.chat], state.credentials]),
  );

  const filteredUsers = users?.filter((user) => user !== credentials?.username);
  const typing = filteredUsers && filteredUsers.length;

  return (
    <div
      className={twMerge(
        "flex items-center gap-2",
        typing ? "" : "text-gray-500 dark:text-gray-400",
      )}
    >
      <Keyboard
        className="h-5 min-h-5 w-5 min-w-5"
        aria-label="Typing users:"
      />
      {typing ? filteredUsers.join(", ") : "No one is currently typing."}
    </div>
  );
};

type EnterPostProps = {
  chat: string;
  replies?: string[];
  setReplies?: (replies: string[]) => void;
  onPost?: () => void;
};
const EnterPost = (props: EnterPostProps) => {
  const post = useAPI((state) => state.post);
  const handleSubmit = (
    postContent: string,
    replies: string[],
    attachments: string[],
  ) => {
    post(postContent, props.chat, replies, attachments);
    props.onPost?.();
    return Promise.resolve({ error: false } as const);
  };

  return (
    <div className="sticky top-0 z-[--z-enter-post] bg-white dark:bg-gray-950">
      <MarkdownInput
        {...props}
        onSubmit={handleSubmit}
        dontDisableWhenPosting
      />
    </div>
  );
};
