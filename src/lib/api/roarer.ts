import { Slice } from ".";
import { z } from "zod";

export const NOTIFICATION_STORAGE = "roarer2:notifications";
export const SETTINGS_STORAGE = "roarer2:settings";

const FULL_SETTINGS_SCHEMA = z.object({
  enterSend: z.boolean(),
  avatarBorders: z.boolean()
});
const SETTINGS_SCHEMA = FULL_SETTINGS_SCHEMA.partial();
export type Settings = z.infer<typeof FULL_SETTINGS_SCHEMA>;

export type RoarerSlice = {
  openChat: string;
  setOpenChat: (openChat: string) => void;
  notificationState: "disabled" | "denied" | "enabled";
  enableNotifications: () => Promise<void>;
  disableNotifications: () => void;
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
};
export const createRoarerSlice: Slice<RoarerSlice> = (set, get) => {
  const notificationPreference = localStorage.getItem(NOTIFICATION_STORAGE);
  const settingsStorage = (() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE);
      if (!stored) {
        return {};
      }
      return SETTINGS_SCHEMA.parse(JSON.parse(stored));
    } catch {
      return {};
    }
  })();
  return {
    openChat: "home",
    setOpenChat: (openChat: string) => {
      set({ openChat });
    },
    notificationState:
      !("Notification" in window) || Notification.permission === "denied" ?
        "denied"
      : (
        Notification.permission === "granted" &&
        notificationPreference &&
        notificationPreference === "enabled"
      ) ?
        "enabled"
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
          permission === "granted" ? "enabled"
          : permission === "denied" ? "denied"
          : "disabled";
      });
    },
    disableNotifications: () => {
      set((state) => {
        state.notificationState = "disabled";
      });
    },
    settings: {
      enterSend: settingsStorage.enterSend ?? true,
      avatarBorders: settingsStorage.avatarBorders ?? false 
    },
    setSettings: (settings) => {
      set((draft) => {
        draft.settings = {
          ...draft.settings,
          ...settings,
        };
      });
      localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(get().settings));
    },
  };
};
