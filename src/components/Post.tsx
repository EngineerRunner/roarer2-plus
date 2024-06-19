import { File, PencilLine, Reply, Trash2, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode, useRef, useState, memo, MouseEventHandler } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { getReply } from "../lib/reply";
import { Attachment, Post as APIPost } from "../lib/api/posts";
import { NO_PROFILE_PICTURE } from "../lib/noProfilePicture";
import { byteToHuman } from "../lib/byteToHuman";
import { Button } from "./Button";
import { EnterPostBase } from "./Chat";
import { Popup } from "./Popup";
import { User } from "./User";
import { Markdown } from "./Markdown";
import { ProfilePicture, ProfilePictureBase } from "./ProfilePicture";
import { twMerge } from "tailwind-merge";

export type PostProps = {
  id: string;
  reply?: boolean | "topLevel";
  onReply?: (id: string, content: string, username: string) => void;
};
export const Post = (props: PostProps) => {
  const [post, loadPost] = useAPI(
    useShallow((state) => [state.posts[props.id], state.loadPost]),
  );
  if (post && !post.error && post.isDeleted) {
    if (props.reply) {
      return (
        <SpeechBubble
          speaker={
            <ProfilePictureBase
              pfp={NO_PROFILE_PICTURE}
              size="h-7 min-h-7 w-7 min-w-7"
            />
          }
          bubble="This post was deleted."
          reply
        />
      );
    }
    return;
  }
  loadPost(props.id);

  if (!post) {
    return (
      <SpeechBubble
        speaker={
          <ProfilePictureBase
            pfp={NO_PROFILE_PICTURE}
            size={props.reply ? "h-7 min-h-7 w-7 min-w-7" : undefined}
          />
        }
        reply={props.reply}
        bubble="Loading..."
      />
    );
  }
  if (post.error) {
    return (
      <SpeechBubble
        speaker={
          <ProfilePictureBase
            pfp={NO_PROFILE_PICTURE}
            size={props.reply ? "h-7 min-h-7 w-7 min-w-7" : undefined}
          />
        }
        reply={props.reply}
        bubble={
          <>
            There was an error loading this post.
            <br />
            Message: {post.message}
          </>
        }
      />
    );
  }

  return <PostBase post={post} reply={props.reply} onReply={props.onReply} />;
};

type PostBaseProps = {
  post: APIPost;
  reply?: boolean | "topLevel";
  onReply?: (id: string, content: string, username: string) => void;
};
const PostBase = memo((props: PostBaseProps) => {
  const [deleteError, setDeleteError] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [credentials, editPost, deletePost] = useAPI(
    useShallow((state) => [
      state.credentials,
      state.editPost,
      state.deletePost,
    ]),
  );
  const reply = getReply(props.post.p);

  const doReply = () => {
    props.onReply?.(props.post.post_id, post, props.post.u);
  };
  const post = reply ? reply.postContent : props.post.p;

  const handleEdit = (postContent: string) => {
    return editPost(
      props.post.post_id,
      reply ? reply.replyText + postContent : postContent,
    );
  };

  const handleDelete = async () => {
    const response = await deletePost(props.post.post_id);
    if (response.error) {
      setDeleteError(response.message);
    }
  };

  return (
    <div>
      <SpeechBubble
        reply={props.reply}
        transparent={!!props.post.optimistic}
        speaker={
          <User username={props.post.u}>
            <button aria-label={props.post.u}>
              <ProfilePicture
                size={props.reply ? "h-7 min-h-7 w-7 min-w-7" : undefined}
                username={props.post.u}
              />
            </button>
          </User>
        }
        bubble={
          <div
            className={twMerge(
              "flex max-w-full",
              props.reply ? "flex-row items-center gap-2" : "flex-col",
            )}
          >
            <div className="flex justify-between">
              <div>
                <User username={props.post.u}>
                  <button
                    className={twMerge(
                      "text-nowrap text-left font-bold",
                      props.reply ? "" : "text-sm",
                    )}
                  >
                    {props.post.u}
                  </button>
                </User>
                {props.post.bridge && !props.reply ? (
                  <span className="ml-2 text-xs opacity-70">Bridged</span>
                ) : undefined}
              </div>
              {!props.reply && !props.post.optimistic ? (
                <div className="flex gap-1">
                  {credentials?.username === props.post.u ? (
                    <>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={handleDelete}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Edit"
                        onClick={() => setEditing((e) => !e)}
                      >
                        <PencilLine className="h-5 w-5" aria-hidden />
                      </button>
                    </>
                  ) : undefined}
                  {credentials ? (
                    <button type="button" aria-label="Reply" onClick={doReply}>
                      <Reply className="h-5 w-5" aria-hidden />
                    </button>
                  ) : undefined}
                </div>
              ) : undefined}
            </div>
            {props.post.optimistic?.error ? (
              <div className="text-red-500">
                This post failed sending. Message: {props.post.optimistic.error}
              </div>
            ) : undefined}
            {deleteError ? (
              <div className="text-red-500">
                Couldn't delete post. Message: {deleteError}
              </div>
            ) : undefined}
            {!props.reply && reply?.id ? (
              <div className="my-1">
                <Post id={reply.id} reply />
              </div>
            ) : undefined}
            <div
              className={
                props.reply ? "line-clamp-1" : "max-h-64 overflow-y-auto"
              }
            >
              {editing ? (
                <div className="mx-1 my-2">
                  <EnterPostBase
                    chat={props.post.post_origin}
                    onSubmit={handleEdit}
                    basePostContent={post}
                    onSuccess={() => setEditing(false)}
                    noAttachments
                  />
                </div>
              ) : (
                <>
                  <Markdown
                    secondaryBackground={
                      props.reply === "topLevel" ? false : props.reply
                    }
                    inline={!!props.reply}
                  >
                    {post}
                  </Markdown>
                  {props.post.u === "mybearworld" &&
                  props.post.p.endsWith("\u200d") &&
                  !props.reply ? (
                    <Button type="button" onClick={() => location.reload()}>
                      Reload
                    </Button>
                  ) : undefined}
                </>
              )}
            </div>
            {!props.reply ? (
              <Attachments attachments={props.post.attachments} />
            ) : undefined}
          </div>
        }
      />
    </div>
  );
});

