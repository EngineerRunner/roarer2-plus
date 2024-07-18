import { z } from "zod";
import { Slice } from ".";
import { USER_SCHEMA } from "./users";
import { getCloudlink, initCloudlink } from "./cloudlink";
import { request } from "./utils";
import { api } from "../servers";

const AUTH_RESPONSE = z.object({
  account: USER_SCHEMA,
  token: z.string(),
});
const AUTH_CL_RESPOSNE = z.object({
  cmd: z.literal("auth"),
  val: AUTH_RESPONSE,
});

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
  finishedAuth: () => Promise<void>;
  logIn: (
    username: string,
    password: string,
    options: { storeAccount: boolean } & (
      | { signUp: false }
      | { signUp: true; captcha: string }
    ),
  ) => Promise<{ error: true; message: string } | { error: false }>;
  signOut: () => void;
};
export const createAuthSlice: Slice<AuthSlice> = (set, get) => {
  const parsedStoredAccounts = parseStoredAccounts(
    localStorage.getItem(STORED_ACCOUNTS_STORAGE) ?? "",
  );
  const finishedAuthResolve: (() => void)[] = [];
  const finishedAuthPromise = new Promise<void>((resolve) => {
    finishedAuthResolve.push(resolve);
  });
  const storedAccounts =
    parsedStoredAccounts.error ? {} : parsedStoredAccounts.accounts;
  const token = localStorage.getItem(TOKEN_STORAGE);
  if (!token) {
    finishedAuthResolve.forEach((fn) => fn());
  }
  initCloudlink(token);
  getCloudlink().then((cloudlink) => {
    cloudlink.on("packet", (packet: unknown) => {
      const parsed = AUTH_CL_RESPOSNE.safeParse(packet);
      if (!parsed.success) {
        return;
      }
      localStorage.setItem(TOKEN_STORAGE, parsed.data.val.token);
      set((draft) => {
        draft.credentials = {
          username: parsed.data.val.account._id,
          token: parsed.data.val.token,
        };
        const home = draft.chatPosts.home;
        if (!home || home.error) {
          return;
        }
        home.stopLoadingMore = false;
      });
      finishedAuthResolve.forEach((fn) => fn());
    });
  });
  return {
    credentials: null,
    storedAccounts,
    finishedAuth: () => finishedAuthPromise,
    logIn: async (username, password, options) => {
      const state = get();
      if (state.credentials) {
        localStorage.setItem(USERNAME_STORAGE, username);
        localStorage.setItem(TOKEN_STORAGE, password);
        location.reload();
      }
      const response = await request(
        fetch(`${api}/auth/${options.signUp ? "register" : "login"}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            ...(options.signUp ? { captcha: options.captcha } : {}),
          }),
        }),
        AUTH_RESPONSE,
      );
      if (response.error) {
        return response;
      }
      const token = response.response.token;
      localStorage.setItem(USERNAME_STORAGE, username);
      localStorage.setItem(TOKEN_STORAGE, token);
      if (options.storeAccount) {
        state.storeAccount(username, token);
      }
      location.reload();
      return { error: false };
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
