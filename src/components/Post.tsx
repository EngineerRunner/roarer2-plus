import { File, Menu as MenuIcon, SmilePlus, Reply, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode, useRef, useState, memo, FormEventHandler } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "../lib/api";
import { getReply, PostWithReplies } from "../lib/reply";
import { Attachment, Post as APIPost } from "../lib/api/posts";
import { NO_PROFILE_PICTURE } from "../lib/noProfilePicture";
import { uploads } from "../lib/servers";
import { byteToHuman } from "../lib/byteToHuman";
import { Button } from "./Button";
import { Popup } from "./Popup";
import { User } from "./User";
import { Input } from "./Input";
import { Menu, MenuItem } from "./Menu";
import { Markdown } from "./Markdown";
import { Mention } from "./Mention";
import { Select, Option } from "./Select";
import { MarkdownInput } from "./MarkdownInput";
import { ProfilePicture, ProfilePictureBase } from "./ProfilePicture";
import { ReactionUsers } from "./ReactionUsers";
import { RelativeTime } from "./RelativeTime";
import { twMerge } from "tailwind-merge";
import { EmojiPicker } from "./EmojiPicker";
import { DiscordEmoji } from "../lib/discordEmoji";
import { IconButton } from "./IconButton";
import { REPORT_REASONS } from "../lib/reportReasons";
import { UserColor } from "./UserColor";

export type PostProps = {
  id: string;
  reply?: boolean;
  topLevel?: boolean;
  onReply?: (id: string, content: string, username: string) => void;
};
export const Post = memo((props: PostProps) => {
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
          reply={props.reply}
          topLevel={props.topLevel}
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
        topLevel={props.topLevel}
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
        topLevel={props.topLevel}
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

  return (
    <PostBase
      post={post}
      reply={props.reply}
      topLevel={props.topLevel}
      onReply={props.onReply}
    />
  );
});

