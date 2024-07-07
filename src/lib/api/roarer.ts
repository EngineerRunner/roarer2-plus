import { Slice } from ".";

export const NOTIFICATION_STORAGE = "roarer2:notifications";

export type RoarerSlice = {
  openChat: string;
  setOpenChat: (openChat: string) => void;
  notificationState: "disabled" | "denied" | "enabled";
  enableNotifications: () => Promise<void>;
  disableNotifications: () => void;
};
export const createRoarerSlice: Slice<RoarerSlice> = (set) => {
  const notificationPreference = localStorage.getItem(NOTIFICATION_STORAGE);
  return {
    openChat: "home",
    setOpenChat: (openChat: string) => {
      set({ openChat });
    },
    notificationState:
      Notification.permission === "denied"
        ? "denied"
        : Notification.permission === "granted" &&
            notificationPreference &&
            notificationPreference === "enabled"
          ? "enabled"
          : "disabled",
    enableNotifications: async () => {
      if (Notification.permission === "granted") {
        set((state) => {
          state.notificationState = "enabled";
        });
      }
      const permission = await Notification.requestPermission();
      set((state) => {
        state.notificationState =
          permission === "granted"
            ? "enabled"
            : permission === "denied"
              ? "denied"
              : "disabled";
      });
    },
    disableNotifications: () => {
      set((state) => {
        state.notificationState = "disabled";
      });
    },
  };
};
