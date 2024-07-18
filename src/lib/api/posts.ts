import { z } from "zod";
import { Slice } from ".";
import { getCloudlink } from "./cloudlink";
import { Errorable, loadMore, request } from "./utils";
import { api } from "../servers";
import { getReply } from "../reply";

export type Attachment = z.infer<typeof ATTACHMENT_SCHEMA>;
const ATTACHMENT_SCHEMA = z.object({
  filename: z.string(),
  height: z.number(),
  id: z.string(),
  mime: z.string(),
  size: z.number(),
  width: z.number(),
});

type SchemaPost = z.infer<typeof BASE_POST_SCHEMA> & {
  reply_to: (SchemaPost | null)[];
};
export type Post = Omit<SchemaPost, "reply_to"> & {
  optimistic?: { error?: string };
  reply_to: string[];
};
const BASE_POST_SCHEMA = z.object({
  attachments: ATTACHMENT_SCHEMA.array(),
  edited_at: z.number().optional(),
  isDeleted: z.literal(false),
  p: z.string(),
  post_id: z.string(),
  post_origin: z.string(),
  t: z.object({
    e: z.number(),
  }),
  type: z.number(),
  u: z.string(),
  reactions: z
    .object({
      count: z.number(),
      emoji: z.string(),
      user_reacted: z.boolean(),
    })
    .array(),
});
const POST_SCHEMA: z.ZodType<SchemaPost> = BASE_POST_SCHEMA.extend({
  reply_to: z.lazy(() => POST_SCHEMA.nullable().array()),
});

const POST_DELETE_PACKET_SCHEMA = z.object({
  cmd: z.literal("delete_post"),
  val: z.object({
    post_id: z.string(),
  }),
});
const POST_UPDATE_PACKET_SCHEMA = z.object({
  cmd: z.literal("update_post"),
  val: POST_SCHEMA,
});
const MORE_POSTS_SCHEMA = z.object({
  autoget: POST_SCHEMA.array(),
  pages: z.number(),
});
const POST_PACKET_SCHEMA = z.object({
  cmd: z.literal("post"),
  val: POST_SCHEMA,
});

const POST_REACTION_PACKET_CHEMA = z.object({
  cmd: z.literal("post_reaction_add").or(z.literal("post_reaction_remove")),
  val: z.object({
    emoji: z.string(),
    post_id: z.string(),
    username: z.string(),
  }),
});