type PostBaseProps = {
  post: APIPost;
  reply?: boolean;
  topLevel?: boolean;
  onReply?: (id: string, content: string, username: string) => void;
};
const PostBase = memo((props: PostBaseProps) => {
  const [deleteError, setDeleteError] = useState<string>();
  const [reactionError, setReactionError] = useState<string>();
  const [viewState, setViewState] = useState<"view" | "edit" | "source">(
    "view",
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [credentials, editPost, deletePost, reactToPost] = useAPI(
    useShallow((state) => [
      state.credentials,
      state.editPost,
      state.deletePost,
      state.reactToPost,
    ]),
  );
  const reply =
    props.post.reply_to && props.post.reply_to.length !== 0 ?
      ({
        ids: props.post.reply_to,
        postContent: props.post.p,
        replyText: "",
        legacy: false,
      } satisfies PostWithReplies)
    : getReply(props.post.p);

  const isInbox = props.post.type === 2;

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

  const handleReaction = async (
    emoji: string | DiscordEmoji,
    type?: "add" | "delete",
  ) => {
    if (typeof emoji !== "string") {
      return;
    }
    const response = await reactToPost(
      props.post.post_id,
      emoji,
      type ??
        ((
          props.post.reactions.some(
            (reaction) => reaction.emoji === emoji && reaction.user_reacted,
          )
        ) ?
          "delete"
        : "add"),
    );
    if (response.error) {
      setReactionError(response.message);
    } else {
      setReactionError(undefined);
    }
  };

  return (
    <div>
      <SpeechBubble
        reply={props.reply}
        topLevel={props.topLevel}
        transparent={!!props.post.optimistic}
        arrow={!props.reply}
        speaker={
          props.reply ? undefined : (
            <User username={props.post.u}>
              <button aria-label={props.post.u}>
                <ProfilePicture
                  size={props.reply ? "h-7 min-h-7 w-7 min-w-7" : undefined}
                  username={props.post.u}
                />
              </button>
            </User>
          )
        }
        bubble={
          <div
            className={twMerge(
              "flex max-w-full",
              props.reply ? "flex-row items-center gap-3" : "flex-col",
            )}
          >
            <div className="flex justify-between">
              <div>
                {props.reply ?
                  <Mention username={props.post.u} />
                : <div className="space-x-2">
                    <User username={props.post.u}>
                      <UserColor username={props.post.u}>
                        <button
                          className={twMerge(
                            "text-nowrap text-left font-bold",
                            props.reply ? "" : "text-sm",
                          )}
                        >
                          {props.post.u}
                          {props.post.u === "noodles" ? " 🧀" : undefined}
                        </button>
                      </UserColor>
                    </User>
                    <span className="text-sm opacity-70">
                      <RelativeTime time={props.post.t.e} />
                    </span>
                  </div>
                }
              </div>
              {!props.reply && !props.post.optimistic ?
                <div className="flex gap-1">
                  {credentials ?
                    <>
                      <EmojiPicker
                        onEmoji={handleReaction}
                        discordEmoji={false}
                        trigger={
                          <IconButton type="button" aria-label="React">
                            <SmilePlus className="h-5 w-5" aria-hidden />
                          </IconButton>
                        }
                      />
                      {isInbox ?
                        undefined
                      : <IconButton
                          type="button"
                          aria-label="Reply"
                          onClick={doReply}
                        >
                          <Reply className="h-6 w-6" aria-hidden />
                        </IconButton>
                      }
                      <Menu
                        trigger={
                          <IconButton
                            aria-label="Actions"
                            className="flex items-center"
                          >
                            <MenuIcon className="h-6 w-6" aria-hidden />
                          </IconButton>
                        }
                      >
                        {credentials ?
                          <Popup
                            trigger={<MenuItem dontClose>Report</MenuItem>}
                            triggerAsChild
                            controlled={{
                              open: reportOpen,
                              onOpenChange: setReportOpen,
                            }}
                          >
                            <ReportModal
                              post={props.post.post_id}
                              onSuccess={() => setReportOpen(false)}
                            />
                          </Popup>
                        : undefined}
                        {credentials.username !== props.post.u ?
                          <MenuItem
                            onClick={() =>
                              setViewState((e) =>
                                e === "source" ? "view" : "source",
                              )
                            }
                          >
                            {viewState === "source" ?
                              "View post"
                            : "View source"}
                          </MenuItem>
                        : undefined}
                        {credentials.username === props.post.u ?
                          <>
                            <MenuItem
                              onClick={() =>
                                setViewState((e) =>
                                  e === "edit" ? "view" : "edit",
                                )
                              }
                            >
                              {viewState === "edit" ? "Cancel editing" : "Edit"}
                            </MenuItem>
                            <MenuItem onClick={handleDelete}>Delete</MenuItem>
                          </>
                        : undefined}
                        <MenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `https://mybearworld.github.io/roarer-2?post=${props.post.post_id}`,
                            );
                          }}
                        >
                          Copy link
                        </MenuItem>
                        {props.post.reactions.length ?
                          <ReactionUsers post={props.post.post_id}>
                            <MenuItem dontClose>Reactions</MenuItem>
                          </ReactionUsers>
                        : undefined}
                      </Menu>
                    </>
                  : undefined}
                </div>
              : undefined}
            </div>
            {props.post.optimistic?.error ?
              <div className="text-red-500">
                This post failed sending. Message: {props.post.optimistic.error}
              </div>
            : undefined}
            {deleteError ?
              <div className="text-red-500">
                Couldn't delete post. Message: {deleteError}
              </div>
            : undefined}
            {(
              !props.reply &&
              reply?.ids &&
              !(viewState === "source" && reply?.legacy)
            ) ?
              <div className="my-1 flex flex-col gap-2">
                {reply.ids.map((id) => (
                  <Post id={id} reply topLevel={false} key={id} />
                ))}
              </div>
            : undefined}
            <div
              className={
                props.reply ? "line-clamp-1" : "max-h-64 overflow-y-auto"
              }
            >
              {viewState === "edit" ?
                <div className="mx-1 my-2">
                  <MarkdownInput
                    chat={props.post.post_origin}
                    onSubmit={handleEdit}
                    value={post}
                    onSuccess={() => setViewState("view")}
                    attachments={false}
                  />
                </div>
              : viewState === "view" ?
                <>
                  <Markdown
                    secondaryBackground={props.topLevel ? false : props.reply}
                    inline={!!props.reply}
                    bigEmoji={!props.reply}
                  >
                    {post}
                  </Markdown>
                  {(
                    props.post.u === "mybearworld" &&
                    props.post.p.endsWith("\u200d") &&
                    !props.reply
                  ) ?
                    <Button type="button" onClick={() => location.reload()}>
                      Reload
                    </Button>
                  : undefined}
                </>
              : <div className="whitespace-pre-wrap">{props.post.p}</div>}
            </div>
            {!props.reply ?
              <Attachments attachments={props.post.attachments} />
            : undefined}
            {props.post.reactions.length && !props.reply ?
              <div className="mt-1 flex flex-wrap gap-2">
                {props.post.reactions.map((reaction) => (
                  <Button
                    secondary={!reaction.user_reacted}
                    key={reaction.emoji}
                    onClick={() =>
                      handleReaction(
                        reaction.emoji,
                        reaction.user_reacted ? "delete" : "add",
                      )
                    }
                    type="button"
                  >
                    <div className="flex items-center gap-2">
                      {reaction.emoji} {reaction.count}
                    </div>
                  </Button>
                ))}
              </div>
            : undefined}
            {reactionError ?
              <div className="text-red-500">
                Couldn't change post reaction. Message: {reactionError}
              </div>
            : undefined}
          </div>
        }
      />
    </div>
  );
});

