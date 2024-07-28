import { create, StateCreator } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createAuthSlice, AuthSlice } from "./auth";
import { createChatsSlice, ChatsSlice } from "./chats";
import { createMeSlice, MeSlice } from "./me";
import { createPostsSlice, PostsSlice } from "./posts";
import { createRoarerSlice, RoarerSlice, NOTIFICATION_STORAGE } from "./roarer";
import { createTypingSlice, TypingSlice } from "./typing";
import { createUlistSlice, UlistSlice } from "./ulist";
import { createUsersSlice, UsersSlice } from "./users";

export type Slice<T> = StateCreator<Store, [["zustand/immer", never]], [], T>;
export type Store = AuthSlice &
  ChatsSlice &
  MeSlice &
  PostsSlice &
  RoarerSlice &
  TypingSlice &
  UlistSlice &
  UsersSlice;

export const useAPI = create<Store>()(
  immer((...args) => {
    return {
      ...createAuthSlice(...args),
      ...createChatsSlice(...args),
      ...createMeSlice(...args),
      ...createPostsSlice(...args),
      ...createRoarerSlice(...args),
      ...createTypingSlice(...args),
      ...createUlistSlice(...args),
      ...createUsersSlice(...args),
    };
  }),
);
const state = useAPI.getState();
localStorage.setItem(NOTIFICATION_STORAGE, state.notificationState);
useAPI.subscribe((state, prevState) => {
  if (state.notificationState === prevState.notificationState) {
    return;
  }
  localStorage.setItem(NOTIFICATION_STORAGE, state.notificationState);
});