export type PostsSlice = {
  chatPosts: Record<
    string,
    Errorable<{
      posts: string[];
      stopLoadingMore: boolean;
      currentOptimistics: Record<string, string>;
    }>
  >;
  posts: Record<string, Errorable<Post | { isDeleted: true }>>;
  addPost: (post: SchemaPost) => SchemaPost;
  loadChatPosts: (id: string) => Promise<void>;
  loadMore: (
    id: string,
  ) => Promise<{ error: true; message: string } | { error: false }>;
  loadPosts: (
    id: string,
    current: number,
  ) => Promise<
    | { error: true; message: string }
    | { error: false; posts: string[]; stop: boolean }
  >;
  loadPost: (id: string) => Promise<void>;
  post: (
    content: string,
    chat: string,
    replies: string[],
    attachments?: string[],
  ) => Promise<void>;
  editPost: (
    id: string,
    newContent: string,
  ) => Promise<{ error: true; message: string } | { error: false }>;
  deletePost: (
    id: string,
  ) => Promise<{ error: true; message: string } | { error: false }>;
  reactToPost: (
    id: string,
    emoji: string,
    type: "add" | "delete",
  ) => Promise<Errorable>;
};
export const createPostsSlice: Slice<PostsSlice> = (set, get) => {
  getCloudlink().then((cloudlink) => {
    cloudlink.on("packet", async (packet: unknown) => {
      const parsed = POST_PACKET_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      const post = parsed.data.val;
      const state = get();
      set((draft) => {
        if (post.post_origin === "home") {
          return;
        }
        const chat = draft.chats[post.post_origin];
        if (!chat || chat.error || chat.deleted) {
          return;
        }
        chat.last_active = Date.now() / 1000;
      });
      const newPost = state.addPost(post);
      const replylessPost = getReply(newPost.p)?.postContent ?? newPost.p;
      if (
        state.notificationState === "enabled" &&
        newPost.u !== state.credentials?.username &&
        newPost.p.includes("@" + state.credentials?.username) &&
        (document.hidden || state.openChat !== newPost.post_origin) &&
        "Notification" in window
      ) {
        new Notification(`${newPost.u} mentioned you:`, {
          body: replylessPost,
        }).addEventListener("click", () => {
          state.setOpenChat(post.post_origin);
          focus();
        });
      }
      state.addPost(post);
      set((draft) => {
        const chatPosts = draft.chatPosts[post.post_origin];
        if (!chatPosts || chatPosts.error) {
          return;
        }
        chatPosts.posts.unshift(post.post_id);
        if (post.u === draft.credentials?.username) {
          const id = Object.entries(chatPosts.currentOptimistics).find(
            ([_id, optimisticPostContent]) => optimisticPostContent === post.p,
          )?.[0];
          if (!id) {
            return;
          }
          delete chatPosts.currentOptimistics[id];
          draft.posts[id] = { error: false, isDeleted: true };
        }
      });
    });
    cloudlink.on("packet", (packet: unknown) => {
      const parsed = POST_UPDATE_PACKET_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      const post = parsed.data.val;
      const state = get();
      state.addPost(post);
    });
    cloudlink.on("packet", (packet: unknown) => {
      const parsed = POST_DELETE_PACKET_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      set((draft) => {
        draft.posts[parsed.data.val.post_id] = {
          isDeleted: true,
          error: false,
        };
      });
    });
    cloudlink.on("packet", (packet: unknown) => {
      const parsed = POST_REACTION_PACKET_CHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      set((draft) => {
        const post = draft.posts[parsed.data.val.post_id];
        if (!post || post.error || post.isDeleted) {
          return;
        }
        const existingReaction = post.reactions.find(
          (reaction) => reaction.emoji === parsed.data.val.emoji,
        );
        if (existingReaction) {
          const newReactionCount =
            existingReaction.count +
            (parsed.data.cmd === "post_reaction_add" ? 1 : -1);
          if (newReactionCount === 0) {
            post.reactions = post.reactions.filter(
              (reaction) => reaction !== existingReaction,
            );
          } else {
            existingReaction.count +=
              parsed.data.cmd === "post_reaction_add" ? 1 : -1;
            if (parsed.data.val.username === draft.credentials?.username) {
              existingReaction.user_reacted =
                parsed.data.cmd === "post_reaction_add";
            }
          }
        } else {
          post.reactions.push({
            count: parsed.data.cmd === "post_reaction_add" ? 1 : -1,
            emoji: parsed.data.val.emoji,
            user_reacted:
              parsed.data.val.username === draft.credentials?.username,
          });
        }
      });
    });
  });

  let id = 0;
  const getOptimisticId = () => `optimistic:${id++}`;

  const loadingPosts = new Set<string>();
  const loadingChats = new Set<string>();
  return {
    posts: {},
    chatPosts: {
      livechat: {
        posts: [],
        stopLoadingMore: true,
        currentOptimistics: {},
        error: false,
      },
    },
    addPost: (post) => {
      const state = get();
      const replies = post.reply_to.filter((reply) => reply !== null);
      replies.forEach((reply) => {
        if (!reply.reply_to.some((reply) => reply === null)) {
          state.addPost(reply);
        }
      });
      set((draft) => {
        draft.posts[post.post_id] = {
          ...post,
          reply_to: replies.map((post) => post.post_id),
          error: false,
        };
      });
      return post;
    },
    loadPost: async (post: string) => {
      if (post in get().posts || loadingPosts.has(post)) {
        return;
      }
      loadingPosts.add(post);
      const state = get();
      const response = await request(
        fetch(`${api}/posts?id=${encodeURIComponent(post)}`, {
          headers: state.credentials ? { Token: state.credentials.token } : {},
        }),
        POST_SCHEMA,
      );
      if (response.error) {
        set((draft) => {
          draft.posts[post] = response;
        });
      } else {
        state.addPost(response.response);
      }
      loadingPosts.delete(post);
    },
    loadMore: async (id: string) => {
      const state = get();
      const posts = state.chatPosts[id];
      if (loadingChats.has(id) || posts?.error) {
        return { error: false };
      }
      loadingChats.add(id);
      const response = await state.loadPosts(
        id,
        posts?.posts?.filter(
          (post) => !state.posts[post]?.error && !state.posts[post]?.isDeleted,
        )?.length ?? 0,
      );
      if (response.error) {
        return response;
      }
      set((draft) => {
        const posts = draft.chatPosts[id];
        if (posts?.error) {
          return;
        }
        draft.chatPosts[id] = {
          posts: [...(posts?.posts ?? []), ...response.posts],
          stopLoadingMore: response.stop,
          currentOptimistics: {},
          error: false,
        };
      });
      loadingChats.delete(id);
      return { error: false };
    },
    loadChatPosts: async (id: string) => {
      const state = get();
      if (state.chatPosts[id]) {
        return;
      }
      state.loadMore(id);
    },
    loadPosts: async (id: string, current: number) => {
      const state = get();
      await state.finishedAuth();
      const newState = get();
      const { page, remove } = loadMore(current);
      const response = await request(
        fetch(
          `${api}/${id === "home" ? "home" : `posts/${encodeURIComponent(id)}`}?page=${page}`,
          {
            headers:
              newState.credentials ? { Token: newState.credentials.token } : {},
          },
        ),
        MORE_POSTS_SCHEMA,
      );
      if (response.error) {
        return response;
      }
      const posts = response.response.autoget.slice(remove);
      posts.forEach((post) => {
        newState.addPost(post);
      });
      const newNewState = get();
      return {
        error: false,
        posts: posts.map((post) => post.post_id),
        stop:
          newNewState.credentials && id === "home" ?
            false
          : page === response.response.pages,
      };
    },
    post: async (content, chat, replies, attachments) => {
      const state = get();
      const optimisticId = getOptimisticId();
      const credentials = state.credentials;
      if (!credentials) {
        return;
      }
      set((draft) => {
        const trimmedContent = content.trim();
        draft.posts[optimisticId] = {
          type: 1,
          attachments: [],
          isDeleted: false,
          p: trimmedContent,
          post_id: optimisticId,
          post_origin: chat,
          t: { e: Date.now() / 1000 },
          u: credentials.username,
          error: false,
          optimistic: {},
          reply_to: replies,
          reactions: [],
        };
        const chatPosts = draft.chatPosts[chat];
        if (chatPosts && !chatPosts.error) {
          chatPosts.posts.unshift(optimisticId);
          chatPosts.currentOptimistics[optimisticId] = trimmedContent;
        }
      });
      const response = await request(
        fetch(
          `${api}/${chat === "home" ? "home" : `posts/${encodeURIComponent(chat)}`}`,
          {
            headers: {
              ...(state.credentials ? { Token: state.credentials.token } : {}),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, attachments, reply_to: replies }),
            method: "POST",
          },
        ),
        POST_SCHEMA,
      );
      if (!response.error) {
        return;
      }
      set((draft) => {
        const post = draft.posts[optimisticId];
        if (!post || post.error || post.isDeleted) {
          return;
        }
        post.optimistic = { error: response.message };
        const chatPosts = draft.chatPosts[chat];
        if (chatPosts && !chatPosts.error) {
          delete chatPosts.currentOptimistics[optimisticId];
        }
      });
    },
    editPost: (id, newContent) => {
      const state = get();
      return request(
        fetch(`${api}/posts?id=${encodeURIComponent(id)}`, {
          headers: {
            ...(state.credentials ? { Token: state.credentials.token } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newContent }),
          method: "PATCH",
        }),
        POST_SCHEMA,
      );
    },
    deletePost: (id) => {
      const state = get();
      return request(
        fetch(`${api}/posts?id=${encodeURIComponent(id)}`, {
          headers: {
            ...(state.credentials ? { Token: state.credentials.token } : {}),
          },
          method: "DELETE",
        }),
        z.object({}),
      );
    },
    reactToPost: async (id, emoji, type) => {
      const state = get();
      const response = await request(
        fetch(
          `https://api.meower.org/posts/${id}/reactions/${encodeURIComponent(emoji)}${type === "delete" ? "/@me" : ""}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(state.credentials ?
                { Token: state.credentials.token }
              : undefined),
            },
            method: type === "add" ? "POST" : "DELETE",
          },
        ),
        z.object({}),
      );
      return response;
    },
  };
};
