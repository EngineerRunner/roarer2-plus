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
import { PostPopup } from "./components/PostPopup";
import { Popup } from "./components/Popup";
import { User } from "./components/User";
import { IconButton } from "./components/IconButton";

export const App = () => {
  const [openChat, setOpenChat] = useAPI(
    useShallow((state) => [state.openChat, state.setOpenChat]),
  );
  const user = new URLSearchParams(location.search).get("user");
  const post = new URLSearchParams(location.search).get("post");

  return (
    <div className="flex h-dvh max-h-dvh w-screen snap-x snap-mandatory divide-x divide-gray-200 overflow-auto bg-white dark:divide-gray-800 dark:bg-gray-950">
      <div className="max-h-full w-screen shrink-0 snap-start overflow-auto bg-white p-2 dark:bg-gray-950 lg:max-w-[65%]">
        <Chat chat={openChat} />
      </div>
      <Tabs.Root
        defaultValue="ulist"
        className="z-[--z-sidebar] flex max-h-full w-screen shrink-0 snap-start flex-col overflow-auto bg-white pt-2 dark:bg-gray-950 lg:shrink"
      >
        <Tabs.Content className="grow" value="ulist">
          <Ulist />
        </Tabs.Content>
        <Tabs.Content className="grow" value="chats">
          <Chats onChatClick={setOpenChat} currentChat={openChat} />
        </Tabs.Content>
        <Tabs.Content className="grow" value="about">
          <About />
        </Tabs.Content>
        <Tabs.List className="sticky bottom-0 z-[--z-sidebar-top] flex items-center justify-between bg-white px-2 py-2 dark:bg-gray-950">
          <div className="flex items-center gap-2">
            <Tabs.Trigger
              className="rounded-lg p-2 hover:bg-gray-100 aria-selected:border-lime-500 aria-selected:bg-gray-100 dark:hover:bg-gray-900 dark:aria-selected:bg-gray-900"
              value="ulist"
            >
              Users
            </Tabs.Trigger>
            <Tabs.Trigger
              className="rounded-lg p-2 hover:bg-gray-100 aria-selected:border-lime-500 aria-selected:bg-gray-100 dark:hover:bg-gray-900 dark:aria-selected:bg-gray-900"
              value="chats"
            >
              Chats
            </Tabs.Trigger>
            <Tabs.Trigger
              className="rounded-lg p-2 hover:bg-gray-100 aria-selected:border-lime-500 aria-selected:bg-gray-100 dark:hover:bg-gray-900 dark:aria-selected:bg-gray-900"
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
      </Tabs.Root>
      {user ?
        <User username={user} children={undefined} openInitially />
      : post ?
        <PostPopup id={post} children={undefined} openInitially />
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
