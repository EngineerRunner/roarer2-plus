import { z } from "zod";
import { Slice } from ".";
import { getCloudlink } from "./cloudlink";
import { Errorable, loadMore, request } from "./utils";

export type Attachment = Omit<
  z.infer<typeof ATTACHMENT_SCHEMA>,
  "height" | "width"
> & { width?: number; height?: number };
const ATTACHMENT_SCHEMA = z.object({
  filename: z.string(),
  height: z.number(),
  id: z.string(),
  mime: z.string(),
  size: z.number(),
  width: z.number(),
});

export type Post = z.infer<typeof POST_SCHEMA> & {
  optimistic?: { error?: string };
  bridge?: "discord";
};
export const POST_SCHEMA = z.object({
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
});

const POST_DELETE_PACKET_SCHEMA = z.object({
  cmd: z.literal("direct"),
  val: z.object({
    mode: z.literal("delete"),
    id: z.string(),
  }),
});
const POST_UPDATE_PACKET_SCHEMA = z.object({
  cmd: z.literal("direct"),
  val: z.object({
    mode: z.literal("update_post"),
    payload: POST_SCHEMA,
  }),
});
const MORE_POSTS_SCHEMA = z.object({
  autoget: POST_SCHEMA.array(),
  pages: z.number(),
});
const POST_PACKET_SCHEMA = z.object({
  cmd: z.literal("direct"),
  val: POST_SCHEMA,
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
  addPost: (post: Post) => void;
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
    attachments?: string[],
  ) => Promise<void>;
  editPost: (
    id: string,
    newContent: string,
  ) => Promise<{ error: true; message: string } | { error: false }>;
  deletePost: (
    id: string,
  ) => Promise<{ error: true; message: string } | { error: false }>;
};
export const createPostsSlice: Slice<PostsSlice> = (set, get) => {
  getCloudlink().then((cloudlink) => {
    cloudlink.on("direct", async (packet: unknown) => {
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
      if (!state.chatPosts[post.post_origin]) {
        return;
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
    cloudlink.on("direct", (packet: unknown) => {
      const parsed = POST_UPDATE_PACKET_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      const post = parsed.data.val.payload;
      set((draft) => {
        draft.posts[post.post_id] = { ...post, error: false };
      });
    });
    cloudlink.on("direct", (packet: unknown) => {
      const parsed = POST_DELETE_PACKET_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      set((draft) => {
        draft.posts[parsed.data.val.id] = { isDeleted: true, error: false };
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
    addPost: (post: Post) => {
      const bridge = post.u === "Discord" ? "discord" : undefined;
      const match = bridge
        ? post.p.match(/(?<username>[a-z0-9_\-]+): (?<post>[\s\S]+)/i)
        : null;
      const username = match?.groups?.username;
      const postContent = match?.groups?.post;
      set((draft) => {
        draft.posts[post.post_id] = {
          ...post,
          ...(bridge && username && postContent
            ? { bridge, u: username, p: postContent }
            : {}),
          error: false,
        };
      });
    },
    loadPost: async (post: string) => {
      if (post in get().posts || loadingPosts.has(post)) {
        return;
      }
      loadingPosts.add(post);
      const state = get();
      const response = await request(
        fetch(`https://api.meower.org/posts?id=${encodeURIComponent(post)}`, {
          headers: state.credentials ? { Token: state.credentials.token } : {},
        }),
        POST_SCHEMA,
      );
      set((draft) => {
        draft.posts[post] = response.error
          ? response
          : { error: false, ...response.response };
      });
      loadingPosts.delete(post);
    },
    loadMore: async (id: string) => {
      const state = get();
      const posts = state.chatPosts[id];
      if (loadingChats.has(id) || posts?.error) {
        return { error: false };
      }
      loadingChats.add(id);
      const response = await state.loadPosts(id, posts?.posts?.length ?? 0);
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
      const { page, remove } = loadMore(current);
      const response = await request(
        fetch(
          `https://api.meower.org/${id === "home" ? "home" : `posts/${encodeURIComponent(id)}`}?page=${page}`,
          {
            headers: state.credentials
              ? { Token: state.credentials.token }
              : {},
          },
        ),
        MORE_POSTS_SCHEMA,
      );
      if (response.error) {
        return response;
      }
      const posts = response.response.autoget.slice(0, remove);
      posts.forEach((post) => {
        state.addPost(post);
      });
      const newCredentials = get().credentials;
      return {
        error: false,
        posts: posts.map((post) => post.post_id),
        // you are not able to access more home posts when logged out.
        // if the fetch request completed after having logged in, this
        // makes loading more possible
        stop:
          (newCredentials && id === "home" && current === 0) ||
          page === response.response.pages,
      };
    },
    post: async (content, chat, attachments) => {
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
          t: { e: Date.now() },
          u: credentials.username,
          error: false,
          optimistic: {},
        };
        const chatPosts = draft.chatPosts[chat];
        if (chatPosts && !chatPosts.error) {
          chatPosts.posts.unshift(optimisticId);
          chatPosts.currentOptimistics[optimisticId] = trimmedContent;
        }
      });
      const response = await request(
        fetch(
          `https://api.meower.org/${chat === "home" ? "home" : `posts/${encodeURIComponent(chat)}`}`,
          {
            headers: {
              ...(state.credentials ? { Token: state.credentials.token } : {}),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, attachments }),
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
      });
    },
    editPost: (id, newContent) => {
      const state = get();
      return request(
        fetch(`https://api.meower.org/posts?id=${encodeURIComponent(id)}`, {
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
        fetch(`https://api.meower.org/posts?id=${encodeURIComponent(id)}`, {
          headers: {
            ...(state.credentials ? { Token: state.credentials.token } : {}),
          },
          method: "DELETE",
        }),
        z.object({}),
      );
    },
  };
};