type SpeechBubbleProps = {
  reply?: boolean;
  topLevel?: boolean;
  speaker: ReactNode;
  bubble: ReactNode;
  transparent?: boolean;
  arrow?: boolean;
};
const SpeechBubble = (props: SpeechBubbleProps) => {
  const topLevel = props.topLevel ?? true;
  return (
    <div
      className={twMerge(
        "flex",
        (props.arrow ?? true) ? "gap-2" : "gap-1",
        props.reply ? "items-center" : "",
        props.transparent ? "opacity-70" : "",
      )}
    >
      <div>{props.speaker}</div>
      <div
        className={twMerge(
          "relative min-w-0 grow break-words rounded-lg px-2 py-1",
          topLevel ?
            "bg-gray-100 dark:bg-gray-900"
          : "bg-gray-200 dark:bg-gray-800",
          (props.arrow ?? true) ? "rounded-ss-none" : "",
        )}
      >
        {(props.arrow ?? true) ?
          <div
            className={twMerge(
              "absolute left-[calc(-0.5rem-theme(spacing.2))] top-0 box-content h-0 w-0 border-[length:0.5rem] border-transparent border-r-gray-100 contrast-more:hidden",
              topLevel ?
                "border-r-gray-100 dark:border-r-gray-900"
              : "border-r-gray-200 dark:border-r-gray-800",
            )}
            aria-hidden
          />
        : undefined}
        {props.bubble}
      </div>
    </div>
  );
};

type ReportModalProps = {
  post: string;
  onSuccess: () => void;
};
const ReportModal = (props: ReportModalProps) => {
  const reportPost = useAPI((state) => state.reportPost);
  const [reason, setReason] = useState<string>();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();

  const handleReport: FormEventHandler = async (e) => {
    e.preventDefault();
    const response = await reportPost(props.post, reason, comment);
    if (response.error) {
      setError(response.message);
      return;
    }
    props.onSuccess();
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleReport}>
      <Dialog.Title className="text-lg font-bold">
        Report this post
      </Dialog.Title>
      <Select label="Reason" onInput={(e) => setReason(e.currentTarget.value)}>
        <Option selected disabled>
          Choose a reason...
        </Option>
        {REPORT_REASONS.map((reason) => (
          <Option value={reason} key={reason}>
            {reason}
          </Option>
        ))}
      </Select>
      <Input
        label="Comment"
        value={comment}
        onInput={(e) => setComment(e.currentTarget.value)}
      />
      <Button type="submit">Report</Button>
      {error ?
        <div className="text-red-500">{error}</div>
      : undefined}
    </form>
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
  const closeRow =
    props.onRemove ?
      <button
        type="button"
        aria-label="Remove"
        className="flex items-center gap-2 text-wrap font-bold"
        onClick={() => props.onRemove?.(props.attachment.id)}
      >
        <span>{props.attachment.filename}</span>
        <X className="h-6 w-6" strokeWidth={2.2} aria-hidden />
      </button>
    : undefined;

  if (props.attachment.mime.startsWith("image/")) {
    return (
      <Popup
        triggerAsChild
        size="wide"
        trigger={
          <div className="flex flex-col items-center">
            {closeRow}
            <button type="button" aria-label={props.attachment.filename}>
              <img
                key={props.attachment.id}
                className="max-h-40"
                src={`${uploads}/attachments/${props.attachment.id}/${props.attachment.filename}?preview`}
                alt={props.attachment.filename}
                title={props.attachment.filename}
                height={Math.min(160, props.attachment.height)} // max-h-40
              />
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Dialog.Title className="grow text-xl font-bold">
              {props.attachment.filename}
            </Dialog.Title>
          </div>
          <img
            src={`${uploads}/attachments/${props.attachment.id}/${props.attachment.filename}`}
            alt={props.attachment.filename}
            title={props.attachment.filename}
            width={props.attachment.width}
            height={props.attachment.height}
          />
        </div>
      </Popup>
    );
  }

  if (props.attachment.mime.startsWith("video/")) {
    return (
      <video
        src={`${uploads}/attachments/${props.attachment.id}/${props.attachment.filename}`}
        className="max-h-40"
        controls
        title={props.attachment.filename}
      />
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <a ref={download} download={props.attachment.filename} hidden />
      {closeRow}
      <Button
        onClick={async () => {
          const url = URL.createObjectURL(
            await (
              await fetch(
                `${uploads}/attachments/${props.attachment.id}/${props.attachment.filename}`,
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
        className="flex h-36 w-36 max-w-36 flex-col items-center justify-center gap-2 text-center"
        title={props.attachment.filename}
      >
        <File className="h-14 w-14" strokeWidth={1.25} />
        <div>
          <div className="line-clamp-2 text-sm font-bold [overflow-wrap:anywhere]">
            {props.attachment.filename}
          </div>
          <div className="text-sm">({byteToHuman(props.attachment.size)})</div>
        </div>
      </Button>
    </div>
  );
};
