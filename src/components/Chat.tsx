import { useState, useCallback } from "react";
import { Keyboard } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAPI } from "../lib/api";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./Button";
import { Reply, MarkdownInput } from "./MarkdownInput";
import { Post } from "./Post";

export type ChatProps = {
  chat: string;
};
export const Chat = (props: ChatProps) => {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string>();
  const [credentials, chat, loadChat, posts, loadChatPosts, loadMore] = useAPI(
    useShallow((state) => [
      state.credentials,
      state.chats[props.chat],
      state.loadChat,
      state.chatPosts[props.chat],
      state.loadChatPosts,
      state.loadMore,
    ]),
  );
  if (props.chat !== "home" && props.chat !== "lievchat") {
    loadChat(props.chat);
  }
  loadChatPosts(props.chat);

  const setReplyFromPost = useCallback(
    (id: string, content: string, username: string) => {
      setReplies((replies) => [...replies, { id, content, username }]);
    },
    [],
  );

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
    <div className="flex flex-col gap-2">
      {props.chat === "home" ? undefined : (
        <p className="font-bold">
          {props.chat === "livechat"
            ? "Livechat"
            : chat
              ? chat.error
                ? `Failed getting chat. Message: ${chat.message}`
                : chat.deleted
                  ? ""
                  : chat.nickname ??
                    "@" +
                      chat.members.find(
                        (member) => member !== credentials?.username,
                      )
              : "Loading chat name..."}
        </p>
      )}
      <EnterPost chat={props.chat} replies={replies} setReplies={setReplies} />
      <TypingIndicator chat={props.chat} />
      {posts.posts.map((post) => (
        <Post key={post} id={post} onReply={setReplyFromPost} />
      ))}
      {posts.stopLoadingMore ? undefined : (
        <Button type="button" onClick={handleLoadMore} disabled={loadingMore}>
          Load more
        </Button>
      )}
      {loadMoreError ? (
        <div className="text-red-500">{loadMoreError}</div>
      ) : null}
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
  replies?: Reply[];
  setReplies?: (replies: Reply[]) => void;
};
const EnterPost = (props: EnterPostProps) => {
  const post = useAPI((state) => state.post);
  const handleSubmit = (postContent: string, attachments: string[]) => {
    post(postContent, props.chat, attachments);
    return Promise.resolve({ error: false } as const);
  };

  return (
    <MarkdownInput {...props} onSubmit={handleSubmit} dontDisableWhenPosting />
  );
};
