import { z } from "zod";
import { Slice } from ".";
import { api } from "../servers";
import { request, Errorable } from "./utils";
import { getCloudlink } from "./cloudlink";

export const CHAT_SCHEMA = z.object({
  allow_pinning: z.boolean().optional(),
  created: z.number(),
  deleted: z.literal(false),
  icon: z.string().optional(),
  icon_color: z.string().optional(),
  last_active: z.number(),
  members: z.string().array(),
  type: z.number(),
  _id: z.string(),
  nickname: z.string().nullable(),
  owner: z.string().nullable(),
});
export type Chat = z.infer<typeof CHAT_SCHEMA>;

const CHATS_RESPONSE_SCHEMA = z.object({
  autoget: CHAT_SCHEMA.array(),
  // even though this endpoint looks like it's paginated, it is not
});

const UPDATE_CHAT_SCHEMA = z.object({
  cmd: z.literal("update_chat"),
  val: CHAT_SCHEMA.omit({ _id: true })
    .partial()
    .and(z.object({ _id: z.string() })),
});

export type UpdateChatOptions = {
  nickname: string;
  icon: string;
  icon_color: string;
  allow_pinning: boolean;
};

export type ChatsSlice = {
  userChats: Errorable<{ chats: string[] }> | undefined;
  chats: Record<string, Errorable<Chat | { deleted: true }>>;
  addChat: (chat: Chat) => void;
  loadChats: () => Promise<void>;
  loadChat: (chat: string) => Promise<void>;
  updateChat: (
    chat: string,
    options: Partial<UpdateChatOptions>,
  ) => Promise<Errorable>;
  getDM: (
    username: string,
  ) => Promise<
    { error: true; message: string } | { error: false; chat: string }
  >;
};
export const createChatsSlice: Slice<ChatsSlice> = (set, get) => {
  getCloudlink().then((cloudlink) => {
    cloudlink.on("packet", async (packet: unknown) => {
      const parsed = UPDATE_CHAT_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      const chatID = parsed.data.val._id;
      const chat = get().chats[chatID];
      if (!chat || chat.error || chat.deleted) {
        return;
      }
      set((draft) => {
        draft.chats[chatID] = { ...chat, ...parsed.data.val };
      });
    });
  });

  const loadingChats = new Set<string>();
  const dmsByUsername = new Map<string, string>();
  return {
    userChats: undefined,
    chats: {},
    addChat: (chat) => {
      set((state) => {
        state.chats[chat._id] = { ...chat, error: false };
      });
    },
    loadChats: async () => {
      const state = get();
      if (state.userChats) {
        return;
      }
      const credentials = get().credentials;
      const response = await request(
        fetch(`${api}/chats`, {
          headers: credentials ? { Token: credentials.token } : {},
        }),
        CHATS_RESPONSE_SCHEMA,
      );
      if (!response.error) {
        response.response.autoget.forEach((chat) => {
          state.addChat(chat);
        });
      }
      set({
        userChats:
          response.error ? response : (
            ({
              error: false,
              chats: response.response.autoget.map((chat) => chat._id),
            } as const)
          ),
      });
    },
    loadChat: async (chat: string) => {
      if (
        chat in get().chats ||
        loadingChats.has(chat) ||
        chat === "home" ||
        chat === "livechat"
      ) {
        return;
      }
      loadingChats.add(chat);
      const response = await request(
        fetch(`${api}/chats/${encodeURIComponent(chat)}`),
        CHAT_SCHEMA,
      );
      if (response.error) {
        set((draft) => {
          draft.chats[chat] = { error: true, message: response.message };
        });
        return;
      }
      get().addChat(response.response);
      loadingChats.delete(chat);
    },
    updateChat: async (chat, options) => {
      const state = get();
      const response = await request(
        fetch(`https://api.meower.org/chats/${encodeURIComponent(chat)}`, {
          method: "PATCH",
          headers: {
            ...(state.credentials ? { Token: state.credentials.token } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(options),
        }),
        CHAT_SCHEMA,
      );
      if (response.error) {
        return response;
      }
      return { error: false };
    },
    getDM: async (username: string) => {
      const state = get();
      const dm = dmsByUsername.get(username);
      if (dm) {
        return { error: false, chat: dm };
      }
      // unlike the other endpoints, _this_ endpoint doesn't have an error
      // flag and just throws with only a status code
      let response;
      try {
        response = CHAT_SCHEMA.parse(
          await (
            await fetch(`${api}/users/${encodeURIComponent(username)}/dm`, {
              headers:
                state.credentials ? { Token: state.credentials.token } : {},
            })
          ).json(),
        );
      } catch (e) {
        return { error: true, message: (e as Error).message };
      }
      get().addChat(response);
      set((draft) => {
        if (!draft.userChats || draft.userChats.error) {
          return;
        }
        draft.userChats.chats.push(response._id);
      });
      dmsByUsername.set(username, response._id);
      return { error: false, chat: response._id };
    },
  };
};
