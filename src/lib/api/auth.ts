import { z } from "zod";
import { Slice } from ".";
import { getCloudlink } from "./cloudlink";
import { USER_SCHEMA } from "./users";

const AUTH_RESPONSE = z
  .object({
    cmd: z.literal("direct"),
    listener: z.literal("loginRequest"),
    val: z.object({
      mode: z.literal("auth"),
      payload: z.object({
        account: USER_SCHEMA,
        token: z.string(),
      }),
    }),
  })
  .or(
    z.object({
      cmd: z.literal("statuscode"),
      listener: z.literal("loginRequest"),
      val: z.string(),
    }),
  );

const STORED_ACCOUNTS_SCHEMA = z.record(z.string(), z.string());

export const USERNAME_STORAGE = "roarer2:username";
export const TOKEN_STORAGE = "roarer2:token";
export const STORED_ACCOUNTS_STORAGE = "roarer2:storedAccounts";

const parseStoredAccounts = (maybeJSON: string) => {
  try {
    const parsed = STORED_ACCOUNTS_SCHEMA.parse(JSON.parse(maybeJSON));
    return { error: false, accounts: parsed } as const;
  } catch {
    return { error: true } as const;
  }
};

export type AuthSlice = {
  credentials: {
    username: string;
    token: string;
  } | null;
  storedAccounts: z.infer<typeof STORED_ACCOUNTS_SCHEMA>;
  storeAccount: (username: string, token: string) => void;
  removeStoredAccount: (username: string) => void;
  logIn: (
    username: string,
    password: string,
    options: { signUp: boolean; keepLoggedIn: boolean; storeAccount: boolean },
  ) => Promise<{ error: true; message: string } | { error: false }>;
  signOut: () => void;
};
export const createAuthSlice: Slice<AuthSlice> = (set, get) => {
  const parsedStoredAccounts = parseStoredAccounts(
    localStorage.getItem(STORED_ACCOUNTS_STORAGE) ?? "",
  );
  const storedAccounts = parsedStoredAccounts.error
    ? {}
    : parsedStoredAccounts.accounts;
  return {
    credentials: null,
    storedAccounts,
    logIn: (username, password, options) => {
      return new Promise((resolve) => {
        const state = get();
        if (state.credentials) {
          if (options.keepLoggedIn) {
            localStorage.setItem(USERNAME_STORAGE, username);
            localStorage.setItem(TOKEN_STORAGE, password);
            location.reload();
          } else {
            throw new Error(
              "logIn called while already logged in without keepLoggedIn",
            );
          }
          return;
        }
        getCloudlink().then((cloudlink) => {
          cloudlink.on("packet", (packet: unknown) => {
            const parsed = AUTH_RESPONSE.safeParse(packet);
            if (!parsed.success) {
              return;
            }
            if (parsed.data.cmd === "statuscode") {
              if (parsed.data.val === "I:100 | OK") {
                return;
              }
              resolve({ error: true, message: parsed.data.val });
              return;
            }
            const token = parsed.data.val.payload.token;
            set((draft) => {
              draft.credentials = { username, token };
              const home = draft.chatPosts["home"];
              if (!home || home.error) {
                return;
              }
              // you are not able to access more home posts when logged out.
              // if the fetch request completed before having logged in, this
              // makes loading more possible
              home.stopLoadingMore = false;
            });
            if (options.keepLoggedIn) {
              localStorage.setItem(USERNAME_STORAGE, username);
              localStorage.setItem(TOKEN_STORAGE, token);
            }
            const state = get();
            if (options.storeAccount && options.keepLoggedIn) {
              state.storeAccount(username, token);
            }
            state.addUser(parsed.data.val.payload.account);
            state.loadChats();
            resolve({ error: false });
          });
          cloudlink.send({
            cmd: options.signUp ? "gen_account" : "authpswd",
            val: {
              username,
              pswd: password,
            },
            listener: "loginRequest",
          });
        });
      });
    },
    storeAccount: (username, token) => {
      set((state) => {
        state.storedAccounts[username] = token;
      });
      localStorage.setItem(
        STORED_ACCOUNTS_STORAGE,
        JSON.stringify(get().storedAccounts),
      );
    },
    removeStoredAccount: (username) => {
      set((state) => {
        delete state.storedAccounts[username];
      });
      localStorage.setItem(
        STORED_ACCOUNTS_STORAGE,
        JSON.stringify(get().storedAccounts),
      );
    },
    signOut: () => {
      localStorage.removeItem(USERNAME_STORAGE);
      localStorage.removeItem(TOKEN_STORAGE);
      set({ credentials: null });
      location.reload();
    },
  };
};
