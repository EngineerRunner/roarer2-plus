import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { ReactNode, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { Popup } from "./Popup";
import { UserView } from "./UserView";
import { Button } from "./Button";

export type ReactionUsersProps = {
  post: string;
  children: ReactNode;
};
export const ReactionUsers = (props: ReactionUsersProps) => {
  const [posts, loadPost] = useAPI(
    useShallow((state) => [state.posts, state.loadPost]),
  );
  loadPost(props.post);
  const post = posts[props.post];

  return (
    <Popup trigger={props.children} triggerAsChild size="extend">
      {!post ?
        <Dialog.Title>Loading post...</Dialog.Title>
      : post.error ?
        <Dialog.Title>
          Failed to get post.
          <br />
          Message: {post.message}
        </Dialog.Title>
      : post.isDeleted ?
        <Dialog.Title>This was post was deleted.</Dialog.Title>
      : !post.reactions.length ?
        <Dialog.Title>
          This post doesn't have any reactions yet. Be the first to react!
        </Dialog.Title>
      : <div>
          <Dialog.Title className="text-xl font-bold">Reactions</Dialog.Title>
          <Tabs.Root
            className="flex gap-2"
            defaultValue={post.reactions[0]?.emoji}
          >
            <Tabs.List className="flex flex-col gap-2">
              {post.reactions.map((reaction) => (
                <Tabs.Trigger
                  value={reaction.emoji}
                  className="border-b-2 border-transparent text-xl aria-selected:border-lime-500 dark:aria-selected:border-lime-600"
                  key={reaction.emoji}
                >
                  {reaction.emoji.length === 24 ?
                    <img
                      src={`https://uploads.meower.org/emojis/${encodeURIComponent(reaction.emoji)}`}
                      className="mb-1 h-6 min-h-6 w-6 min-w-6"
                    />
                  : reaction.emoji}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {post.reactions.map((reaction) => (
              <Tabs.Content
                className="grow"
                value={reaction.emoji}
                key={reaction.emoji}
              >
                <IndividualReactionUsers
                  post={props.post}
                  emoji={reaction.emoji}
                />
              </Tabs.Content>
            ))}
          </Tabs.Root>
        </div>
      }
    </Popup>
  );
};

type IndividualReactionUsersProps = {
  post: string;
  emoji: string;
};
const IndividualReactionUsers = (props: IndividualReactionUsersProps) => {
  const [
    credentials,
    reactionUsers,
    loadReactionUsers,
    loadMoreReactionUsers,
    reactToPost,
  ] = useAPI(
    useShallow((state) => [
      state.credentials,
      state.reactionUsers,
      state.loadReactionUsers,
      state.loadMoreReactionUsers,
      state.reactToPost,
    ]),
  );
  const [error, setError] = useState<string>();
  const [loadingMore, setLoadingMore] = useState(false);
  loadReactionUsers(props.post, props.emoji);
  const users = reactionUsers[`${props.post}/${props.emoji}`];

  const handleRemove = async () => {
    const response = await reactToPost(props.post, props.emoji, "delete");
    if (response.error) {
      setError(response.message);
    }
  };
  const handleLoadMore = async () => {
    setLoadingMore(true);
    const response = await loadMoreReactionUsers(props.post, props.emoji);
    setLoadingMore(false);
    if (response.error) {
      setError(response.message);
    }
  };

  return (
    <div>
      {!users ?
        "Loading..."
      : users.error ?
        <div>
          Failed getting users.
          <br />
          Message: {users.message}
        </div>
      : <div className="flex flex-col gap-2">
          {error ?
            <div className="text-red-400">{error}</div>
          : undefined}
          <div className="flex flex-col">
            {users.users.map((user) => (
              <UserView
                username={user}
                key={user}
                secondary
                disabled={user !== credentials?.username}
                text={user === credentials?.username ? "You" : undefined}
                rightText={
                  user === credentials?.username ? "Remove" : undefined
                }
                onClick={handleRemove}
              />
            ))}
          </div>
          {users.stopLoadingMore ?
            undefined
          : <Button
              className="w-full"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              Load more
            </Button>
          }
        </div>
      }
    </div>
  );
};
