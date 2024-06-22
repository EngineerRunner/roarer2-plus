import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Moon, Sun } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { twMerge } from "tailwind-merge";
import { useShallow } from "zustand/react/shallow";
import { useAPI } from "./lib/api";
import { About } from "./components/About";
import { Account } from "./components/Account";
import { Chat } from "./components/Chat";
import { Chats } from "./components/Chats";
import { Button } from "./components/Button";
import { Ulist } from "./components/Ulist";

export const App = () => {
  const [showSideNav, setShowSideNav] = useState(false);
  const [openChat, setOpenChat] = useAPI(
    useShallow((state) => [state.openChat, state.setOpenChat]),
  );

  return (
    <div className="flex h-screen max-h-screen divide-x divide-gray-200 overflow-auto bg-white [--nav-bar-size:min(theme(spacing.96),90vw)] dark:divide-gray-800 dark:bg-gray-950">
      <div className="max-h-screen w-full min-w-[65%] overflow-auto bg-white p-2 dark:bg-gray-950">
        <Button
          className={twMerge(
            "absolute bottom-[50%] z-[--z-sidebar] h-14 rounded-none rounded-s-lg px-1 py-2 lg:hidden",
            showSideNav ? "right-[--nav-bar-size]" : "right-0",
          )}
          onClick={() => setShowSideNav((n) => !n)}
          aria-label="Open navigation bar"
        >
          {showSideNav ? (
            <ChevronRight aria-hidden />
          ) : (
            <ChevronLeft aria-hidden />
          )}
        </Button>
        <Chat chat={openChat} />
      </div>
      <Tabs.Root
        defaultValue="ulist"
        className={`${
          showSideNav ? "" : "hidden"
        } absolute right-0 top-0 z-[--z-sidebar] h-screen max-h-screen w-[--nav-bar-size] min-w-[--nav-bar-size] overflow-auto bg-white py-2 dark:bg-gray-950 lg:sticky lg:top-0 lg:block`}
      >
        <Tabs.List className="mb-2 flex h-8 items-center justify-between px-2">
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
            <DarkMode />
            <Account />
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
    </div>
  );
};

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
    <button type="button" onClick={() => setDarkMode((d) => !d)}>
      {darkMode ? <Sun /> : <Moon />}
    </button>
  );
};
