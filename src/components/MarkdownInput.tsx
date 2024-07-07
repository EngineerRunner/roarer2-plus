import { FormEvent, useState, useEffect, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CirclePlus, SendHorizontal, Smile, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { useAPI } from "../lib/api";
import {
  discordEmoji,
  syntaxForDiscordEmoji,
  urlFromDiscordEmoji,
  DiscordEmoji,
} from "../lib/discordEmoji";
import { getImageSize } from "../lib/imageSize";
import { trimmedPost } from "../lib/reply";
import { uploadFile } from "../lib/upload";
import { useShallow } from "zustand/react/shallow";
import { Textarea } from "./Input";
import { AttachmentView, Post } from "./Post";
import { Attachment } from "../lib/api/posts";
import { Checkbox } from "./Checkbox";
import { Markdown } from "./Markdown";

export type Reply = {
  id: string;
  content: string;
  username: string;
};
export type MarkdownInputProps = {
  chat: string;
  replies?: Reply[];
  setReplies?: (replies: Reply[]) => void;
  basePostContent?: string;
  onSuccess?: () => void;
  dontDisableWhenPosting?: boolean;
  onSubmit: (
    postContent: string,
    attachments: string[],
  ) => Promise<{ error: true; message: string } | { error: false }>;
  noAttachments?: boolean;
};
export const MarkdownInput = (props: MarkdownInputProps) => {
  const replies = props.replies ?? [];

  const [credentials, sendTyping] = useAPI(
    useShallow((state) => [state.credentials, state.sendTyping]),
  );
  const [postContent, setPostContent] = useState(props.basePostContent ?? "");
  const [error, setError] = useState("");
  const [state, setState] = useState<"posting" | "writing" | "uploading">(
    "writing",
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [preview, setPreview] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const textArea = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    textArea.current?.focus?.();
  }, [props.replies]);

  if (!credentials) {
    return <></>;
  }

  const handlePost = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (state !== "writing" || !(attachments.length || postContent)) {
      return;
    }
    setState("posting");
    const response = await props.onSubmit(
      replies
        .map(
          (reply) =>
            `@${reply.username} ${trimmedPost(reply.content)} (${reply.id})\n`,
        )
        .join("") + postContent,
      attachments.map((attachment) => attachment.id),
    );
    setState("writing");
    if (response.error) {
      setError(response.message);
    } else {
      props.onSuccess?.();
      setPostContent("");
      setAttachments([]);
      setError("");
      setPreview(false);
      props.setReplies?.([]);
    }
  };

  const handleEmoji = (emoji: DiscordEmoji) => {
    setPostContent((p) => p + syntaxForDiscordEmoji(emoji));
  };

  const showAttachments = !props.noAttachments;

  const upload = async (files: FileList) => {
    const errors: string[] = [];
    setState("uploading");
    for (const file of files) {
      const uploadedFile = await uploadFile(file, "attachments");
      if (uploadedFile.error) {
        errors.push(uploadedFile.message);
        break;
      }
      const imageSize = await getImageSize(URL.createObjectURL(file));
      setAttachments((attachments) => [
        ...attachments,
        {
          filename: file.name,
          id: uploadedFile.response.id,
          mime: file.type,
          size: file.size,
          width: imageSize.width,
          height: imageSize.height,
        } satisfies Attachment,
      ]);
    }
    if (errors.length) {
      setError(`Some files couldn't be uploaded. Errors: ${errors.join(",")}`);
    }
    setState("writing");
  };

  return (
    <form onSubmit={handlePost} className={twMerge("w-full")}>
      <Textarea
        aria-label="Enter post"
        ref={textArea}
        value={postContent}
        onChange={(e) => setPostContent(e.currentTarget.value)}
        onInput={() => sendTyping(props.chat)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            props.setReplies?.([]);
          }
        }}
        disabled={
          state === "uploading" ||
          (!props.dontDisableWhenPosting && state === "posting")
        }
        onEnter={handlePost}
        before={
          <>
            {showAttachments ? (
              <button
                type="button"
                aria-label="Upload attachment"
                disabled={state !== "writing"}
                onClick={() => fileInput.current?.click()}
              >
                <input
                  type="file"
                  hidden
                  multiple
                  onInput={async (e) => {
                    const files = e.currentTarget.files;
                    if (!files) {
                      return;
                    }
                    await upload(files);
                    e.currentTarget.value = "";
                  }}
                  ref={fileInput}
                />
                <CirclePlus aria-hidden />
              </button>
            ) : undefined}
          </>
        }
        after={
          <div className="flex gap-2">
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  aria-label="Pick an emoji"
                  disabled={state !== "writing"}
                >
                  <Smile aria-hidden />
                </button>
              </Popover.Trigger>
              <Popover.Anchor />
              <Popover.Portal>
                <Popover.Content asChild align="end" sideOffset={4}>
                  <div className="z-[--z-above-sidebar] flex w-60 flex-row flex-wrap gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 dark:border-gray-800 dark:bg-gray-950">
                    {discordEmoji.map((emoji) => (
                      <button
                        key={emoji.id}
                        className="h-6 w-6"
                        title={emoji.name}
                        onClick={() => handleEmoji(emoji)}
                      >
                        <img
                          src={urlFromDiscordEmoji(emoji)}
                          alt={emoji.name}
                        />
                      </button>
                    ))}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            <button
              type="submit"
              aria-label="Send"
              disabled={state !== "writing"}
            >
              <SendHorizontal aria-hidden />
            </button>
          </div>
        }
        above={
          <div className="flex flex-col gap-2">
            {replies.map((reply, index) => (
              <div className="flex gap-2" key={index}>
                <div className="grow">
                  <Post id={reply.id} reply="topLevel" />
                </div>
                <button
                  type="button"
                  aria-label="Remove reply"
                  onClick={() =>
                    props.setReplies?.(
                      replies.slice(0, index).concat(replies.slice(index + 1)),
                    )
                  }
                >
                  <X aria-hidden />
                </button>
              </div>
            ))}
          </div>
        }
        below={
          <div>
            <div className="float-right">
              <label className="flex gap-2">
                <Checkbox checked={preview} onInput={setPreview} />
                <span>Preview</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <AttachmentView
                  attachment={attachment}
                  key={attachment.id}
                  onRemove={
                    preview
                      ? undefined
                      : (id) =>
                          setAttachments((attachments) =>
                            attachments.filter(
                              (attachment) => attachment.id !== id,
                            ),
                          )
                  }
                />
              ))}
            </div>
          </div>
        }
        replaceTextarea={
          preview ? <Markdown>{postContent}</Markdown> : undefined
        }
        onPaste={(e) => {
          if (showAttachments && e.clipboardData.files.length) {
            upload(e.clipboardData.files);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (showAttachments && e.dataTransfer.files.length) {
            upload(e.dataTransfer.files);
          }
        }}
      />
      {error ? <span className="text-red-500">{error}</span> : undefined}
    </form>
  );
};
