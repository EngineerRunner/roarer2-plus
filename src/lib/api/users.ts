import { z } from "zod";
import { Slice } from ".";
import { getCloudlink } from "./cloudlink";
import { request, Errorable } from "./utils";
import { api } from "../servers";

export const USER_SCHEMA = z.object({
  _id: z.string(),
  avatar: z.string(),
  avatar_color: z.string(),
  banned: z.boolean(),
  created: z.number().nullable(),
  flags: z.number(),
  last_seen: z.number().nullable(),
  lower_username: z.string(),
  lvl: z.number(),
  permissions: z.number().nullable(),
  pfp_data: z.number().nullable(),
  quote: z.string().nullable(),
  uuid: z.string().nullable(),
});
type SchemaUser = z.infer<typeof USER_SCHEMA>;
export type User = SchemaUser & { pronouns: string };

const UPDATE_USER_SCHEMA = z.object({
  cmd: z.literal("update_profile"),
  val: USER_SCHEMA.omit({ _id: true })
    .partial()
    .and(z.object({ _id: z.string() })),
});

export type UsersSlice = {
  users: Record<string, Errorable<User>>;
  addUser: (user: SchemaUser) => void;
  loadUser: (username: string, options?: { force?: boolean }) => Promise<void>;
};
export const createUsersSlice: Slice<UsersSlice> = (set, get) => {
  getCloudlink().then((cloudlink) => {
    cloudlink.on("packet", async (packet: unknown) => {
      const parsed = UPDATE_USER_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      const username = parsed.data.val._id.toLowerCase();
      const user = get().users[username];
      if (!user || user.error) {
        return;
      }
      set((draft) => {
        draft.users[username] = {
          ...user,
          ...parsed.data.val,
          ...pronounsFromQuote(parsed.data.val.quote),
        };
      });
    });
  });

  const loadingUsers = new Set<string>();
  return {
    users: {},
    addUser: (user) => {
      set((state) => {
        state.users[user._id.toLowerCase()] = {
          ...user,
          error: false,
          ...pronounsFromQuote(user.quote),
        };
      });
    },
    loadUser: async (username: string, options) => {
      const lowerUsername = username.toLowerCase();
      const force = options?.force ?? false;
      const state = get();
      if (
        (lowerUsername in state.users &&
          (!state.users[lowerUsername]?.error || !force)) ||
        loadingUsers.has(lowerUsername)
      ) {
        return;
      }
      loadingUsers.add(lowerUsername);
      const response = await request(
        fetch(`${api}/users/${encodeURIComponent(lowerUsername)}`),
        USER_SCHEMA,
      );
      loadingUsers.delete(lowerUsername);
      if (response.error) {
        set((state) => {
          state.users[lowerUsername] = response;
        });
        return;
      }
      get().addUser(response.response);
    },
  };
};

const pronounsFromQuote = (quote?: string | null) => {
  const [_, newQuote, pronouns] =
    quote?.match(/^(.*)\n+\[([^\]\n]+)\]$/s) ?? [];
  return newQuote && pronouns ?
      { quote: newQuote, pronouns }
    : { pronouns: "" };
};
