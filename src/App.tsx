import { useEffect, useState } from "react";
import { Bell, BellOff, Moon, Sun } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "./lib/api";
import { About } from "./components/About";
import { Account } from "./components/Account";
import { Chat } from "./components/Chat";
import { Chats } from "./components/Chats";
import { Button } from "./components/Button";
import { Ulist } from "./components/Ulist";
import { Popup } from "./components/Popup";
import { User } from "./components/User";
import { IconButton } from "./components/IconButton";

export const App = () => {
  const [openChat, setOpenChat] = useAPI(
    useShallow((state) => [state.openChat, state.setOpenChat]),
  );
  const user = new URLSearchParams(location.search).get("user");

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-screen snap-x snap-mandatory divide-x divide-gray-200 overflow-auto bg-white dark:divide-gray-800 dark:bg-gray-950">
      <div className="max-h-full w-screen shrink-0 snap-start overflow-auto bg-white p-2 dark:bg-gray-950 lg:max-w-[65%]">
        <Chat chat={openChat} />
      </div>
      <Tabs.Root
        defaultValue="ulist"
        className="z-[--z-sidebar] max-h-full w-screen shrink-0 snap-start overflow-auto bg-white pb-2 dark:bg-gray-950 lg:shrink"
      >
        <Tabs.List className="sticky top-0 z-[--z-sidebar-top] flex items-center justify-between bg-white px-2 py-2 dark:bg-gray-950">
          <div className="flex items-center gap-2">
            <Tabs.Trigger
              className="border-b-2 border-transparent aria-selected:border-lime-500 aria-selected:font-bold dark:aria-selected:border-lime-600"
              value="ulist"
            >
              Users
            </Tabs.Trigger>
            <Tabs.Trigger
              className="border-b-2 border-transparent aria-selected:border-lime-500 aria-selected:font-bold dark:aria-selected:border-lime-600"
              value="chats"
            >
              Chats
            </Tabs.Trigger>
            <Tabs.Trigger
              className="border-b-2 border-transparent aria-selected:border-lime-500 aria-selected:font-bold dark:aria-selected:border-lime-600"
              value="about"
            >
              About
            </Tabs.Trigger>
          </div>
          <div className="flex gap-2">
            <NotificationToggle />
            <DarkMode />
            <div className="ml-2">
              <Account />
            </div>
          </div>
        </Tabs.List>
        <Tabs.Content value="ulist">
          <Ulist />
        </Tabs.Content>
        <Tabs.Content value="chats">
          <Chats onChatClick={setOpenChat} currentChat={openChat} />
        </Tabs.Content>
        <Tabs.Content value="about">
          <About />
        </Tabs.Content>
      </Tabs.Root>
      {user ?
        <User username={user} children={undefined} openInitially />
      : undefined}
    </div>
  );
};

// "roarer3" was an accident, but I can't really fix it now
const DARK_MODE_STORAGE = "roarer3:dark";
const DarkMode = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem(DARK_MODE_STORAGE) === "true",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem(DARK_MODE_STORAGE, JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <IconButton type="button" onClick={() => setDarkMode((d) => !d)}>
      {darkMode ?
        <Sun />
      : <Moon />}
    </IconButton>
  );
};

const NotificationToggle = () => {
  const [notificationState, enableNotifications, disableNotifications] = useAPI(
    useShallow((state) => [
      state.notificationState,
      state.enableNotifications,
      state.disableNotifications,
    ]),
  );

  return (
    notificationState === "disabled" ?
      <IconButton
        type="button"
        aria-label="Enable notifications"
        onClick={enableNotifications}
      >
        <BellOff aria-hidden />
      </IconButton>
    : notificationState === "enabled" ?
      <IconButton
        type="button"
        aria-label="Disable notifications"
        onClick={disableNotifications}
      >
        <Bell aria-hidden />
      </IconButton>
    : <Popup
        triggerAsChild
        trigger={
          <IconButton
            className="opacity-70"
            type="button"
            aria-label="Enable notifications"
          >
            <BellOff aria-hidden />
          </IconButton>
        }
      >
        <div className="flex flex-col items-start gap-2">
          <p>
            You have denied Roarer the permission to send notifications, or your
            browser doesn't support them.
            <br />
            Reenable them in your browser, then try again.
          </p>
          <Dialog.Close>
            <Button>Ok</Button>
          </Dialog.Close>
        </div>
      </Popup>
  );
};
