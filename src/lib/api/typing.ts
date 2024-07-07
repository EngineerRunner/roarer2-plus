import { z } from "zod";
import { Slice } from ".";
import { getCloudlink } from "./cloudlink";
import { api } from "../servers";

const TYPING_SCHEMA = z.object({
  cmd: z.literal("direct"),
  val: z.object({
    chatid: z.string(),
    u: z.string(),
    state: z.literal(101).or(z.literal(100)),
  }),
});

export type TypingSlice = {
  typingUsers: Record<string, string[]>;
  sendTyping: (chat: string) => void;
};
export const createTypingSlice: Slice<TypingSlice> = (set, get) => {
  const userDates: Record<string, Record<string, number>> = {};
  let lastSentIndicator = 0;
  getCloudlink().then((cloudlink) => {
    cloudlink.on("packet", (packet: unknown) => {
      const parsed = TYPING_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      const id =
        parsed.data.val.chatid === "livechat" ? "home" : parsed.data.val.chatid;
      const user = parsed.data.val.u;
      set((draft) => {
        if (draft.typingUsers[id]?.includes(user)) {
          return;
        }
        draft.typingUsers[id] = [...(draft.typingUsers[id] ?? []), user];
      });
      const time = Date.now();
      userDates[id] ??= {};
      userDates[id]![user] = time;
      setTimeout(() => {
        if (userDates[id]?.[user] !== time) {
          return;
        }
        set((draft) => {
          draft.typingUsers[id] =
            draft.typingUsers[id]?.filter((u) => u !== user) ?? [];
        });
      }, 3000);
    });
  });
  return {
    typingUsers: {},
    sendTyping: (chat) => {
      const state = get();
      if (lastSentIndicator > Date.now() - 2500) {
        return;
      }
      lastSentIndicator = Date.now();
      fetch(
        `${api}/${chat === "home" ? "home" : `chats/${chat}`}/typing`,
        {
          method: "POST",
          headers: state.credentials ? { Token: state.credentials.token } : {},
        },
      );
      lastSentIndicator = Date.now();
    },
  };
};
