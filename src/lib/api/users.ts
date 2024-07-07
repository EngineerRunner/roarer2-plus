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
export type User = z.infer<typeof USER_SCHEMA>;

const UPDATE_USER_SCHEMA = z.object({
  cmd: z.literal("direct"),
  val: z.object({
    mode: z.literal("update_profile"),
    payload: USER_SCHEMA.omit({ _id: true })
      .partial()
      .and(z.object({ _id: z.string() })),
  }),
});

export type UsersSlice = {
  users: Record<string, Errorable<User>>;
  addUser: (user: User) => void;
  loadUser: (username: string) => Promise<void>;
};
export const createUsersSlice: Slice<UsersSlice> = (set, get) => {
  getCloudlink().then((cloudlink) => {
    cloudlink.on("packet", async (packet: unknown) => {
      const parsed = UPDATE_USER_SCHEMA.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      const username = parsed.data.val.payload._id;
      const user = get().users[username];
      if (!user || user.error) {
        return;
      }
      set((draft) => {
        draft.users[username] = { ...user, ...parsed.data.val.payload };
      });
    });
  });

  const loadingUsers = new Set<string>();
  return {
    users: {},
    addUser: (user) => {
      set((state) => {
        state.users[user._id] = { ...user, error: false };
      });
    },
    loadUser: async (username: string) => {
      if (username in get().users || loadingUsers.has(username)) {
        return;
      }
      loadingUsers.add(username);
      const response = await request(
        fetch(`${api}/users/${encodeURIComponent(username)}`),
        USER_SCHEMA,
      );
      set((state) => {
        state.users[username] = response.error
          ? response
          : { error: false, ...response.response };
      });
      loadingUsers.delete(username);
    },
  };
};