type SpeechBubbleProps = {
  reply?: boolean | "topLevel";
  speaker: ReactNode;
  bubble: ReactNode;
  transparent?: boolean;
  onDoubleClick?: MouseEventHandler<HTMLDivElement>;
};
const SpeechBubble = (props: SpeechBubbleProps) => {
  return (
    <div
      className={twMerge("flex gap-3", props.transparent ? "opacity-70" : "")}
    >
      <div>{props.speaker}</div>
      <div
        className={twMerge(
          "relative min-w-0 grow break-words rounded-lg rounded-ss-none px-2 py-1",
          props.reply && props.reply !== "topLevel"
            ? "bg-gray-200 dark:bg-gray-800"
            : "bg-gray-100 dark:bg-gray-900",
        )}
        onDoubleClick={props.onDoubleClick}
      >
        <div
          className={twMerge(
            "absolute left-[calc(-0.5rem-theme(spacing.2))] top-0 box-content h-0 w-0 border-[length:0.5rem] border-transparent border-r-gray-100",
            props.reply && props.reply !== "topLevel"
              ? "border-r-gray-200 dark:border-r-gray-800"
              : "border-r-gray-100 dark:border-r-gray-900",
          )}
          aria-hidden
        />
        {props.bubble}
      </div>
    </div>
  );
};

type AttachmentsProps = {
  attachments: Attachment[];
};
const Attachments = (props: AttachmentsProps) => {
  if (!props.attachments.length) {
    return;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {props.attachments.map((attachment) => (
        <AttachmentView key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
};

export type AttachmentViewProps = {
  attachment: Attachment;
  onRemove?: (id: string) => void;
};
export const AttachmentView = (props: AttachmentViewProps) => {
  const download = useRef<HTMLAnchorElement>(null);
  const closeButton = props.onRemove ? (
    <Button
      className="absolute right-2 top-2 opacity-50 hover:opacity-100"
      aria-label="Remove"
      onClick={() => props.onRemove?.(props.attachment.id)}
    >
      <X />
    </Button>
  ) : undefined;

  if (props.attachment.mime.startsWith("image/")) {
    return (
      <Popup
        triggerAsChild
        trigger={
          <button
            aria-label={props.attachment.filename}
            className="relative h-36 w-36"
          >
            <img
              key={props.attachment.id}
              className="h-36 w-36 rounded-xl object-cover"
              src={`https://uploads.meower.org/attachments/${props.attachment.id}/${props.attachment.filename}?preview`}
              alt={props.attachment.filename}
              title={props.attachment.filename}
              width="144"
              height="144"
            />
            {closeButton}
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Dialog.Title className="grow text-xl font-bold">
              {props.attachment.filename}
            </Dialog.Title>
          </div>
          <img
            src={`https://uploads.meower.org/attachments/${props.attachment.id}/${props.attachment.filename}`}
            alt={props.attachment.filename}
            title={props.attachment.filename}
            width={props.attachment.width}
            height={props.attachment.height}
          />
        </div>
      </Popup>
    );
  }

  return (
    <div className="relative inline-block">
      <a ref={download} download={props.attachment.filename} hidden />
      <button
        onClick={async () => {
          const url = URL.createObjectURL(
            await (
              await fetch(
                `https://uploads.meower.org/attachments/${props.attachment.id}/${props.attachment.filename}`,
              )
            ).blob(),
          );
          if (!download.current) {
            return;
          }
          download.current.href = url;
          download.current.click();
        }}
        type="button"
        className="flex h-36 w-36 max-w-36 flex-col items-center justify-center gap-2 rounded-xl bg-lime-200 px-2 py-1 text-center dark:bg-lime-800"
        title={props.attachment.filename}
      >
        <File className="h-14 w-14" strokeWidth={1.25} />
        <div>
          <div className="line-clamp-2 text-sm font-bold [overflow-wrap:anywhere]">
            {props.attachment.filename}
          </div>
          <div className="text-sm">({byteToHuman(props.attachment.size)})</div>
        </div>
      </button>
      {closeButton}
    </div>
  );
};
